import { describe, it, expect } from 'vitest';
import { mapGoogleTypesToStructuredTags, mapGoogleTypesToTagsFlat, priceLevelToBucket } from './placeMapping';

describe('placeMapping', () => {
  it('maps price level to bucket', () => {
    expect(priceLevelToBucket(0)).toBe('budget');
    expect(priceLevelToBucket(1)).toBe('budget');
    expect(priceLevelToBucket(2)).toBe('mid');
    expect(priceLevelToBucket(3)).toBe('high');
    expect(priceLevelToBucket(4)).toBe('high');
    expect(priceLevelToBucket(undefined)).toBeUndefined();
  });

  it('maps google types to structured tags', () => {
    const tags = mapGoogleTypesToStructuredTags([
      'japanese_restaurant',
      'sushi_restaurant',
      'cafe',
      'vegetarian_restaurant',
    ]);

    expect(tags.cuisine).toContain('japanese');
    expect(tags.taste).toContain('light');
    expect(tags.ambience).toContain('casual');
    expect(tags.mealType).toContain('snack');
    expect(tags.diet).toContain('vegetarian');
  });

  it('maps google types to flat tags', () => {
    const flat = mapGoogleTypesToTagsFlat(['ramen_restaurant', 'barbecue_restaurant']);
    expect(flat).toContain('japanese');
    expect(flat).toContain('heavy');
    expect(flat).toContain('meal');
  });
});
