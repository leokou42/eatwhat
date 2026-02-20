import { prisma } from '@/lib/prisma';

export async function isFirstUse(userId?: string) {
  if (!userId) return true;

  const [preference, pick] = await Promise.all([
    prisma.userPreference.findUnique({ where: { userId } }),
    prisma.userPickHistory.findFirst({ where: { userId } }),
  ]);

  return !preference && !pick;
}
