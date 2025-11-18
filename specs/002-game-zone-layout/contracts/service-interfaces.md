# Service Interfaces: Game Area Zone Layout

**Created**: 2025-01-27  
**Purpose**: Define internal service interfaces and contracts for zone layout functionality

## Overview

These contracts define the internal service interfaces for zone layout management. Since this is a client-side game, these are internal service interfaces that components use to interact with zone layout logic.

## ZoneLayoutService

Handles zone layout calculations, boundary detection, and zone management.

### Interface

```typescript
interface ZoneLayoutService {
  /**
   * Initialize zone layout with container dimensions.
   * 
   * @param containerWidth - Width of the game area container
   * @param containerHeight - Height of the game area container
   * @param proportions - Optional custom proportions (uses defaults if not provided)
   * @returns ZoneLayout instance with all zones calculated
   */
  initializeLayout(
    containerWidth: number,
    containerHeight: number,
    proportions?: ZoneProportions
  ): ZoneLayout;

  /**
   * Update layout when container is resized.
   * 
   * @param layout - Current zone layout
   * @param newWidth - New container width
   * @param newHeight - New container height
   * @returns Updated ZoneLayout with recalculated zone positions and sizes
   */
  resizeLayout(
    layout: ZoneLayout,
    newWidth: number,
    newHeight: number
  ): ZoneLayout;

  /**
   * Get zone boundary for a specific zone type.
   * 
   * @param layout - Current zone layout
   * @param zoneType - Type of zone to get boundary for
   * @returns ZoneBoundary for the specified zone
   * @throws Error if zone type not found
   */
  getZoneBoundary(layout: ZoneLayout, zoneType: ZoneType): ZoneBoundary;

  /**
   * Check if a point (x, y) is within a specific zone.
   * 
   * @param layout - Current zone layout
   * @param zoneType - Type of zone to check
   * @param x - X coordinate
   * @param y - Y coordinate
   * @returns True if point is within zone boundary
   */
  isPointInZone(
    layout: ZoneLayout,
    zoneType: ZoneType,
    x: number,
    y: number
  ): boolean;

  /**
   * Get the zone type that contains a given point.
   * 
   * @param layout - Current zone layout
   * @param x - X coordinate
   * @param y - Y coordinate
   * @returns ZoneType if point is within a zone, null otherwise
   */
  getZoneAtPoint(
    layout: ZoneLayout,
    x: number,
    y: number
  ): ZoneType | null;

  /**
   * Validate that card drop position is within the card drop area (yellow zone, logical within white).
   * 
   * @param layout - Current zone layout
   * @param x - X coordinate of card drop
   * @param y - Y coordinate of card drop
   * @returns True if position is valid for card drop
   */
  isValidCardDropPosition(
    layout: ZoneLayout,
    x: number,
    y: number
  ): boolean;

  /**
   * Get a random valid position within the card drop area.
   * 
   * @param layout - Current zone layout
   * @param prng - Optional PRNG function (defaults to Math.random)
   * @returns Random position {x, y} within drop area, or null if no valid area
   */
  getRandomDropPosition(
    layout: ZoneLayout,
    prng?: () => number
  ): { x: number; y: number } | null;

  /**
   * Check if zones overlap (should never happen, but useful for validation).
   * 
   * @param layout - Current zone layout
   * @returns True if any zones overlap
   */
  hasOverlappingZones(layout: ZoneLayout): boolean;

  /**
   * Validate zone layout structure and boundaries.
   * 
   * @param layout - Zone layout to validate
   * @returns Validation result with errors if any
   */
  validateLayout(layout: ZoneLayout): ValidationResult;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}
```

### Error Cases

- **Invalid container dimensions**: Throw error (dimensions must be positive)
- **Zone type not found**: Throw error (all five zones must exist)
- **Invalid proportions**: Throw error (proportions must sum correctly)
- **Overlapping zones**: Return validation error (zones must not overlap)

---

## ZoneBoundary Utilities

Utility functions for zone boundary calculations and checks.

### Interface

