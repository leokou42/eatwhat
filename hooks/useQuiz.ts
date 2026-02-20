import { useEffect, useMemo, useState, useCallback } from 'react';
import { Question } from '@/types';
import { RankedRestaurant } from '@/lib/rankRestaurants';
import { logStartup, logStartupError, msSince } from '@/lib/startupDebug';
import { mergeAppSettings, readGuestSettings, SETTINGS_UPDATED_EVENT } from '@/lib/settings';

export type QuizPhase = 'starter' | 'dynamic';
export type QuizStatus = 'loadingQuestions' | 'questioning' | 'loadingResults' | 'results' | 'error' | 'consent';

interface AnswerPayload {
  questionId: number;
  choice: 'left' | 'right' | 'skip';
  leftTags: string[];
  rightTags: string[];
  questionText: string;
  leftChoice: string;
  rightChoice: string;
  skipChoice: string;
}

interface UseQuizReturn {
  uiState: QuizStatus;
  phase: QuizPhase;
  currentQIndex: number;
  currentQuestion: Question | null;
  progress: {
    current: number;
    total: number;
  };
  results: RankedRestaurant[];
  error?: string;
  startupTrace: string[];
  choose: (choice: 'left' | 'right' | 'skip') => void;
  back: () => void;
  reset: () => void;
  retry: () => void;
  confirmConsent: () => void;
}

