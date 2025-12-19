"use client";

import { useState } from 'react';
import { Question } from '@/types';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';

interface CardStageProps {
    question: Question;
    onChoose: (choice: 'left' | 'right' | 'skip') => void;
}

export default function CardStage({ question, onChoose }: CardStageProps) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Rotation based on X movement
    const rotate = useTransform(x, [-200, 200], [-25, 25]);

    // Opacity indicators
    const leftOpacity = useTransform(x, [-100, -20], [1, 0]);
    const rightOpacity = useTransform(x, [20, 100], [0, 1]);
    // Changed: Skip is now Swipe Up (negative Y)
    const skipOpacity = useTransform(y, [-100, -20], [1, 0]);

    // Background scales to indicate hidden cards
    const bgScale = useTransform(x, [-200, 0, 200], [1.05, 1, 1.05]);

    const handleDragEnd = (event: any, info: PanInfo) => {
        const threshold = 100;
        const { x, y } = info.offset;

        if (Math.abs(x) > Math.abs(y)) {
            // Horizontal Dominant
            if (x < -threshold) {
                onChoose('left');
            } else if (x > threshold) {
                onChoose('right');
            }
        } else {
            // Vertical Dominant
            // Request: Up => Skip (y < -threshold)
            if (y < -threshold) {
                onChoose('skip');
            }
        }
    };

    return (
        <div className="relative flex-1 w-full flex items-center justify-center pointer-events-none">
            {/* Background Indicators (Left/Right/Skip) */}
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 flex justify-between z-0">
                {/* Left Hint */}
                <div className="w-16 h-32 bg-red-100 rounded-l-xl border-l-4 border-red-400 flex items-center justify-center opacity-50">
                    <span className="sr-only">Left</span>
                </div>
                {/* Right Hint */}
                <div className="w-16 h-32 bg-green-100 rounded-r-xl border-r-4 border-green-400 flex items-center justify-center opacity-50">
                    <span className="sr-only">Right</span>
                </div>
            </div>

            {/* Skip Hint (Now Top for Swipe Up) */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-32 h-16 bg-gray-100 rounded-t-xl border-t-4 border-gray-400 opacity-50 z-0">
            </div>

            {/* Main Card */}
            <motion.div
                key={question.id}
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} // Snap back if released early
                dragElastic={0.6}
                onDragEnd={handleDragEnd}
                style={{ x, y, rotate }}
                className="w-72 h-96 bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col items-center justify-center p-6 relative z-10 cursor-grab active:cursor-grabbing pointer-events-auto touch-none"
                whileTap={{ scale: 1.05 }}
                initial={{ scale: 0.9, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 1.1, opacity: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
            >
                {/* Overlays for swipe feedback */}
                <motion.div style={{ opacity: rightOpacity }} className="absolute inset-0 bg-green-500/20 rounded-2xl flex items-center justify-center pointer-events-none">
                    <span className="text-4xl font-bold text-green-600 border-4 border-green-600 rounded px-2 -rotate-12">
                        {question.rightChoice}
                    </span>
                </motion.div>

                <motion.div style={{ opacity: leftOpacity }} className="absolute inset-0 bg-red-500/20 rounded-2xl flex items-center justify-center pointer-events-none">
                    <span className="text-4xl font-bold text-red-600 border-4 border-red-600 rounded px-2 rotate-12">
                        {question.leftChoice}
                    </span>
                </motion.div>

                <motion.div style={{ opacity: skipOpacity }} className="absolute inset-0 bg-gray-500/20 rounded-2xl flex items-start justify-center pt-8 pointer-events-none">
                    <span className="text-2xl font-bold text-gray-600 border-4 border-gray-600 rounded px-2">
                        {question.skipChoice}
                    </span>
                </motion.div>

                {/* Content */}
                <div className="text-center space-y-4">
                    <div className="text-6xl mb-4">🍽️</div>
                    <h3 className="text-2xl font-bold text-gray-800">{question.text}</h3>
                    <p className="text-gray-400 text-sm">Drag Up to Skip</p>
                </div>

            </motion.div>
        </div>
    );
}
