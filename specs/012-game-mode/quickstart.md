# Quickstart Guide: Game Mode Selection

**Feature**: Game Mode Selection (012-game-mode)  
**Date**: 2025-01-27

## Overview

The Game Mode Selection feature allows players to choose from four different game modes before starting the game. Each mode configures different starting conditions (decks, chaos, upgrades, shop availability) and gameplay mechanics.

## Quick Reference

### Game Modes

1. **Classic**: Unlimited decks, no shop, no upgrades
2. **Ruthless**: Limited decks (5), low chaos (25), buy decks with chaos, no shop, no upgrades
3. **Give me my Dopamine**: High decks (75), high chaos (750), increased rarity (25%), lucky drop level 1, only Rarity/Luck upgrades
4. **Stacked Deck Clicker**: Limited decks (10), zero chaos, full shop, all upgrades

### Key Files

- `src/lib/services/gameModeService.ts` - Game mode management service
- `src/lib/components/GameModeSelection.svelte` - Mode selection UI component
- `src/lib/models/GameMode.ts` - Game mode type definitions
- `src/routes/+page.svelte` - Main page (integrates mode selection)
- `src/lib/utils/defaultGameState.ts` - Modified to accept mode configuration

## Architecture

### Service Layer

```
GameModeService
  ├── Mode configuration storage
  ├── Mode selection persistence (localStorage)
  ├── Mode configuration application
  └── Integration with GameStateService
```

### Component Layer

```
GameModeSelection.svelte
  ├── Displays available modes
  ├── Handles user selection
  ├── Shows confirmation dialog (for mode changes)
  └── Emits selection events

UpgradeShop.svelte (modified)
  ├── Filters upgrades based on mode
  └── Conditionally renders based on mode

GameAreaLayout.svelte (modified)
  └── Conditionally shows/hides shop zone
```

### Data Flow

```
Application Start
  → Check localStorage for 'gameMode'
  → If null: Show GameModeSelection
  → If set: Load mode configuration
  → Apply mode to game state initialization
  → Initialize game state with mode values
  → Load game area
```

## Development Workflow

### 1. Setting Up Game Mode Service

```typescript
import { gameModeService } from '$lib/services/gameModeService.js';

// Get current mode
const currentMode = gameModeService.getCurrentModeId();

// Get mode configuration
const config = gameModeService.getModeConfiguration('classic');

// Check if shop is enabled
const shopEnabled = gameModeService.isShopEnabled();
```

### 2. Creating Game Mode Selection Component

```svelte
<script lang="ts">
  import { gameModeService } from '$lib/services/gameModeService.js';
  import type { GameModeId } from '$lib/models/GameMode.js';

  let selectedMode: GameModeId | null = null;
  let showConfirmation = false;

  const modes = gameModeService.getAvailableModes();

  function handleModeSelect(modeId: GameModeId) {
    selectedMode = modeId;
    // Show confirmation if changing mode mid-session
    if (hasExistingGameState()) {
      showConfirmation = true;
    } else {
      confirmSelection();
    }
  }

  function confirmSelection() {
    if (selectedMode) {
      gameModeService.setMode(selectedMode);
      gameModeService.applyModeConfiguration(selectedMode);
      // Trigger game initialization
      dispatch('mode:selected', { modeId: selectedMode });
    }
  }
</script>
```

### 3. Integrating with Game Initialization

```typescript
// In +page.svelte onMount()
async function initializeGame() {
  const savedMode = gameModeService.getCurrentModeId();
  
  if (!savedMode) {
    // Show mode selection screen
    showModeSelection = true;
    return;
  }
  
  // Apply mode configuration
  gameModeService.applyModeConfiguration(savedMode);
  
  // Initialize game state with mode
  await gameStateService.initialize(savedMode);
  
  isLoading = false;
}
```

### 4. Filtering Upgrades by Mode

```svelte
<!-- In UpgradeShop.svelte -->
<script lang="ts">
  import { gameModeService } from '$lib/services/gameModeService.js';

  $: currentMode = gameModeService.getCurrentMode();
  $: allowedTypes = currentMode?.allowedUpgrades ?? [];
  $: availableUpgrades = gameState
    ? upgradeService.getAvailableUpgrades(gameState.upgrades)
        .filter(upgrade => allowedTypes.includes(upgrade.type))
    : [];
</script>
```

### 5. Implementing Deck Purchase (Ruthless Mode)

```typescript
// In gameStateService.ts
async purchaseDecks(chaosCost: number, deckCount: number): Promise<void> {
  const state = this.getGameState();
  
  // Validate current mode allows deck purchases
  const mode = gameModeService.getCurrentMode();
  if (!mode || mode.id !== 'ruthless') {
    throw new Error('Deck purchases only available in Ruthless mode');
  }
  
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

## Testing Guide

### Unit Tests

```typescript
// gameModeService.test.ts
import { gameModeService } from './gameModeService.js';

describe('GameModeService', () => {
  it('should return null when no mode is selected', () => {
    expect(gameModeService.getCurrentModeId()).toBeNull();
  });

  it('should get mode configuration', () => {
    const config = gameModeService.getModeConfiguration('classic');
    expect(config.startingDecks).toBe('unlimited');
    expect(config.shopEnabled).toBe(false);
  });

  it('should set and persist mode', () => {
    gameModeService.setMode('ruthless');
    expect(gameModeService.getCurrentModeId()).toBe('ruthless');
    // Verify localStorage
    expect(localStorage.getItem('gameMode')).toBe('ruthless');
  });
});
```

### Integration Tests

```typescript
// gameModeSelection.test.ts
import { render, fireEvent } from '@testing-library/svelte';
import GameModeSelection from './GameModeSelection.svelte';

