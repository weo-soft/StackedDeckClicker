# Quickstart: Debug Menu

**Feature**: Debug Menu (011-debug-menu)  
**Date**: 2025-01-27

## Overview

The Debug Menu consolidates all debugging tools into a single accessible location. It replaces scattered debug controls (Add Chaos, Add Decks, Rarity slider, Lucky Drop slider, Debug mode toggle) with a unified modal interface.

## Quick Reference

### Opening the Debug Menu

- **Keyboard**: Press `F12` (when not in an input field)
- **Mouse**: Click the "Debug Menu" button (visible in development mode)
- **Visibility**: Menu trigger is visible when `import.meta.env.DEV === true`

### Available Debug Tools

1. **Add Chaos** - Adds 10 chaos orbs to player score
2. **Add Decks** - Adds 10 decks to player inventory
3. **Rarity Slider** - Adjust rarity percentage (0-10000%)
4. **Lucky Drop Slider** - Adjust lucky drop level (0-10)
5. **Debug Mode Toggle** - Enable/disable debug mode

### Closing the Debug Menu

- Press `Escape` key
- Click the close button (×)
- Click outside the menu (backdrop)

## Architecture

### Component Structure

```
DebugMenu.svelte (new)
├── Resources Section
│   ├── Add Chaos button
│   └── Add Decks button
├── Upgrades Section
│   ├── Rarity slider
│   └── Lucky Drop slider
└── Settings Section
    └── Debug Mode toggle
```

### Integration Points

- **Parent Component**: `src/routes/+page.svelte`
  - Renders DebugMenu component
  - Passes `gameState` prop
  
- **Services Used**: `src/lib/services/gameStateService.ts`
  - `addChaos(amount)`
  - `addDecks(amount)`
  - `setCustomRarityPercentage(percentage, allowDebug)`
  - `setLuckyDropLevel(level)`

- **Components Modified**:
  - `src/lib/components/InventoryZone.svelte` - Remove Add Decks/Chaos buttons
  - `src/lib/components/UpgradeShop.svelte` - Remove debug toggle and sliders

## Development Workflow

### 1. Create DebugMenu Component

**File**: `src/lib/components/DebugMenu.svelte`

```svelte
<script lang="ts">
  import { gameStateService } from '$lib/services/gameStateService.js';
  import type { GameState } from '$lib/models/GameState.js';
  
  export let gameState: GameState | null = null;
  
  let isOpen = false;
  let isVisible = import.meta.env.DEV;
  
  // Tool state (move from UpgradeShop)
  let debugModeEnabled = false;
  let raritySliderValue = 0;
  let luckyDropSliderValue = 0;
  // ... other state
  
  function open() {
    isOpen = true;
    // Focus first element
  }
  
  function close() {
    isOpen = false;
    // Return focus
  }
  
  // Keyboard handler
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && isOpen) {
      close();
    }
  }
  
  // Tool handlers (move from InventoryZone/UpgradeShop)
  async function handleAddChaos() {
    // ... implementation
  }
  // ... other handlers
</script>

{#if isVisible}
  <!-- Trigger button -->
  <button on:click={open}>Debug Menu</button>
{/if}

{#if isOpen}
  <div class="modal-overlay" on:click|self={close} on:keydown={handleKeyDown}>
    <div class="modal-content">
      <!-- Menu content -->
    </div>
  </div>
{/if}
```

### 2. Integrate in +page.svelte

**File**: `src/routes/+page.svelte`

```svelte
<script>
  import DebugMenu from '$lib/components/DebugMenu.svelte';
  // ... other imports
  
  let gameState: GameState | null = null;
  // ... other state
</script>

<main>
  <!-- Existing game UI -->
  
  <DebugMenu bind:gameState={gameState} />
</main>
```

### 3. Remove Debug Tools from Original Locations

**File**: `src/lib/components/InventoryZone.svelte`

```svelte
// Remove these:
// - ADD_DECKS_POS constant
// - ADD_CHAOS_POS constant
// - isAddDecksCell() function
// - isAddChaosCell() function
// - handleAddDecks() function
// - handleAddChaos() function
// - Grid cells for Add Decks/Chaos buttons
```

**File**: `src/lib/components/UpgradeShop.svelte`

