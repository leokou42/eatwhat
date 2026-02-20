import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logStartup, logStartupError, msSince } from '@/lib/startupDebug';

export async function POST() {
  const startedAt = Date.now();
  logStartup('server', 'api:consent', 'request:start');
  try {
    const session = await auth();
    const userId = session?.user?.id as string | undefined;

    if (!userId) {
      logStartup('server', 'api:consent', 'response:unauthorized', {
        elapsedMs: msSince(startedAt),
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const consent = await prisma.userConsent.upsert({
      where: { userId },
      create: { userId, llmConsentAt: new Date() },
      update: { llmConsentAt: new Date() },
    });

    logStartup('server', 'api:consent', 'response:ok', {
      elapsedMs: msSince(startedAt),
    });
    return NextResponse.json({ consentedAt: consent.llmConsentAt });
  } catch (error) {
    logStartupError('server', 'api:consent', 'request:failed', error, {
      elapsedMs: msSince(startedAt),
    });
    return NextResponse.json({ error: 'Failed to save consent' }, { status: 500 });
  }
}
