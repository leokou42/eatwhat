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
];

const mockRestaurants: Restaurant[] = [
    {
        id: '1',
        name: 'Rice Place',
        distance: 10, // Original
        locationUrl: '',
        tags: ['rice'],
        latitude: 25.033493, // Taipei 101 approx
        longitude: 121.529881
    },
    {
        id: '2',
        name: 'Noodle Place',
        distance: 20, // Original
        locationUrl: '',
        tags: ['noodle'],
        latitude: 25.046556, // Different location
        longitude: 121.543440
    },
];

describe('rankRestaurants', () => {
    it('should rank and provide reasons', () => {
        const answers: Answer[] = [
            { questionId: 1, choice: 'left' }, // chose rice
        ];

        const ranked = rankRestaurants(answers, mockRestaurants, mockQuestions, null);

        // Check reasons for Rice Place
        expect(ranked[0].id).toBe('1');
        expect(ranked[0].score).toBe(1);
        expect(ranked[0].reasons.length).toBeGreaterThan(0);
    });

    it('should calculate distance when user location is provided', () => {
        const answers: Answer[] = [];
        const userLoc = { latitude: 25.033000, longitude: 121.529000 }; // Very close to Rice Place

        const ranked = rankRestaurants(answers, mockRestaurants, mockQuestions, userLoc);

        // Distance should be very small (< 1km)
        expect(ranked[0].id).toBe('1'); // Rice place
        expect(ranked[0].distance).toBeLessThan(1.0);
        expect(ranked[0].distance).not.toBe(10); // Should not be 10 anymore
    });
});
