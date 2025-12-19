import { Answer } from './index';

export type QuizStatus = 'questioning' | 'loading' | 'results' | 'error';

export interface QuizState {
    status: QuizStatus;
    currentQIndex: number;
    answers: Answer[];
    error?: string;
}

export type QuizEvent =
    | { type: 'ANSWER'; payload: { questionId: number; choice: 'left' | 'right' | 'skip' } }
    | { type: 'BACK' }
    | { type: 'LOADED' }
    | { type: 'ERROR'; payload: string }
    | { type: 'RETRY' }
    | { type: 'RESET' };