```svelte
// Remove these:
// - debugModeEnabled state
// - toggleDebugMode() function
// - raritySliderValue, isDraggingRaritySlider state
// - luckyDropSliderValue, isDraggingLuckyDropSlider state
// - handleRaritySliderChange(), handleRaritySliderInput() functions
// - handleLuckyDropSliderChange(), handleLuckyDropSliderInput() functions
// - showRaritySlider, showLuckyDropSlider reactive statements
// - Debug mode toggle button UI
// - Rarity slider section UI
// - Lucky drop slider section UI
```

### 4. Add Global Keyboard Listener (Optional)

**File**: `src/routes/+page.svelte` or `DebugMenu.svelte`

```svelte
<script>
  import { onMount } from 'svelte';
  
  function handleGlobalKeyDown(event: KeyboardEvent) {
    // Only handle F12 when not in input field
    if (event.key === 'F12' && 
        event.target instanceof HTMLElement && 
        event.target.tagName !== 'INPUT' && 
        event.target.tagName !== 'TEXTAREA') {
      event.preventDefault();
      openDebugMenu();
    }
  }
  
  onMount(() => {
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  });
</script>
```

## Testing

### Unit Tests

**File**: `tests/unit/components/DebugMenu.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import DebugMenu from '$lib/components/DebugMenu.svelte';

describe('DebugMenu', () => {
  it('opens when trigger is clicked', async () => {
    const { getByLabelText, queryByRole } = render(DebugMenu, {
      props: { gameState: mockGameState }
    });
    
    const trigger = getByLabelText('Open debug menu');
    await fireEvent.click(trigger);
    
    expect(queryByRole('dialog')).toBeTruthy();
  });
  
  it('closes when Escape is pressed', async () => {
    // ... test implementation
  });
  
  // ... more tests
});
```

### Integration Tests

**File**: `tests/integration/debugMenu.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import DebugMenu from '$lib/components/DebugMenu.svelte';
import { gameStateService } from '$lib/services/gameStateService.js';

describe('DebugMenu Integration', () => {
  it('adds chaos when Add Chaos button is clicked', async () => {
    const addChaosSpy = vi.spyOn(gameStateService, 'addChaos');
    
    const { getByLabelText } = render(DebugMenu, {
      props: { gameState: mockGameState }
    });
    
    // Open menu, click Add Chaos
    // ... implementation
    
    await waitFor(() => {
      expect(addChaosSpy).toHaveBeenCalledWith(10);
    });
  });
  
  // ... more integration tests
});
```

### E2E Tests

**File**: `tests/e2e/debug-menu.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test('debug menu workflow', async ({ page }) => {
  await page.goto('/');
  
  // Open debug menu
  await page.keyboard.press('F12');
  await expect(page.getByRole('dialog')).toBeVisible();
  
  // Use Add Chaos tool
  await page.getByLabel('Add 10 Chaos').click();
  // Verify game state updated
  
  // Close menu
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});
```

## Common Tasks

### Adding a New Debug Tool

1. Add tool state to `DebugMenu.svelte`
2. Add tool handler function
3. Add tool UI in appropriate section (Resources/Upgrades/Settings)
4. Add tests for new tool
5. Update documentation

### Changing Keyboard Shortcut

1. Update `handleGlobalKeyDown` function
2. Update ARIA `aria-keyshortcuts` attribute
3. Update documentation
4. Update tests

### Enabling Menu in Production

1. Set `localStorage.setItem('debugMenuEnabled', 'true')`
2. Update `isVisible` logic to check localStorage
3. Add UI indicator that debug mode is enabled

## Troubleshooting

### Menu Doesn't Open

- Check `import.meta.env.DEV` is `true` (development mode)
- Verify keyboard listener is attached
- Check console for errors
- Verify trigger button is visible

### Tools Don't Work

- Verify `gameState` prop is passed correctly
- Check service calls are working (console logs)
- Verify error handling displays errors
- Check gameState updates are reactive

### Keyboard Navigation Issues

- Verify focus trap is implemented
- Check ARIA attributes are correct
- Test with screen reader
- Verify Escape key handler is attached

### Visual Issues

- Check modal CSS classes match existing modals
- Verify z-index is higher than other modals (2001+)
- Check responsive design on small screens
- Verify backdrop click handler works

## Next Steps

1. Review [spec.md](./spec.md) for complete requirements
2. Review [data-model.md](./data-model.md) for data structures
3. Review [contracts/component-interfaces.md](./contracts/component-interfaces.md) for API contracts
4. Create tasks using `/speckit.tasks` command
5. Begin implementation following this quickstart


