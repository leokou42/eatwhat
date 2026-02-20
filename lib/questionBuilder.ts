import { DYNAMIC_QUESTION_TEMPLATES, STARTER_QUESTIONS } from '@/data/questionTemplates';
import { GeneratedQuestion, rewriteQuestions } from '@/lib/gemini';

export type QuestionPhase = 'starter' | 'dynamic';

export async function buildStarterQuestions(): Promise<GeneratedQuestion[]> {
  return STARTER_QUESTIONS;
}

export async function buildDynamicQuestions(params: {
  preferenceSummary: string;
  confidence: number;
}): Promise<GeneratedQuestion[]> {
  const count = params.confidence >= 0.8 ? 3 : 5;
  const base = DYNAMIC_QUESTION_TEMPLATES.slice(0, count);
  return rewriteQuestions({ baseQuestions: base, preferenceSummary: params.preferenceSummary });
}

export function withIds(questions: GeneratedQuestion[]) {
  return questions.map((q, idx) => ({ id: idx + 1, ...q }));
}
