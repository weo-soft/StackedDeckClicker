# Data Model: Light Beam Effect for Dropped Cards

**Feature**: 009-light-beam-effect  
**Date**: 2025-01-27

## Overview

This document defines the data structures and models required for the light beam effect system. The models extend the existing tier configuration system to include beam settings (enabled state and color) and add beam state tracking to card animations.

## Core Entities

### LightBeamConfiguration

Represents the light beam settings for a tier group.

```typescript
interface LightBeamConfiguration {
  /** Whether light beam effect is enabled for this tier */
  enabled: boolean;
  /** Beam color in hex format (e.g., "#FF0000" for red). Null if not configured. */
  color: string | null;
}
```

**Fields**:
- `enabled`: Boolean flag indicating whether cards from this tier should display beam effects
- `color`: Hex color code for the beam (e.g., "#FF0000"). Null indicates no color configured (beam disabled or uses default)

**Validation Rules**:
- `enabled` must be boolean (default: false)
- `color` must be valid hex color code (format: "#RRGGBB") or null
- If `enabled` is true and `color` is null, beam will not be displayed (treated as disabled)

**State Transitions**:
- Created with default values: `{ enabled: false, color: null }`
- Updated when user modifies tier beam settings in Tier Settings
- `enabled` can be toggled independently of `color`
- `color` can be set even if `enabled` is false (for preview purposes)

**Default Values**:
- Default tier configurations: `{ enabled: false, color: null }` (beams disabled by default)
- Custom tiers: Inherit default values on creation

### TierConfiguration (Extended)

Extended existing interface to include light beam configuration.

```typescript
interface TierConfiguration {
  /** Color scheme for card label display */
  colorScheme: ColorScheme;
  /** Drop sound configuration */
  sound: SoundConfiguration;
  /** Whether cards from this tier should be displayed when dropped */
  enabled: boolean;
  /** Light beam effect configuration */
  lightBeam?: LightBeamConfiguration;  // Optional for backward compatibility
  /** Last modification timestamp */
  modifiedAt: number;
}
```

**New Field**:
- `lightBeam`: Optional `LightBeamConfiguration` object (optional to maintain backward compatibility with existing tier configurations)

**Migration Strategy**:
- Existing tier configurations without `lightBeam` property are treated as having default beam settings: `{ enabled: false, color: null }`
- When loading tier configurations, check for `lightBeam` property; if missing, initialize with defaults
- No version bump required (optional property maintains backward compatibility)

**Validation Rules**:
- If `lightBeam` is provided, it must be a valid `LightBeamConfiguration` object
- `lightBeam.enabled` must be boolean
- `lightBeam.color` must be valid hex color or null

### CardAnimation (Extended)

Extended existing interface to include beam effect state.

```typescript
interface CardAnimation {
  // ... existing fields ...
  card: DivinationCard;
  x: number;
  y: number;
  // ... other existing fields ...
  
  /** Light beam effect state */
  beamColor: string | null;        // Beam color from tier configuration
  beamEnabled: boolean;            // Whether beam should be displayed
  beamAge: number;                 // Beam age in milliseconds (for fade-out)
  beamHeight: number;              // Current beam height in pixels
}
```

**New Fields**:
- `beamColor`: Color to use for this card's beam (from tier configuration, or null if no beam)
- `beamEnabled`: Whether beam should be displayed (from tier configuration)
- `beamAge`: Age of beam effect in milliseconds (starts at 0 when card is dropped)
- `beamHeight`: Current beam height in pixels (for animation/fade effects)

**Initialization**:
- When card is dropped, `beamColor` and `beamEnabled` are set from tier configuration
- `beamAge` starts at 0
- `beamHeight` initialized to maximum height (e.g., 30-40% of canvas height)

**Update Logic**:
- `beamAge` increments each frame (same as card `age`)
- `beamHeight` may reduce slightly during fade-out for dynamic effect
- Beam opacity calculated from `beamAge` (exponential fade over 5-8 seconds)

### LightBeamEffect (Runtime Entity)

Represents an active beam effect being rendered on the canvas.

