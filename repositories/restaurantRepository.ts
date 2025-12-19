import { Restaurant } from '@/types';
import { MOCK_RESTAURANTS } from '@/data/mock';
import { RestaurantSchema } from '@/schemas/restaurant';
import { z } from 'zod';

export interface IRestaurantRepository {
    listRestaurants(signal?: AbortSignal): Promise<Restaurant[]>;
}

class MockRestaurantRepository implements IRestaurantRepository {
    async listRestaurants(signal?: AbortSignal): Promise<Restaurant[]> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                resolve(MOCK_RESTAURANTS);
            }, 500);

            if (signal) {
                signal.addEventListener('abort', () => {
                    clearTimeout(timer);
                    reject(new DOMException('Aborted', 'AbortError'));
                });
            }
        });
    }
}

class ApiRestaurantRepository implements IRestaurantRepository {
    async listRestaurants(signal?: AbortSignal): Promise<Restaurant[]> {
        try {
            const response = await fetch('/api/restaurants', { signal });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // Zod Validation: Ensure data matches schema
            // Using safeParse or parse. Parse throws if invalid, which is handled by caller.
            const parsed = z.array(RestaurantSchema).parse(data);
            return parsed;

        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw error; // Re-throw cancellation
            }
            console.error("Failed to fetch restaurants:", error);
            throw error;
        }
    }
}

// Factory to select implementation
export function getRestaurantRepository(): IRestaurantRepository {
    const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE;

    if (dataSource === 'api') {
        return new ApiRestaurantRepository();
    }

    return new MockRestaurantRepository();
}
