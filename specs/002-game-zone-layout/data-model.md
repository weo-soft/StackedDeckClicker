# Data Model: Game Area Zone Layout

**Feature**: Game Area Zone Layout  
**Date**: 2025-01-27

## Entities

### ZoneLayout

Represents the overall zone-based layout configuration and state.

**Fields**:
- `zones: Map<ZoneType, Zone>` - Map of zone type to zone instance
- `containerWidth: number` - Total width of the game area container
- `containerHeight: number` - Total height of the game area container
- `proportions: ZoneProportions` - Layout proportions configuration

**Relationships**:
- Contains multiple `Zone` instances
- References `ZoneProportions` for layout configuration

**Validation Rules**:
- Container dimensions must be positive numbers
- All five zone types must be present in zones map
- Zone boundaries must not overlap
- Zone boundaries must be within container bounds

**State Transitions**:
- Initial state: Layout created with default proportions
- Resize: Container dimensions updated, zones recalculated
- Zone update: Individual zone updated, boundaries recalculated

### Zone

Represents a single functional zone within the game area layout.

**Fields**:
- `type: ZoneType` - Type identifier (white, yellow, blue, orange, green)
- `x: number` - X coordinate of zone origin (top-left)
- `y: number` - Y coordinate of zone origin (top-left)
- `width: number` - Zone width in pixels
- `height: number` - Zone height in pixels
- `content: ZoneContent` - Content displayed in this zone
- `interactive: boolean` - Whether zone accepts user interactions

**Relationships**:
- Belongs to a `ZoneLayout`
- Contains `ZoneContent` for display

**Validation Rules**:
- Dimensions must be positive numbers
- Coordinates must be non-negative
- Zone must fit within parent container
- Interactive zones must have defined interaction handlers

**State Transitions**:
- Initial state: Zone created with calculated position and size
- Resize: Position and size recalculated based on layout
- Content update: Content changed, zone re-rendered

### ZoneProportions

Represents the proportional layout configuration for zones.

**Fields**:
- `whiteZoneWidth: number` - Width proportion for white zone (e.g., 0.67 for 67%)
- `rightZoneWidth: number` - Width proportion for right side zones (e.g., 0.33 for 33%)
- `blueZoneHeight: number` - Height proportion for blue zone (e.g., 0.5 for 50%)
- `orangeZoneHeight: number` - Height proportion for orange zone (e.g., 0.25 for 25%)
- `greenZoneHeight: number` - Height proportion for green zone (e.g., 0.25 for 25%)

**Relationships**:
- Used by `ZoneLayout` for layout calculations

**Validation Rules**:
- All proportions must be between 0 and 1
- Width proportions must sum to 1.0
- Height proportions for right side zones must sum to 1.0
- Proportions must match reference image layout

### ZoneContent

Represents the content displayed within a zone.

**Fields**:
- `component: string` - Component identifier to render (e.g., "GameCanvas", "UpgradeShop")
- `props: Record<string, any>` - Props to pass to component
- `data: any` - Zone-specific data (e.g., upgrades list, state info)

**Relationships**:
- Belongs to a `Zone`
- References component by identifier

**Validation Rules**:
- Component identifier must be valid
- Props must match component requirements
- Data must be serializable for state persistence

### ZoneBoundary

Represents the boundary definition for interaction containment.

**Fields**:
- `zoneType: ZoneType` - Zone this boundary belongs to
- `minX: number` - Minimum X coordinate
- `maxX: number` - Maximum X coordinate
- `minY: number` - Minimum Y coordinate
- `maxY: number` - Maximum Y coordinate

**Relationships**:
- Belongs to a `Zone`

**Validation Rules**:
- minX < maxX
- minY < maxY
- Boundaries must be within parent container
- Boundaries must match zone position and size

**Methods**:
- `contains(x: number, y: number): boolean` - Check if point is within boundary
- `intersects(other: ZoneBoundary): boolean` - Check if boundaries overlap

## Zone Types

### ZoneType Enum

```typescript
enum ZoneType {
  WHITE = 'white',      // Ambient Scene
  YELLOW = 'yellow',    // Card Drop Area (logical, within white)
  BLUE = 'blue',        // Upgrade Store
  ORANGE = 'orange',    // State Information
  GREEN = 'green'       // Inventory
}
```

## Relationships Diagram

```
ZoneLayout
  ├── contains: Zone[] (5 zones)
  │   ├── white: Zone
  │   │   └── contains: ZoneContent (GameCanvas component)
  │   ├── yellow: Zone (logical, within white)
  │   │   └── contains: ZoneContent (drop area definition)
  │   ├── blue: Zone
  │   │   └── contains: ZoneContent (UpgradeShop component)
  │   ├── orange: Zone
  │   │   └── contains: ZoneContent (StateInfoZone component)
  │   └── green: Zone
  │       └── contains: ZoneContent (InventoryZone component)
  ├── uses: ZoneProportions
  └── calculates: ZoneBoundary[] (one per zone)
```

## State Management

### Zone Layout State

The zone layout state is derived from:
- Container dimensions (from viewport/resize events)
- Zone proportions (from configuration)
- Game state (for zone content data)

State is calculated reactively:
- Container resize → Recalculate zone positions/sizes
- Proportion change → Recalculate zone positions/sizes
- Game state change → Update zone content data

### Persistence

Zone layout configuration is persisted:
- Zone proportions: Stored in game state (localStorage/IndexedDB)
- Zone content data: Derived from game state (upgrades, buffs, etc.)
- Zone positions/sizes: Calculated on load (not persisted, derived from proportions)

## Validation Rules Summary

1. **Layout Validation**:
   - All five zones must be present
   - Zones must not overlap
   - Zones must fit within container
   - Proportions must sum correctly

2. **Boundary Validation**:
   - Boundaries must match zone dimensions
   - Boundaries must be within container
   - Yellow zone must be within white zone

3. **Content Validation**:
   - Component identifiers must be valid
   - Props must match component requirements
   - Data must be serializable

4. **Interaction Validation**:
   - Interactions must be within zone boundaries
   - Card drops must be within yellow zone (logical, within white)
   - Click events must be routed to correct zone

