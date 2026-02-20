import { prisma } from '@/lib/prisma';
import {
  type AppSettings,
  type RuntimeSettingsInput,
  mergeAppSettings,
  parseRuntimeSettings,
} from '@/lib/settings';

function toSettingsShape(record: {
  theme: string;
  modelPreset: string;
  questionLength: string;
  searchRadiusM: number;
}): Partial<AppSettings> {
  return {
    theme: record.theme as AppSettings['theme'],
    modelPreset: record.modelPreset as AppSettings['modelPreset'],
    questionLength: record.questionLength as AppSettings['questionLength'],
    searchRadiusM: record.searchRadiusM as AppSettings['searchRadiusM'],
  };
}

export async function getUserSettings(userId: string): Promise<AppSettings> {
  try {
    const stored = await prisma.userSettings.findUnique({ where: { userId } });
    if (!stored) return mergeAppSettings();
    return mergeAppSettings(toSettingsShape(stored));
  } catch (error) {
    console.error('[serverSettings:getUserSettings] fallback to defaults', {
      userId,
      error,
    });
    return mergeAppSettings();
  }
}

export async function resolveRequestSettings(params: {
  userId?: string;
  runtimeSettings?: unknown;
}): Promise<AppSettings> {
  const runtime = parseRuntimeSettings(params.runtimeSettings) as RuntimeSettingsInput;

  if (!params.userId) {
    return mergeAppSettings(runtime);
  }

  try {
    const stored = await prisma.userSettings.findUnique({ where: { userId: params.userId } });
    if (!stored) {
      return mergeAppSettings(runtime);
    }

    // precedence: defaults -> stored -> runtime
    return mergeAppSettings(toSettingsShape(stored), runtime);
  } catch (error) {
    console.error('[serverSettings:resolveRequestSettings] fallback to runtime/default', {
      userId: params.userId,
      error,
    });
    return mergeAppSettings(runtime);
  }
}
