import { NextResponse } from 'next/server';
import { z } from 'zod';

const RequestSchema = z.object({
    lat: z.coerce.number(),
    lng: z.coerce.number(),
    radius: z.coerce.number().default(2000), // Default 2km
});

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const result = RequestSchema.safeParse(Object.fromEntries(searchParams));

    if (!result.success) {
        return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const { lat, lng, radius } = result.data;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        console.warn('GOOGLE_MAPS_API_KEY is not set. Returning mock results.');
        // Fallback to mock data if no API key
        return NextResponse.json({
            error: 'API Key missing',
            isMock: true
        }, { status: 200 }); // Still 200 to let frontend handle it
    }

    try {
        // Standard Places API Nearby Search
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=restaurant&key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            throw new Error(`Google API Error: ${data.status} ${data.error_message || ''}`);
        }

        const results = (data.results || []).map((place: any) => ({
            id: place.place_id,
            name: place.name,
            distance: 0, // Calculated client-side
            locationUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`,
            tags: mapGoogleTypesToTags(place.types || []),
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            rating: place.rating,
            address: place.vicinity,
            imageUrl: place.photos?.[0]
                ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`
                : undefined
        }));

        return NextResponse.json(results);
    } catch (error: any) {
        console.error('Failed to fetch from Google Places:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function mapGoogleTypesToTags(types: string[]): string[] {
    const tags: string[] = ['meal']; // Default to meal

    if (types.includes('cafe') || types.includes('bakery') || types.includes('snack_bar')) {
        tags.push('snack');
    }

    if (types.includes('japanese_restaurant') || types.includes('sushi_restaurant')) {
        tags.push('light');
    }

    if (types.includes('steak_house') || types.includes('hamburger_restaurant') || types.includes('barbecue_restaurant')) {
        tags.push('heavy');
    }

    // Heuristics for rice/noodle aren't perfect from types alone, but let's try
    if (types.includes('chinese_restaurant') || types.includes('ramen_restaurant')) {
        tags.push('noodle');
    }

    return Array.from(new Set(tags));
}
