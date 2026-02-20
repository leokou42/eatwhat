import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PreferenceSchema, PreferenceProfile } from '@/lib/gemini';
import { fetchNearbyPlaces } from '@/lib/googlePlaces';
import { scorePlaces } from '@/lib/recommendationScoring';
import { logStartup, logStartupError, msSince } from '@/lib/startupDebug';

const AnswerSchema = z.object({
  questionId: z.number(),
  choice: z.enum(['left', 'right', 'skip']),
  leftTags: z.array(z.string()),
  rightTags: z.array(z.string()),
});

const RequestSchema = z.object({
  location: z.object({ latitude: z.number(), longitude: z.number() }),
  answers: z.array(AnswerSchema),
});

function applyAnswersToPreference(preference: PreferenceProfile, answers: z.infer<typeof AnswerSchema>[]) {
  const addTags = (tags: string[]) => {
    for (const tag of tags) {
      if (['budget', 'mid', 'high'].includes(tag)) {
        if (!preference.price.includes(tag as any)) preference.price.push(tag as any);
        continue;
      }
      if (['near', 'far'].includes(tag)) {
        preference.distancePreference = tag as 'near' | 'far';
        continue;
      }
      if (['casual', 'date', 'family'].includes(tag)) {
        if (!preference.ambience.includes(tag)) preference.ambience.push(tag);
        continue;
      }
      if (['meal', 'snack'].includes(tag)) {
        if (!preference.mealType.includes(tag)) preference.mealType.push(tag);
        continue;
      }
      if (tag === 'cafe') {
        if (!preference.mealType.includes('snack')) preference.mealType.push('snack');
        if (!preference.ambience.includes('casual')) preference.ambience.push('casual');
        continue;
      }
      if (['light', 'heavy', 'sweet', 'spicy'].includes(tag)) {
        if (!preference.taste.includes(tag)) preference.taste.push(tag);
        continue;
      }
      if (['vegetarian', 'vegan', 'halal'].includes(tag)) {
        if (!preference.diet.includes(tag)) preference.diet.push(tag);
        continue;
      }
      if (!preference.cuisine.includes(tag)) preference.cuisine.push(tag);
    }
  };

  for (const ans of answers) {
    if (ans.choice === 'left') addTags(ans.leftTags);
    if (ans.choice === 'right') addTags(ans.rightTags);
  }

  return preference;
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  logStartup('server', 'api:recommendations/score', 'request:start');
  try {
    const session = await auth();
    const userId = session?.user?.id as string | undefined;
    logStartup('server', 'api:recommendations/score', 'auth:done', {
      elapsedMs: msSince(startedAt),
      hasUserId: Boolean(userId),
    });

    const body = await request.json().catch(() => null);
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      logStartup('server', 'api:recommendations/score', 'request:invalid', {
        elapsedMs: msSince(startedAt),
      });
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { location, answers } = parsed.data;

    const preferenceReadStartedAt = Date.now();
    const storedPreference = userId
      ? await prisma.userPreference.findUnique({ where: { userId } })
      : null;
    logStartup('server', 'api:recommendations/score', 'preference:read', {
      elapsedMs: msSince(preferenceReadStartedAt),
      hasStoredPreference: Boolean(storedPreference),
    });

    let preference: PreferenceProfile = {
      cuisine: [],
      taste: [],
      price: [],
      ambience: [],
      mealType: [],
      distancePreference: 'no_preference',
      diet: [],
      confidence: 0.4,
      rationale: [],
    };

    if (storedPreference) {
      try {
        preference = PreferenceSchema.parse(storedPreference.preferenceJson);
      } catch {
        logStartup('server', 'api:recommendations/score', 'preference:parse-fallback');
      }
    }

    const updatedPreference = applyAnswersToPreference(preference, answers);

    const placesStartedAt = Date.now();
    const places = await fetchNearbyPlaces(location.latitude, location.longitude, 2000);
    logStartup('server', 'api:recommendations/score', 'places:done', {
      elapsedMs: msSince(placesStartedAt),
      placeCount: places.length,
    });

    const scoringStartedAt = Date.now();
    const ranked = scorePlaces(places, updatedPreference, location);
    logStartup('server', 'api:recommendations/score', 'scoring:done', {
      elapsedMs: msSince(scoringStartedAt),
      resultCount: ranked.length,
    });

    if (userId && ranked[0]) {
      const persistStartedAt = Date.now();
      await prisma.userPreference.upsert({
        where: { userId },
        create: { userId, preferenceJson: updatedPreference },
        update: { preferenceJson: updatedPreference },
      });
      await prisma.userPickHistory.create({
        data: {
          userId,
          placeId: ranked[0].id,
          restaurantName: ranked[0].name,
          contextJson: { answers, preference: updatedPreference },
        },
      });
      logStartup('server', 'api:recommendations/score', 'persist:done', {
        elapsedMs: msSince(persistStartedAt),
      });
    }

    logStartup('server', 'api:recommendations/score', 'response:ok', {
      elapsedMs: msSince(startedAt),
      resultCount: ranked.length,
    });
    return NextResponse.json({
      results: ranked,
      preference: updatedPreference,
    });
  } catch (error) {
    logStartupError('server', 'api:recommendations/score', 'request:failed', error, {
      elapsedMs: msSince(startedAt),
    });
    return NextResponse.json({ error: 'Failed to score' }, { status: 500 });
  }
}
