import { Restaurant } from '@/types';
import { MOCK_RESTAURANTS } from '@/data/mock';
import { RestaurantSchema } from '@/schemas/restaurant';
import { z } from 'zod';

export interface IRestaurantRepository {
    listRestaurants(
        signal?: AbortSignal,
        location?: { latitude: number; longitude: number } | null,
        radius?: number
    ): Promise<Restaurant[]>;
}

class MockRestaurantRepository implements IRestaurantRepository {
    async listRestaurants(
        signal?: AbortSignal,
        location?: { latitude: number; longitude: number } | null,
        radius?: number
    ): Promise<Restaurant[]> {
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
    async listRestaurants(
        signal?: AbortSignal,
        location?: { latitude: number; longitude: number } | null,
        radius?: number
    ): Promise<Restaurant[]> {
        try {
            const url = new URL('/api/restaurants', window.location.origin);
            if (location) {
                url.searchParams.set('lat', location.latitude.toString());
                url.searchParams.set('lng', location.longitude.toString());
            }
            if (radius) {
                url.searchParams.set('radius', radius.toString());
            }

            const response = await fetch(url.toString(), { signal });

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

export class GooglePlacesRepository implements IRestaurantRepository {
    async listRestaurants(
        signal?: AbortSignal,
        location?: { latitude: number; longitude: number } | null,
        radius?: number
    ): Promise<Restaurant[]> {
        if (!location) {
            console.warn('GooglePlacesRepository requires location. Falling back to mock.');
            return MOCK_RESTAURANTS;
        }

        try {
            const url = new URL('/api/places', window.location.origin);
            url.searchParams.set('lat', location.latitude.toString());
            url.searchParams.set('lng', location.longitude.toString());
            if (radius) url.searchParams.set('radius', radius.toString());

            const response = await fetch(url.toString(), { signal });

            if (!response.ok) {
                throw new Error(`Places API Error: ${response.status}`);
            }

            const data = await response.json();

            // If API route returned an error/mock hint, handle it or return empty
            if (data.error) {
                console.warn('Backend returned error for Places:', data.error);
                return [];
            }

            return z.array(RestaurantSchema).parse(data);
        } catch (error) {
            console.error('Failed to fetch from Google Places:', error);
            return [];
        }
    }
}

// Factory to select implementation
export function getRestaurantRepository(): IRestaurantRepository {
    const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE;

    if (dataSource === 'api') {
        return new ApiRestaurantRepository();
    }

    if (dataSource === 'google') {
        return new GooglePlacesRepository();
    }

    return new MockRestaurantRepository();
}
