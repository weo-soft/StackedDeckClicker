# Service Interface Contracts: Game Mode Selection

**Feature**: Game Mode Selection (012-game-mode)  
**Date**: 2025-01-27

## GameModeService Interface

### Service Methods

```typescript
class GameModeService {
  /**
   * Get the currently selected game mode ID from storage.
   * Returns null if no mode has been selected.
   * 
   * @returns Current game mode ID or null
   */
  getCurrentModeId(): GameModeId | null;

  /**
   * Get the full game mode configuration for a given mode ID.
   * 
   * @param modeId - Game mode ID to get configuration for
   * @returns Game mode configuration object
   * @throws Error if modeId is invalid
   */
  getModeConfiguration(modeId: GameModeId): GameMode;

  /**
   * Get the currently selected game mode configuration.
   * Returns null if no mode is selected.
   * 
   * @returns Current game mode configuration or null
   */
  getCurrentMode(): GameMode | null;

  /**
   * Get all available game modes.
   * 
   * @returns Array of all game mode configurations
   */
  getAvailableModes(): GameMode[];

  /**
   * Set the selected game mode and persist to storage.
   * Does NOT apply configuration - use applyModeConfiguration() for that.
   * 
   * @param modeId - Game mode ID to select
   * @throws Error if modeId is invalid
   */
  setMode(modeId: GameModeId): void;

  /**
   * Apply game mode configuration to game state initialization.
   * This should be called before gameStateService.initialize().
   * 
   * @param modeId - Game mode ID to apply
   * @throws Error if modeId is invalid or application fails
   */
  applyModeConfiguration(modeId: GameModeId): void;

  /**
   * Check if shop is enabled for the current game mode.
   * 
   * @returns True if shop should be visible, false otherwise
   */
  isShopEnabled(): boolean;

  /**
   * Get allowed upgrade types for the current game mode.
   * 
   * @returns Array of allowed upgrade types
   */
  getAllowedUpgrades(): UpgradeType[];

  /**
   * Check if a specific upgrade type is allowed in the current mode.
   * 
   * @param upgradeType - Upgrade type to check
   * @returns True if upgrade is allowed, false otherwise
   */
  isUpgradeAllowed(upgradeType: UpgradeType): boolean;

  /**
   * Clear the selected game mode from storage.
   * Used when resetting or changing modes.
   */
  clearMode(): void;

  /**
   * Validate that a mode ID is valid.
   * 
   * @param modeId - Mode ID to validate
   * @returns True if valid, false otherwise
   */
  isValidModeId(modeId: string | null): modeId is GameModeId;
}
```

### Error Cases

- **Invalid mode ID**: Throw Error with message "Invalid game mode ID: {modeId}"
- **Storage read failure**: Return null (treat as no mode selected)
- **Storage write failure**: Log warning, continue with in-memory mode
- **Configuration application failure**: Throw Error with details

---

## GameStateService Extensions

### New Methods

```typescript
class GameStateService {
  /**
   * Purchase stacked decks using chaos/score.
   * Available only in modes that support deck purchases (e.g., Ruthless).
   * 
   * @param chaosCost - Amount of chaos to spend
   * @param deckCount - Number of decks to purchase
   * @throws InsufficientResourcesError if player doesn't have enough chaos
   * @throws Error if deck purchases are not available in current mode
   */
  async purchaseDecks(chaosCost: number, deckCount: number): Promise<void>;

  /**
   * Initialize game state with a specific game mode configuration.
   * This extends the existing initialize() method to accept mode parameter.
   * 
   * @param modeId - Optional game mode ID to use for initialization
   *                 If not provided, uses current mode from GameModeService
   */
  async initialize(modeId?: GameModeId): Promise<void>;
}
```

### Modified Methods

```typescript
class GameStateService {
  /**
   * Create default game state, optionally with game mode configuration.
   * 
   * @param mode - Optional game mode configuration to apply
   * @returns Configured game state
   */
  createDefaultGameState(mode?: GameMode): GameState;
}
```

---

## UpgradeService Extensions

### New Methods (Optional)

```typescript
class UpgradeService {
  /**
   * Filter available upgrades by allowed types.
   * This is a convenience method, but filtering can also be done at component level.
   * 
   * @param upgrades - Upgrade collection to filter
   * @param allowedTypes - Array of allowed upgrade types
   * @returns Filtered array of upgrade info objects
   */
  getFilteredUpgrades(
    upgrades: UpgradeCollection,
    allowedTypes: UpgradeType[]
  ): UpgradeInfo[];
}
```

**Note**: Filtering can be done at component level instead. This method is optional.

---

## StorageService Extensions

### New Methods

```typescript
class StorageService {
  /**
   * Load game mode ID from localStorage.
   * 
   * @returns Game mode ID or null if not found
   */
  loadGameMode(): GameModeId | null;

  /**
   * Save game mode ID to localStorage.
   * 
   * @param modeId - Game mode ID to save
   */
  saveGameMode(modeId: GameModeId): void;

  /**
   * Clear game mode from localStorage.
   */
  clearGameMode(): void;
}
```

**Alternative**: GameModeService can directly use localStorage. StorageService methods are optional but recommended for consistency.

