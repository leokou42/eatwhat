import { z } from 'zod';

export const RestaurantSchema = z.object({
    id: z.number(),
    name: z.string().min(1),
    distance: z.number().nonnegative(),
    locationUrl: z.string().url(),
    tags: z.array(z.string()),
    score: z.number().optional()
});

export type Restaurant = z.infer<typeof RestaurantSchema>;
