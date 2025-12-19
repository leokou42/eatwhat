import { NextResponse } from 'next/server';
import { MOCK_RESTAURANTS } from '@/data/mock';

export async function GET() {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    return NextResponse.json(MOCK_RESTAURANTS);
}
