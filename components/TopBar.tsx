import { RotateCcw, ChevronLeft, Home } from 'lucide-react';

interface TopBarProps {
    currentStep: number;
    totalSteps: number;
    onReset: () => void;
    onBack?: () => void;
    onExit?: () => void;
    canBack?: boolean;
    isResults: boolean;
}

export default function TopBar({
    currentStep,
    totalSteps,
    onReset,
    onBack,
    onExit,
    canBack,
    isResults,
}: TopBarProps) {
    return (
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 z-10">
            <h1 className="text-xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                Eat What
            </h1>

            <div className="flex items-center gap-2">
                {!isResults && (
                    <div className="flex items-center gap-2 mr-2">
                        {onExit && (
                            <button
                                onClick={onExit}
                                className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
                                aria-label="Exit Recommendation"
                            >
                                <Home size={18} />
                            </button>
                        )}
                        {canBack && (
                            <button
                                onClick={onBack}
                                className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
                                aria-label="Back"
                            >
                                <ChevronLeft size={20} />
                            </button>
                        )}
                        <span className="text-sm font-medium text-gray-500">
                            {currentStep} / {totalSteps}
                        </span>
                    </div>
                )}
                <button
                    onClick={onReset}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
                    aria-label="Reset"
                >
                    <RotateCcw size={20} />
                </button>
            </div>
        </div>
    );
}
