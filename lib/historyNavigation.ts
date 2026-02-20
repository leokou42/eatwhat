import { z } from 'zod';

export const NavigationHistoryCreateSchema = z.object({
  placeId: z.string().optional(),
  restaurantId: z.string().optional(),
  restaurantName: z.string().min(1),
  locationUrl: z.string().url(),
  rank: z.number().int().positive(),
  score: z.number().optional(),
  distanceKm: z.number().nonnegative().optional(),
  address: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
});

export type NavigationHistoryCreateInput = z.infer<typeof NavigationHistoryCreateSchema>;

export interface HistoryNavigationItem {
  id: string;
  placeId?: string | null;
  restaurantId?: string | null;
  restaurantName: string;
  locationUrl: string;
  pickedAt: string;
  rank: number;
  score?: number;
  distanceKm?: number;
  address?: string;
  rating?: number;
}

export function isMapsNavigationContext(value: unknown): value is {
  action: 'maps_navigation';
  locationUrl: string;
  rank: number;
  score?: number;
  distanceKm?: number;
  address?: string;
  rating?: number;
} {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return obj.action === 'maps_navigation' && typeof obj.locationUrl === 'string';
}
