import { z } from 'zod';

export const RestaurantSchema = z.object({
    id: z.string(),
    name: z.string().min(1),
    distance: z.number().nonnegative(),
    locationUrl: z.string().url(),
    tags: z.array(z.string()),
    score: z.number().optional(),
    latitude: z.number(),
    longitude: z.number(),
    imageUrl: z.string().url().optional(),
    rating: z.number().min(0).max(5).optional(),
    priceLevel: z.string().optional(), // Google Places price level (e.g., "PRICE_LEVEL_INEXPENSIVE")
    address: z.string().optional(),
    reason: z.string().optional(),
});

export type Restaurant = z.infer<typeof RestaurantSchema>;
