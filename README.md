# 🍽️ Eat What - AI-Powered Restaurant Recommendation MVP

**"What to eat today?"** - A web application that uses AI and location-based algorithms to solve the eternal dining dilemma through intelligent restaurant recommendations.

---

## 📋 Table of Contents

- [Quick Overview](#quick-overview)
- [Core Features](#core-features)
- [Technology Stack](#technology-stack)
- [Installation & Setup](#installation--setup)
- [Project Structure](#project-structure)
- [Architecture & Design Patterns](#architecture--design-patterns)
- [Key Concepts](#key-concepts)
- [Development Workflow](#development-workflow)
- [Configuration](#configuration)
- [Testing](#testing)
- [Deployment & Building](#deployment--building)
- [Common Development Tasks](#common-development-tasks)
- [Troubleshooting](#troubleshooting)
- [Next Steps & Roadmap](#next-steps--roadmap)

---

## 🚀 Quick Overview

**Eat What** is a restaurant recommendation application built with **Next.js 14**, **React 18**, and **TypeScript**. It uses:
- **Quiz-based preference collection** to understand user dining preferences
- **Multiple data sources** (Mock data, Custom API with LLM, Google Places API)
- **Location-based distance calculation** using real GPS coordinates
- **Smart ranking algorithm** based on tag matching and user proximity
- **Keyboard shortcuts & swipe gestures** for smooth mobile/desktop interaction

Users answer 7 questions about their preferences, and the app returns a ranked list of nearby restaurants that best match their needs.

---

## ✨ Core Features

### 1. **Interactive Quiz System**
- 7-question quiz covering dining preferences:
  - Rice vs. Noodle
  - Full meal vs. Snack
  - Light vs. Heavy flavors
  - Distance preference
  - Budget range
  - Group vs. Solo dining
  - Atmosphere preference
- Support for "Skip" option on each question
- Progress tracking with visual feedback
- Back button to revise previous answers

### 2. **Intelligent Recommendation Engine**
- **Multi-source data fetching**:
  - **Mock Mode**: Local test data with 5 Taipei restaurants
  - **API Mode**: Custom `/api/restaurants` with Google Places + Ollama LLM integration
  - **Google Mode**: Direct Google Places API fallback
- **Smart ranking algorithm**:
  - Tag-based preference matching with weighted scoring
  - Haversine formula for accurate distance calculation
  - Scenario tags (budget, luxury, gathering, solo) get 2x weight
  - LLM recommendations provide additional reasoning
- **Explainability**: Each recommendation includes "Why this fits" reasons

### 3. **Geolocation Integration**
- Automatic browser geolocation detection on app load
- Real-time distance recalculation based on actual user location
- Graceful fallback if location permission denied
- Distance displayed in kilometers to each restaurant

### 4. **Rich Restaurant Information**
- Restaurant name, address, and formatted location
- Google Maps integration (clickable navigation links)
- Rating/review data (when available from API)
- Price level indicators
- Cuisine/food type tags
- Restaurant photos (from Google Places)
- Recommendation reasoning from AI

### 5. **Multi-Platform Interaction**
- **Desktop**: Keyboard shortcuts (Arrow keys, Space, Backspace)
- **Mobile**: Swipe gestures for answer selection and results navigation
- **Both**: Visual buttons as fallback
- Smooth Framer Motion animations

### 6. **Error Handling & Recovery**
- Graceful error states with retry functionality
- Loading indicators with visual feedback
- Fallback to mock data on API failures
- Form validation with Zod

---

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend Framework** | Next.js 14.2.3 (App Router) |
| **Runtime** | React 18 + TypeScript 5 |
| **Styling** | Tailwind CSS 3.3 + Tailwind Merge |
| **Animations** | Framer Motion 11 |
| **UI Icons** | Lucide React 0.344 |
| **Validation** | Zod 3.23.8 |
| **Testing** | Vitest 3.2.4 + React Testing Library 16 |
| **DOM Testing** | jsdom 26.1.0 |
| **External APIs** | Google Places API v1 + Maps API |
| **LLM Integration** | Ollama (llama2 model - local) |

---

## 🔧 Installation & Setup

### Prerequisites
- **Node.js**: v18+ (npm or yarn package manager)
- **Git** for version control
- **Browser geolocation permission** (for location-based features)
- (Optional) **Ollama**: For AI-powered recommendations on `/api/restaurants`
- (Optional) **Google Maps API Key**: For real restaurant data

### Step 1: Clone & Install Dependencies
```bash
git clone <repository-url>
cd eatwhat
npm install
```

### Step 2: Configure Environment Variables
Create a `.env.local` file in the project root:

```env
# Data Source Selection (required)
# Options: "mock" (default), "api" (Ollama + Google), "google" (Google Places only)
NEXT_PUBLIC_DATA_SOURCE=mock

# Google Maps API Key (required for "api" or "google" modes)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### Step 3: Run Development Server
```bash
# Default mode (Mock data)
npm run dev

# API mode (requires Ollama running on localhost:11434)
NEXT_PUBLIC_DATA_SOURCE=api npm run dev

# Google Places mode
NEXT_PUBLIC_DATA_SOURCE=google npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 📁 Project Structure

```
eatwhat/
├── app/
│   ├── api/
│   │   ├── restaurants/
│   │   │   └── route.ts          # AI-powered recommendations (Google Places + Ollama)
│   │   └── places/
│   │       └── route.ts          # Google Places API proxy
│   ├── layout.tsx                # Root layout with global styles
│   └── page.tsx                  # Home page with main quiz UI
│
├── components/
│   ├── TopBar.tsx                # Progress bar & reset button
│   ├── QuestionHeader.tsx         # Question display
│   ├── CardStage.tsx             # Question choice cards (left/right/skip)
│   ├── ActionButtons.tsx         # Keyboard hint buttons
│   ├── RestaurantCard.tsx        # Individual restaurant display
│   ├── ResultCardStack.tsx       # Swipeable results carousel
│   ├── ResultsList.tsx           # Alternative results view (fallback)
│   └── [other UI components]     # Additional UI utilities
│
├── hooks/
│   ├── useQuiz.ts               # Main quiz state orchestration
│   │                            # Manages geolocation, loading, state transitions
│   └── useKeyboardShortcuts.ts  # Keyboard event listener hook
│
├── services/
│   └── recommendationService.ts # Business logic orchestration
│                               # Handles tag extraction, repository selection, ranking
│
├── lib/
│   ├── quizMachine.ts           # State machine (reducer) for quiz flow
│   ├── rankRestaurants.ts       # Ranking algorithm + Haversine distance calc
│   └── rankRestaurants.test.ts  # Unit tests for ranking
│
├── repositories/
│   └── restaurantRepository.ts  # Data layer abstraction
│                               # Implements Repository Pattern with 3 implementations:
│                               # - MockRestaurantRepository
│                               # - ApiRestaurantRepository
│                               # - GooglePlacesRepository
│
├── schemas/
│   ├── restaurant.ts            # Zod schema for Restaurant type
│   └── question.ts              # Zod schema for Question type
│
├── types/
│   ├── index.ts                 # Main type definitions (Question, Restaurant, Answer)
│   └── quiz.ts                  # Quiz state machine types (QuizState, QuizEvent)
│
├── data/
│   └── mock.ts                  # Mock questions & restaurants for development
│
├── public/                       # Static assets
├── .env.local                   # Local environment variables (not committed)
├── next.config.js              # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies & scripts
```

---

## 🏗️ Architecture & Design Patterns

### 1. **Repository Pattern**
The application abstracts data fetching behind a repository interface, allowing flexible switching between data sources:

```typescript
// Interface definition
interface IRestaurantRepository {
    listRestaurants(
        signal?: AbortSignal,
        location?: { latitude: number; longitude: number },
        radius?: number,
        tags?: string
    ): Promise<Restaurant[]>;
}

// Three implementations:
- MockRestaurantRepository         // For testing/development
- ApiRestaurantRepository          // Custom /api/restaurants endpoint
- GooglePlacesRepository           // Direct Google Places API

// Factory pattern selects implementation based on env var
getRestaurantRepository() // Returns appropriate implementation
```

**Benefit**: Easy to test, swap data sources, or add new sources without changing UI code.

### 2. **State Machine (Reducer Pattern)**
Quiz flow is managed through a strict reducer-based state machine:

```
Initial State: { status: 'questioning', currentQIndex: 0, answers: [] }
                        ↓
             Answer Question (ANSWER event)
                        ↓
             Last Question?
                    ↙         ↘
                 NO            YES
                 ↓              ↓
          Next Question      status = 'loading'
                              ↓
                    Fetch Recommendations
                              ↓
                    Receive Results (LOADED)
                              ↓
                    status = 'results'
```

Valid events: `ANSWER`, `BACK`, `LOADED`, `ERROR`, `RETRY`, `RESET`

**Benefit**: Predictable state transitions, no race conditions, testable.

### 3. **Service-Repository-Component Layering**
```
React Component (page.tsx, useQuiz hook)
        ↓
    recommendationService
        ├─ Extracts tags from answers
        ├─ Selects repository
        └─ Calls ranking logic
        ↓
    restaurantRepository (interface)
        ├─ MockRestaurantRepository
        ├─ ApiRestaurantRepository
        └─ GooglePlacesRepository
        ↓
    External APIs / Mock Data
```

**Benefit**: Clear separation of concerns, testable service layer.

### 4. **Custom Hooks for State Management**
- `useQuiz()`: Orchestrates entire quiz flow, geolocation, async loading
- `useKeyboardShortcuts()`: Encapsulates keyboard event logic

**Benefit**: Reusable, composable, avoids prop drilling.

### 5. **Schema Validation with Zod**
All API responses are validated at runtime against Zod schemas:
- `RestaurantSchema`: Validates restaurant data structure
- `QuestionSchema`: Validates question structure
- Prevents runtime type errors from API responses

---

## 🔑 Key Concepts

### **Preferences Tags System**
Users' answers map to "tags" that restaurants can have:

| Answer | Tag | Weight | Example |
|--------|-----|--------|---------|
| Rice | `rice` | 1 | Rice-based dishes |
| Noodle | `noodle` | 1 | Noodle-based dishes |
| Full Meal | `meal` | 1 | Proper sit-down meal |
| Snack | `snack` | 1 | Quick bites |
| Light | `light` | 1 | Light/healthy |
| Heavy | `heavy` | 1 | Rich/hearty |
| Budget | `budget` | **2** | Affordable |
| Luxury | `luxury` | **2** | Premium/upscale |
| Group | `gathering` | **2** | Social dining |
| Solo | `solo` | **2** | Individual dining |
| Quiet | `quiet` | **2** | Peaceful atmosphere |
| Lively | `lively` | **2** | Vibrant atmosphere |
| Near | `near` | 1 | Close proximity |
| Far | `far` | 1 | Distance doesn't matter |

**Scenario tags** (budget, luxury, gathering, solo, quiet, lively) have 2x weight in scoring.

### **Ranking Algorithm**
```
For each restaurant:
  1. Initialize score = 0
  2. For each tag in restaurant.tags:
     If tag matches user preference:
       Add weight to score (1 or 2 depending on tag type)
       Add reason to reasons array
  3. If restaurant has LLM-provided reason:
     Add reason to array
     Add 1 point if score was 0 (boost)
  4. Recalculate distance using Haversine if user location available

Final sort:
  Primary: By score (highest first)
  Secondary: By distance (closest first)
```

### **Distance Calculation (Haversine Formula)**
```
R = 6371 km (Earth's radius)
a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)
c = 2 × atan2(√a, √(1−a))
distance = R × c
```

Ensures accurate real-world distance between user and restaurants.

### **API Integration Flow**

#### `/api/restaurants` (AI-Powered)
```
Client sends: { lat, lng, tags, radius }
  ↓
Server: Calls Google Places API (searchNearby)
  ↓
Server: Sends restaurant list + user tags to Ollama (llama2)
  ↓
Ollama: Returns top 5 recommended restaurants with reasons
  ↓
Server: Maps Google types to application tags, calculates distances
  ↓
Returns: Restaurant[] with AI-provided reasons
```

#### `/api/places` (Google Direct)
```
Client sends: { lat, lng, radius }
  ↓
Server: Calls Google Places Nearby Search API
  ↓
Server: Maps results to Restaurant schema
  ↓
Returns: Restaurant[] (no AI ranking, just data)
```

---

## 📖 Development Workflow

### 1. **Understanding the Quiz Flow**
When a user answers a question:
1. `page.tsx` calls `choose('left'|'right'|'skip')`
2. `useQuiz` dispatches `ANSWER` event to `quizMachine`
3. State machine advances to next question or triggers loading
4. On last question, state transitions to `loading`
5. `useQuiz` effect detects `status === 'loading'`, calls `recommendationService`
6. Service extracts tags, fetches restaurants, ranks them
7. Results stored in state, user sees results page

### 2. **Adding a New Question**
Edit `data/mock.ts`:
```typescript
{
    id: 8,  // Unique ID
    text: 'Your question here?',
    leftChoice: 'Left option',
    rightChoice: 'Right option',
    skipChoice: 'Skip text',
    leftTags: ['tag1', 'tag2'],  // Tags selected by left choice
    rightTags: ['tag3', 'tag4'],  // Tags selected by right choice
}
```

### 3. **Adding Mock Restaurants**
Edit `data/mock.ts`:
```typescript
{
    id: '10',
    name: 'Restaurant Name',
    distance: 0,  // Will be recalculated
    locationUrl: 'https://maps.google.com/...',
    tags: ['meal', 'light', 'near', 'budget'],  // Must match question tags
    latitude: 25.0,
    longitude: 121.5,
    rating: 4.5,  // Optional
    address: 'Street address',  // Optional
}
```

### 4. **Testing Ranking Logic**
Unit tests in `lib/rankRestaurants.test.ts`:
```bash
npm run test
# or
npx vitest run
```

---

## ⚙️ Configuration

### Environment Variables (`env.local`)

| Variable | Options | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_DATA_SOURCE` | `"mock"` (default), `"api"`, `"google"` | Selects data fetching strategy |
| `GOOGLE_MAPS_API_KEY` | Your API key | Required for real API modes |
| `GEMINI_API_KEY` | (Not used yet) | Reserved for future LLM integration |

### Data Source Selection

```bash
# Development with mock data (default)
npm run dev
# → Uses MockRestaurantRepository from data/mock.ts

# With Ollama AI integration
NEXT_PUBLIC_DATA_SOURCE=api npm run dev
# → Requires Ollama running on localhost:11434
# → Google Maps API key required
# → Hits /api/restaurants endpoint

# Direct Google Places API
NEXT_PUBLIC_DATA_SOURCE=google npm run dev
# → Uses GooglePlacesRepository
# → Hits /api/places endpoint
# → Google Maps API key required
```

### Ollama Setup
To use AI-powered recommendations (`api` mode):
1. Install Ollama: https://ollama.ai
2. Pull llama2 model: `ollama pull llama2`
3. Start Ollama: `ollama serve`
4. Ollama will be available at `http://localhost:11434`

---

## 🧪 Testing

### Run All Tests
```bash
npx vitest run
```

### Run Tests in Watch Mode
```bash
npx vitest
```

### Test Coverage
Tests for ranking algorithm in `lib/rankRestaurants.test.ts`:
- Tag matching logic
- Score calculation
- Distance calculation (Haversine)
- Sorting by score then distance

---

## 🚀 Deployment & Building

### Build for Production
```bash
npm run build
# Generates optimized build in .next/

npm start
# Runs production server
```

### Linting
```bash
npm run lint
# ESLint checks code quality
```

### Environment Variables in Production
Set these before deployment:
```bash
export NEXT_PUBLIC_DATA_SOURCE=api    # or "google"
export GOOGLE_MAPS_API_KEY=your_key
```

---

## 💡 Common Development Tasks

### Task 1: Switch Data Source While Developing
```bash
# Current terminal runs on mock
npm run dev

# New terminal runs on API (with Ollama)
NEXT_PUBLIC_DATA_SOURCE=api npm run dev -p 3001
```

### Task 2: Add Restaurant Images
1. Ensure `restaurants` have `imageUrl` field pointing to valid image URLs
2. Update `RestaurantCard.tsx` to display images (already done)
3. Update mock restaurants with image URLs

### Task 3: Add a New Tag Type
1. Add to question definition in `data/mock.ts`
2. Update mock restaurants to include the new tag if relevant
3. Update `rankRestaurants.ts` tag lists if it should be a scenario tag
4. Test ranking with new tag

### Task 4: Debug Tag Matching
Check browser console for logs from:
- `recommendationService.ts`: Tag extraction logs
- `rankRestaurants.ts`: Score calculation logs
- `restaurantRepository.ts`: API call logs

### Task 5: Add Error Boundary
The app already has error UI in `page.tsx`. To add a React Error Boundary component in production, create:
```typescript
// components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component { ... }
```

---

## 🔧 Troubleshooting

### Issue: "Location permission denied"
**Symptom**: `console.warn: "Geolocation access denied or failed"`
**Solution**:
- Browser didn't request permission or user rejected it
- App continues with mock distances
- Grant location permission in browser settings

### Issue: "Ollama is not running"
**Symptom**: 500 error on `/api/restaurants`, "Ollama running on localhost:11434?" message
**Solution**:
```bash
# Start Ollama in another terminal
ollama serve

# Pull model if needed
ollama pull llama2
```

### Issue: "Google Maps API error"
**Symptom**: 400/401 error on API routes
**Solution**:
- Verify `GOOGLE_MAPS_API_KEY` is set in `.env.local`
- Check API key has necessary permissions (Places API, Maps API)
- Verify API key isn't rate-limited

### Issue: "No restaurants returned"
**Symptom**: Loading forever or empty results
**Causes**:
- Location might be set to a remote area
- Try with known restaurant locations (Taipei)
- Check API response with browser DevTools Network tab

### Issue: "Zod validation error"
**Symptom**: Type error from restaurant data
**Solution**:
- Check that all restaurants have required fields: `id`, `name`, `distance`, `locationUrl`, `tags`, `latitude`, `longitude`
- Validate data structure matches `RestaurantSchema` in `schemas/restaurant.ts`

---

## 🗺️ Next Steps & Roadmap

### Suggested Enhancements (by priority)

#### High Priority
- [ ] **Add restaurant images** - Display photos from Google Places API in cards
- [ ] **Save preferences** - Store user history in localStorage
- [ ] **More quiz questions** - Expand from 7 to 10+ questions
- [ ] **Share functionality** - Generate shareable recommendation links
- [ ] **Favorites system** - Allow users to bookmark restaurants

#### Medium Priority
- [ ] **Search bar** - Search by restaurant name or cuisine
- [ ] **Filters after results** - Refine results by price, rating, distance
- [ ] **Review integration** - Show Google reviews/ratings prominently
- [ ] **Multiple languages** - Support English, Chinese, etc.
- [ ] **Opening hours** - Show if restaurant is currently open

#### Nice to Have
- [ ] **Map view** - Show restaurants on interactive map
- [ ] **User accounts** - Sync preferences across devices
- [ ] **Community ratings** - In-app user ratings separate from Google
- [ ] **Reservation integration** - Book tables directly from app
- [ ] **Dietary restrictions** - Vegetarian, vegan, allergies questions

### Developer Notes for Next Implementation
- Detailed handover guide available in **[HANDOVER.md](./HANDOVER.md)** with step-by-step prompts
- Code is well-structured with clear separation of concerns
- All external dependencies are kept minimal (10 production dependencies)
- Type safety enforced throughout with TypeScript + Zod

---

## 📞 Support & References

- **Next.js Docs**: https://nextjs.org/docs
- **React Docs**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com
- **Zod**: https://zod.dev
- **Framer Motion**: https://www.framer.com/motion/
- **Google Maps API**: https://developers.google.com/maps/documentation/places/web-service/overview
- **Ollama**: https://ollama.ai

---

## 📄 License

This project is maintained for educational/portfolio purposes.

---

## 🤝 Contributing

When taking over this project:
1. Read this README thoroughly
2. Review **HANDOVER.md** for implementation guidelines
3. Check **TESTING_GUIDE.md** for test procedures
4. Run `npm install` and `npm run dev` to verify setup
5. Check git history for recent changes

**Last Updated**: January 2026
**Current Version**: 0.1.0 (MVP)
**Status**: Active Development
