import { describe, it, expect } from 'vitest';
import { scorePlaces } from './recommendationScoring';
import { PreferenceProfile } from './gemini';
import { NormalizedPlace } from './googlePlaces';

const basePreference: PreferenceProfile = {
  cuisine: ['japanese'],
  taste: ['light'],
  price: ['mid'],
  ambience: ['casual'],
  mealType: ['meal'],
  distancePreference: 'near',
  diet: [],
  confidence: 0.9,
  rationale: [],
};

const makePlace = (overrides: Partial<NormalizedPlace>): NormalizedPlace => ({
  id: 'p1',
  name: 'Sushi',
  distance: 0,
  locationUrl: 'https://example.com',
  tags: ['japanese', 'light'],
  latitude: 25.03,
  longitude: 121.52,
  rating: 4.5,
  address: 'addr',
  priceLevel: 2,
  priceBucket: 'mid',
  structuredTags: {
    cuisine: ['japanese'],
    taste: ['light'],
    ambience: ['casual'],
    mealType: ['meal'],
    diet: [],
  },
  ...overrides,
});

describe('recommendationScoring', () => {
  it('scores matches higher and ranks by score then distance', () => {
    const placeA = makePlace({ id: 'a', latitude: 25.03, longitude: 121.52, rating: 4.6 });
    const placeB = makePlace({
      id: 'b',
      name: 'Burger',
      structuredTags: {
        cuisine: [],
        taste: ['heavy'],
        ambience: ['casual'],
        mealType: ['meal'],
        diet: [],
      },
      tags: ['heavy'],
      priceBucket: 'high',
      rating: 3.0,
      latitude: 25.05,
      longitude: 121.55,
    });

    const ranked = scorePlaces([placeB, placeA], basePreference, {
      latitude: 25.03,
      longitude: 121.52,
    });

    expect(ranked[0].id).toBe('a');
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
    expect(ranked[0].reasons.length).toBeGreaterThan(0);
  });

  it('applies distance preference for near', () => {
    const near = makePlace({ id: 'near', latitude: 25.03, longitude: 121.52 });
    const far = makePlace({ id: 'far', latitude: 25.10, longitude: 121.60 });

    const ranked = scorePlaces([far, near], basePreference, {
      latitude: 25.03,
      longitude: 121.52,
    });

    expect(ranked[0].id).toBe('near');
    expect(ranked[0].distance).toBeLessThan(ranked[1].distance);
  });
});
