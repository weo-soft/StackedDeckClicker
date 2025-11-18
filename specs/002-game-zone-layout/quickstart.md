# Quick Start: Game Area Zone Layout

**Feature**: Game Area Zone Layout  
**Date**: 2025-01-27

## Overview

This feature reworks the game area from a single scene with overlay to a zone-based layout with five distinct functional zones. The implementation reorganizes existing components into a unified zone-based layout while preserving all existing functionality.

## Key Concepts

### Five Zones

1. **White Zone (Ambient Scene)**: Background/room where cards drop
2. **Yellow Zone (Card Drop Area)**: Logical area within white zone (not visually distinct)
3. **Blue Zone (Upgrade Store)**: Grid-like store for purchasing upgrades
4. **Orange Zone (State Information)**: Displays active buffs, upgrades, and state info
5. **Green Zone (Inventory)**: Main click area for opening decks, plus interactive upgrades

### Layout Proportions

- White zone: ~67% of left side (two-thirds)
- Right side zones: ~33% of total width
  - Blue zone: Top half of right side (~50% height)
  - Orange zone: Bottom quarter of right side (~25% height)
  - Green zone: Bottom quarter of right side (~25% height)

## Implementation Steps

### Step 1: Create Zone Layout Service

Create `src/lib/services/zoneLayoutService.ts`:

```typescript
import type { ZoneLayout, Zone, ZoneType, ZoneProportions, ZoneBoundary } from '../models/ZoneLayout.js';

export class ZoneLayoutService {
  initializeLayout(
    containerWidth: number,
    containerHeight: number,
    proportions?: ZoneProportions
  ): ZoneLayout {
    // Calculate zone positions and sizes based on proportions
    // Return ZoneLayout with all five zones
  }
  
  // ... other methods from service interface
}
```

### Step 2: Create Zone Models

Create `src/lib/models/ZoneLayout.ts`:

```typescript
export enum ZoneType {
  WHITE = 'white',
  YELLOW = 'yellow',
  BLUE = 'blue',
  ORANGE = 'orange',
  GREEN = 'green'
}

export interface Zone {
  type: ZoneType;
  x: number;
  y: number;
  width: number;
  height: number;
  // ... other fields
}

export interface ZoneLayout {
  zones: Map<ZoneType, Zone>;
  containerWidth: number;
  containerHeight: number;
  proportions: ZoneProportions;
}
```

### Step 3: Create Zone Components

Create zone wrapper components in `src/lib/components/`:

1. **GameAreaLayout.svelte** - Main container component
2. **AmbientSceneZone.svelte** - White zone wrapper
3. **UpgradeStoreZone.svelte** - Blue zone wrapper
4. **StateInfoZone.svelte** - Orange zone component
5. **InventoryZone.svelte** - Green zone component

### Step 4: Integrate with Main Page

Update `src/routes/+page.svelte`:

```svelte
<script>
  import GameAreaLayout from '$lib/components/GameAreaLayout.svelte';
  // ... other imports
</script>

<GameAreaLayout {gameState} on:deckOpen={handleOpenDeck} />
```

### Step 5: Adapt Existing Components

- **GameCanvas**: Wrap in `AmbientSceneZone`, adapt for zone boundaries
- **UpgradeShop**: Wrap in `UpgradeStoreZone`, maintain existing functionality
- **Deck Opening**: Move to `InventoryZone`, maintain existing logic

## Key Files to Create/Modify

### New Files

- `src/lib/services/zoneLayoutService.ts` - Zone layout calculations
- `src/lib/models/ZoneLayout.ts` - Zone data models
- `src/lib/utils/zoneBoundaries.ts` - Boundary utility functions
- `src/lib/components/GameAreaLayout.svelte` - Main layout component
- `src/lib/components/AmbientSceneZone.svelte` - White zone
- `src/lib/components/UpgradeStoreZone.svelte` - Blue zone
- `src/lib/components/StateInfoZone.svelte` - Orange zone
- `src/lib/components/InventoryZone.svelte` - Green zone

### Modified Files

- `src/routes/+page.svelte` - Use GameAreaLayout instead of separate components
- `src/lib/canvas/scene.ts` - Adapt for zone boundary checking
- `src/lib/components/GameCanvas.svelte` - Adapt for zone container

## Testing Strategy

### Unit Tests

- `tests/unit/services/zoneLayoutService.test.ts` - Zone layout calculations
- `tests/unit/utils/zoneBoundaries.test.ts` - Boundary detection

### Integration Tests

- `tests/integration/zoneLayout.test.ts` - Zone interactions and boundaries

### E2E Tests

- `tests/e2e/zone-layout.spec.ts` - Complete user workflows

## Common Patterns

### Zone Layout Calculation

```typescript
// Calculate zone positions based on proportions
const whiteZoneWidth = containerWidth * proportions.whiteZoneWidth;
const rightZoneWidth = containerWidth * proportions.rightZoneWidth;

const whiteZone: Zone = {
  type: ZoneType.WHITE,
  x: 0,
  y: 0,
  width: whiteZoneWidth,
  height: containerHeight
};

const blueZone: Zone = {
  type: ZoneType.BLUE,
  x: whiteZoneWidth,
  y: 0,
  width: rightZoneWidth,
  height: containerHeight * proportions.blueZoneHeight
};
// ... other zones
```

### Boundary Checking

```typescript
// Check if point is in zone
const isInZone = zoneLayoutService.isPointInZone(
  layout,
  ZoneType.WHITE,
  x,
  y
);

// Validate card drop position
const isValid = zoneLayoutService.isValidCardDropPosition(
  layout,
  cardX,
  cardY
);
```

### Component Integration

```svelte
<!-- GameAreaLayout.svelte -->
<div class="game-area-layout" style="width: {layout.containerWidth}px; height: {layout.containerHeight}px">
  <AmbientSceneZone
    width={whiteZone.width}
    height={whiteZone.height}
    {gameState}
  />
  <UpgradeStoreZone
    width={blueZone.width}
    height={blueZone.height}
    {gameState}
  />
  <!-- ... other zones -->
</div>
```

## Responsive Design

Zones maintain proportions using CSS:

```css
.game-area-layout {
  display: grid;
  grid-template-columns: 2fr 1fr; /* White:Right = 2:1 */
  grid-template-rows: auto;
  width: 100%;
  height: 100vh;
}

.white-zone {
  grid-column: 1;
  grid-row: 1;
}

.right-zones {
  grid-column: 2;
  display: grid;
  grid-template-rows: 1fr 1fr; /* Blue:Orange+Green = 1:1 */
}
```

## Performance Considerations

- Cache zone boundary calculations
- Debounce resize events
- Use CSS transforms for layout (GPU-accelerated)
- Maintain 60fps canvas rendering

## Accessibility

- Add ARIA labels to each zone
- Maintain keyboard navigation
- Ensure screen reader compatibility
- Test with keyboard-only navigation

## Next Steps

1. Review [spec.md](./spec.md) for detailed requirements
2. Review [data-model.md](./data-model.md) for entity definitions
3. Review [contracts/service-interfaces.md](./contracts/service-interfaces.md) for API contracts
4. Review [research.md](./research.md) for design decisions
5. Create tasks using `/speckit.tasks` command

