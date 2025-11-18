# Research: Stacked Deck Clicker Game

**Created**: 2025-01-27  
**Purpose**: Resolve technical unknowns and establish best practices for implementation

## Technology Stack Research

### SvelteKit for Game Development

**Decision**: Use SvelteKit as the primary framework for UI and state management.

**Rationale**: 
- SvelteKit provides excellent performance with compile-time optimizations
- Reactive stores (`writable`, `readable`) are perfect for game state management
- Component-based architecture allows clean separation of UI concerns
- Built-in routing supports potential future expansion (settings, stats pages)
- TypeScript support ensures type safety for game logic
- SSR can be disabled for pure client-side game (adapter-static)

**Alternatives Considered**:
- React: More overhead, virtual DOM adds unnecessary complexity for game UI
- Vue: Similar benefits but Svelte's compile-time approach is more performant
- Vanilla JS: Too much boilerplate, no built-in state management

**Best Practices**:
- Use Svelte stores for global game state (score, upgrades, decks)
- Keep components small and focused (one responsibility)
- Use `$:` reactive statements for derived state
- Leverage Svelte's built-in transitions for UI animations
- Use `onMount` and `onDestroy` for canvas lifecycle management

### HTML5 Canvas for Rendering/Animation

**Decision**: Use HTML5 Canvas API for card drop animations and scene rendering.

**Rationale**:
- Canvas provides pixel-level control for custom animations
- Better performance than DOM manipulation for many moving objects (100+ cards)
- Supports custom drawing, effects, and particle systems
- Can maintain 60fps with proper optimization techniques

**Alternatives Considered**:
- SVG: Better for vector graphics but slower with many elements
- DOM/CSS: Easier but performance degrades with 100+ animated elements
- WebGL: Overkill for 2D card animations, adds complexity

**Best Practices**:
- Use `requestAnimationFrame` for smooth 60fps rendering
- Implement object pooling for card sprites to reduce GC pressure
- Use dirty rectangle technique - only redraw changed areas
- Batch draw operations (group similar draws together)
- Use offscreen canvas for pre-rendered static elements
- Implement viewport culling - only render visible cards
- Use `willReadFrequently: false` for better performance when not reading pixels

**Performance Optimization**:
- Limit visible cards to ~100-150 on screen at once
- Implement card fade-out/removal after display duration
- Use sprite sheets if card artwork is added later
- Debounce/throttle rapid state updates to canvas

### IndexedDB via localforge for State Persistence

**Decision**: Use localforge library as a wrapper around IndexedDB for game state persistence.

**Rationale**:
- IndexedDB provides large storage capacity (much larger than localStorage)
- localforge simplifies IndexedDB's complex API with Promise-based interface
- Supports structured data storage (objects, arrays)
- Handles storage quota management
- Better performance than localStorage for frequent writes
- Supports transactions for atomic operations

**Alternatives Considered**:
- localStorage: Simple but limited to 5-10MB, synchronous API blocks UI
- IndexedDB directly: Too complex, callback-based API is error-prone
- Dexie.js: More features but heavier, overkill for simple game state

**Best Practices**:
- Store complete game state as single JSON object for atomic updates
- Implement save throttling (debounce saves to avoid excessive writes)
- Use transactions for multi-key updates
- Handle storage quota exceeded errors gracefully
- Validate loaded data structure before using
- Implement data migration strategy for future schema changes
- Save on critical events (upgrade purchase, score milestone) and periodic auto-save

**Storage Schema**:
```typescript
{
  gameState: {
    score: number,
    decks: number,
    lastSessionTimestamp: number,
    upgrades: { [upgradeType: string]: number },
    customizations: { [customizationId: string]: boolean },
    cardCollection: { [cardName: string]: number } // optional: track collected cards
  }
}
```

### Howler.js for Audio Management

**Decision**: Use Howler.js library for audio playback and management.

**Rationale**:
- Cross-browser audio compatibility (handles codec differences)
- Supports multiple audio formats with fallback
- Spatial audio support (if needed for future features)
- Volume control and audio sprites (multiple sounds in one file)
- Handles audio context initialization issues
- Lightweight and well-maintained

**Alternatives Considered**:
- Web Audio API directly: More control but complex, requires more code
- HTML5 Audio: Simple but limited features, browser compatibility issues
- Tone.js: Overkill for simple sound effects

