import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_APP_SETTINGS } from '@/lib/settings';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    userSettings: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { getUserSettings, resolveRequestSettings } from '@/lib/serverSettings';

const mockedFindUnique = vi.mocked(prisma.userSettings.findUnique);

describe('serverSettings', () => {
  beforeEach(() => {
    mockedFindUnique.mockReset();
  });

  it('uses defaults + runtime for anonymous user', async () => {
    const resolved = await resolveRequestSettings({
      runtimeSettings: { modelPreset: 'fast', searchRadiusM: 3000 },
    });

    expect(resolved).toEqual({
      ...DEFAULT_APP_SETTINGS,
      modelPreset: 'fast',
      searchRadiusM: 3000,
    });
    expect(mockedFindUnique).not.toHaveBeenCalled();
  });

  it('uses stored as base and runtime overrides stored fields', async () => {
    mockedFindUnique.mockResolvedValue({
      id: 's1',
      userId: 'u1',
      theme: 'dark',
      modelPreset: 'quality',
      questionLength: 'long',
      searchRadiusM: 3000,
      updatedAt: new Date(),
    } as never);

    const resolved = await resolveRequestSettings({
      userId: 'u1',
      runtimeSettings: { modelPreset: 'fast' },
    });

    expect(resolved.theme).toBe('dark');
    expect(resolved.questionLength).toBe('long');
    expect(resolved.searchRadiusM).toBe(3000);
    expect(resolved.modelPreset).toBe('fast');
  });

  it('falls back to runtime/default when storage query fails', async () => {
    mockedFindUnique.mockRejectedValue(new Error('relation "UserSettings" does not exist'));

    const resolved = await resolveRequestSettings({
      userId: 'u1',
      runtimeSettings: { questionLength: 'short' },
    });

    expect(resolved).toEqual({
      ...DEFAULT_APP_SETTINGS,
      questionLength: 'short',
    });
  });

  it('getUserSettings falls back to defaults when storage query fails', async () => {
    mockedFindUnique.mockRejectedValue(new Error('db unavailable'));

    const resolved = await getUserSettings('u1');

    expect(resolved).toEqual(DEFAULT_APP_SETTINGS);
  });
});
