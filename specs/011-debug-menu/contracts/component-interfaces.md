# Component Interface Contracts: Debug Menu

**Feature**: Debug Menu (011-debug-menu)  
**Date**: 2025-01-27

## DebugMenu Component Interface

### Props

```typescript
interface DebugMenuProps {
  /**
   * Current game state (reactive)
   * Required for reading current values and triggering updates
   */
  gameState: GameState | null;
  
  /**
   * Whether the menu trigger button should be visible
   * Default: import.meta.env.DEV (development mode)
   * Can be overridden for production debugging
   */
  isVisible?: boolean;
}
```

### Events

```typescript
interface DebugMenuEvents {
  /**
   * Dispatched when menu opens
   * Payload: { isOpen: true }
   */
  'menu:open': CustomEvent<{ isOpen: boolean }>;
  
  /**
   * Dispatched when menu closes
   * Payload: { isOpen: false }
   */
  'menu:close': CustomEvent<{ isOpen: boolean }>;
  
  /**
   * Dispatched when a debug tool action completes
   * Payload: { tool: string, success: boolean, error?: string }
   */
  'tool:action': CustomEvent<{
    tool: 'addChaos' | 'addDecks' | 'setRarity' | 'setLuckyDrop' | 'toggleDebugMode';
    success: boolean;
    error?: string;
  }>;
}
```

### Component Methods (Internal)

```typescript
class DebugMenu {
  /**
   * Open the debug menu
   * Sets isOpen to true, focuses first interactive element
   */
  open(): void;
  
  /**
   * Close the debug menu
   * Sets isOpen to false, returns focus to trigger button
   */
  close(): void;
  
  /**
   * Toggle menu open/closed state
   */
  toggle(): void;
  
  /**
   * Handle keyboard events (F12 to open, Escape to close)
   */
  handleKeyDown(event: KeyboardEvent): void;
}
```

## Service Interface Contracts

### gameStateService Methods Used

```typescript
interface GameStateService {
  /**
   * Add chaos orbs to player's score (for testing/debugging)
   * @param amount - Number of chaos orbs to add (default: 10)
   * @throws Error if operation fails
   */
  addChaos(amount: number): Promise<void>;
  
  /**
   * Add decks to player's inventory (for testing/debugging)
   * @param amount - Number of decks to add (default: 10)
   * @throws Error if operation fails
   */
  addDecks(amount: number): Promise<void>;
  
  /**
   * Set custom rarity percentage (for testing/debugging)
   * @param percentage - Rarity percentage (0-10000)
   * @param allowDebug - Whether to allow setting without upgrade purchased (default: false)
   * @throws Error if operation fails or validation fails
   */
  setCustomRarityPercentage(
    percentage: number,
    allowDebug?: boolean
  ): Promise<void>;
  
  /**
   * Set lucky drop level (for testing/debugging)
   * @param level - Lucky drop level (0-10)
   * @throws Error if operation fails or validation fails
   */
  setLuckyDropLevel(level: number): Promise<void>;
}
```

## Parent Component Integration

### Usage in +page.svelte

```svelte
<script>
  import DebugMenu from '$lib/components/DebugMenu.svelte';
  import { gameStateService } from '$lib/services/gameStateService.js';
  
  let gameState: GameState | null = null;
  
  // GameState is reactive, passed to DebugMenu
  $: if (gameState) {
    // DebugMenu will reactively update when gameState changes
  }
</script>

<DebugMenu bind:gameState={gameState} />
```

### Integration Points

1. **GameState Prop**: DebugMenu receives `gameState` from parent
   - Parent manages gameState lifecycle
   - DebugMenu reads current values and triggers updates via service calls
   - Updates flow back through reactive system

2. **Service Calls**: DebugMenu calls `gameStateService` methods
   - All service calls are async (Promise-based)
   - Errors handled within DebugMenu component
   - Success/error state displayed inline

3. **Keyboard Shortcuts**: Global keyboard listener in parent or DebugMenu
   - F12 key opens menu (when not in input field)
   - Escape key closes menu (handled in DebugMenu)
   - Focus management handled by DebugMenu

## Component Removal Contracts

