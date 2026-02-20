import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    userSettings: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GET, PUT } from '@/app/api/settings/route';

const mockedAuth = vi.mocked(auth);
const mockedFindUnique = vi.mocked(prisma.userSettings.findUnique);
const mockedUpsert = vi.mocked(prisma.userSettings.upsert);

describe('api/settings', () => {
  beforeEach(() => {
    mockedAuth.mockReset();
    mockedFindUnique.mockReset();
    mockedUpsert.mockReset();
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockedAuth.mockResolvedValue(null as never);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('GET returns 503 when storage unavailable', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'u1' } } as never);
    mockedFindUnique.mockRejectedValue(new Error('relation "UserSettings" does not exist'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.code).toBe('SETTINGS_STORAGE_UNAVAILABLE');
  });

  it('PUT returns 400 for invalid payload', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'u1' } } as never);

    const response = await PUT(
      new Request('http://localhost/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ searchRadiusM: 1234 }),
      })
    );

    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.code).toBe('INVALID_PAYLOAD');
  });

  it('PUT returns 503 when storage unavailable', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'u1' } } as never);
    mockedFindUnique.mockRejectedValue(new Error('db unavailable'));

    const response = await PUT(
      new Request('http://localhost/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ theme: 'dark' }),
      })
    );

    const data = await response.json();
    expect(response.status).toBe(503);
    expect(data.code).toBe('SETTINGS_STORAGE_UNAVAILABLE');
  });

  it('PUT returns 200 for valid payload', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'u1' } } as never);
    mockedFindUnique.mockResolvedValue(null as never);
    mockedUpsert.mockResolvedValue({
      id: 's1',
      userId: 'u1',
      theme: 'dark',
      modelPreset: 'default',
      questionLength: 'standard',
      searchRadiusM: 2000,
      updatedAt: new Date(),
    } as never);

    const response = await PUT(
      new Request('http://localhost/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ theme: 'dark' }),
      })
    );

    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.settings.theme).toBe('dark');
  });
});
