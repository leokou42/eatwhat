import { ArrowLeft, ArrowRight, ChevronUp } from 'lucide-react';

interface ActionButtonsProps {
    onLeft: () => void;
    onRight: () => void;
    onSkip: () => void;
    disabled?: boolean;
}

export default function ActionButtons({
    onLeft,
    onRight,
    onSkip,
    disabled,
}: ActionButtonsProps) {
    const btnClass =
        'flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';

    return (
        <div className="flex items-center justify-center gap-6 pb-8 pt-4 z-20">
            <button
                onClick={onLeft}
                disabled={disabled}
                className={`${btnClass} bg-white text-red-500 border border-red-100 hover:bg-red-50`}
                aria-label="Select Left"
            >
                <ArrowLeft size={24} />
            </button>

            <button
                onClick={onSkip}
                disabled={disabled}
                className={`${btnClass} bg-gray-100 text-gray-500 hover:bg-gray-200 w-12 h-12`}
                aria-label="Skip"
            >
                <ChevronUp size={24} />
            </button>

            <button
                onClick={onRight}
                disabled={disabled}
                className={`${btnClass} bg-white text-green-500 border border-green-100 hover:bg-green-50`}
                aria-label="Select Right"
            >
                <ArrowRight size={24} />
            </button>
        </div>
    );
}
