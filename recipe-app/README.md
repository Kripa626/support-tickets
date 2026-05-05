# Recipebook

A mobile recipe management app built with Expo (React Native) + Claude AI.

## Features

### Recipe Import (AI-powered)
- **URL / Instagram**: Paste any recipe URL or Instagram post link — Claude extracts the full recipe automatically
- **Paste text**: Copy from any app, message, or website and Claude parses it into structured data
- **Photo**: Take a photo of a recipe card or screenshot and Claude reads it

### Recipe Management
- ⭐ Star and ❤️ favourite recipes
- Rate 1–5 stars with tap
- Mark as "Made it!" with optional serving count and notes — tracks full cooking history
- See "last cooked X days ago" at a glance
- Scale servings — all ingredient amounts update automatically with fraction symbols (½, ¼, etc.)
- Add/edit steps with optional tips per step (tap steps to mark complete while cooking)

### Organisation
- 🏷️ Tags — auto-suggested by Claude on import, or add manually
- Filter by: favourites, starred, minimum rating, tag
- Sort by: newest, A–Z, rating, last made
- Full-text search across title, description, notes
- Tag browser tab with per-tag recipe counts and custom colours

### Recipe Linking
- Link recipes as sauce / side / base / variation
- Or use the notes field for freeform cross-references

### Meal Planning
- Create named meal plans (e.g. "Week 20", "Holiday menu")
- Add any recipe to any date + meal type (breakfast/lunch/dinner/snack/dessert)
- Auto-generate shopping lists from a meal plan with one tap

### Shopping Lists
- Auto-generated from meal plans (ingredients scaled to planned servings)
- Add items manually
- Check off items with a progress bar
- Items grouped by ingredient category
- Multiple lists, long-press to delete

## Setup

### 1. Install dependencies
```bash
cd recipe-app
npm install
```

### 2. Add your Anthropic API key
Launch the app and tap ⚙️ Settings → enter your API key from [console.anthropic.com](https://console.anthropic.com/account/keys).

The key is stored securely on-device using `expo-secure-store` and never sent anywhere except Anthropic's API.

### 3. Run
```bash
npm run ios        # iOS Simulator
npm run android    # Android Emulator / device
npm run web        # Browser (limited native features)
```

Or scan the QR code with **Expo Go** after `npm start`.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo 55 + React Native 0.76 |
| Navigation | Expo Router (file-based) |
| Database | expo-sqlite (local, no server needed) |
| State | Zustand |
| AI | Anthropic claude-sonnet-4-6 |
| UI | React Native Paper + custom components |
| Language | TypeScript |

## Architecture

```
recipe-app/
├── app/                    # Expo Router screens
│   ├── (tabs)/             # Bottom tab bar
│   │   ├── index.tsx       # Recipe list + search + filters
│   │   ├── tags.tsx        # Tag browser
│   │   ├── plans.tsx       # Meal plans list
│   │   └── shopping.tsx    # Shopping lists
│   ├── recipe/
│   │   ├── [id].tsx        # Recipe detail
│   │   ├── new.tsx         # Add recipe manually
│   │   └── edit/[id].tsx   # Edit recipe
│   ├── plan/[id].tsx       # Meal plan detail
│   ├── import.tsx          # Claude AI import
│   └── settings.tsx        # API key + info
├── components/             # Shared UI components
├── lib/
│   ├── database.ts         # SQLite schema + init
│   ├── db/                 # Per-domain SQL queries
│   ├── claude.ts           # Anthropic SDK integration
│   ├── types.ts            # TypeScript interfaces
│   └── utils.ts            # Scaling, formatting helpers
└── store/
    └── useRecipeStore.ts   # Zustand global store
```
