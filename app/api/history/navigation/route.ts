import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  HistoryNavigationItem,
  NavigationHistoryCreateSchema,
  isMapsNavigationContext,
} from '@/lib/historyNavigation';

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = NavigationHistoryCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const payload = parsed.data;

  await prisma.userPickHistory.create({
    data: {
      userId,
      placeId: payload.placeId,
      restaurantId: payload.restaurantId,
      restaurantName: payload.restaurantName,
      contextJson: {
        action: 'maps_navigation',
        locationUrl: payload.locationUrl,
        rank: payload.rank,
        score: payload.score,
        distanceKm: payload.distanceKm,
        address: payload.address,
        rating: payload.rating,
      },
    },
  });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await prisma.userPickHistory.findMany({
    where: { userId },
    orderBy: { pickedAt: 'desc' },
    take: 200,
  });

  const items: HistoryNavigationItem[] = rows
    .filter((row) => isMapsNavigationContext(row.contextJson))
    .slice(0, 50)
    .map((row) => {
      const context = row.contextJson as {
        locationUrl: string;
        rank: number;
        score?: number;
        distanceKm?: number;
        address?: string;
        rating?: number;
      };

      return {
        id: row.id,
        placeId: row.placeId,
        restaurantId: row.restaurantId,
        restaurantName: row.restaurantName,
        locationUrl: context.locationUrl,
        pickedAt: row.pickedAt.toISOString(),
        rank: context.rank,
        score: context.score,
        distanceKm: context.distanceKm,
        address: context.address,
        rating: context.rating,
      };
    });

  return NextResponse.json({ items });
}
