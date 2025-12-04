# Research: Game Mode Selection

**Feature**: Game Mode Selection  
**Date**: 2025-01-27  
**Phase**: 0 - Research

## Overview

This document resolves all NEEDS CLARIFICATION items from the implementation plan and documents research decisions for implementing game mode selection.

## Research Decisions

### 1. Unlimited Decks Implementation (Classic Mode)

**Decision**: Use the existing `infiniteDecksEnabled` flag mechanism in `gameStateService`.

**Rationale**: 
- The codebase already has a well-tested infinite decks mechanism via `gameStateService.setInfiniteDecks()` and `gameStateService.isInfiniteDecksEnabled()`
- This flag is stored in localStorage as `'infiniteDecksEnabled'`
- The `openDeck()` method already checks this flag and skips deck decrement when enabled
- `InventoryZone` component already displays '∞' when infinite decks is enabled
- Reusing existing infrastructure reduces complexity and maintenance burden

**Implementation Approach**:
- Classic mode will call `gameStateService.setInfiniteDecks(true)` during initialization
- Other modes will call `gameStateService.setInfiniteDecks(false)` to ensure limited decks
- No new infrastructure needed - leverage existing mechanism

**Alternatives Considered**:
- **Special deck count value (e.g., -1)**: Rejected because it requires changes to validation logic and type handling
- **Separate unlimited flag per mode**: Rejected because it duplicates existing functionality unnecessarily

---

### 2. Purchasing Decks with Chaos (Ruthless Mode)

**Decision**: Add a new method `purchaseDecks(chaosCost: number, deckCount: number)` to `gameStateService`, following the pattern of `purchaseUpgrade()`.

**Rationale**:
- Consistent with existing purchase patterns (`purchaseUpgrade`, `purchaseCustomization`)
- Centralizes game state updates and validation
- Follows existing error handling patterns (`InsufficientResourcesError`)
- Can reuse existing `updateGameState()` mechanism for atomic updates

**Implementation Approach**:
```typescript
async purchaseDecks(chaosCost: number, deckCount: number): Promise<void> {
  const state = this.getGameState();
  
  if (state.score < chaosCost) {
    throw new InsufficientResourcesError(
      ERROR_MESSAGES.INSUFFICIENT_SCORE,
      'INSUFFICIENT_SCORE'
    );
  }
  
  await this.updateGameState((s) => ({
    ...s,
    score: s.score - chaosCost,
    decks: s.decks + deckCount
  }), true);
}
```

**Pricing Strategy**:
- Base cost: 10 chaos per deck (configurable per mode)
- Can be displayed in UI as a purchase button in InventoryZone or a dedicated shop area
- Ruthless mode will show this purchase option when shop is disabled

**Alternatives Considered**:
- **Extend purchaseUpgrade system**: Rejected because decks are not upgrades and have different semantics
- **Component-level purchase logic**: Rejected because it bypasses service layer validation and state management

---

### 3. Filtering Available Upgrades Based on Game Mode

**Decision**: Filter upgrades at the component level in `UpgradeShop.svelte` using a reactive statement that filters `availableUpgrades` based on current game mode.

**Rationale**:
- `upgradeService.getAvailableUpgrades()` returns all upgrades - filtering at component level is simpler
- Game mode is a UI concern, not a service concern
- Component-level filtering allows easy conditional rendering
- No changes needed to upgrade service, maintaining separation of concerns

**Implementation Approach**:
```typescript
// In UpgradeShop.svelte
import { gameModeService } from '../services/gameModeService.js';

$: currentGameMode = gameModeService.getCurrentMode();
$: allowedUpgradeTypes = currentGameMode?.allowedUpgrades ?? [];
$: availableUpgrades = gameState 
  ? upgradeService.getAvailableUpgrades(gameState.upgrades)
      .filter(upgrade => allowedUpgradeTypes.includes(upgrade.type))
  : [];
```

**Mode-Specific Allowed Upgrades**:
- **Classic**: `[]` (empty - no upgrades)
- **Ruthless**: `[]` (empty - no upgrades)
- **Give me my Dopamine**: `['improvedRarity', 'luckyDrop']`
- **Stacked Deck Clicker**: `['autoOpening', 'improvedRarity', 'luckyDrop', 'multidraw', 'deckProduction', 'sceneCustomization']` (all)

**Alternatives Considered**:
- **Service-level filtering**: Rejected because it couples game mode logic to upgrade service unnecessarily
- **Separate upgrade service method**: Rejected because it duplicates logic and adds complexity

---

### 4. Game Mode Storage Location

**Decision**: Store game mode selection in a separate localStorage key `'gameMode'` (string value), independent of game state storage.

**Rationale**:
- Game mode selection is a user preference, not game state
- Separating from game state allows mode changes without affecting saved game data structure
- localStorage is simpler than IndexedDB for a single string value
- Matches pattern used for `'infiniteDecksEnabled'` flag
- Game mode persists even when game state is reset