**Best Practices**:
- Preload audio files on game initialization
- Use audio sprites (multiple sounds in one file) to reduce HTTP requests
- Implement sound pools for frequently played sounds (card drops)
- Respect user preferences (mute button, volume slider)
- Use different audio files for different card tiers (common, rare, epic, legendary)
- Implement audio fade-in/out for smooth transitions
- Handle audio context autoplay restrictions (require user interaction first)

### seedrandom for Deterministic PRNG

**Decision**: Use seedrandom library for deterministic pseudo-random number generation.

**Rationale**:
- Enables reproducible random sequences (critical for testing)
- Can seed with timestamp for true randomness in production
- Supports multiple PRNG algorithms (default is good quality)
- Lightweight and fast
- Works well with weighted random selection algorithms

**Alternatives Considered**:
- Math.random(): Non-deterministic, cannot reproduce test scenarios
- crypto.getRandomValues(): True randomness but not deterministic for tests
- Custom PRNG: Unnecessary complexity, seedrandom is battle-tested

**Best Practices**:
- Use deterministic seeds in tests for reproducible results
- Use timestamp-based or user-action-based seeds in production
- Create separate PRNG instances for different purposes (card draws, visual effects)
- Reset seed for each game session or use session-based seed

### Vite Build Configuration for GitHub Pages

**Decision**: Use Vite as build tool with adapter-static for GitHub Pages deployment.

**Rationale**:
- Vite is the default build tool for SvelteKit
- Fast HMR during development
- Optimized production builds with code splitting
- adapter-static generates static files perfect for GitHub Pages
- Supports environment variables for build configuration

**Best Practices**:
- Configure `base` path in `svelte.config.js` if using custom domain or subdirectory
- Use `vite.config.js` for build optimizations (minification, compression)
- Set up GitHub Actions workflow for automatic deployment
- Use `adapter-static` with prerendering disabled (SPA mode)
- Configure proper 404.html for client-side routing

**GitHub Pages Configuration**:
- Build output: `build/` directory
- Deploy from `gh-pages` branch or `docs/` folder
- Use GitHub Actions for automated deployment on push to main

## Algorithm Research

### Weighted Random Selection

**Decision**: Use cumulative distribution function (CDF) approach for weighted random selection.

**Rationale**:
- O(n) preprocessing, O(log n) selection (with binary search) or O(n) linear search for small pools
- Accurate probability distribution
- Handles any weight values (not just integers)
- Easy to implement and test

**Algorithm**:
1. Precompute cumulative weights array: `[w1, w1+w2, w1+w2+w3, ...]`
2. Generate random number `r` in range [0, totalWeight)
3. Find first index where cumulative weight >= r (binary search for large pools, linear for small)
4. Return card at that index

**Alternatives Considered**:
- Alias method: O(1) selection but O(n) preprocessing, more complex
- Rejection sampling: Simple but inefficient for highly skewed distributions
- Roulette wheel: O(n) selection, acceptable for small card pools (<100 cards)

**Implementation Notes**:
- Cache cumulative weights array, recalculate only when card pool changes
- Use binary search for card pools > 50 cards
- Validate weights are positive numbers
- Handle edge case: all weights zero (should not happen per requirements)

### Offline Progression Calculation

**Decision**: Calculate offline progression by simulating deck openings using deterministic PRNG seeded with session timestamp.

**Rationale**:
- Maintains statistical accuracy (same distribution as online play)
- Deterministic results (same offline time = same results, testable)
- Handles all upgrade effects correctly
- Can cap maximum offline time to prevent unrealistic gains

**Algorithm**:
1. Calculate elapsed time: `currentTime - lastSessionTimestamp`
2. Cap elapsed time to maximum (e.g., 7 days) to prevent abuse
3. Calculate decks to open: `elapsedSeconds * autoOpeningRate * deckProductionMultiplier`
4. For each deck:
   - Apply rarity improvements (modify weights)
   - Apply luck upgrades (best-of-N selection)
   - Draw card using weighted random
   - Accumulate score
5. Store results and update game state

**Edge Cases**:
- Negative elapsed time (clock changed): Treat as 0
- Very large elapsed time: Cap to maximum (7 days)
- No auto-opening upgrade: Return 0 decks
- Storage unavailable: Skip offline calculation, show error

### Large Number Handling

**Decision**: Use JavaScript's native `number` type with BigInt for extremely large values if needed.