describe('GameModeSelection', () => {
  it('should show all four game modes', () => {
    const { getByText } = render(GameModeSelection, { isVisible: true });
    expect(getByText('Classic')).toBeTruthy();
    expect(getByText('Ruthless')).toBeTruthy();
    expect(getByText('Give me my Dopamine')).toBeTruthy();
    expect(getByText('Stacked Deck Clicker')).toBeTruthy();
  });

  it('should emit mode:selected when mode is selected', async () => {
    const { component, getByText } = render(GameModeSelection, { isVisible: true });
    const handler = vi.fn();
    component.$on('mode:selected', handler);
    
    await fireEvent.click(getByText('Classic'));
    await fireEvent.click(getByText('Confirm'));
    
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { modeId: 'classic' } })
    );
  });
});
```

### E2E Tests

```typescript
// game-mode-selection.spec.ts
import { test, expect } from '@playwright/test';

test('should show mode selection on first visit', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=Select Game Mode')).toBeVisible();
});

test('should initialize Classic mode correctly', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Classic');
  await page.click('text=Confirm');
  
  // Verify unlimited decks
  const deckCount = await page.locator('.deck-count-badge').textContent();
  expect(deckCount).toBe('∞');
  
  // Verify shop is hidden
  await expect(page.locator('.upgrade-store-zone')).not.toBeVisible();
});

test('should persist mode selection', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Stacked Deck Clicker');
  await page.click('text=Confirm');
  
  // Reload page
  await page.reload();
  
  // Should not show selection screen
  await expect(page.locator('text=Select Game Mode')).not.toBeVisible();
  
  // Should show shop
  await expect(page.locator('.upgrade-store-zone')).toBeVisible();
});
```

## Common Tasks

### Adding a New Game Mode

1. Add mode ID to `GameModeId` type:
```typescript
type GameModeId = 'classic' | 'ruthless' | 'dopamine' | 'stacked-deck-clicker' | 'new-mode';
```

2. Add mode configuration to `GameModeService`:
```typescript
const newModeConfig: GameMode = {
  id: 'new-mode',
  name: 'New Mode',
  description: 'Description of new mode',
  startingDecks: 20,
  startingChaos: 100,
  shopEnabled: true,
  allowedUpgrades: ['improvedRarity', 'luckyDrop'],
  initialUpgradeLevels: new Map(),
  customRarityPercentage: undefined
};
```

3. Add mode to `getAvailableModes()` array

### Changing Mode Configuration Values

Edit mode configuration in `gameModeService.ts`:
```typescript
const classicMode: GameMode = {
  // ... update values here
  startingDecks: 'unlimited', // Change if needed
  startingChaos: 0, // Change if needed
};
```

### Debugging Mode Selection

```typescript
// Check current mode
console.log('Current mode:', gameModeService.getCurrentModeId());

// Check mode configuration
const mode = gameModeService.getCurrentMode();
console.log('Mode config:', mode);

// Check localStorage
console.log('Stored mode:', localStorage.getItem('gameMode'));

// Clear mode (for testing)
gameModeService.clearMode();
```

## Troubleshooting

### Mode Selection Screen Not Appearing

- **Check localStorage**: Verify `'gameMode'` key is not set
- **Check component visibility**: Ensure `isVisible` prop is `true`
- **Check initialization flow**: Verify `+page.svelte` checks for mode before initializing

### Mode Configuration Not Applied

- **Check mode application**: Verify `applyModeConfiguration()` is called before `gameStateService.initialize()`
- **Check game state creation**: Verify `createDefaultGameState()` receives mode parameter
- **Check infinite decks**: Verify `setInfiniteDecks()` is called for Classic mode

### Upgrades Not Filtering Correctly

- **Check mode configuration**: Verify `allowedUpgrades` array is correct
- **Check component filtering**: Verify `UpgradeShop` filters by `allowedUpgrades`
- **Check reactive statements**: Verify Svelte reactivity is working

### Deck Purchase Not Working

- **Check mode**: Verify current mode is 'ruthless'
- **Check chaos balance**: Verify player has sufficient chaos
- **Check method availability**: Verify `purchaseDecks()` is implemented in `gameStateService`

### Mode Not Persisting

- **Check localStorage**: Verify write is successful
- **Check storage errors**: Check browser console for storage errors
- **Check private browsing**: Some browsers restrict localStorage in private mode

## Performance Considerations

- **Mode selection screen**: Should render in <100ms
- **Mode configuration application**: Should complete in <500ms
- **Game state initialization**: Should complete in <3s total
- **localStorage operations**: Should complete in <10ms each

## Accessibility

- **Keyboard navigation**: All mode options must be keyboard accessible
- **Screen readers**: Mode descriptions must be announced
- **Focus management**: Focus should move to selected mode on confirmation
- **ARIA labels**: All interactive elements must have appropriate labels

## Future Enhancements

- **Mode-specific achievements**: Track achievements per mode
- **Mode statistics**: Track playtime and progress per mode
- **Custom modes**: Allow players to create custom mode configurations
- **Mode recommendations**: Suggest modes based on player preferences

