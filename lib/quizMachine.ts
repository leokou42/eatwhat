import { QuizState, QuizEvent } from '@/types/quiz';
import { QUESTIONS } from '@/data/mock';

export const INITIAL_STATE: QuizState = {
    status: 'questioning',
    currentQIndex: 0,
    answers: [],
};

export function quizMachine(state: QuizState, event: QuizEvent): QuizState {
    switch (event.type) {
        case 'ANSWER': {
            if (state.status !== 'questioning') {
                return state;
            }

            const nextAnswers = [...state.answers, {
                questionId: event.payload.questionId,
                choice: event.payload.choice
            }];

            const isLastQuestion = state.currentQIndex >= QUESTIONS.length - 1;

            if (isLastQuestion) {
                return {
                    ...state,
                    answers: nextAnswers,
                    status: 'loading',
                };
            }

            return {
                ...state,
                answers: nextAnswers,
                currentQIndex: state.currentQIndex + 1,
            };
        }

        case 'BACK': {
            if (state.status !== 'questioning' || state.currentQIndex === 0) {
                return state;
            }

            // Remove the last answer
            const nextAnswers = state.answers.slice(0, -1);

            return {
                ...state,
                answers: nextAnswers,
                currentQIndex: state.currentQIndex - 1,
            };
        }

        case 'LOADED': {
            if (state.status !== 'loading') {
                return state;
            }
            return {
                ...state,
                status: 'results',
            };
        }

        case 'ERROR': {
            return {
                ...state,
                status: 'error',
                error: event.payload
            };
        }

        case 'RETRY': {
            if (state.status !== 'error') return state;
            return {
                ...state,
                status: 'loading',
                error: undefined
            };
        }

        case 'RESET': {
            return INITIAL_STATE;
        }

        default:
            return state;
    }
}
