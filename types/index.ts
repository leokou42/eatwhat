import { Question } from '@/schemas/question';
import { Restaurant } from '@/schemas/restaurant';

export type { Question } from '@/schemas/question';
export type { Restaurant } from '@/schemas/restaurant';

export interface Answer {
    questionId: number;
    choice: 'left' | 'right' | 'skip';
}

export type UIState = 'questioning' | 'loading' | 'results';
