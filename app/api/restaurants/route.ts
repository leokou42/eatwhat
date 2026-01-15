import { NextRequest, NextResponse } from 'next/server';
import { Restaurant } from '@/schemas/restaurant';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const tags = searchParams.get('tags') || '';
    const radius = 10000.0; // Requirement: 1km radius

    if (!lat || !lng) {
        return NextResponse.json({ error: 'Location (lat, lng) is required' }, { status: 400 });
    }

    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

    if (!GOOGLE_MAPS_API_KEY) {
        console.error('GOOGLE_MAPS_API_KEY is missing in environment variables');
        return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 });
    }

    try {
        // 1. Google Places Search Nearby (New)
        // Cost Control: FieldMask strictly includes only required fields.
        const placesResponse = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
                'X-Goog-FieldMask': 'places.id,places.displayName,places.rating,places.priceLevel,places.types,places.location,places.formattedAddress',
            },
            body: JSON.stringify({
                includedTypes: ['restaurant'],
                maxResultCount: 20,
                locationRestriction: {
                    circle: {
                        center: {
                            latitude: parseFloat(lat),
                            longitude: parseFloat(lng),
                        },
                        radius: radius,
                    },
                },
            }),
        });

        if (!placesResponse.ok) {
            const error = await placesResponse.text();
            console.error('Google Places API error:', error);
            return NextResponse.json({ error: 'Failed to fetch places from Google' }, { status: 502 });
        }

        const placesData = await placesResponse.json();
        const rawPlaces = placesData.places || [];

        if (rawPlaces.length === 0) {
            return NextResponse.json([]);
        }

        // 2. Prepare data for LLM
        const contextPlaces = rawPlaces.map((p: any) => ({
            id: p.id,
            name: p.displayName?.text,
            rating: p.rating,
            priceLevel: p.priceLevel,
            types: p.types,
            address: p.formattedAddress,
        }));

        // 3. Ollama LLM Recommendation (Local)
        const prompt = `你是一個在地美食嚮導。請根據使用者的『偏好標籤 (tags)』，從提供的餐廳中挑選最符合的 5 間。請考慮價格等級、類型與評分。

使用者偏好標籤: ${tags}

餐廳列表:
${JSON.stringify(contextPlaces, null, 2)}

請僅回傳 JSON 格式，包含一個 key "recommendations"，其值為陣列。
每個推薦物件包含：
- id: 餐廳 ID (必須與提供的 ID 一致)
- reason: 一行話說明為何推薦這家（需結合用戶 tags）

回傳範例:
{
  "recommendations": [
    {"id": "...", "reason": "..."},
    ...
  ]
}`;

        const ollamaUrl = 'http://localhost:11434/api/generate';

        const ollamaPayload = {
            model: 'llama2',
            prompt: prompt,
            stream: false,
        };

        console.log('[Ollama] Sending request to local Ollama...');
        const ollamaResponse = await fetch(ollamaUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(ollamaPayload),
        });

        if (!ollamaResponse.ok) {
            const errorText = await ollamaResponse.text();
            console.error('Ollama API error:', errorText);
            return NextResponse.json({ error: 'Failed to get recommendations from Ollama. Is Ollama running on localhost:11434?' }, { status: 502 });
        }

        const ollamaData = await ollamaResponse.json();
        let recommendations: any[] = [];

        try {
            // Ollama 的回傳結構: { response: "..." }
            const responseText = ollamaData.response;
            // 從 response 中提取 JSON
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in Ollama response');
            }
            const content = JSON.parse(jsonMatch[0]);
            recommendations = content.recommendations || [];
        } catch (e) {
            console.error('Failed to parse Ollama response:', e);
            console.log('Ollama raw response:', ollamaData.response);
            return NextResponse.json({ error: 'Invalid recommendation format from Ollama' }, { status: 500 });
        }

        // 4. Merge results and format for Restaurant schema
        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);

        const finalResults: Restaurant[] = recommendations
            .map((rec: any) => {
                const place = rawPlaces.find((p: any) => p.id === rec.id);
                if (!place) return null;

                const distance = calculateDistanceInKm(
                    userLat,
                    userLng,
                    place.location.latitude,
                    place.location.longitude
                );

                const restaurant: Restaurant = {
                    id: place.id,
                    name: place.displayName?.text || 'Unknown',
                    distance: distance,
                    locationUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.displayName?.text + ' ' + place.formattedAddress)}&query_place_id=${place.id}`,
                    tags: mapGoogleTypesToTags(place.types || []),
                    latitude: place.location.latitude,
                    longitude: place.location.longitude,
                    rating: place.rating,
                    priceLevel: place.priceLevel,
                    address: place.formattedAddress,
                    reason: rec.reason,
                };
                return restaurant;
            })
            .filter((r): r is Restaurant => r !== null);

        return NextResponse.json(finalResults);
    } catch (error) {
        console.error('API integration error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

function mapGoogleTypesToTags(types: string[]): string[] {
    const tags: string[] = ['meal'];

    if (types.includes('cafe') || types.includes('bakery') || types.includes('dessert_shop')) {
        tags.push('snack');
    }

    if (types.includes('japanese_restaurant') || types.includes('sushi_restaurant') || types.includes('vegetarian_restaurant')) {
        tags.push('light');
    }

    if (types.includes('steak_house') || types.includes('hamburger_restaurant') || types.includes('barbecue_restaurant') || types.includes('brazilian_steakhouse')) {
        tags.push('heavy');
    }

    if (types.includes('chinese_restaurant') || types.includes('ramen_restaurant') || types.includes('noodle_shop')) {
        tags.push('noodle');
    }

    if (types.includes('fast_food_restaurant') || types.includes('sandwich_shop')) {
        tags.push('snack');
    }

    return Array.from(new Set(tags));
}

function calculateDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
}
