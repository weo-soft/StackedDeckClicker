# Service Interfaces: Stacked Deck Clicker Game

**Created**: 2025-01-27  
**Purpose**: Define internal service interfaces and contracts for game logic

## Overview

Since this is a client-side game with no backend, these "contracts" define the internal service interfaces that components use to interact with game logic. These interfaces ensure separation of concerns and testability.

## CardService

Handles card drawing and weighted random selection.

### Interface

```typescript
interface CardService {
  /**
   * Draw a single card from the card pool using weighted random selection.
   * Applies upgrade effects (rarity improvements, luck bonuses) before drawing.
   * 
   * @param cardPool - The pool of cards to draw from
   * @param upgrades - Active upgrades that affect card drawing
   * @param prng - Seeded PRNG instance for deterministic results
   * @returns The drawn DivinationCard
   */
  drawCard(
    cardPool: CardPool,
    upgrades: UpgradeCollection,
    prng: () => number
  ): DivinationCard;

  /**
   * Draw multiple cards at once (for multidraw upgrade).
   * 
   * @param count - Number of cards to draw
   * @param cardPool - The pool of cards to draw from
   * @param upgrades - Active upgrades
   * @param prng - Seeded PRNG instance
   * @returns Array of drawn cards
   */
  drawMultipleCards(
    count: number,
    cardPool: CardPool,
    upgrades: UpgradeCollection,
    prng: () => number
  ): DivinationCard[];

  /**
   * Apply upgrade effects to card pool weights (for improved rarity).
   * Returns modified weights without mutating original pool.
   * 
   * @param cardPool - Original card pool
   * @param rarityLevel - Level of improved rarity upgrade
   * @returns Modified card pool with adjusted weights
   */
  applyRarityUpgrade(
    cardPool: CardPool,
    rarityLevel: number
  ): CardPool;

  /**
   * Apply luck upgrade (best-of-N selection).
   * 
   * @param cardPool - Card pool to draw from
   * @param luckLevel - Level of luck upgrade (determines N)
   * @param prng - Seeded PRNG instance
   * @returns Best card from N draws
   */
  applyLuckUpgrade(
    cardPool: CardPool,
    luckLevel: number,
    prng: () => number
  ): DivinationCard;
}
```

### Error Cases

- **Empty card pool**: Throw error (should never happen per requirements)
- **Invalid weights**: Throw error (all weights must be > 0)
- **Invalid upgrade level**: Use level 0 (no effect) as fallback

---

## UpgradeService

Handles upgrade calculations, costs, and effects.

### Interface

```typescript
interface UpgradeService {
  /**
   * Calculate the cost to purchase the next level of an upgrade.
   * 
   * @param upgrade - The upgrade to calculate cost for
   * @returns Cost in score
   */
  calculateUpgradeCost(upgrade: Upgrade): number;

  /**
   * Calculate the current effect value of an upgrade based on its level.
   * Effect calculation varies by upgrade type.
   * 
   * @param upgrade - The upgrade to calculate effect for
   * @returns Effect magnitude (interpretation depends on upgrade type)
   */
  calculateUpgradeEffect(upgrade: Upgrade): number;

  /**
   * Check if player can afford an upgrade.
   * 
   * @param upgrade - The upgrade to check
   * @param currentScore - Player's current score
   * @returns True if player can afford, false otherwise
   */
  canAffordUpgrade(upgrade: Upgrade, currentScore: number): boolean;

  /**
   * Get all available upgrades with their current costs and effects.
   * 
   * @param upgrades - Current upgrade collection
   * @returns Array of upgrade info objects
   */
  getAvailableUpgrades(upgrades: UpgradeCollection): UpgradeInfo[];

  /**
   * Calculate auto-opening rate (decks per second) based on upgrade level.
   * 
   * @param autoOpeningLevel - Level of auto-opening upgrade
   * @returns Decks per second
   */
  calculateAutoOpeningRate(autoOpeningLevel: number): number;

  /**
   * Calculate deck production rate (decks per second) based on upgrade level.
   * 
   * @param productionLevel - Level of deck production upgrade
   * @returns Decks per second
   */
  calculateDeckProductionRate(productionLevel: number): number;
}

interface UpgradeInfo {
  type: UpgradeType;
  level: number;
  cost: number;
  effect: number;
  effectDescription: string;
}
```

