#!/usr/bin/env tsx
/**
 * POC Test Script: LLM Clustering for Restaurant Recommendations
 *
 * This script validates the core assumptions of the dynamic clustering system:
 * 1. Multi-radius strategy can fetch 40-60 restaurants
 * 2. LLM batch tagging works with acceptable latency
 * 3. Tag distribution supports dynamic question generation
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// ============================================================================
// Type Definitions
// ============================================================================

interface AITags {
  carbType?: 'noodle' | 'rice' | 'bread' | 'other';
  mealType?: 'full_meal' | 'snack' | 'drink_focused';
  flavorProfile?: 'light' | 'heavy' | 'balanced';
  atmosphere?: 'quiet' | 'lively' | 'casual' | 'formal';
  cuisineCategory?: 'taiwanese' | 'japanese' | 'korean' | 'chinese' | 'western' | 'cafe' | 'fastfood' | 'fusion' | 'other';
}

interface Place {
  id: string;
  name: string;
  types: string[];
  rating?: number;
  priceLevel?: string;
  latitude: number;
  longitude: number;
  address?: string;
}

interface TaggedPlace extends Place {
  aiTags?: AITags;
}

interface TestLocation {
  name: string;
  latitude: number;
  longitude: number;
}

interface FetchResult {
  radius: number;
  count: number;
  duration: number;
  places: Place[];
}

interface TestResult {
  location: TestLocation;
  fetchResults: FetchResult[];
  totalUnique: number;
  taggingDuration: number;
  taggedPlaces: TaggedPlace[];
  tagDistribution: Record<string, Record<string, number>>;
  questionRelevance: QuestionRelevance[];
}

interface QuestionRelevance {
  question: string;
  optionA: string;
  optionB: string;
  countA: number;
  countB: number;
  showQuestion: boolean;
}

// ============================================================================
// Test Locations
// ============================================================================

const TEST_LOCATIONS: TestLocation[] = [
  {
    name: '台北市大安區',
    latitude: 25.0260,
    longitude: 121.5435,
  },
  {
    name: '台中市西屯區',
    latitude: 24.1810,
    longitude: 120.6460,
  },
  {
    name: '高雄市鹽埕區',
    latitude: 22.6225,
    longitude: 120.2850,
  },
];

// ============================================================================
// Google Places API Functions
// ============================================================================

async function fetchGooglePlaces(
  lat: number,
  lng: number,
  radius: number
): Promise<{ places: Place[]; duration: number }> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY not found in environment');
  }

  const startTime = Date.now();

  const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.rating,places.priceLevel,places.types,places.location,places.formattedAddress',
    },
    body: JSON.stringify({
      includedTypes: ['restaurant'],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: {
            latitude: lat,
            longitude: lng,
          },
          radius: radius,
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Places API error: ${error}`);
  }

  const data = await response.json();
  const rawPlaces = data.places || [];

  const places: Place[] = rawPlaces.map((p: any) => ({
    id: p.id,
    name: p.displayName?.text || 'Unknown',
    types: p.types || [],
    rating: p.rating,
    priceLevel: p.priceLevel,
    latitude: p.location.latitude,
    longitude: p.location.longitude,
    address: p.formattedAddress,
  }));

  const duration = Date.now() - startTime;

  return { places, duration };
}

async function smartFetch(lat: number, lng: number): Promise<FetchResult[]> {
  const radiusRanges = [1000, 2000, 3000]; // 1km, 2km, 3km
  const allPlaces = new Map<string, Place>();
  const results: FetchResult[] = [];

  for (const radius of radiusRanges) {
    const { places, duration } = await fetchGooglePlaces(lat, lng, radius);

    places.forEach(p => allPlaces.set(p.id, p));

    results.push({
      radius,
      count: allPlaces.size,
      duration,
      places: Array.from(allPlaces.values()),
    });

    // Stop if we have enough restaurants
    if (allPlaces.size >= 50) break;
  }

  // If still not enough, try 5km
  if (allPlaces.size < 30) {
    const { places, duration } = await fetchGooglePlaces(lat, lng, 5000);
    places.forEach(p => allPlaces.set(p.id, p));

    results.push({
      radius: 5000,
      count: allPlaces.size,
      duration,
      places: Array.from(allPlaces.values()),
    });
  }

  return results;
}

// ============================================================================
// LLM Tagging Functions
// ============================================================================

interface MinifiedPlace {
  id: string;
  name: string;
  types: string[];
  rating?: number;
  priceLevel?: string;
}

async function tagWithOllama(places: MinifiedPlace[]): Promise<Record<string, AITags>> {
  const prompt = `你是餐廳分類專家。請為每間餐廳分類。僅回傳 JSON 格式。

分類維度與值：
- carbType: noodle(麵食)|rice(飯類)|bread(麵包)|other(其他)
- mealType: full_meal(正餐)|snack(小吃)|drink_focused(飲品為主)
- flavorProfile: light(清淡)|heavy(重口味)|balanced(均衡)
- atmosphere: quiet(安靜)|lively(熱鬧)|casual(休閒)|formal(正式)
- cuisineCategory: taiwanese|japanese|korean|chinese|western|cafe|fastfood|fusion|other

餐廳資料：
${JSON.stringify(places, null, 2)}

請嚴格按照以下格式回傳，不要有額外文字：
{"餐廳ID": {"carbType": "...", "mealType": "...", ...}, ...}`;

  const startTime = Date.now();

  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama2',
      prompt: prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.statusText}`);
  }

  const data = await response.json();
  const duration = Date.now() - startTime;

  try {
    // Extract JSON from response
    const responseText = data.response;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.warn('⚠️  No JSON found in Ollama response, using heuristic fallback');
      return heuristicTagging(places);
    }

    const tags = JSON.parse(jsonMatch[0]);
    console.log(`   ✅ LLM tagging completed in ${duration}ms`);
    return tags;
  } catch (error) {
    console.warn('⚠️  Failed to parse Ollama response, using heuristic fallback');
    return heuristicTagging(places);
  }
}

function heuristicTagging(places: MinifiedPlace[]): Record<string, AITags> {
  const tags: Record<string, AITags> = {};

  for (const place of places) {
    const types = place.types || [];
    const name = place.name.toLowerCase();

    tags[place.id] = {
      carbType: inferCarbType(types, name),
      mealType: inferMealType(types, name),
      flavorProfile: inferFlavorProfile(types, name),
      atmosphere: inferAtmosphere(types, name),
      cuisineCategory: inferCuisineCategory(types, name),
    };
  }

  return tags;
}

function inferCarbType(types: string[], name: string): AITags['carbType'] {
  if (types.includes('ramen_restaurant') || types.includes('noodle_shop') || name.includes('麵')) {
    return 'noodle';
  }
  if (types.includes('chinese_restaurant') || name.includes('飯')) {
    return 'rice';
  }
  if (types.includes('bakery') || types.includes('cafe') || name.includes('麵包')) {
    return 'bread';
  }
  return 'other';
}

function inferMealType(types: string[], name: string): AITags['mealType'] {
  if (types.includes('cafe') || types.includes('bakery') || types.includes('dessert_shop')) {
    return 'snack';
  }
  if (types.includes('bar') || types.includes('night_club')) {
    return 'drink_focused';
  }
  return 'full_meal';
}

function inferFlavorProfile(types: string[], name: string): AITags['flavorProfile'] {
  if (types.includes('japanese_restaurant') || types.includes('sushi_restaurant') || name.includes('日')) {
    return 'light';
  }
  if (types.includes('steak_house') || types.includes('barbecue_restaurant') || name.includes('燒烤')) {
    return 'heavy';
  }
  return 'balanced';
}

function inferAtmosphere(types: string[], name: string): AITags['atmosphere'] {
  if (types.includes('fine_dining_restaurant') || types.includes('upscale')) {
    return 'formal';
  }
  if (types.includes('fast_food_restaurant') || types.includes('food_court')) {
    return 'casual';
  }
  if (types.includes('bar') || types.includes('night_club')) {
    return 'lively';
  }
  return 'casual';
}

function inferCuisineCategory(types: string[], name: string): AITags['cuisineCategory'] {
  if (types.includes('japanese_restaurant') || types.includes('sushi_restaurant')) {
    return 'japanese';
  }
  if (types.includes('korean_restaurant')) {
    return 'korean';
  }
  if (types.includes('chinese_restaurant')) {
    return 'chinese';
  }
  if (types.includes('american_restaurant') || types.includes('steak_house')) {
    return 'western';
  }
  if (types.includes('cafe') || types.includes('coffee_shop')) {
    return 'cafe';
  }
  if (types.includes('fast_food_restaurant')) {
    return 'fastfood';
  }
  return 'taiwanese';
}

// ============================================================================
// Analysis Functions
// ============================================================================

function analyzeTagDistribution(taggedPlaces: TaggedPlace[]): Record<string, Record<string, number>> {
  const distribution: Record<string, Record<string, number>> = {
    carbType: {},
    mealType: {},
    flavorProfile: {},
    atmosphere: {},
    cuisineCategory: {},
  };

  for (const place of taggedPlaces) {
    if (!place.aiTags) continue;

    for (const [key, value] of Object.entries(place.aiTags)) {
      if (value) {
        distribution[key][value] = (distribution[key][value] || 0) + 1;
      }
    }
  }

  return distribution;
}

function evaluateQuestionRelevance(distribution: Record<string, Record<string, number>>): QuestionRelevance[] {
  const MIN_THRESHOLD = 5; // Minimum restaurants per option to show question

  const questions: QuestionRelevance[] = [
    {
      question: '今天想吃飯還是吃麵？',
      optionA: 'rice',
      optionB: 'noodle',
      countA: distribution.carbType?.rice || 0,
      countB: distribution.carbType?.noodle || 0,
      showQuestion: false,
    },
    {
      question: '想吃正餐還是小吃？',
      optionA: 'full_meal',
      optionB: 'snack',
      countA: distribution.mealType?.full_meal || 0,
      countB: distribution.mealType?.snack || 0,
      showQuestion: false,
    },
    {
      question: '口味想清淡還是重口味？',
      optionA: 'light',
      optionB: 'heavy',
      countA: distribution.flavorProfile?.light || 0,
      countB: distribution.flavorProfile?.heavy || 0,
      showQuestion: false,
    },
    {
      question: '想要安靜還是熱鬧的氛圍？',
      optionA: 'quiet',
      optionB: 'lively',
      countA: distribution.atmosphere?.quiet || 0,
      countB: distribution.atmosphere?.lively || 0,
      showQuestion: false,
    },
  ];

  for (const q of questions) {
    q.showQuestion = q.countA >= MIN_THRESHOLD && q.countB >= MIN_THRESHOLD;
  }

  return questions;
}

// ============================================================================
// Main Test Function
// ============================================================================

async function runTest(location: TestLocation): Promise<TestResult> {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Testing: ${location.name} (${location.latitude}, ${location.longitude})`);
  console.log('='.repeat(70));

  // Step 1: Smart Fetch
  console.log('\n1️⃣  Fetching restaurants with multi-radius strategy...');
  const fetchResults = await smartFetch(location.latitude, location.longitude);

  const lastResult = fetchResults[fetchResults.length - 1];
  const totalUnique = lastResult.count;

  for (const result of fetchResults) {
    console.log(`   - ${result.radius}m: ${result.count} restaurants (${result.duration}ms)`);
  }
  console.log(`   ✅ Total unique: ${totalUnique} restaurants`);

  // Step 2: LLM Tagging
  console.log('\n2️⃣  Tagging restaurants with LLM...');
  const minifiedPlaces: MinifiedPlace[] = lastResult.places.map(p => ({
    id: p.id,
    name: p.name,
    types: p.types,
    rating: p.rating,
    priceLevel: p.priceLevel,
  }));

  const startTagging = Date.now();
  const tags = await tagWithOllama(minifiedPlaces);
  const taggingDuration = Date.now() - startTagging;

  const taggedPlaces: TaggedPlace[] = lastResult.places.map(p => ({
    ...p,
    aiTags: tags[p.id],
  }));

  // Step 3: Analyze Distribution
  console.log('\n3️⃣  Analyzing tag distribution...');
  const distribution = analyzeTagDistribution(taggedPlaces);

  for (const [key, values] of Object.entries(distribution)) {
    const formatted = Object.entries(values)
      .map(([k, v]) => `${k}(${v})`)
      .join(' ');
    console.log(`   ${key}: ${formatted}`);
  }

  // Step 4: Evaluate Questions
  console.log('\n4️⃣  Evaluating question relevance...');
  const questionRelevance = evaluateQuestionRelevance(distribution);

  for (const q of questionRelevance) {
    const status = q.showQuestion ? '✅ SHOW' : '❌ SKIP';
    console.log(`   ${status} "${q.question}"`);
    console.log(`      ${q.optionA}(${q.countA}) vs ${q.optionB}(${q.countB})`);
  }

  return {
    location,
    fetchResults,
    totalUnique,
    taggingDuration,
    taggedPlaces,
    tagDistribution: distribution,
    questionRelevance,
  };
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║       LLM Clustering POC Test - Restaurant Recommendations       ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');

  const allResults: TestResult[] = [];

  for (const location of TEST_LOCATIONS) {
    try {
      const result = await runTest(location);
      allResults.push(result);
    } catch (error) {
      console.error(`\n❌ Test failed for ${location.name}:`, error);
    }
  }

  // Summary Report
  console.log('\n\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                          SUMMARY REPORT                          ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');

  for (const result of allResults) {
    console.log(`\n${result.location.name}:`);
    console.log(`  Restaurants: ${result.totalUnique}`);
    console.log(`  Tagging: ${result.taggingDuration}ms`);
    console.log(`  Questions: ${result.questionRelevance.filter(q => q.showQuestion).length}/${result.questionRelevance.length} relevant`);
  }

  // Acceptance Criteria
  console.log('\n\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                     ACCEPTANCE CRITERIA                          ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');

  const avgRestaurants = allResults.reduce((sum, r) => sum + r.totalUnique, 0) / allResults.length;
  const avgTagging = allResults.reduce((sum, r) => sum + r.taggingDuration, 0) / allResults.length;
  const avgQuestions = allResults.reduce((sum, r) => sum + r.questionRelevance.filter(q => q.showQuestion).length, 0) / allResults.length;

  console.log(`\n✓ Restaurant Count: ${avgRestaurants.toFixed(0)} (Target: 40-60, Min: 30)`);
  console.log(`  ${avgRestaurants >= 30 ? '✅ PASS' : '❌ FAIL'}`);

  console.log(`\n✓ LLM Tagging Latency: ${avgTagging.toFixed(0)}ms (Target: <3000ms, Max: <10000ms)`);
  console.log(`  ${avgTagging < 10000 ? '✅ PASS' : '❌ FAIL'}`);

  console.log(`\n✓ Question Relevance: ${avgQuestions.toFixed(1)} questions (Target: ≥5, Min: ≥3)`);
  console.log(`  ${avgQuestions >= 3 ? '✅ PASS' : '❌ FAIL'}`);

  const allPass = avgRestaurants >= 30 && avgTagging < 10000 && avgQuestions >= 3;

  console.log('\n' + '='.repeat(70));
  console.log(`Overall: ${allPass ? '✅ POC VALIDATION PASSED' : '❌ POC VALIDATION FAILED'}`);
  console.log('='.repeat(70));

  // Save results to file
  const resultsPath = path.join(__dirname, '../poc-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(allResults, null, 2));
  console.log(`\n📄 Detailed results saved to: ${resultsPath}`);
}

// Run the test
main().catch(console.error);