### InventoryZone.svelte Changes

**Removed Props** (if any):
- None (Add Decks/Chaos were internal, not props)

**Removed Functions**:
- `handleAddDecks()` - Move to DebugMenu
- `handleAddChaos()` - Move to DebugMenu
- `isAddDecksCell(cellIndex: number): boolean` - Remove
- `isAddChaosCell(cellIndex: number): boolean` - Remove

**Removed Constants**:
- `ADD_DECKS_POS` - Remove
- `ADD_CHAOS_POS` - Remove

**Removed UI Elements**:
- Add Decks button grid cell
- Add Chaos button grid cell

### UpgradeShop.svelte Changes

**Removed State**:
- `debugModeEnabled: boolean` - Move to DebugMenu
- `raritySliderValue: number` - Move to DebugMenu
- `isDraggingRaritySlider: boolean` - Move to DebugMenu
- `luckyDropSliderValue: number` - Move to DebugMenu
- `isDraggingLuckyDropSlider: boolean` - Move to DebugMenu

**Removed Functions**:
- `toggleDebugMode()` - Move to DebugMenu
- `handleRaritySliderChange(event: Event)` - Move to DebugMenu
- `handleRaritySliderInput(event: Event)` - Move to DebugMenu
- `handleLuckyDropSliderChange(event: Event)` - Move to DebugMenu
- `handleLuckyDropSliderInput(event: Event)` - Move to DebugMenu

**Removed Reactive Statements**:
- `showRaritySlider` - Remove (always show in debug menu)
- `showLuckyDropSlider` - Remove (always show in debug menu)

**Removed UI Elements**:
- Debug mode toggle button
- Rarity slider section
- Lucky drop slider section

## Validation Contracts

### Input Validation

1. **Rarity Slider**:
   - Value must be number
   - Range: 0-10000 (inclusive)
   - Step: 1
   - Invalid values: Reject and show error

2. **Lucky Drop Slider**:
   - Value must be number
   - Range: 0-10 (inclusive)
   - Step: 1
   - Invalid values: Reject and show error

3. **Add Chaos/Decks**:
   - Amount must be positive number
   - Default: 10
   - Invalid values: Use default or show error

### Error Handling Contracts

```typescript
interface ErrorHandling {
  /**
   * All service calls must handle errors
   * Display error message inline with tool
   * Log to console for debugging
   * Clear error on successful operation
   */
  handleError(error: Error | unknown): void;
  
  /**
   * Error messages must be user-friendly
   * Avoid technical jargon
   * Provide actionable information when possible
   */
  formatErrorMessage(error: Error | unknown): string;
}
```

## Accessibility Contracts

### Keyboard Navigation

```typescript
interface KeyboardNavigation {
  /**
   * F12: Open debug menu (when trigger visible)
   * Escape: Close debug menu (when menu open)
   * Tab: Navigate between tools within menu
   * Enter/Space: Activate focused tool
   * Arrow keys: Navigate sliders (existing pattern)
   */
  handleKeyboardNavigation(event: KeyboardEvent): void;
}
```

### ARIA Attributes

```html
<!-- Debug Menu Trigger Button -->
<button
  aria-label="Open debug menu"
  aria-expanded="false"
  aria-controls="debug-menu"
  tabindex="0"
>
  Debug Menu
</button>

<!-- Debug Menu Modal -->
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="debug-menu-title"
  aria-describedby="debug-menu-description"
  tabindex="-1"
>
  <h2 id="debug-menu-title">Debug Menu</h2>
  <p id="debug-menu-description">Developer tools for testing and debugging</p>
  <!-- Tools -->
</div>
```

## Performance Contracts

### Response Time Requirements

- Menu open: <200ms (PERF-001)
- Menu close: <200ms (PERF-002)
- Tool interaction: <100ms (PERF-003)
- No frame rate drops when menu open (PERF-004)
- Memory usage: <5MB when menu open (PERF-005)

### Optimization Requirements

- Lazy load debug menu content (only render when open)
- Debounce slider inputs (existing pattern: 100ms delay)
- Minimize re-renders (use Svelte reactivity efficiently)
- No unnecessary service calls (only call on user action)