### Error Cases

- **Invalid upgrade type**: Throw error
- **Negative level**: Treat as 0
- **Invalid cost multiplier**: Use default 1.5

---

## OfflineService

Handles offline progression calculation.

### Interface

```typescript
interface OfflineService {
  /**
   * Calculate offline progression based on elapsed time and active upgrades.
   * 
   * @param lastTimestamp - Timestamp of last session
   * @param currentTimestamp - Current timestamp
   * @param upgrades - Active upgrades
   * @param cardPool - Card pool for drawing cards
   * @param maxOfflineSeconds - Maximum offline time to calculate (default: 7 days)
   * @returns OfflineProgressionResult with all drawn cards and score gained
   */
  calculateOfflineProgression(
    lastTimestamp: number,
    currentTimestamp: number,
    upgrades: UpgradeCollection,
    cardPool: CardPool,
    maxOfflineSeconds?: number
  ): OfflineProgressionResult;

  /**
   * Simulate opening a single deck offline (with all upgrade effects).
   * 
   * @param cardPool - Card pool to draw from
   * @param upgrades - Active upgrades
   * @param prng - Seeded PRNG instance (seeded with timestamp for determinism)
   * @returns CardDrawResult
   */
  simulateDeckOpening(
    cardPool: CardPool,
    upgrades: UpgradeCollection,
    prng: () => number
  ): CardDrawResult;
}
```

### Error Cases

- **Negative elapsed time**: Treat as 0 (clock changed)
- **Invalid timestamps**: Throw error
- **No auto-opening upgrade**: Return empty result (0 decks opened)

---

## StorageService

Handles game state persistence to IndexedDB.

### Interface

```typescript
interface StorageService {
  /**
   * Load game state from IndexedDB.
   * 
   * @returns Promise resolving to GameState, or null if no saved state exists
   * @throws Error if storage is unavailable or data is corrupted
   */
  loadGameState(): Promise<GameState | null>;

  /**
   * Save game state to IndexedDB.
   * 
   * @param gameState - Game state to save
   * @returns Promise resolving when save is complete
   * @throws Error if storage quota exceeded or save fails
   */
  saveGameState(gameState: GameState): Promise<void>;

  /**
   * Load card pool definition from IndexedDB.
   * 
   * @returns Promise resolving to CardPool, or null if not found
   */
  loadCardPool(): Promise<CardPool | null>;

  /**
   * Save card pool definition to IndexedDB.
   * 
   * @param cardPool - Card pool to save
   * @returns Promise resolving when save is complete
   */
  saveCardPool(cardPool: CardPool): Promise<void>;

  /**
   * Check if storage is available and has sufficient quota.
   * 
   * @returns Promise resolving to true if storage is available
   */
  isStorageAvailable(): Promise<boolean>;

  /**
   * Get estimated storage usage.
   * 
   * @returns Promise resolving to estimated bytes used
   */
  getStorageUsage(): Promise<number>;

  /**
   * Clear all saved game data (for testing or reset).
   * 
   * @returns Promise resolving when clear is complete
   */
  clearAll(): Promise<void>;
}
```

### Error Cases

- **Storage unavailable**: Throw error with user-friendly message
- **Quota exceeded**: Throw specific error for user notification
- **Corrupted data**: Attempt to recover, fall back to default state
- **Parse error**: Return null, treat as no saved state

---

## GameStateService

Manages game state updates and coordinates between services.

### Interface

