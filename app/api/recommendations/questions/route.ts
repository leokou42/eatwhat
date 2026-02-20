import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isFirstUse } from '@/lib/userState';
import { buildStarterQuestions, buildDynamicQuestions, withIds } from '@/lib/questionBuilder';
import { preferenceSummary } from '@/lib/preferenceSummary';
import { PreferenceSchema, PreferenceProfile } from '@/lib/gemini';
import { resolveRequestSettings } from '@/lib/serverSettings';
import { modelPresetToModelName, RuntimeSettingsSchema } from '@/lib/settings';
import { logStartup, logStartupError, msSince } from '@/lib/startupDebug';

const RequestSchema = z.object({
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  runtimeSettings: RuntimeSettingsSchema.optional(),
});

export async function POST(request: Request) {
  const startedAt = Date.now();
  logStartup('server', 'api:recommendations/questions', 'request:start');
  try {
    const session = await auth();
    const userId = session?.user?.id as string | undefined;
    logStartup('server', 'api:recommendations/questions', 'auth:done', {
      elapsedMs: msSince(startedAt),
      hasUserId: Boolean(userId),
    });

    const body = await request.json().catch(() => null);
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      logStartup('server', 'api:recommendations/questions', 'request:invalid', {
        elapsedMs: msSince(startedAt),
      });
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const resolvedSettings = await resolveRequestSettings({
      userId,
      runtimeSettings: parsed.data.runtimeSettings,
    });

    const firstUse = await isFirstUse(userId);
    logStartup('server', 'api:recommendations/questions', 'user-state:resolved', {
      elapsedMs: msSince(startedAt),
      firstUse,
    });
    if (firstUse) {
      const questions = await buildStarterQuestions();
      logStartup('server', 'api:recommendations/questions', 'response:starter', {
        elapsedMs: msSince(startedAt),
        questionCount: questions.length,
      });
      return NextResponse.json({
        phase: 'starter',
        questions: withIds(questions),
        resolvedSettings,
      });
    }

    if (!userId) {
      const questions = await buildStarterQuestions();
      logStartup('server', 'api:recommendations/questions', 'response:starter-anon', {
        elapsedMs: msSince(startedAt),
        questionCount: questions.length,
      });
      return NextResponse.json({
        phase: 'starter',
        questions: withIds(questions),
        resolvedSettings,
      });
    }

    const consent = await prisma.userConsent.findUnique({ where: { userId } });
    if (!consent) {
      logStartup('server', 'api:recommendations/questions', 'response:consent-required', {
        elapsedMs: msSince(startedAt),
      });
      return NextResponse.json({ requiresConsent: true }, { status: 200 });
    }

    const pref = await prisma.userPreference.findUnique({ where: { userId } });
    let preference: PreferenceProfile | null = null;
    try {
      if (pref) preference = PreferenceSchema.parse(pref.preferenceJson);
    } catch {
      preference = null;
    }

    const summary = preferenceSummary(preference);
    const questions = await buildDynamicQuestions({
      preferenceSummary: summary,
      questionLength: resolvedSettings.questionLength,
      model: modelPresetToModelName(resolvedSettings.modelPreset),
    });

    logStartup('server', 'api:recommendations/questions', 'response:dynamic', {
      elapsedMs: msSince(startedAt),
      questionCount: questions.length,
      confidence: preference?.confidence ?? 0.4,
    });
    return NextResponse.json({
      phase: 'dynamic',
      questions: withIds(questions),
      resolvedSettings,
    });
  } catch (error) {
    logStartupError('server', 'api:recommendations/questions', 'request:failed', error, {
      elapsedMs: msSince(startedAt),
    });
    return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 });
  }
}
