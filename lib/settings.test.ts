import { describe, expect, it } from 'vitest';
import {
  DEFAULT_APP_SETTINGS,
  mergeAppSettings,
  modelPresetToModelName,
  questionLengthToDynamicCount,
} from '@/lib/settings';

describe('settings helpers', () => {
  it('mergeAppSettings fills defaults', () => {
    const merged = mergeAppSettings({ modelPreset: 'fast' });

    expect(merged).toEqual({
      ...DEFAULT_APP_SETTINGS,
      modelPreset: 'fast',
    });
  });

  it('question length mapping is correct', () => {
    expect(questionLengthToDynamicCount('short')).toBe(3);
    expect(questionLengthToDynamicCount('standard')).toBe(5);
    expect(questionLengthToDynamicCount('long')).toBe(7);
  });

  it('runtime settings can override stored settings in merge order', () => {
    const merged = mergeAppSettings(
      { modelPreset: 'quality', searchRadiusM: 3000 },
      { modelPreset: 'fast' }
    );

    expect(merged.modelPreset).toBe('fast');
    expect(merged.searchRadiusM).toBe(3000);
  });

  it('model preset mapping returns string model', () => {
    expect(typeof modelPresetToModelName('default')).toBe('string');
    expect(typeof modelPresetToModelName('fast')).toBe('string');
    expect(typeof modelPresetToModelName('quality')).toBe('string');
  });
});