```typescript
interface GameStateService {
  /**
   * Get current game state.
   * 
   * @returns Current GameState
   */
  getGameState(): GameState;

  /**
   * Update game state (for internal use, triggers save).
   * 
   * @param updater - Function that receives current state and returns new state
   */
  updateGameState(updater: (state: GameState) => GameState): Promise<void>;

  /**
   * Open a single deck and update game state.
   * 
   * @returns Promise resolving to CardDrawResult
   * @throws Error if no decks available
   */
  openDeck(): Promise<CardDrawResult>;

  /**
   * Open multiple decks at once (multidraw).
   * 
   * @param count - Number of decks to open
   * @returns Promise resolving to array of CardDrawResult
   * @throws Error if insufficient decks available
   */
  openMultipleDecks(count: number): Promise<CardDrawResult[]>;

  /**
   * Purchase an upgrade and update game state.
   * 
   * @param upgradeType - Type of upgrade to purchase
   * @returns Promise resolving when purchase is complete
   * @throws Error if insufficient score or invalid upgrade type
   */
  purchaseUpgrade(upgradeType: UpgradeType): Promise<void>;

  /**
   * Purchase a scene customization.
   * 
   * @param customizationId - ID of customization to purchase
   * @param cost - Cost in score
   * @returns Promise resolving when purchase is complete
   * @throws Error if insufficient score
   */
  purchaseCustomization(customizationId: string, cost: number): Promise<void>;

  /**
   * Initialize game state (load from storage or create default).
   * 
   * @returns Promise resolving when initialization is complete
   */
  initialize(): Promise<void>;

  /**
   * Process offline progression on game load.
   * 
   * @returns Promise resolving to OfflineProgressionResult, or null if no offline time
   */
  processOfflineProgression(): Promise<OfflineProgressionResult | null>;
}
```

### Error Cases

- **No decks available**: Throw error with user-friendly message
- **Insufficient score**: Throw error with required amount
- **Invalid upgrade type**: Throw error
- **Storage failure**: Log error, continue in memory, show warning to user

---

## AudioService

Manages audio playback using Howler.js.

### Interface

```typescript
interface AudioService {
  /**
   * Play sound effect for card drop based on quality tier.
   * 
   * @param qualityTier - Quality tier of the card
   */
  playCardDropSound(qualityTier: QualityTier): void;

  /**
   * Play sound effect for upgrade purchase.
   */
  playUpgradeSound(): void;

  /**
   * Play sound effect for score gain.
   * 
   * @param amount - Amount of score gained (for volume/pitch variation)
   */
  playScoreGainSound(amount: number): void;

  /**
   * Set master volume (0.0 to 1.0).
   * 
   * @param volume - Volume level
   */
  setVolume(volume: number): void;

  /**
   * Mute/unmute all audio.
   * 
   * @param muted - True to mute, false to unmute
   */
  setMuted(muted: boolean): void;

  /**
   * Preload all audio files.
   * 
   * @returns Promise resolving when all audio is loaded
   */
  preloadAudio(): Promise<void>;
}
```

### Error Cases

- **Audio file not found**: Log warning, continue silently
- **Audio context blocked**: Show user message to interact first
- **Browser doesn't support audio**: Gracefully degrade (no audio)

---

## CanvasService

Manages HTML5 Canvas rendering and animations.

### Interface

```typescript
interface CanvasService {
  /**
   * Initialize canvas and start render loop.
   * 
   * @param canvasElement - HTML canvas element
   * @param width - Canvas width
   * @param height - Canvas height
   */
  initialize(canvasElement: HTMLCanvasElement, width: number, height: number): void;

  /**
   * Add a card to the scene with drop animation.
   * 
   * @param card - Card to display
   * @param position - Initial position {x, y}
   */
  addCard(card: DivinationCard, position?: {x: number, y: number}): void;

  /**
   * Update scene customizations.
   * 
   * @param customizations - Map of active customizations
   */
  updateCustomizations(customizations: Map<string, boolean>): void;

  /**
   * Clear all cards from scene.
   */
  clearCards(): void;

  /**
   * Start render loop (60fps).
   */
  start(): void;

  /**
   * Stop render loop.
   */
  stop(): void;

  /**
   * Clean up resources.
   */
  destroy(): void;
}
```

### Error Cases

- **Canvas not supported**: Throw error (should not happen in modern browsers)
- **Invalid dimensions**: Use default or throw error
- **Too many cards**: Limit visible cards, remove oldest

---

## Service Dependencies

```
GameStateService
  ├── CardService
  ├── UpgradeService
  ├── OfflineService
  ├── StorageService
  └── (coordinates all services)

CanvasService
  └── (receives events from GameStateService)

AudioService
  └── (receives events from GameStateService)
```

## Testing Contracts

All services must be:
- **Testable in isolation**: Can be instantiated with mocked dependencies
- **Deterministic**: Same inputs produce same outputs (when using seeded PRNG)
- **Error-handling**: All error cases documented and handled gracefully
- **Type-safe**: Full TypeScript type definitions
- **Documented**: JSDoc comments for all public methods

