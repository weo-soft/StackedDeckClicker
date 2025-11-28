# Service Interfaces: Light Beam Effect

**Feature**: 009-light-beam-effect  
**Date**: 2025-01-27

## Overview

This document defines the service interfaces and API contracts for the light beam effect feature. The interfaces extend existing tier service APIs to support beam configuration.

## Tier Service Extensions

### updateTierConfiguration

**Existing Interface** (extended to support beam configuration):

```typescript
/**
 * Update tier configuration including light beam settings.
 * @param tierId - ID of tier to update
 * @param config - Updated tier configuration (includes optional lightBeam property)
 * @returns Promise that resolves when configuration is saved
 * @throws Error if tier not found or validation fails
 */
updateTierConfiguration(
  tierId: string,
  config: {
    colorScheme: ColorScheme;
    sound: SoundConfiguration;
    enabled: boolean;
    lightBeam?: LightBeamConfiguration;  // New optional property
  }
): Promise<void>;
```

**Changes**:
- Added optional `lightBeam` property to configuration parameter
- Existing calls without `lightBeam` continue to work (backward compatible)
- Validation ensures `lightBeam` is valid `LightBeamConfiguration` if provided

**Usage Example**:
```typescript
await tierService.updateTierConfiguration('S', {
  colorScheme: existingColorScheme,
  sound: existingSound,
  enabled: true,
  lightBeam: {
    enabled: true,
    color: '#FF0000'  // Red beam
  }
});
```

### getTierForCard

**Existing Interface** (no changes, but return value includes beam config):

```typescript
/**
 * Get tier for a card by card name.
 * @param cardName - Name of the card
 * @returns Tier object (includes config.lightBeam if configured) or null
 */
getTierForCard(cardName: string): Tier | null;
```

**Return Value**:
- `Tier` object includes `config.lightBeam` if configured
- If tier has no `lightBeam` property, treat as default: `{ enabled: false, color: null }`

## Scene Service Extensions

### addCard

**Existing Interface** (no signature changes, but behavior extended):

```typescript
/**
 * Add a card to the scene with drop animation and beam effect.
 * @param card - Card to add
 * @param canvasWidth - Canvas width
 * @param canvasHeight - Canvas height
 * @param position - Optional card position
 */
addCard(
  card: DivinationCard,
  canvasWidth: number,
  canvasHeight: number,
  position?: { x: number; y: number }
): void;
```

**Behavior Changes**:
- When card is added, beam state is initialized from tier configuration
- Beam state stored in CardAnimation object
- Beam rendering happens automatically during render loop

### render

**Existing Interface** (no signature changes, but rendering extended):

```typescript
/**
 * Render all cards and effects to canvas.
 * Now includes light beam effects.
 * @param ctx - Canvas rendering context
 */
render(ctx: CanvasRenderingContext2D): void;
```

**Rendering Order** (updated):
1. Background
2. Yellow zone overlay
3. Particle effects (if enabled)
4. Card objects
5. **Light beam effects** (new)
6. Card labels
7. Glow border (if enabled)

## Canvas Animation Extensions

### createCardAnimation

**Existing Interface** (extended to initialize beam state):

```typescript
/**
 * Create a new card animation with initial properties including beam state.
 * @param card - Card to animate
 * @param startX - Starting X position
 * @param startY - Starting Y position
 * @param popUp - Whether card pops up (vs falls)
 * @returns CardAnimation with beam state initialized from tier config
 */
createCardAnimation(
  card: DivinationCard,
  startX: number,
  startY: number,
  popUp: boolean = false
): CardAnimation;
```

**Behavior Changes**:
- Looks up tier for card via `tierService.getTierForCard()`
- Initializes `beamColor` and `beamEnabled` from tier `lightBeam` config
- Sets `beamAge` to 0
- Calculates initial `beamHeight` based on canvas dimensions

### updateCardAnimation

**Existing Interface** (extended to update beam age):

```typescript
/**
 * Update card animation physics and beam state.
 * @param animation - Card animation to update
 * @param deltaTime - Time since last update (ms)
 * @param canvasHeight - Canvas height
 * @param canvasWidth - Canvas width
 * @param scene - Scene reference
 * @param gravity - Gravity constant
 * @param friction - Friction constant
 * @param airResistance - Air resistance constant
 */
updateCardAnimation(
  animation: CardAnimation,
  deltaTime: number,
  canvasHeight: number,
  canvasWidth: number,
  scene: Scene,
  gravity?: number,
  friction?: number,
  airResistance?: number
): void;
```