---

## Component Contracts

### GameModeSelection Component

```typescript
interface GameModeSelectionProps {
  /**
   * Callback when a game mode is selected.
   * 
   * @param modeId - Selected game mode ID
   */
  onModeSelect?: (modeId: GameModeId) => void;

  /**
   * Whether to show the selection screen.
   * If false, component doesn't render.
   */
  isVisible: boolean;

  /**
   * Whether user is changing mode mid-session.
   * If true, shows confirmation dialog.
   */
  isModeChange?: boolean;
}

interface GameModeSelectionEvents {
  /**
   * Dispatched when mode is selected and confirmed.
   * Payload: { modeId: GameModeId }
   */
  'mode:selected': CustomEvent<{ modeId: GameModeId }>;

  /**
   * Dispatched when mode change is cancelled.
   */
  'mode:cancelled': CustomEvent<void>;
}
```

### UpgradeShop Component Modifications

```typescript
interface UpgradeShopProps {
  // ... existing props ...
  
  /**
   * Optional: Filter upgrades by allowed types.
   * If not provided, shows all upgrades.
   */
  allowedUpgradeTypes?: UpgradeType[];
}
```

**Implementation**: Component filters `availableUpgrades` based on `allowedUpgradeTypes` prop.

---

## Integration Contracts

### +page.svelte Integration

```typescript
// In +page.svelte onMount()
async function initializeGame() {
  // Check for saved game mode
  const savedMode = gameModeService.getCurrentModeId();
  
  if (!savedMode) {
    // Show game mode selection screen
    showModeSelection = true;
    return;
  }
  
  // Apply mode configuration
  gameModeService.applyModeConfiguration(savedMode);
  
  // Initialize game state
  await gameStateService.initialize(savedMode);
  
  // Continue with normal initialization...
}
```

### GameAreaLayout Integration

```typescript
// In GameAreaLayout.svelte
{#if gameModeService.isShopEnabled()}
  <!-- Blue Zone: Upgrade Store -->
  {#if layout.zones.has(ZoneType.BLUE)}
    <!-- Render UpgradeStoreZone -->
  {/if}
{/if}
```

---

## Validation Contracts

### Mode ID Validation

```typescript
function validateModeId(modeId: string | null): modeId is GameModeId {
  const validModes: GameModeId[] = [
    'classic',
    'ruthless',
    'dopamine',
    'stacked-deck-clicker'
  ];
  return modeId !== null && validModes.includes(modeId as GameModeId);
}
```

### Mode Configuration Validation

```typescript
function validateModeConfiguration(mode: GameMode): boolean {
  // Validate all required fields
  if (!mode.id || !mode.name || !mode.description) return false;
  
  // Validate startingDecks
  if (mode.startingDecks !== 'unlimited' && mode.startingDecks <= 0) return false;
  
  // Validate startingChaos
  if (mode.startingChaos < 0) return false;
  
  // Validate customRarityPercentage
  if (mode.customRarityPercentage !== undefined) {
    if (mode.customRarityPercentage < 0 || mode.customRarityPercentage > 100) return false;
  }
  
  // Validate allowedUpgrades contains valid types
  const validTypes: UpgradeType[] = [
    'autoOpening', 'improvedRarity', 'luckyDrop',
    'multidraw', 'deckProduction', 'sceneCustomization'
  ];
  for (const type of mode.allowedUpgrades) {
    if (!validTypes.includes(type)) return false;
  }
  
  return true;
}
```

---

## Performance Contracts

### Mode Selection Performance

- **Mode selection screen render**: <100ms
- **Mode configuration application**: <500ms
- **Game state initialization with mode**: <3s total
- **localStorage read/write**: <10ms each

### Deck Purchase Performance

- **Purchase validation**: <10ms
- **State update**: <50ms
- **UI update**: <100ms total

---

## Error Handling Contracts

### Error Types

```typescript
class InvalidModeError extends Error {
  constructor(modeId: string) {
    super(`Invalid game mode ID: ${modeId}`);
    this.name = 'InvalidModeError';
  }
}

class ModeApplicationError extends Error {
  constructor(message: string, cause?: Error) {
    super(`Failed to apply game mode: ${message}`);
    this.name = 'ModeApplicationError';
    this.cause = cause;
  }
}
```

### Error Recovery

- **Invalid mode ID in storage**: Clear storage, show selection screen
- **Mode configuration missing**: Fall back to default mode (Stacked Deck Clicker)
- **State initialization failure**: Show error message, allow retry
- **Storage write failure**: Log warning, continue with in-memory mode (non-critical)

---

## Testing Contracts

### Mock Interfaces

```typescript
interface MockGameModeService {
  getCurrentModeId(): GameModeId | null;
  getModeConfiguration(modeId: GameModeId): GameMode;
  setMode(modeId: GameModeId): void;
  applyModeConfiguration(modeId: GameModeId): void;
  isShopEnabled(): boolean;
  getAllowedUpgrades(): UpgradeType[];
}
```

### Test Data

- Provide mock mode configurations for each mode
- Provide invalid mode IDs for error testing
- Provide corrupted localStorage data for recovery testing