```typescript
interface ZoneBoundaryUtils {
  /**
   * Check if a point is within a boundary.
   * 
   * @param boundary - Zone boundary to check
   * @param x - X coordinate
   * @param y - Y coordinate
   * @returns True if point is within boundary
   */
  contains(boundary: ZoneBoundary, x: number, y: number): boolean;

  /**
   * Check if two boundaries intersect.
   * 
   * @param boundary1 - First boundary
   * @param boundary2 - Second boundary
   * @returns True if boundaries overlap
   */
  intersects(boundary1: ZoneBoundary, boundary2: ZoneBoundary): boolean;

  /**
   * Create boundary from zone position and size.
   * 
   * @param zone - Zone to create boundary for
   * @returns ZoneBoundary instance
   */
  createBoundary(zone: Zone): ZoneBoundary;

  /**
   * Get intersection area of two boundaries (for overlap detection).
   * 
   * @param boundary1 - First boundary
   * @param boundary2 - Second boundary
   * @returns Intersection area, or null if no intersection
   */
  getIntersection(
    boundary1: ZoneBoundary,
    boundary2: ZoneBoundary
  ): ZoneBoundary | null;
}
```

### Error Cases

- **Invalid boundary coordinates**: Throw error (minX < maxX, minY < maxY)
- **Null zone**: Throw error (zone must be provided)

---

## Component Interfaces

### GameAreaLayout Component

Main container component for zone-based layout.

**Props**:
```typescript
interface GameAreaLayoutProps {
  gameState: GameState;
  onDeckOpen?: () => void;
  onUpgradePurchase?: (upgradeType: UpgradeType) => void;
}
```

**Events**:
- `zoneInteraction` - Emitted when user interacts with a zone
- `layoutResize` - Emitted when layout is resized

### AmbientSceneZone Component

Wrapper for white zone (ambient scene with card drops).

**Props**:
```typescript
interface AmbientSceneZoneProps {
  width: number;
  height: number;
  gameState: GameState;
  onCardDrop?: (card: DivinationCard, position: {x: number, y: number}) => void;
}
```

### UpgradeStoreZone Component

Wrapper for blue zone (upgrade store).

**Props**:
```typescript
interface UpgradeStoreZoneProps {
  width: number;
  height: number;
  gameState: GameState;
  onUpgradePurchase?: (upgradeType: UpgradeType) => void;
}
```

### StateInfoZone Component

Orange zone displaying state information.

**Props**:
```typescript
interface StateInfoZoneProps {
  width: number;
  height: number;
  gameState: GameState;
  activeBuffs?: Buff[];
  activeUpgrades?: Upgrade[];
}
```

### InventoryZone Component

Green zone with deck opening and interactive upgrades.

**Props**:
```typescript
interface InventoryZoneProps {
  width: number;
  height: number;
  gameState: GameState;
  onDeckOpen?: () => void;
  interactiveUpgrades?: Upgrade[];
}
```

---

## Service Dependencies

```
ZoneLayoutService
  └── (standalone service, no dependencies)

GameAreaLayout Component
  ├── ZoneLayoutService
  ├── GameStateService (for game state)
  └── CanvasService (for ambient scene)

Zone Components
  └── (receive props, emit events to parent)
```

---

## Testing Contracts

All services must be:
- **Testable in isolation**: Can be instantiated with test data
- **Deterministic**: Same inputs produce same outputs
- **Error-handling**: All error cases documented and handled gracefully
- **Type-safe**: Full TypeScript type definitions
- **Documented**: JSDoc comments for all public methods

## Integration Points

### With Existing Services

- **GameStateService**: Zone layout receives game state for content display
- **CanvasService**: Ambient scene zone uses canvas service for card rendering
- **UpgradeService**: Upgrade store zone uses upgrade service for upgrade data

### With Existing Components

- **GameCanvas**: Wrapped in AmbientSceneZone component
- **UpgradeShop**: Wrapped in UpgradeStoreZone component
- **ScoreDisplay**: Can be integrated into StateInfoZone or remain separate

