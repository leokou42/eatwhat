"use client";

import { useQuiz } from '@/hooks/useQuiz';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import TopBar from '@/components/TopBar';
import QuestionHeader from '@/components/QuestionHeader';
import CardStage from '@/components/CardStage';
import ActionButtons from '@/components/ActionButtons';
import ResultsList from '@/components/ResultsList';
import ConsentModal from '@/components/ConsentModal';

export default function Home() {
  const { uiState, currentQuestion, progress, results, error, startupTrace, choose, back, reset, retry, confirmConsent } = useQuiz();

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
        {uiState === 'questioning' && currentQuestion && (
          <div className="flex-1 flex flex-col items-center justify-between py-4 overflow-hidden">
            <QuestionHeader question={currentQuestion} />
            <CardStage question={currentQuestion} onChoose={choose} />
            <ActionButtons onLeft={() => choose('left')} onRight={() => choose('right')} onSkip={() => choose('skip')} />
          </div>
        )}

        {(uiState === 'loadingQuestions' || uiState === 'loadingResults') && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-orange-100 border-t-orange-500 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-xl">🍽️</div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-800">資料準備中...</h2>
              <p className="text-gray-500 text-sm">正在處理你的偏好</p>
            </div>
          </div>
        )}

        {uiState === 'results' && (
          <div className="flex-1 flex flex-col w-full overflow-hidden">
            <div className="px-6 py-2 text-center bg-white border-b border-gray-100 shadow-sm z-10">
              <p className="text-gray-500 text-sm">Based on your choices</p>
            </div>
            <ResultsList restaurants={results} />
            <div className="p-4 bg-white border-t border-gray-100">
              <button onClick={reset} className="w-full bg-gray-900 text-white font-bold py-3 px-4 rounded-xl hover:bg-black transition-colors">
                Start Over
              </button>
            </div>
          </div>
        )}

        {uiState === 'error' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <h2 className="text-xl font-bold text-gray-800">發生錯誤</h2>
            <p className="text-gray-500 text-sm">{error || '請稍後再試'}</p>
            <button onClick={retry} className="bg-gray-900 text-white px-4 py-2 rounded-lg">
              重試
            </button>
          </div>
        )}

        {uiState === 'consent' && <ConsentModal onConfirm={confirmConsent} />}
      </div>

      {process.env.NEXT_PUBLIC_STARTUP_DEBUG === '1' && (
        <div className="border-t border-slate-200 bg-slate-900 text-slate-100 px-3 py-2 text-[11px] font-mono max-h-40 overflow-y-auto">
          <div className="text-slate-300 mb-1">Startup Trace</div>
          {startupTrace.length === 0 ? (
            <div className="text-slate-500">No trace yet</div>
          ) : (
            startupTrace.map((line, index) => (
              <div key={`${line}-${index}`} className="whitespace-pre-wrap break-words">
                {line}
              </div>
            ))
          )}
        </div>
      )}
    </main>
  );
}
