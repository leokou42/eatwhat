"use client";

import { useQuiz } from '@/hooks/useQuiz';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import TopBar from '@/components/TopBar';
import QuestionHeader from '@/components/QuestionHeader';
import CardStage from '@/components/CardStage';
import ActionButtons from '@/components/ActionButtons';
import ResultsList from '@/components/ResultsList';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function Home() {
  const { uiState, currentQuestion, progress, results, error, choose, back, reset, retry } = useQuiz();

  useKeyboardShortcuts({
    onLeft: () => choose('left'),
    onRight: () => choose('right'),
    onSkip: () => choose('skip'),
    onBack: back,
    disabled: uiState !== 'questioning',
  });

  return (
    <main className="flex flex-col h-full w-full bg-slate-50 relative">
      <TopBar
        currentStep={progress.current}
        totalSteps={progress.total}
        onReset={reset}
        onBack={back}
        canBack={progress.current > 1}
        isResults={uiState === 'results'}
      />

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {uiState === 'questioning' && (
          <motion.div
            key="question-mode"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-between py-4 overflow-hidden"
          >
            <QuestionHeader question={currentQuestion} />

            <CardStage
              question={currentQuestion}
              onChoose={choose}
            />

            <ActionButtons
              onLeft={() => choose('left')}
              onRight={() => choose('right')}
              onSkip={() => choose('skip')}
            />
          </motion.div>
        )}

        {uiState === 'loading' && (
          <motion.div
            key="loading-mode"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-orange-100 border-t-orange-500 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-xl">🍽️</div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-800">Finding best matches...</h2>
              <p className="text-gray-500 text-sm">Analyzing your preferences</p>
            </div>
          </motion.div>
        )}

        {uiState === 'error' && (
          <motion.div
            key="error-mode"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6"
          >
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
              <AlertCircle size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-800">Oops!</h2>
              <p className="text-gray-500">{error || 'Something went wrong.'}</p>
            </div>

            <button
              onClick={retry}
              className="flex items-center gap-2 bg-gray-900 text-white font-bold py-3 px-6 rounded-xl hover:bg-black transition-colors"
            >
              <RefreshCw size={20} />
              <span>Try Again</span>
            </button>

            <button onClick={reset} className="text-gray-400 hover:text-gray-600 underline text-sm">
              Return to Start
            </button>
          </motion.div>
        )}

        {uiState === 'results' && (
          <motion.div
            key="results-mode"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col w-full overflow-hidden"
          >
            <div className="px-6 py-2 text-center bg-white border-b border-gray-100 shadow-sm z-10">
              <p className="text-gray-500 text-sm">Based on your choices</p>
            </div>
            <ResultsList restaurants={results} />

            <div className="p-4 bg-white border-t border-gray-100">
              <button
                onClick={reset}
                className="w-full bg-gray-900 text-white font-bold py-3 px-4 rounded-xl hover:bg-black transition-colors"
              >
                Start Over
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
