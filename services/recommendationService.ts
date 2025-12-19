import { Answer } from '@/types';
import { rankRestaurants, RankedRestaurant } from '@/lib/rankRestaurants';
import { QUESTIONS } from '@/data/mock';
import { getRestaurantRepository } from '@/repositories/restaurantRepository';

export const recommendationService = {
    getRecommendations: async (
        answers: Answer[],
        signal?: AbortSignal
    ): Promise<RankedRestaurant[]> => {

        // 1. Fetch Data from selected repository
        const repository = getRestaurantRepository();

        // Pass signal to repository for network cancellation
        const restaurants = await repository.listRestaurants(signal);

        // 2. Rank Logic (Pure)
        return rankRestaurants(answers, restaurants, QUESTIONS);
    },
};
