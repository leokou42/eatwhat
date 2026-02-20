import { PreferenceProfile } from '@/lib/gemini';

export function preferenceSummary(pref: PreferenceProfile | null) {
  if (!pref) return '尚無偏好資料';
  return [
    pref.cuisine.length ? `料理：${pref.cuisine.join('、')}` : null,
    pref.taste.length ? `口味：${pref.taste.join('、')}` : null,
    pref.price.length ? `價位：${pref.price.join('、')}` : null,
    pref.ambience.length ? `氣氛：${pref.ambience.join('、')}` : null,
    pref.mealType.length ? `型態：${pref.mealType.join('、')}` : null,
    pref.diet.length ? `飲食限制：${pref.diet.join('、')}` : null,
    `距離：${pref.distancePreference}`,
  ]
    .filter(Boolean)
    .join('\n');
}
