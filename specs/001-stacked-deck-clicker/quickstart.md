# Quickstart Guide: Stacked Deck Clicker Game

**Created**: 2025-01-27  
**Purpose**: Get the game running locally for development

## Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Modern web browser (Chrome, Firefox, Safari, Edge - latest 2 versions)
- Git (for cloning repository)

## Initial Setup

### 1. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 2. Development Server

Start the development server with hot module replacement:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

The game will be available at `http://localhost:5173` (or the port shown in terminal).

### 3. Build for Production

Build optimized production bundle:

```bash
npm run build
# or
yarn build
# or
pnpm build
```

Preview production build locally:

```bash
npm run preview
# or
yarn preview
# or
pnpm preview
```

## Project Structure

```
src/
├── lib/
│   ├── components/     # Svelte UI components
│   ├── stores/         # Svelte stores (state management)
│   ├── services/       # Business logic services
│   ├── models/         # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── canvas/         # Canvas rendering/animation
│   ├── audio/          # Audio management
│   └── routes/         # SvelteKit routes
├── static/             # Static assets (sounds, images)
└── app.html            # HTML template

tests/
├── unit/               # Unit tests (Vitest)
├── integration/        # Integration tests (Vitest)
└── e2e/                # End-to-end tests (Playwright)
```

## Key Files

- **Main game page**: `src/lib/routes/+page.svelte`
- **Game state store**: `src/lib/stores/gameState.ts`
- **Card service**: `src/lib/services/cardService.ts`
- **Storage service**: `src/lib/services/storageService.ts`
- **Canvas renderer**: `src/lib/canvas/renderer.ts`

## Running Tests

### Unit Tests

```bash
npm run test
# or
yarn test
# or
pnpm test
```

### Integration Tests

```bash
npm run test:integration
# or
yarn test:integration
# or
pnpm test:integration
```

### End-to-End Tests

```bash
npm run test:e2e
# or
yarn test:e2e
# or
pnpm test:e2e
```

### Test Coverage

```bash
npm run test:coverage
# or
yarn test:coverage
# or
pnpm test:coverage
```

Target: ≥80% coverage for critical paths (card drawing, score calculation, upgrades, offline progression, storage).

## Development Workflow

### 1. Making Changes

- Edit files in `src/lib/`
- Changes hot-reload automatically in dev server
- Check browser console for errors

### 2. Testing Changes

- Write/update tests in `tests/` directory
- Run relevant test suite
- Ensure all tests pass before committing

### 3. Checking Game State

- Open browser DevTools
- Check Application tab → IndexedDB → `stackedDeckClicker`
- View `gameState` object to inspect current state
- Use `localStorage.clear()` or DevTools to reset state for testing

### 4. Debugging

- Use browser DevTools for debugging
- Check Console for errors and logs
- Use Sources tab to set breakpoints
- Use Performance tab to profile canvas rendering
- Use Memory tab to check for leaks

## Common Tasks

### Reset Game State

**Option 1: Via DevTools**
1. Open DevTools (F12)
2. Application tab → IndexedDB → `stackedDeckClicker`
3. Right-click `gameState` → Delete
4. Refresh page

**Option 2: Via Code**
```typescript
import { storageService } from '$lib/services/storageService';
await storageService.clearAll();
```

### Add New Card

Edit card pool definition (location TBD in implementation):
```typescript
const newCard: DivinationCard = {
  name: "Card Name",
  weight: 100,  // Lower = rarer
  value: 50,    // Score contribution
  qualityTier: "rare"
};
```

### Test Offline Progression

1. Enable auto-opening upgrade
2. Note current timestamp in game state
3. Manually modify `lastSessionTimestamp` in IndexedDB to simulate offline time
4. Reload page
5. Verify offline progression calculated correctly

### Test Weighted Random

Use deterministic seed in tests:
```typescript
import seedrandom from 'seedrandom';
const prng = seedrandom('test-seed');
// Use prng() for reproducible random numbers
```

## Environment Variables

Create `.env` file for local development (if needed):

```env
# Example (add as needed)
VITE_APP_NAME=Stacked Deck Clicker
```

## Browser Compatibility

- Chrome/Edge: Latest 2 versions ✅
- Firefox: Latest 2 versions ✅
- Safari: Latest 2 versions ✅
- Mobile browsers: iOS Safari, Chrome Mobile ✅

## Performance Tips

- Use browser DevTools Performance tab to profile
- Check Memory tab for leaks during long sessions
- Monitor canvas FPS (should maintain 60fps)
- Check Network tab for asset loading times

## Troubleshooting

### Game won't load

- Check browser console for errors
- Verify IndexedDB is available (not in private/incognito mode)
- Clear browser cache and reload

### Canvas not rendering

- Check canvas element exists in DOM
- Verify canvas dimensions are set
- Check console for rendering errors

### Audio not playing

- Check browser audio permissions
- Verify audio files exist in `static/sounds/`
- Some browsers require user interaction before audio can play

### Storage errors

- Check IndexedDB quota (DevTools → Application → Storage)
- Clear old data if quota exceeded
- Verify localforge is properly initialized

### Tests failing

- Ensure all dependencies installed
- Check test environment setup
- Verify test data is isolated (no shared state)

## Next Steps

1. Read [data-model.md](./data-model.md) for entity definitions
2. Review [service-interfaces.md](./contracts/service-interfaces.md) for API contracts
3. Check [research.md](./research.md) for technical decisions
4. See [spec.md](./spec.md) for full requirements

## Getting Help

- Check browser console for error messages
- Review test files for usage examples
- Consult SvelteKit, Howler.js, and localforge documentation
- Review constitution for code quality and testing standards

