import { z } from 'zod';
import { logStartup, logStartupError, msSince } from '@/lib/startupDebug';

export const PreferenceSchema = z.object({
  cuisine: z.array(z.string()),
  taste: z.array(z.string()),
  price: z.array(z.enum(['budget', 'mid', 'high'])),
  ambience: z.array(z.string()),
  mealType: z.array(z.string()),
  distancePreference: z.enum(['near', 'far', 'no_preference']),
  diet: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  rationale: z.array(z.string()),
});

export type PreferenceProfile = z.infer<typeof PreferenceSchema>;

const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash';
const DEFAULT_GEMINI_API_VERSION = 'v1beta';

function getGeminiApiVersion() {
  return process.env.GEMINI_API_VERSION?.trim() || DEFAULT_GEMINI_API_VERSION;
}

function getGeminiModel() {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}

function buildGeminiEndpoint(model: string) {
  const version = getGeminiApiVersion();
  return `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent`;
}

export async function inferPreferences(params: {
  userHistorySummary: string;
  starterQuizAnswers: string;
  nearbyPlacesMinimal: string;
}): Promise<PreferenceProfile> {
  const model = getGeminiModel();
  const endpoint = buildGeminiEndpoint(model);
  const startedAt = Date.now();
  logStartup('server', 'gemini', 'infer-preferences:start', {
    model,
    apiVersion: getGeminiApiVersion(),
    starterAnswerLength: params.starterQuizAnswers.length,
    nearbyPlacesLength: params.nearbyPlacesMinimal.length,
  });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logStartup('server', 'gemini', 'infer-preferences:missing-key', {
      elapsedMs: msSince(startedAt),
    });
    throw new Error('GEMINI_API_KEY missing');
  }

  const prompt = `
你是餐廳推薦系統的偏好分析助手。你必須只輸出符合 JSON Schema 的結果，且不要輸出多餘文字。
你需要根據「使用者歷史偏好、初始問題答案、候選餐廳資訊」推斷結構化偏好。
如果沒有明確偏好，請給出保守的合理推斷，並降低 confidence。

[使用者歷史喜好]
${params.userHistorySummary}

[初始問答]
${params.starterQuizAnswers}

[候選餐廳清單]
${params.nearbyPlacesMinimal}

輸出必須符合以下 Schema:
{
  "cuisine": string[],
  "taste": string[],
  "price": ("budget"|"mid"|"high")[],
  "ambience": string[],
  "mealType": string[],
  "distancePreference": "near" | "far" | "no_preference",
  "diet": string[],
  "confidence": number,
  "rationale": string[]
}

約束：
1) confidence 介於 0.0–1.0
2) 若推斷不明確，填入空陣列並降低 confidence
3) rationale 用繁體中文、簡短條列、最多 3 條
`;

  const response = await fetch(`${endpoint}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    logStartup('server', 'gemini', 'infer-preferences:api-error', {
      model,
      elapsedMs: msSince(startedAt),
      status: response.status,
    });
    throw new Error(`Gemini API error: ${response.status} ${text}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini returned empty response');
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (err) {
    logStartupError('server', 'gemini', 'infer-preferences:parse-failed', err, {
      elapsedMs: msSince(startedAt),
    });
    throw new Error('Gemini response is not valid JSON');
  }
  const parsedPreference = PreferenceSchema.parse(json);
  logStartup('server', 'gemini', 'infer-preferences:done', {
    elapsedMs: msSince(startedAt),
    confidence: parsedPreference.confidence,
  });
  return parsedPreference;
}

const QuestionSchema = z.object({
  text: z.string(),
  leftChoice: z.string(),
  rightChoice: z.string(),
  skipChoice: z.string(),
  leftTags: z.array(z.string()),
  rightTags: z.array(z.string()),
});

export type GeneratedQuestion = z.infer<typeof QuestionSchema>;

export async function rewriteQuestions(params: {
  baseQuestions: GeneratedQuestion[];
  preferenceSummary: string;
}): Promise<GeneratedQuestion[]> {
  const model = getGeminiModel();
  const endpoint = buildGeminiEndpoint(model);
  const startedAt = Date.now();
  logStartup('server', 'gemini', 'rewrite-questions:start', {
    model,
    apiVersion: getGeminiApiVersion(),
    baseQuestionCount: params.baseQuestions.length,
  });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logStartup('server', 'gemini', 'rewrite-questions:skip-no-key', {
      elapsedMs: msSince(startedAt),
    });
    return params.baseQuestions;
  }

  const prompt = `
你是問答體驗設計助手。請將以下問題改寫成更自然的繁體中文，保留選項語意與 tag。
只輸出 JSON array，不要輸出任何多餘文字。

[偏好摘要]
${params.preferenceSummary}

[問題]
${JSON.stringify(params.baseQuestions, null, 2)}
`;

  const response = await fetch(`${endpoint}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
    }),
  });

  if (!response.ok) {
    logStartup('server', 'gemini', 'rewrite-questions:api-error', {
      model,
      elapsedMs: msSince(startedAt),
      status: response.status,
    });
    return params.baseQuestions;
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    logStartup('server', 'gemini', 'rewrite-questions:empty-response', {
      elapsedMs: msSince(startedAt),
    });
    return params.baseQuestions;
  }

  try {
    const json = JSON.parse(text);
    const rewrittenQuestions = z.array(QuestionSchema).parse(json);
    logStartup('server', 'gemini', 'rewrite-questions:done', {
      elapsedMs: msSince(startedAt),
      rewrittenCount: rewrittenQuestions.length,
    });
    return rewrittenQuestions;
  } catch {
    logStartup('server', 'gemini', 'rewrite-questions:parse-fallback', {
      elapsedMs: msSince(startedAt),
    });
    return params.baseQuestions;
  }
}
