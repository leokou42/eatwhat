import { Answer } from '@/types';
import { rankRestaurants, RankedRestaurant, UserLocation } from '@/lib/rankRestaurants';
import { QUESTIONS } from '@/data/mock';
import { getRestaurantRepository } from '@/repositories/restaurantRepository';

export const recommendationService = {
    getRecommendations: async (
        answers: Answer[],
        userLocation: UserLocation | null, // Accept location
        signal?: AbortSignal
    ): Promise<RankedRestaurant[]> => {

        // 1. Extract Tags from answers to pass to API if needed
        const tags: string[] = [];
        answers.forEach(ans => {
            if (ans.choice === 'skip') return;
            const q = QUESTIONS.find(q => q.id === ans.questionId);
            if (!q) return;
            if (ans.choice === 'left') tags.push(...q.leftTags);
            if (ans.choice === 'right') tags.push(...q.rightTags);
        });
        const tagsString = tags.join(',');
        console.log(`[RecommendationService] Tags extracted: ${tagsString}`);

        // 2. Fetch Data from selected repository
        const repository = getRestaurantRepository();
        console.log(`[RecommendationService] Using repository: ${repository.constructor.name}`);

        // Pass signal and tags to repository
        const restaurants = await repository.listRestaurants(signal, userLocation, undefined, tagsString);
        console.log(`[RecommendationService] Fetched ${restaurants.length} restaurants from repository`);

        // 3. Rank Logic (Pure)
        const ranked = rankRestaurants(answers, restaurants, QUESTIONS, userLocation);
        console.log(`[RecommendationService] Ranked ${ranked.length} restaurants, returning top results`);
        return ranked;
    },
};