**Storage Format**:
```typescript
// Store mode ID as string
localStorage.setItem('gameMode', 'classic' | 'ruthless' | 'dopamine' | 'stacked-deck-clicker');

// Load on initialization
const savedMode = localStorage.getItem('gameMode') as GameModeId | null;
```

**Implementation Approach**:
- `gameModeService` will handle localStorage read/write
- Default to `null` if no mode selected (shows selection screen)
- Validate stored mode on load (handle invalid/corrupted data gracefully)

**Alternatives Considered**:
- **Store in game state**: Rejected because mode change should reset game state, not preserve it
- **Store in IndexedDB**: Rejected because it's overkill for a single string value and adds async complexity

---

### 5. Mode Change Mid-Session Handling

**Decision**: Show a confirmation dialog when changing game mode mid-session, warning that all progress will be reset. On confirmation, reset game state and apply new mode configuration.

**Rationale**:
- Prevents accidental data loss
- Provides clear user feedback about consequences
- Follows existing pattern (see `showResetConfirmation` in `+page.svelte`)
- Allows users to cancel if they change their mind

**Implementation Approach**:
```typescript
// In GameModeSelection component or +page.svelte
let showModeChangeConfirmation = false;
let pendingModeChange: GameModeId | null = null;

function handleModeChangeRequest(newMode: GameModeId) {
  if (hasExistingGameState()) {
    pendingModeChange = newMode;
    showModeChangeConfirmation = true;
  } else {
    applyModeChange(newMode);
  }
}

async function confirmModeChange() {
  if (pendingModeChange) {
    // Clear game state
    await storageService.clearAll();
    // Apply new mode
    await gameModeService.setMode(pendingModeChange);
    // Reinitialize game
    await gameStateService.initialize();
    showModeChangeConfirmation = false;
    pendingModeChange = null;
  }
}
```

**Dialog Content**:
- Title: "Change Game Mode?"
- Message: "Changing game mode will reset all your progress (score, decks, upgrades, collection). Are you sure you want to continue?"
- Buttons: "Cancel" and "Change Mode"

**Alternatives Considered**:
- **Immediate reset without confirmation**: Rejected because it risks accidental data loss
- **Preserve game state across modes**: Rejected because different modes have incompatible starting conditions

---

## Additional Research Findings

### Game State Initialization Flow

Current flow in `+page.svelte`:
1. `onMount()` → `gameStateService.initialize()`
2. `gameStateService.initialize()` → `createDefaultGameState()` (immediate)
3. Then loads from storage asynchronously

**New Flow with Game Mode**:
1. `onMount()` → Check for saved game mode
2. If no mode selected → Show `GameModeSelection` component
3. After mode selected → `gameModeService.applyModeConfiguration(mode)` → `gameStateService.initialize()`
4. `gameStateService.initialize()` → `createDefaultGameState(mode)` (pass mode for configuration)

### Shop Visibility Control

Current implementation:
- `UpgradeStoreZone` is always rendered in `GameAreaLayout` if blue zone exists
- Shop visibility controlled by zone layout, not conditional rendering

**New Approach**:
- Add conditional rendering in `GameAreaLayout` or `+page.svelte` based on game mode
- Check `gameModeService.isShopEnabled()` before rendering `UpgradeStoreZone`
- Classic and Ruthless modes: Hide shop zone entirely
- Give me my Dopamine and Stacked Deck Clicker: Show shop zone

### Upgrade Initialization with Pre-set Levels

For "Give me my Dopamine" mode, `luckyDrop` upgrade needs to start at level 1.

**Approach**:
- Modify `createDefaultGameState()` to accept optional mode configuration
- Or create mode-specific initialization functions
- Set `luckyDrop.level = 1` during state creation for dopamine mode
- Other upgrades remain at level 0

### Rarity Base Increase

For "Give me my Dopamine" mode, base rarity percentage needs to be increased.

**Approach**:
- Set `customRarityPercentage` in game state during initialization
- Use existing `customRarityPercentage` field in `GameState` interface
- Set to 20-30% (configurable) for dopamine mode
- This overrides level-based calculation (see `cardService.drawCard()`)

---

## Summary

All NEEDS CLARIFICATION items resolved:

1. ✅ **Unlimited decks**: Use existing `infiniteDecksEnabled` flag mechanism
2. ✅ **Deck purchase mechanism**: Add `purchaseDecks()` method to `gameStateService`
3. ✅ **Upgrade filtering**: Filter at component level in `UpgradeShop.svelte`
4. ✅ **Mode storage**: Use separate localStorage key `'gameMode'`
5. ✅ **Mode change handling**: Show confirmation dialog, then reset state and apply new mode

**Next Steps**: Proceed to Phase 1 (Design & Contracts) with these decisions documented.

