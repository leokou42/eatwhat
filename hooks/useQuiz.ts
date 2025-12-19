import { useReducer, useEffect, useCallback, useState } from 'react';
import { QUESTIONS } from '@/data/mock';
import { Question } from '@/types';
import { QuizStatus } from '@/types/quiz';
import { quizMachine, INITIAL_STATE } from '@/lib/quizMachine';
import { recommendationService } from '@/services/recommendationService';
import { RankedRestaurant } from '@/lib/rankRestaurants';

interface UseQuizReturn {
    uiState: QuizStatus;
    currentQIndex: number;
    currentQuestion: Question;
    progress: {
        current: number;
        total: number;
    };
    results: RankedRestaurant[];
    error?: string;
    choose: (choice: 'left' | 'right' | 'skip') => void;
    back: () => void;
    reset: () => void;
    retry: () => void;
}

export function useQuiz(): UseQuizReturn {
    const [state, dispatch] = useReducer(quizMachine, INITIAL_STATE);
    const [results, setResults] = useState<RankedRestaurant[]>([]);

    const currentQuestion = QUESTIONS[state.currentQIndex];

    const choose = useCallback((choice: 'left' | 'right' | 'skip') => {
        dispatch({
            type: 'ANSWER',
            payload: {
                questionId: QUESTIONS[state.currentQIndex].id,
                choice
            }
        });
    }, [state.currentQIndex]);

    const back = useCallback(() => {
        dispatch({ type: 'BACK' });
    }, []);

    const reset = useCallback(() => {
        dispatch({ type: 'RESET' });
        setResults([]);
    }, []);

    const retry = useCallback(() => {
        dispatch({ type: 'RETRY' });
    }, []);

    // Handle Async Loading with Cancellation
    useEffect(() => {
        let abortController: AbortController | null = null;

        if (state.status === 'loading') {
            abortController = new AbortController();
            const signal = abortController.signal;

            recommendationService.getRecommendations(state.answers, signal)
                .then((data) => {
                    if (!signal.aborted) {
                        setResults(data);
                        dispatch({ type: 'LOADED' });
                    }
                })
                .catch((err) => {
                    if (err.name === 'AbortError') {
                        console.log('Loading cancelled');
                    } else {
                        console.error('Failed to load recommendations', err);
                        dispatch({ type: 'ERROR', payload: err.message || 'Unknown error occurred' });
                    }
                });
        }

        return () => {
            if (abortController) {
                abortController.abort();
            }
        };
    }, [state.status, state.answers]);

    return {
        uiState: state.status,
        currentQIndex: state.currentQIndex,
        currentQuestion,
        progress: {
            current: state.currentQIndex + 1,
            total: QUESTIONS.length,
        },
        results,
        error: state.error,
        choose,
        back,
        reset,
        retry,
    };
}
