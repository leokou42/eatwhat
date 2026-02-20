import { PreferenceProfile } from '@/lib/gemini';
import { NormalizedPlace } from '@/lib/googlePlaces';
import { calculateDistanceKm } from '@/lib/geo';

export function scorePlaces(
  places: NormalizedPlace[],
  preference: PreferenceProfile,
  userLocation?: { latitude: number; longitude: number }
) {
  return places
    .map((place) => {
      const reasons: string[] = [];
      let score = 0;

      const structured = place.structuredTags;
      const tagMatch = (category: keyof NonNullable<typeof structured>, labels: string[], weight: number) => {
        if (!structured || labels.length === 0) return;
        const matches = labels.filter((label) => structured[category]?.includes(label));
        if (matches.length > 0) {
          score += matches.length * weight;
          reasons.push(`符合偏好：${matches.join('、')}`);
        }
      };

      tagMatch('cuisine', preference.cuisine, 2.0);
      tagMatch('taste', preference.taste, 1.5);
      tagMatch('ambience', preference.ambience, 1.0);
      tagMatch('mealType', preference.mealType, 1.0);
      tagMatch('diet', preference.diet, 1.5);

      if (preference.price.length > 0 && place.priceBucket) {
        if (preference.price.includes(place.priceBucket)) {
          score += 1.0;
          reasons.push(`價位符合：${place.priceBucket}`);
        }
      }

      let distance = place.distance;
      if (userLocation) {
        distance = calculateDistanceKm(
          userLocation.latitude,
          userLocation.longitude,
          place.latitude,
          place.longitude
        );
      }

      if (preference.distancePreference === 'near' && distance <= 1.5) {
        score += 2.0;
        reasons.push('距離偏好：近');
      }
      if (preference.distancePreference === 'far' && distance >= 2.0) {
        score += 1.0;
        reasons.push('距離偏好：遠');
      }

      if (place.rating) {
        score += place.rating / 5;
        reasons.push(`評分良好：${place.rating}`);
      }

      if (place.openNow) {
        score += 0.5;
        reasons.push('目前營業中');
      }

      return { ...place, distance, score, reasons };
    })
    .sort((a, b) => {
      const scoreDiff = b.score - a.score;
      if (scoreDiff !== 0) return scoreDiff;
      return a.distance - b.distance;
    });
}