export function useQuiz(): UseQuizReturn {
  const [uiState, setUiState] = useState<QuizStatus>('loadingQuestions');
  const [phase, setPhase] = useState<QuizPhase>('starter');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [starterAnswers, setStarterAnswers] = useState<AnswerPayload[]>([]);
  const [dynamicAnswers, setDynamicAnswers] = useState<AnswerPayload[]>([]);
  const [results, setResults] = useState<RankedRestaurant[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [pendingAction, setPendingAction] = useState<'questions' | 'init' | 'score' | null>(null);
  const [localConsent, setLocalConsent] = useState(false);
  const [startupTrace, setStartupTrace] = useState<string[]>([]);
  const [runtimeSettings, setRuntimeSettings] = useState(() => mergeAppSettings(readGuestSettings()));

  const currentQuestion = questions[currentQIndex] ?? null;

  const appendTrace = useCallback((phase: string, payload?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    const line = payload && Object.keys(payload).length > 0
      ? `${timestamp} ${phase} ${JSON.stringify(payload)}`
      : `${timestamp} ${phase}`;
    setStartupTrace((prev) => [...prev.slice(-79), line]);
    logStartup('client', 'quiz', phase, payload);
  }, []);

  useEffect(() => {
    appendTrace('mount');
  }, [appendTrace]);

  useEffect(() => {
    appendTrace('uiState:update', { uiState });
  }, [appendTrace, uiState]);

  useEffect(() => {
    if (error) appendTrace('uiState:error', { error });
  }, [appendTrace, error]);

  const syncSettings = useCallback(() => {
    const next = mergeAppSettings(readGuestSettings());
    setRuntimeSettings((prev) => {
      const prevSnapshot = JSON.stringify(prev);
      const nextSnapshot = JSON.stringify(next);
      if (prevSnapshot === nextSnapshot) return prev;
      return next;
    });
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncSettings();
      }
    };

    syncSettings();
    window.addEventListener('storage', syncSettings);
    window.addEventListener(SETTINGS_UPDATED_EVENT, syncSettings);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('storage', syncSettings);
      window.removeEventListener(SETTINGS_UPDATED_EVENT, syncSettings);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [syncSettings]);

  useEffect(() => {
    const geoStartedAt = Date.now();
    appendTrace('geolocation:start');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          appendTrace('geolocation:success', {
            elapsedMs: msSince(geoStartedAt),
            latitude: Number(position.coords.latitude.toFixed(6)),
            longitude: Number(position.coords.longitude.toFixed(6)),
            accuracy: position.coords.accuracy,
          });
        },
        (geoError) => {
          setUserLocation(null);
          setUiState('error');
          setError('無法取得定位，請允許定位權限');
          appendTrace('geolocation:failed', {
            elapsedMs: msSince(geoStartedAt),
            code: geoError.code,
            message: geoError.message,
          });
        },
        {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 60000,
        }
      );
    } else {
      setUiState('error');
      setError('此裝置不支援定位');
      appendTrace('geolocation:unsupported');
    }
  }, [appendTrace]);

  const fetchQuestions = useCallback(async () => {
    const startedAt = Date.now();
    appendTrace('questions:request:start', { hasLocation: Boolean(userLocation) });
    setUiState('loadingQuestions');
    setError(undefined);
    try {
      const response = await fetch('/api/recommendations/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: userLocation ?? undefined,
          runtimeSettings,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        requiresConsent?: boolean;
        error?: string;
        phase?: QuizPhase;
        questions?: Question[];
      };

      appendTrace('questions:request:done', {
        status: response.status,
        elapsedMs: msSince(startedAt),
        requiresConsent: Boolean(data.requiresConsent),
        phase: data.phase ?? null,
        questionCount: data.questions?.length ?? 0,
      });

      if (data.requiresConsent) {
        setUiState('consent');
        setPendingAction('questions');
        return;
      }

      if (!response.ok) {
        setUiState('error');
        setError(data.error || 'Failed to load questions');
        return;
      }

      setPhase(data.phase || 'starter');
      setQuestions(data.questions || []);
      setCurrentQIndex(0);
      setUiState('questioning');
    } catch (requestError) {
      logStartupError('client', 'quiz', 'questions:request:failed', requestError, {
        elapsedMs: msSince(startedAt),
      });
      appendTrace('questions:request:failed', { elapsedMs: msSince(startedAt) });
      setUiState('error');
      setError('Failed to load questions');
    }
  }, [appendTrace, runtimeSettings, userLocation]);

  useEffect(() => {
    if (userLocation) {
      appendTrace('geolocation:ready');
      fetchQuestions();
    }
  }, [appendTrace, fetchQuestions, userLocation]);

  const choose = useCallback(
    (choice: 'left' | 'right' | 'skip') => {
      if (!currentQuestion) return;
      const payload: AnswerPayload = {
        questionId: currentQuestion.id,
        choice,
        leftTags: currentQuestion.leftTags,
        rightTags: currentQuestion.rightTags,
        questionText: currentQuestion.text,
        leftChoice: currentQuestion.leftChoice,
        rightChoice: currentQuestion.rightChoice,
        skipChoice: currentQuestion.skipChoice,
      };

      const nextIndex = currentQIndex + 1;

      if (phase === 'starter') {
        const nextAnswers = [...starterAnswers, payload];
        setStarterAnswers(nextAnswers);
        appendTrace('answer:starter', {
          questionId: payload.questionId,
          choice: payload.choice,
          nextIndex,
          total: questions.length,
        });

        if (nextIndex >= questions.length) {
          setUiState('loadingQuestions');
          if (!userLocation) {
            appendTrace('init:blocked:no-location');
            setUiState('error');
            setError('無法取得定位');
            return;
          }
          const runInit = async () => {
            const startedAt = Date.now();
            appendTrace('init:request:start', { answerCount: nextAnswers.length });
            try {
              const response = await fetch('/api/recommendations/init', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  location: userLocation,
                  starterAnswers: nextAnswers,
                  consented: localConsent,
                  runtimeSettings,
                }),
              });
              const data = (await response.json().catch(() => ({}))) as {
                requiresConsent?: boolean;
                error?: string;
                questions?: Question[];
              };
              appendTrace('init:request:done', {
                status: response.status,
                elapsedMs: msSince(startedAt),
                requiresConsent: Boolean(data.requiresConsent),
                questionCount: data.questions?.length ?? 0,
              });
              if (data.requiresConsent) {
                setUiState('consent');
                setPendingAction('init');
                return;
              }
              if (!response.ok) {
                setUiState('error');
                setError(data.error || 'Failed to init');
                return;
              }
              setPhase('dynamic');
              setQuestions(data.questions || []);
              setCurrentQIndex(0);
              setUiState('questioning');
            } catch (requestError) {
              logStartupError('client', 'quiz', 'init:request:failed', requestError, {
                elapsedMs: msSince(startedAt),
              });
              appendTrace('init:request:failed', { elapsedMs: msSince(startedAt) });
              setUiState('error');
              setError('Failed to init');
            }
          };
          void runInit();
          return;
        }

        setCurrentQIndex(nextIndex);
      } else {
        const nextAnswers = [...dynamicAnswers, payload];
        setDynamicAnswers(nextAnswers);
        appendTrace('answer:dynamic', {
          questionId: payload.questionId,
          choice: payload.choice,
          nextIndex,
          total: questions.length,
        });

        if (nextIndex >= questions.length) {
          setUiState('loadingResults');
          if (!userLocation) {
            appendTrace('score:blocked:no-location');
            setUiState('error');
            setError('無法取得定位');
            return;
          }
          const runScore = async () => {
            const startedAt = Date.now();
            appendTrace('score:request:start', { answerCount: nextAnswers.length });
            try {
              const response = await fetch('/api/recommendations/score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  location: userLocation,
                  answers: nextAnswers,
                  runtimeSettings,
                }),
              });
              const data = (await response.json().catch(() => ({}))) as {
                error?: string;
                results?: RankedRestaurant[];
              };
              appendTrace('score:request:done', {
                status: response.status,
                elapsedMs: msSince(startedAt),
                resultCount: data.results?.length ?? 0,
              });
              if (!response.ok) {
                setUiState('error');
                setError(data.error || 'Failed to score');
                return;
              }
              setResults(data.results || []);
              setUiState('results');
            } catch (requestError) {
              logStartupError('client', 'quiz', 'score:request:failed', requestError, {
                elapsedMs: msSince(startedAt),
              });
              appendTrace('score:request:failed', { elapsedMs: msSince(startedAt) });
              setUiState('error');
              setError('Failed to score');
            }
          };
          void runScore();
          return;
        }

        setCurrentQIndex(nextIndex);
      }
    },
    [
      appendTrace,
      currentQuestion,
      currentQIndex,
      dynamicAnswers,
      localConsent,
      phase,
      questions.length,
      runtimeSettings,
      starterAnswers,
      userLocation,
    ]
  );

  const back = useCallback(() => {
    if (currentQIndex === 0) return;
    setCurrentQIndex((idx) => Math.max(0, idx - 1));
    if (phase === 'starter') {
      setStarterAnswers((prev) => prev.slice(0, -1));
    } else {
      setDynamicAnswers((prev) => prev.slice(0, -1));
    }
  }, [currentQIndex, phase]);

  const reset = useCallback(() => {
    appendTrace('reset');
    setResults([]);
    setStarterAnswers([]);
    setDynamicAnswers([]);
    setCurrentQIndex(0);
    setPhase('starter');
    fetchQuestions();
  }, [appendTrace, fetchQuestions]);

  const retry = useCallback(() => {
    if (uiState === 'error') {
      appendTrace('retry');
      fetchQuestions();
    }
  }, [appendTrace, fetchQuestions, uiState]);

  const confirmConsent = useCallback(async () => {
    const startedAt = Date.now();
    appendTrace('consent:request:start', { pendingAction });
    try {
      const response = await fetch('/api/consent', { method: 'POST' });
      appendTrace('consent:request:done', { status: response.status, elapsedMs: msSince(startedAt) });
      if (!response.ok && response.status !== 401) {
        setUiState('error');
        setError('Failed to save consent');
        return;
      }
      if (response.status === 401) {
        appendTrace('consent:request:guest-fallback');
      }
      setLocalConsent(true);
      if (pendingAction === 'questions') {
        setPendingAction(null);
        fetchQuestions();
      }
      if (pendingAction === 'init') {
        setPendingAction(null);
        if (userLocation && starterAnswers.length > 0) {
          setUiState('loadingQuestions');
          const initStartedAt = Date.now();
          appendTrace('init:request:start', { answerCount: starterAnswers.length, consented: true });
          const responseInit = await fetch('/api/recommendations/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              location: userLocation,
              starterAnswers,
              consented: true,
              runtimeSettings,
            }),
          });
          const data = (await responseInit.json().catch(() => ({}))) as { questions?: Question[]; error?: string };
          appendTrace('init:request:done', {
            status: responseInit.status,
            elapsedMs: msSince(initStartedAt),
            questionCount: data.questions?.length ?? 0,
          });
          if (!responseInit.ok) {
            setUiState('error');
            setError(data.error || 'Failed to init');
            return;
          }
          if (data.questions) {
            setPhase('dynamic');
            setQuestions(data.questions || []);
            setCurrentQIndex(0);
            setUiState('questioning');
          }
        }
      }
    } catch (requestError) {
      logStartupError('client', 'quiz', 'consent:request:failed', requestError, {
        elapsedMs: msSince(startedAt),
      });
      appendTrace('consent:request:failed', { elapsedMs: msSince(startedAt) });
      setUiState('error');
      setError('Failed to save consent');
    }
  }, [appendTrace, fetchQuestions, pendingAction, runtimeSettings, starterAnswers, userLocation]);

  const progress = useMemo(() => ({
    current: currentQIndex + 1,
    total: questions.length || 1,
  }), [currentQIndex, questions.length]);

  return {
    uiState,
    phase,
    currentQIndex,
    currentQuestion,
    progress,
    results,
    error,
    startupTrace,
    choose,
    back,
    reset,
    retry,
    confirmConsent,
  };
}