```typescript
interface LightBeamEffect {
  /** Card animation this beam is associated with */
  cardAnimation: CardAnimation;
  /** Beam start position (card position) */
  startX: number;
  startY: number;
  /** Beam end position (top of beam) */
  endX: number;
  endY: number;
  /** Beam color */
  color: string;
  /** Current opacity (0.0 to 1.0) */
  opacity: number;
  /** Beam width at base */
  width: number;
}
```

**Fields**:
- `cardAnimation`: Reference to the CardAnimation this beam belongs to
- `startX`, `startY`: Bottom of beam (card position)
- `endX`, `endY`: Top of beam (calculated from height and direction)
- `color`: Beam color from tier configuration
- `opacity`: Current opacity for fade-out animation
- `width`: Beam width at base (narrower at top for tapering effect)

**Computed Properties**:
- Beam end position calculated from start position, height, and direction (upward)
- Opacity calculated from `beamAge` using exponential fade function
- Width tapers from base to top (e.g., 8px at base, 2px at top)

## Data Flow

### Tier Configuration Update Flow

1. User opens Tier Settings and expands tier configuration
2. User configures beam color and enabled state
3. User saves configuration
4. `tierService.updateTierConfiguration()` called with updated `TierConfiguration` including `lightBeam`
5. Configuration persisted to IndexedDB via `tierStorageService`
6. `tierStore` refreshed to update reactive state
7. Future card drops use new beam configuration

### Card Drop with Beam Effect Flow

1. Card is dropped via `scene.addCard()`
2. `createCardAnimation()` creates CardAnimation with initial beam state
3. Tier configuration retrieved via `tierService.getTierForCard()`
4. Beam state initialized: `beamColor` and `beamEnabled` from tier `lightBeam` config
5. Card added to scene's cards array
6. During render loop, beam effects drawn for cards with `beamEnabled === true`
7. Beam age increments each frame
8. Beam fades out over 5-8 seconds based on `beamAge`

## Relationships

- **TierConfiguration** → **LightBeamConfiguration**: One-to-one (optional)
- **CardAnimation** → **LightBeamConfiguration**: Derived from tier (via tier lookup)
- **LightBeamEffect** → **CardAnimation**: One-to-one (runtime entity)

## Persistence

- `LightBeamConfiguration` stored as part of `TierConfiguration` in IndexedDB
- No separate storage required (beam config is part of tier config)
- Migration handled transparently (existing configs get default beam settings)

## Validation

### LightBeamConfiguration Validation

```typescript
function validateLightBeamConfig(config: LightBeamConfiguration): ValidationResult {
  // Validate enabled is boolean
  if (typeof config.enabled !== 'boolean') {
    return { isValid: false, error: 'enabled must be a boolean' };
  }
  
  // Validate color is valid hex or null
  if (config.color !== null && !/^#[0-9A-Fa-f]{6}$/.test(config.color)) {
    return { isValid: false, error: 'color must be a valid hex color code (#RRGGBB) or null' };
  }
  
  return { isValid: true };
}
```

## Default Values

### Default Tier Beam Configurations

All default tiers (S, A, B, C, D, E, F) are created with:
```typescript
lightBeam: {
  enabled: false,
  color: null
}
```

Users can enable and configure beam colors per tier through Tier Settings.

### Custom Tier Beam Configurations

Custom tiers inherit default beam settings on creation:
```typescript
lightBeam: {
  enabled: false,
  color: null
}
```

## Edge Cases

### Missing Tier Configuration

If a card's tier has no `lightBeam` property (legacy configuration):
- Treat as `{ enabled: false, color: null }`
- No beam effect displayed
- No error thrown

### Invalid Beam Color

If tier has invalid beam color (malformed hex):
- Fall back to no beam (`beamEnabled = false`)
- Log warning to console
- Continue normal card rendering

### Deleted Tier

If card's tier is deleted while card is displayed:
- Use default beam settings: `{ enabled: false, color: null }`
- Beam effect stops (if currently displayed)
- No error thrown

### Rapid Card Drops

When multiple cards dropped rapidly:
- Each card gets its own beam state from tier configuration
- Beams render independently
- Performance maintained via efficient rendering loop

