import { Answer, Question, Restaurant } from '@/types';

export interface RankedRestaurant extends Restaurant {
    score: number;
    reasons: string[];
}

export interface UserLocation {
    latitude: number;
    longitude: number;
}

function toRad(value: number) {
    return (value * Math.PI) / 180;
}

// Haversine Formula to calculate distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1)); // Return nicely formatted float
}

/**
 * Rank restaurants based on user answers.
 */
export function rankRestaurants(
    answers: Answer[],
    restaurants: Restaurant[],
    questions: Question[],
    userLocation?: UserLocation | null
): RankedRestaurant[] {
    // 1. Build a map of preferred tags to the reasons why
    const tagReasons = new Map<string, string>();

    answers.forEach((ans) => {
        if (ans.choice === 'skip') return;

        const question = questions.find((q) => q.id === ans.questionId);
        if (!question) return;

        if (ans.choice === 'left') {
            question.leftTags.forEach(tag => {
                tagReasons.set(tag, `Matches your choice: "${question.leftChoice}"`);
            });
        } else if (ans.choice === 'right') {
            question.rightTags.forEach(tag => {
                tagReasons.set(tag, `Matches your choice: "${question.rightChoice}"`);
            });
        }
    });

    // 2. Calculate scores, distances, and gather reasons
    const scoredRestaurants = restaurants.map((restaurant) => {
        let score = 0;
        const reasons: string[] = [];

        // Recalculate distance if user location is available
        let distance = restaurant.distance;
        if (userLocation) {
            distance = calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                restaurant.latitude,
                restaurant.longitude
            );
        }

        restaurant.tags.forEach((tag) => {
            if (tagReasons.has(tag)) {
                score++;
                const reason = tagReasons.get(tag);
                if (reason && !reasons.includes(reason)) {
                    reasons.push(reason);
                }
            }
        });

        return { ...restaurant, distance, score, reasons };
    });

    // 3. Stable Sort
    return [...scoredRestaurants].sort((a, b) => {
        const scoreDiff = b.score - a.score;
        if (scoreDiff !== 0) return scoreDiff;

        // Secondary sort by distance (closer is better) if available
        return a.distance - b.distance;
    });
}
