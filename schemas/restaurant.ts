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
    address: z.string().optional(),
    priceLevel: z.number().min(0).max(4).optional(),
    userRatingsTotal: z.number().nonnegative().optional(),
    openNow: z.boolean().optional(),
    businessStatus: z.string().optional(),
    types: z.array(z.string()).optional(),
});

export type Restaurant = z.infer<typeof RestaurantSchema>;
