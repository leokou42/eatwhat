import { DYNAMIC_QUESTION_TEMPLATES, STARTER_QUESTIONS } from '@/data/questionTemplates';
import { GeneratedQuestion, rewriteQuestions } from '@/lib/gemini';
import { questionLengthToDynamicCount, type QuestionLength } from '@/lib/settings';

export type QuestionPhase = 'starter' | 'dynamic';

export async function buildStarterQuestions(): Promise<GeneratedQuestion[]> {
  return STARTER_QUESTIONS;
}

export async function buildDynamicQuestions(params: {
  preferenceSummary: string;
  confidence?: number;
  questionLength?: QuestionLength;
  model?: string;
}): Promise<GeneratedQuestion[]> {
  const count = params.questionLength
    ? questionLengthToDynamicCount(params.questionLength)
    : (params.confidence ?? 0.4) >= 0.8
      ? 3
      : 5;
  const base = DYNAMIC_QUESTION_TEMPLATES.slice(0, count);
  return rewriteQuestions({
    baseQuestions: base,
    preferenceSummary: params.preferenceSummary,
    model: params.model,
  });
}

export function withIds(questions: GeneratedQuestion[]) {
  return questions.map((q, idx) => ({ id: idx + 1, ...q }));
}
