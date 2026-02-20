import { mapGoogleTypesToTagsFlat, mapGoogleTypesToStructuredTags, priceLevelToBucket } from '@/lib/placeMapping';
import { Restaurant } from '@/types';
import { logStartup, logStartupError, msSince } from '@/lib/startupDebug';

export interface NormalizedPlace extends Restaurant {
  priceBucket?: 'budget' | 'mid' | 'high';
  structuredTags?: ReturnType<typeof mapGoogleTypesToStructuredTags>;
}

export async function fetchNearbyPlaces(
  lat: number,
  lng: number,
  radius = 2000
): Promise<NormalizedPlace[]> {
  const startedAt = Date.now();
  logStartup('server', 'google-places', 'fetch:start', {
    lat,
    lng,
    radius,
  });
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn('GOOGLE_MAPS_API_KEY is not set. Returning empty places.');
    logStartup('server', 'google-places', 'fetch:skipped-no-key', {
      elapsedMs: msSince(startedAt),
    });
    return [];
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=restaurant&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google API Error: ${data.status} ${data.error_message || ''}`);
    }

    const normalizedPlaces = (data.results || []).map((place: any) => {
      const structuredTags = mapGoogleTypesToStructuredTags(place.types || []);
      return {
        id: String(place.place_id),
        name: place.name,
        distance: 0,
        locationUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`,
        tags: mapGoogleTypesToTagsFlat(place.types || []),
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        rating: place.rating,
        address: place.vicinity,
        priceLevel: place.price_level,
        userRatingsTotal: place.user_ratings_total,
        openNow: place.opening_hours?.open_now,
        businessStatus: place.business_status,
        types: place.types,
        imageUrl: place.photos?.[0]
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`
          : undefined,
        priceBucket: priceLevelToBucket(place.price_level),
        structuredTags,
      } as NormalizedPlace;
    });
    logStartup('server', 'google-places', 'fetch:done', {
      elapsedMs: msSince(startedAt),
      resultCount: normalizedPlaces.length,
      apiStatus: data.status,
    });
    return normalizedPlaces;
  } catch (error) {
    console.error('Failed to fetch nearby places, returning empty list:', error);
    logStartupError('server', 'google-places', 'fetch:failed', error, {
      elapsedMs: msSince(startedAt),
    });
    return [];
  }
}
