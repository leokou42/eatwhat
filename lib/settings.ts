import { z } from 'zod';

export const ThemeSettingSchema = z.enum(['system', 'light', 'dark']);
export const ModelPresetSchema = z.enum(['default', 'fast', 'quality']);
export const QuestionLengthSchema = z.enum(['short', 'standard', 'long']);
export const SearchRadiusSchema = z.union([z.literal(1000), z.literal(2000), z.literal(3000)]);

export type ThemeSetting = z.infer<typeof ThemeSettingSchema>;
export type ModelPreset = z.infer<typeof ModelPresetSchema>;
export type QuestionLength = z.infer<typeof QuestionLengthSchema>;
export type SearchRadius = z.infer<typeof SearchRadiusSchema>;

export const AppSettingsSchema = z.object({
  theme: ThemeSettingSchema,
  modelPreset: ModelPresetSchema,
  questionLength: QuestionLengthSchema,
  searchRadiusM: SearchRadiusSchema,
});

export const AppSettingsUpdateSchema = AppSettingsSchema.partial();
export const RuntimeSettingsSchema = AppSettingsSchema.partial();

export type AppSettings = z.infer<typeof AppSettingsSchema>;
export type AppSettingsUpdateInput = z.infer<typeof AppSettingsUpdateSchema>;
export type RuntimeSettingsInput = z.infer<typeof RuntimeSettingsSchema>;

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'system',
  modelPreset: 'default',
  questionLength: 'standard',
  searchRadiusM: 2000,
};

export const GUEST_SETTINGS_STORAGE_KEY = 'eatwhat:guest-settings';
export const SETTINGS_UPDATED_EVENT = 'eatwhat:settings-updated';

export function parseRuntimeSettings(input: unknown): RuntimeSettingsInput {
  const parsed = RuntimeSettingsSchema.safeParse(input);
  return parsed.success ? parsed.data : {};
}

export function mergeAppSettings(...parts: Array<Partial<AppSettings> | null | undefined>): AppSettings {
  const merged = parts.reduce<Partial<AppSettings>>((acc, part) => {
    if (!part) return acc;
    return { ...acc, ...part };
  }, {});

  return {
    ...DEFAULT_APP_SETTINGS,
    ...merged,
  };
}

export function questionLengthToDynamicCount(questionLength: QuestionLength): number {
  if (questionLength === 'short') return 3;
  if (questionLength === 'long') return 7;
  return 5;
}

export function modelPresetToModelName(modelPreset: ModelPreset): string {
  const envDefault = process.env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash';
  const envFast = process.env.GEMINI_MODEL_FAST?.trim() || 'gemini-2.0-flash-lite';
  const envQuality = process.env.GEMINI_MODEL_QUALITY?.trim() || 'gemini-2.0-pro';

  if (modelPreset === 'fast') return envFast;
  if (modelPreset === 'quality') return envQuality;
  return envDefault;
}

export function applyThemeToDocument(theme: ThemeSetting) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
}

export function readGuestSettings(): Partial<AppSettings> {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(GUEST_SETTINGS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parseRuntimeSettings(parsed);
  } catch {
    return {};
  }
}

export function writeGuestSettings(settings: AppSettings) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(GUEST_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export function clearGuestSettings() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(GUEST_SETTINGS_STORAGE_KEY);
}