**Rationale**:
- JavaScript `number` (IEEE 754 double) supports up to ~2^53 safely (9 quadrillion)
- For score values, this is sufficient for most gameplay scenarios
- BigInt available if needed for truly massive numbers
- Native number operations are fastest

**Alternatives Considered**:
- Decimal.js: More precision but slower, unnecessary overhead
- BigNumber.js: Similar to Decimal.js, overkill
- String-based arithmetic: Too slow and complex

**Best Practices**:
- Format large numbers for display (1.5M, 2.3B, etc.)
- Use `Number.isSafeInteger()` to detect overflow
- Implement graceful degradation if numbers exceed safe range
- Consider BigInt only if score regularly exceeds 2^53

**Number Formatting**:
- Implement custom formatter: 1,000 → "1K", 1,000,000 → "1M", etc.
- Support up to quadrillions (Q) for display
- Maintain precision for calculations, only format for display

## Performance Optimization Strategies

### Canvas Rendering Optimization

**Decision**: Implement object pooling, viewport culling, and dirty rectangle updates.

**Rationale**:
- Reduces garbage collection pressure
- Minimizes draw calls
- Maintains 60fps with 100+ cards

**Techniques**:
- Object pool for card sprites (reuse objects instead of creating/destroying)
- Viewport culling (only render cards in visible area)
- Dirty rectangles (track changed areas, only redraw those)
- Batch similar draw operations
- Use offscreen canvas for static background elements

### State Update Optimization

**Decision**: Debounce/throttle state updates and batch multiple changes.

**Rationale**:
- Prevents excessive re-renders
- Reduces storage write frequency
- Maintains UI responsiveness

**Techniques**:
- Debounce save operations (wait 500ms after last change before saving)
- Batch multiple score updates during rapid deck opening
- Use Svelte's reactive statements efficiently (avoid unnecessary recalculations)
- Throttle canvas updates to 60fps maximum

## Testing Strategy

### Deterministic Testing with seedrandom

**Decision**: Use fixed seeds in tests for reproducible results.

**Rationale**:
- Enables regression testing
- Predictable test outcomes
- Can test specific scenarios (rare card draws, edge cases)

**Implementation**:
- Create PRNG instance with fixed seed for each test
- Test weighted random distribution over large sample (1000+ draws)
- Verify statistical properties (chi-square test for distribution)
- Test edge cases (all weights equal, single card, extreme weights)

### Test Data Isolation

**Decision**: Use in-memory IndexedDB polyfill or mock storage for tests.

**Rationale**:
- Tests don't affect real browser storage
- Fast test execution
- Can test storage failures and edge cases

**Implementation**:
- Use `fake-indexeddb` library for IndexedDB mocking
- Mock localforge API in unit tests
- Test storage quota exceeded scenarios
- Test corrupted data recovery

## Accessibility Considerations

### WCAG 2.1 Level AA Compliance

**Decision**: Implement keyboard navigation, screen reader support, and proper ARIA labels.

**Rationale**:
- Required by constitution
- Expands game accessibility
- Legal compliance in many jurisdictions

**Implementation**:
- All buttons keyboard accessible (Tab navigation, Enter/Space activation)
- Canvas content described via ARIA live regions
- Score and game state announced to screen readers
- Color contrast ratios meet WCAG standards (4.5:1 for text)
- Provide text alternatives for visual information (card names, rarity)

## Deployment Strategy

### GitHub Pages Static Hosting

**Decision**: Deploy as static site using GitHub Pages with GitHub Actions automation.

**Rationale**:
- Free hosting
- Automatic HTTPS
- Easy deployment workflow
- No server maintenance

**Implementation**:
- Use `adapter-static` in SvelteKit config
- Configure GitHub Actions workflow for automatic deployment
- Build on push to main branch
- Deploy to `gh-pages` branch or `docs/` folder
- Configure custom 404.html for SPA routing

## Summary

All technical decisions have been researched and documented. The stack is well-suited for a client-side incremental game with:
- Fast, reactive UI (SvelteKit)
- Smooth animations (Canvas with optimizations)
- Reliable persistence (IndexedDB via localforge)
- Rich audio feedback (Howler.js)
- Testable randomness (seedrandom)
- Easy deployment (Vite + GitHub Pages)

No critical unknowns remain. Ready to proceed to Phase 1 design.

