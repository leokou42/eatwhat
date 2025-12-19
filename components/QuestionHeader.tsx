"use client";
import { Question } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface QuestionHeaderProps {
    question: Question;
}

export default function QuestionHeader({ question }: QuestionHeaderProps) {
    return (
        <div className="flex flex-col items-center justify-center p-6 text-center z-10 pointer-events-none">
            <AnimatePresence mode="wait">
                <motion.h2
                    key={question.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-2xl font-bold text-gray-800 leading-tight"
                >
                    {question.text}
                </motion.h2>
            </AnimatePresence>
            <p className="text-sm text-gray-400 mt-2">
                ← {question.leftChoice} · {question.skipChoice} ↓ · {question.rightChoice} →
            </p>
        </div>
    );
}
