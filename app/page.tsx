"use client";

import { useQuiz } from '@/hooks/useQuiz';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import TopBar from '@/components/TopBar';
import QuestionHeader from '@/components/QuestionHeader';
import CardStage from '@/components/CardStage';
import ActionButtons from '@/components/ActionButtons';
import ResultCardStack from '@/components/ResultCardStack';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function Home() {
  const { uiState, currentQuestion, progress, results, error, choose, back, reset, retry } = useQuiz();

  console.log(`Home: uiState=${uiState}, results=${results.length}, error=${error}`);

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
      <div className="flex-1 flex flex-col w-full overflow-hidden relative">
        {uiState === 'questioning' && (
          <div className="flex-1 flex flex-col items-center justify-between py-4 overflow-hidden">
            <QuestionHeader question={currentQuestion} />
            <CardStage question={currentQuestion} onChoose={choose} />
            <ActionButtons onLeft={() => choose('left')} onRight={() => choose('right')} onSkip={() => choose('skip')} />
          </div>
        )}

        {uiState === 'loading' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-orange-100 border-t-orange-500 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-xl">🍽️</div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-800">Finding best matches...</h2>
              <p className="text-gray-500 text-sm">Analyzing your preferences</p>
            </div>
          </div>
        )}

        {uiState === 'error' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-800">Oops! Something went wrong</h2>
              <p className="text-gray-500 text-sm">{error || 'Failed to load recommendations'}</p>
            </div>
            <button
              onClick={retry}
              className="flex items-center gap-2 bg-orange-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-orange-600 transition-all shadow-lg"
            >
              <RefreshCw size={18} />
              Try Again
            </button>
          </div>
        )}

        {uiState === 'results' && (
          <div className="flex-1 flex flex-col w-full overflow-hidden">
            <div className="px-6 py-4 text-center bg-white border-b border-gray-100 shadow-sm z-10">
              <p className="text-gray-900 font-bold">Top Recommendations</p>
              <p className="text-gray-500 text-xs">Swipe right to accept, left to discard</p>
            </div>
            <ResultCardStack restaurants={results} onReset={reset} />
          </div>
        )}
      </div>
    </main>
  );
}
