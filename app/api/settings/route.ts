import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  AppSettingsSchema,
  AppSettingsUpdateSchema,
  mergeAppSettings,
  type AppSettings,
} from '@/lib/settings';

function pickSettings(source: {
  theme: string;
  modelPreset: string;
  questionLength: string;
  searchRadiusM: number;
}): Partial<AppSettings> {
  return {
    theme: source.theme as AppSettings['theme'],
    modelPreset: source.modelPreset as AppSettings['modelPreset'],
    questionLength: source.questionLength as AppSettings['questionLength'],
    searchRadiusM: source.searchRadiusM as AppSettings['searchRadiusM'],
  };
}

function storageUnavailableResponse(operation: 'settings.get' | 'settings.put', error: unknown) {
  console.error(`[api:${operation}] settings storage unavailable`, { error });
  return NextResponse.json(
    {
      code: 'SETTINGS_STORAGE_UNAVAILABLE',
      error: 'Settings storage unavailable',
    },
    { status: 503 }
  );
}

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ code: 'UNAUTHORIZED', error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stored = await prisma.userSettings.findUnique({ where: { userId } });
    const settings = mergeAppSettings(stored ? pickSettings(stored) : undefined);
    const validated = AppSettingsSchema.parse(settings);

    return NextResponse.json({ settings: validated });
  } catch (error) {
    return storageUnavailableResponse('settings.get', error);
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ code: 'UNAUTHORIZED', error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = AppSettingsUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ code: 'INVALID_PAYLOAD', error: 'Invalid payload' }, { status: 400 });
  }

  try {
    const existing = await prisma.userSettings.findUnique({ where: { userId } });
    const merged = mergeAppSettings(existing ? pickSettings(existing) : undefined, parsed.data);
    const validated = AppSettingsSchema.parse(merged);

    const saved = await prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        theme: validated.theme,
        modelPreset: validated.modelPreset,
        questionLength: validated.questionLength,
        searchRadiusM: validated.searchRadiusM,
      },
      update: {
        theme: validated.theme,
        modelPreset: validated.modelPreset,
        questionLength: validated.questionLength,
        searchRadiusM: validated.searchRadiusM,
      },
    });

    return NextResponse.json({
      settings: AppSettingsSchema.parse({
        theme: saved.theme,
        modelPreset: saved.modelPreset,
        questionLength: saved.questionLength,
        searchRadiusM: saved.searchRadiusM,
      }),
    });
  } catch (error) {
    return storageUnavailableResponse('settings.put', error);
  }
}
