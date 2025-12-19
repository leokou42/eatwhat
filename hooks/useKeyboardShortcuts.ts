import { useEffect } from 'react';

type KeyAction = 'left' | 'right' | 'skip' | 'back';

interface ShortcutConfig {
    onLeft?: () => void;
    onRight?: () => void;
    onSkip?: () => void;
    onBack?: () => void;
    disabled?: boolean;
}

export function useKeyboardShortcuts({
    onLeft,
    onRight,
    onSkip,
    onBack,
    disabled
}: ShortcutConfig) {
    useEffect(() => {
        if (disabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent if typing in an input
            const target = e.target as HTMLElement;
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) {
                return;
            }

            switch (e.key) {
                case 'ArrowLeft':
                    onLeft?.();
                    break;
                case 'ArrowRight':
                    onRight?.();
                    break;
                case 'ArrowUp': // Also support Up Arrow for skip as requested gesture logic aligns
                case ' ': // Space
                    e.preventDefault(); // Prevent scroll
                    onSkip?.();
                    break;
                case 'Backspace':
                    onBack?.();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onLeft, onRight, onSkip, onBack, disabled]);
}