**Behavior Changes**:
- Updates `beamAge` by adding `deltaTime`
- Calculates beam opacity based on `beamAge` (exponential fade)
- Optionally adjusts `beamHeight` during fade-out

## New Methods

### Scene.drawLightBeams

**New Method**:

```typescript
/**
 * Draw all light beam effects for cards with beams enabled.
 * @param ctx - Canvas rendering context
 */
private drawLightBeams(ctx: CanvasRenderingContext2D): void;
```

**Behavior**:
- Iterates through all cards in scene
- For each card with `beamEnabled === true` and valid `beamColor`:
  - Creates vertical linear gradient from card position upward
  - Draws beam rectangle with gradient fill
  - Applies opacity based on `beamAge` (fade-out)
- Beams fade out over 5-8 seconds

**Performance**:
- Single pass through cards array
- Gradient objects created per beam (reused during beam lifetime)
- Efficient canvas operations (rectangles with gradients)

## Component Interfaces

### TierSettings Component

**Extended Props** (no new props, but component extended):

```typescript
// Existing props unchanged
export let tierId: string | null = null;
export let onTierUpdated: ((tierId: string) => void) | undefined = undefined;
```

**New Internal State**:
```typescript
let editingLightBeam: LightBeamConfiguration | null = null;
```

**New Methods**:
```typescript
/**
 * Handle beam color change.
 * @param value - New color value (hex with or without #)
 */
function handleBeamColorChange(value: string): void;

/**
 * Handle beam enabled toggle.
 * @param enabled - New enabled state
 */
function handleBeamEnabledChange(enabled: boolean): void;
```

**UI Extensions**:
- New section in tier collapsible: "Light Beam Effect"
- Color picker for beam color (matches existing color scheme editor pattern)
- Toggle switch for enable/disable
- Visual preview of beam color

## Data Validation

### LightBeamConfiguration Validation

```typescript
/**
 * Validate light beam configuration.
 * @param config - Configuration to validate
 * @returns Validation result
 */
function validateLightBeamConfig(
  config: LightBeamConfiguration
): ValidationResult;
```

**Validation Rules**:
- `enabled` must be boolean
- `color` must be valid hex color (#RRGGBB) or null
- If `enabled` is true and `color` is null, treated as disabled

## Error Handling

### Invalid Beam Color

**Scenario**: Tier configuration has invalid beam color (malformed hex)

**Behavior**:
- Validation fails during save
- Error message displayed to user
- Configuration not saved
- Existing configuration remains unchanged

### Missing Tier

**Scenario**: Card's tier is deleted or not found

**Behavior**:
- `getTierForCard()` returns null
- Card uses default beam settings: `{ enabled: false, color: null }`
- No beam effect displayed
- No error thrown (graceful degradation)

### Tier Service Not Initialized

**Scenario**: Tier service not ready when card is dropped

**Behavior**:
- Card uses default beam settings: `{ enabled: false, color: null }`
- No beam effect displayed
- Warning logged to console (dev mode only)
- Card renders normally

## Backward Compatibility

### Existing Tier Configurations

**Scenario**: Tier configuration loaded from storage without `lightBeam` property

**Behavior**:
- Configuration loaded successfully
- `lightBeam` property initialized with defaults: `{ enabled: false, color: null }`
- No migration script required (handled at load time)
- Existing functionality unaffected

### Existing API Calls

**Scenario**: Code calls `updateTierConfiguration()` without `lightBeam` property

**Behavior**:
- Call succeeds (backward compatible)
- Existing `lightBeam` value preserved (if present)
- If `lightBeam` missing, defaults applied on next load

## Performance Contracts

### Beam Rendering Performance

**Contract**: Beam rendering must complete within 5ms per beam (PERF-001)

**Implementation**:
- Single pass loop through cards
- Gradient objects reused during beam lifetime
- Efficient canvas operations (rectangles with gradients)
- Opacity calculations cached per frame

### Memory Usage

**Contract**: Beam effects must not exceed 1MB per 50 active beams (PERF-004)

**Implementation**:
- Beam state stored in CardAnimation (minimal overhead)
- Gradient objects created once per beam
- No additional image resources
- Beams cleaned up when cards removed

