# Data Model: Debug Menu

**Feature**: Debug Menu (011-debug-menu)  
**Date**: 2025-01-27

## Overview

The debug menu feature primarily involves UI state management rather than complex data models. The menu consolidates existing debug tools without introducing new data structures. However, the menu component needs to manage its own state and interact with existing game state services.

## Entities

### DebugMenuState

**Purpose**: Manages the open/closed state and visibility of the debug menu.

**Fields**:
- `isOpen: boolean` - Whether the debug menu is currently visible
  - Default: `false`
  - Updated by: User actions (open/close triggers)
  
- `isVisible: boolean` - Whether the debug menu trigger button should be visible
  - Default: `import.meta.env.DEV` (development mode)
  - Updated by: Environment detection, localStorage flag (optional)
  - Validation: Must be `true` in development or when explicitly enabled

**State Transitions**:
```
Closed (isOpen: false) → [User clicks trigger/F12] → Open (isOpen: true)
Open (isOpen: true) → [User clicks close/Escape/backdrop] → Closed (isOpen: false)
```

**Relationships**:
- No persistent storage required (ephemeral UI state)
- May read from `localStorage` for optional production enablement flag

### DebugToolState (Per Tool)

**Purpose**: Manages state for individual debug tools within the menu.

**Fields** (inherited from existing implementations):

1. **Add Chaos/Decks Buttons**:
   - No local state (direct service calls)
   - Error state: `errorMessage: string | null`

2. **Rarity Slider**:
   - `raritySliderValue: number` - Current slider value (0-10000)
   - `isDraggingRaritySlider: boolean` - Whether user is actively dragging
   - `currentRarityPercentage: number` - Computed from gameState or custom value
   - Error state: `errorMessage: string | null`

3. **Lucky Drop Slider**:
   - `luckyDropSliderValue: number` - Current slider value (0-10)
   - `isDraggingLuckyDropSlider: boolean` - Whether user is actively dragging
   - `currentLuckyDropLevel: number` - Computed from gameState
   - Error state: `errorMessage: string | null`

4. **Debug Mode Toggle**:
   - `debugModeEnabled: boolean` - Whether debug mode is active
   - Default: `false`
   - Updated by: Toggle button click

**State Transitions**:
- Sliders: User input → `isDragging: true` → Service call → State update → `isDragging: false`
- Toggle: Click → `debugModeEnabled = !debugModeEnabled`
- Buttons: Click → Service call → Success/Error state

**Relationships**:
- All tools interact with `gameStateService` (existing service)
- Tools read from `gameState: GameState` (reactive prop)
- Tools may trigger `gameState` updates via service calls

## Data Flow

### Opening Debug Menu
```
User Action (F12/Button Click)
  → DebugMenu.isOpen = true
  → Focus first interactive element
  → Render all debug tools
```

### Using Debug Tool
```
User Interaction (button click, slider change, toggle)
  → Tool handler function
  → gameStateService method call
  → GameState update (reactive)
  → UI update (Svelte reactivity)
  → Success/Error feedback
```

### Closing Debug Menu
```
User Action (Escape/Close/Backdrop)
  → DebugMenu.isOpen = false
  → Return focus to trigger button
  → Cleanup (if needed)
```

## Validation Rules

### DebugMenuState
- `isOpen` must be boolean
- `isVisible` must be boolean
- Menu can only be open if `isVisible === true` (defensive check)

### DebugToolState
- **Rarity Slider**: Value must be between 0 and 10000 (inclusive)
- **Lucky Drop Slider**: Value must be between 0 and 10 (inclusive)
- **Error Messages**: Must be string or null, cleared on successful operation

## Dependencies

### External Services
- `gameStateService`: 
  - `addChaos(amount: number): Promise<void>`
  - `addDecks(amount: number): Promise<void>`
  - `setCustomRarityPercentage(percentage: number, allowDebug: boolean): Promise<void>`
  - `setLuckyDropLevel(level: number): Promise<void>`

### External State
- `gameState: GameState` - Reactive prop from parent component
  - Used to read current values (decks, chaos, rarity, lucky drop level)
  - Updated by service calls, triggers reactive updates

### External Stores (if needed)
- No new stores required
- May use existing stores if needed for cross-component communication

## Persistence

### Ephemeral State (No Persistence)
- `DebugMenuState.isOpen` - Resets to `false` on page reload
- `DebugToolState` (slider values, toggle state) - Resets to gameState values on menu open
- Error messages - Cleared on operation success or menu close

### Optional Persistence
- `isVisible` flag: May be stored in `localStorage` as `debugMenuEnabled` for production debugging
  - Format: `localStorage.setItem('debugMenuEnabled', 'true' | 'false')`
  - Not required for MVP, can be added later

## Migration Considerations

### From InventoryZone
- Remove `ADD_DECKS_POS`, `ADD_CHAOS_POS` constants
- Remove `isAddDecksCell()`, `isAddChaosCell()` functions
- Remove `handleAddDecks()`, `handleAddChaos()` functions (move to DebugMenu)
- Remove grid cells for Add Decks/Chaos buttons

### From UpgradeShop
- Remove `debugModeEnabled` state (move to DebugMenu)
- Remove `toggleDebugMode()` function (move to DebugMenu)
- Remove `raritySliderValue`, `isDraggingRaritySlider` state (move to DebugMenu)
- Remove `luckyDropSliderValue`, `isDraggingLuckyDropSlider` state (move to DebugMenu)
- Remove `handleRaritySliderChange()`, `handleLuckyDropSliderChange()` functions (move to DebugMenu)
- Remove rarity/lucky drop slider UI sections
- Remove debug mode toggle button

## Notes

- All debug tool state is derived from or updates `gameState`
- No new database tables or persistent storage structures required
- State management uses Svelte's reactive system
- Error handling follows existing patterns (errorMessage state)


