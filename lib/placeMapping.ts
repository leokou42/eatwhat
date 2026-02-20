export type PriceBucket = 'budget' | 'mid' | 'high';

export function priceLevelToBucket(priceLevel?: number): PriceBucket | undefined {
  if (priceLevel === undefined || priceLevel === null) return undefined;
  if (priceLevel <= 1) return 'budget';
  if (priceLevel === 2) return 'mid';
  return 'high';
}

export interface PlaceTags {
  cuisine: string[];
  taste: string[];
  ambience: string[];
  mealType: string[];
  diet: string[];
}

const TYPE_TO_TAGS: Record<string, Partial<PlaceTags>> = {
  cafe: { ambience: ['casual'], mealType: ['snack'] },
  bakery: { mealType: ['snack'], taste: ['sweet'] },
  snack_bar: { mealType: ['snack'] },
  bar: { ambience: ['casual'], mealType: ['snack'] },
  meal_takeaway: { ambience: ['casual'], mealType: ['meal'] },
  meal_delivery: { ambience: ['casual'], mealType: ['meal'] },
  restaurant: { mealType: ['meal'] },
  japanese_restaurant: { cuisine: ['japanese'], taste: ['light'] },
  sushi_restaurant: { cuisine: ['japanese'], taste: ['light'] },
  korean_restaurant: { cuisine: ['korean'] },
  chinese_restaurant: { cuisine: ['chinese'], taste: ['light'] },
  ramen_restaurant: { cuisine: ['japanese'], taste: ['heavy'], mealType: ['meal'] },
  steak_house: { taste: ['heavy'], mealType: ['meal'] },
  hamburger_restaurant: { taste: ['heavy'], mealType: ['meal'] },
  barbecue_restaurant: { taste: ['heavy'], mealType: ['meal'] },
  vegetarian_restaurant: { diet: ['vegetarian'] },
  vegan_restaurant: { diet: ['vegan'] },
  halal_restaurant: { diet: ['halal'] },
};

export function mapGoogleTypesToStructuredTags(types: string[] = []): PlaceTags {
  const tags: PlaceTags = {
    cuisine: [],
    taste: [],
    ambience: [],
    mealType: [],
    diet: [],
  };

  for (const type of types) {
    const mapped = TYPE_TO_TAGS[type];
    if (!mapped) continue;
    for (const key of Object.keys(mapped) as (keyof PlaceTags)[]) {
      const values = mapped[key] || [];
      for (const value of values) {
        if (!tags[key].includes(value)) tags[key].push(value);
      }
    }
  }

  return tags;
}

export function mapGoogleTypesToTagsFlat(types: string[] = []): string[] {
  const structured = mapGoogleTypesToStructuredTags(types);
  return Array.from(
    new Set([
      ...structured.cuisine,
      ...structured.taste,
      ...structured.ambience,
      ...structured.mealType,
      ...structured.diet,
    ])
  );
}
