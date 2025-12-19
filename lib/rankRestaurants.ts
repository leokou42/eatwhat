import { Answer, Question, Restaurant } from '@/types';

export interface RankedRestaurant extends Restaurant {
    score: number;
    reasons: string[];
}

/**
 * Rank restaurants based on user answers.
 */
export function rankRestaurants(
    answers: Answer[],
    restaurants: Restaurant[],
    questions: Question[]
): RankedRestaurant[] {
    // 1. Build a map of preferred tags to the reasons why
    // Map<TagName, ReasonString>
    const tagReasons = new Map<string, string>();

    answers.forEach((ans) => {
        if (ans.choice === 'skip') return;

        const question = questions.find((q) => q.id === ans.questionId);
        if (!question) return;

        if (ans.choice === 'left') {
            question.leftTags.forEach(tag => {
                // Reason: "Preferred Rice (Rice or Noodle?)"
                tagReasons.set(tag, `Matches your choice: "${question.leftChoice}"`);
            });
        } else if (ans.choice === 'right') {
            question.rightTags.forEach(tag => {
                tagReasons.set(tag, `Matches your choice: "${question.rightChoice}"`);
            });
        }
    });

    // 2. Calculate scores and gather reasons
    const scoredRestaurants = restaurants.map((restaurant) => {
        let score = 0;
        const reasons: string[] = [];

        restaurant.tags.forEach((tag) => {
            if (tagReasons.has(tag)) {
                score++;
                const reason = tagReasons.get(tag);
                // Avoid duplicate reasons for the same restaurant if multiple tags map to same logic (unlikely here but possible)
                if (reason && !reasons.includes(reason)) {
                    reasons.push(reason);
                }
            }
        });

        return { ...restaurant, score, reasons };
    });

    // 3. Stable Sort
    return [...scoredRestaurants].sort((a, b) => {
        const scoreDiff = b.score - a.score;
        if (scoreDiff !== 0) return scoreDiff;
        return 0;
    });
}
