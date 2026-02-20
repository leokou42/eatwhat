import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { inferPreferences, PreferenceSchema, type PreferenceProfile } from '@/lib/gemini';
import { fetchNearbyPlaces } from '@/lib/googlePlaces';
import { buildDynamicQuestions, withIds } from '@/lib/questionBuilder';
import { preferenceSummary } from '@/lib/preferenceSummary';
import { calculateDistanceKm } from '@/lib/geo';
import { logStartup, logStartupError, msSince } from '@/lib/startupDebug';

const AnswerSchema = z.object({
  questionId: z.number(),
  choice: z.enum(['left', 'right', 'skip']),
  questionText: z.string(),
  leftChoice: z.string(),
  rightChoice: z.string(),
  skipChoice: z.string(),
});

const RequestSchema = z.object({
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  starterAnswers: z.array(AnswerSchema),
  consented: z.boolean().optional(),
});

function answersToSummary(answers: z.infer<typeof AnswerSchema>[]) {
  return answers
    .map((a) => {
      if (a.choice === 'left') return `${a.questionText} -> ${a.leftChoice}`;
      if (a.choice === 'right') return `${a.questionText} -> ${a.rightChoice}`;
      return `${a.questionText} -> ${a.skipChoice}`;
    })
    .join('\n');
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  logStartup('server', 'api:recommendations/init', 'request:start');
  try {
    const session = await auth();
    const userId = session?.user?.id as string | undefined;
    logStartup('server', 'api:recommendations/init', 'auth:done', {
      elapsedMs: msSince(startedAt),
      hasUserId: Boolean(userId),
    });

    const body = await request.json().catch(() => null);
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      logStartup('server', 'api:recommendations/init', 'request:invalid', {
        elapsedMs: msSince(startedAt),
      });
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    if (userId) {
      const consent = await prisma.userConsent.findUnique({ where: { userId } });
      if (!consent) {
        logStartup('server', 'api:recommendations/init', 'response:consent-required', {
          elapsedMs: msSince(startedAt),
        });
        return NextResponse.json({ requiresConsent: true }, { status: 200 });
      }
    } else if (!parsed.data.consented) {
      logStartup('server', 'api:recommendations/init', 'response:consent-required-anon', {
        elapsedMs: msSince(startedAt),
      });
      return NextResponse.json({ requiresConsent: true }, { status: 200 });
    }

    const { location, starterAnswers } = parsed.data;
    const placesStartedAt = Date.now();
    const places = await fetchNearbyPlaces(location.latitude, location.longitude, 2000);
    logStartup('server', 'api:recommendations/init', 'places:done', {
      elapsedMs: msSince(placesStartedAt),
      placeCount: places.length,
    });

    const minimalPlaces = places.map((p) => ({
      name: p.name,
      types: p.types,
      rating: p.rating,
      priceLevel: p.priceLevel,
    }));

    const preferenceStartedAt = Date.now();
    let validated: PreferenceProfile;
    let inferenceSource: 'gemini' | 'fallback' = 'gemini';
    let warningCode: string | undefined;
    try {
      const preference = await inferPreferences({
        userHistorySummary: '首次使用，無歷史',
        starterQuizAnswers: answersToSummary(starterAnswers),
        nearbyPlacesMinimal: JSON.stringify(minimalPlaces),
      });
      validated = PreferenceSchema.parse(preference);
      logStartup('server', 'api:recommendations/init', 'infer-preferences:done', {
        elapsedMs: msSince(preferenceStartedAt),
      });
    } catch (error) {
      inferenceSource = 'fallback';
      warningCode = 'INFER_PREFERENCES_FAILED';
      logStartupError('server', 'api:recommendations/init', 'infer-preferences:fallback', error, {
        elapsedMs: msSince(preferenceStartedAt),
      });
      validated = {
        cuisine: [],
        taste: [],
        price: [],
        ambience: [],
        mealType: [],
        distancePreference: 'no_preference',
        diet: [],
        confidence: 0.2,
        rationale: ['AI 服務暫時不可用，已改用預設偏好'],
      };
    }

    if (userId) {
      const persistStartedAt = Date.now();
      await prisma.userPreference.upsert({
        where: { userId },
        create: { userId, preferenceJson: validated },
        update: { preferenceJson: validated },
      });
      logStartup('server', 'api:recommendations/init', 'preference:upserted', {
        elapsedMs: msSince(persistStartedAt),
      });
    }

    const summary = preferenceSummary(validated);
    const questionsStartedAt = Date.now();
    const questions = await buildDynamicQuestions({
      preferenceSummary: summary,
      confidence: validated.confidence ?? 0.4,
    });
    logStartup('server', 'api:recommendations/init', 'dynamic-questions:done', {
      elapsedMs: msSince(questionsStartedAt),
      questionCount: questions.length,
    });

    const enrichedPlaces = places.map((p) => ({
      ...p,
      distance: calculateDistanceKm(location.latitude, location.longitude, p.latitude, p.longitude),
    }));

    logStartup('server', 'api:recommendations/init', 'response:ok', {
      elapsedMs: msSince(startedAt),
      nearbyCount: enrichedPlaces.length,
      questionCount: questions.length,
    });
    return NextResponse.json({
      phase: 'dynamic',
      questions: withIds(questions),
      inferredPreference: validated,
      nearbyCount: enrichedPlaces.length,
      inferenceSource,
      warningCode,
    });
  } catch (error) {
    logStartupError('server', 'api:recommendations/init', 'request:failed', error, {
      elapsedMs: msSince(startedAt),
    });
    return NextResponse.json({ error: 'Failed to init' }, { status: 500 });
  }
}
