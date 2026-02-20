import { describe, expect, it } from 'vitest';
import {
  NavigationHistoryCreateSchema,
  isMapsNavigationContext,
} from '@/lib/historyNavigation';

describe('history navigation schema', () => {
  it('accepts valid payload', () => {
    const parsed = NavigationHistoryCreateSchema.safeParse({
      placeId: 'abc',
      restaurantName: 'Test Restaurant',
      locationUrl: 'https://www.google.com/maps/search/?api=1&query=test',
      rank: 1,
      score: 9.2,
      distanceKm: 0.8,
      rating: 4.5,
    });

    expect(parsed.success).toBe(true);
  });

  it('rejects invalid payload', () => {
    const parsed = NavigationHistoryCreateSchema.safeParse({
      restaurantName: '',
      locationUrl: 'bad-url',
      rank: 0,
    });

    expect(parsed.success).toBe(false);
  });

  it('detects maps navigation context', () => {
    expect(isMapsNavigationContext({ action: 'maps_navigation', locationUrl: 'https://example.com' })).toBe(true);
    expect(isMapsNavigationContext({ action: 'other' })).toBe(false);
  });
});
