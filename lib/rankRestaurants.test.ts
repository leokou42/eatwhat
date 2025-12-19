import { describe, it, expect } from 'vitest';
import { rankRestaurants } from './rankRestaurants';
import { Question, Restaurant, Answer } from '@/types';

// Mock Data for Tests
const mockQuestions: Question[] = [
    {
        id: 1,
        text: 'Rice or Noodle?',
        leftChoice: 'Rice',
        rightChoice: 'Noodle',
        skipChoice: 'None',
        leftTags: ['rice'],
        rightTags: ['noodle'],
    },
    {
        id: 2,
        text: 'Near or Far?',
        leftChoice: 'Near',
        rightChoice: 'Far',
        skipChoice: 'None',
        leftTags: ['near'],
        rightTags: ['far'],
    },
];

const mockRestaurants: Restaurant[] = [
    { id: 1, name: 'Rice Place', distance: 1, locationUrl: '', tags: ['rice', 'near'] },
    { id: 2, name: 'Noodle Place', distance: 5, locationUrl: '', tags: ['noodle', 'far'] },
    { id: 3, name: 'Mixed Place', distance: 3, locationUrl: '', tags: ['rice', 'noodle'] },
];

describe('rankRestaurants', () => {
    it('should rank and provide reasons', () => {
        const answers: Answer[] = [
            { questionId: 1, choice: 'left' }, // chose rice
        ];

        const ranked = rankRestaurants(answers, mockRestaurants, mockQuestions);

        // Check reasons for Rice Place
        expect(ranked[0].id).toBe(1);
        expect(ranked[0].score).toBe(1);
        expect(ranked[0].reasons.length).toBeGreaterThan(0);
        expect(ranked[0].reasons[0]).toContain('Matches your choice: "Rice"');

        // Check Noodle Place (score 0)
        expect(ranked[2].id).toBe(2);
        expect(ranked[2].score).toBe(0);
        expect(ranked[2].reasons.length).toBe(0);
    });
});
