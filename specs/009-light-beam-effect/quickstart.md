# Quickstart Guide: Light Beam Effect for Dropped Cards

**Feature**: 009-light-beam-effect  
**Date**: 2025-01-27

## Overview

This guide provides step-by-step instructions for implementing the light beam effect feature. Follow these steps in order to ensure proper implementation and integration with existing systems.

## Prerequisites

- Understanding of Svelte component structure and stores
- Familiarity with TypeScript interfaces
- Knowledge of Canvas API rendering
- Understanding of existing tier service and store APIs
- Access to existing canvas rendering code (Scene, CardAnimation)

## Implementation Steps

### Step 1: Extend TierConfiguration Interface

**File**: `src/lib/models/Tier.ts`

Add the `LightBeamConfiguration` interface and extend `TierConfiguration`:

```typescript
/**
 * Light beam effect configuration for a tier.
 */
export interface LightBeamConfiguration {
  /** Whether light beam effect is enabled for this tier */
  enabled: boolean;
  /** Beam color in hex format (e.g., "#FF0000"). Null if not configured. */
  color: string | null;
}

// ... existing interfaces ...

export interface TierConfiguration {
  colorScheme: ColorScheme;
  sound: SoundConfiguration;
  enabled: boolean;
  lightBeam?: LightBeamConfiguration;  // Add this line
  modifiedAt: number;
}
```

**Validation**: Run TypeScript compiler to ensure no type errors.

---

### Step 2: Update Default Tier Configurations

**File**: `src/lib/utils/tierAssignment.ts`

Update `createDefaultTierConfigurations()` to include default beam settings:

```typescript
export function createDefaultTierConfigurations(): Map<string, TierConfiguration> {
  const configs = new Map<string, TierConfiguration>();
  const now = Date.now();
  
  // ... existing color scheme setup ...
  
  for (let i = 0; i < defaultTiers.length; i++) {
    const tierId = defaultTiers[i];
    configs.set(tierId, {
      colorScheme: defaultColors[tierId],
      sound: { filePath: null, volume: 1.0, enabled: true },
      enabled: true,
      lightBeam: { enabled: false, color: null },  // Add this line
      modifiedAt: now
    });
  }
  
  return configs;
}
```

**Validation**: Verify default tiers are created with beam settings.

---

### Step 3: Extend CardAnimation Interface

**File**: `src/lib/canvas/cardAnimation.ts`

Add beam state fields to `CardAnimation` interface:

```typescript
export interface CardAnimation {
  // ... existing fields ...
  
  /** Light beam effect state */
  beamColor: string | null;
  beamEnabled: boolean;
  beamAge: number;
  beamHeight: number;
}
```

**Validation**: TypeScript should compile without errors.

---

### Step 4: Initialize Beam State in createCardAnimation

**File**: `src/lib/canvas/cardAnimation.ts`

Update `createCardAnimation()` to initialize beam state from tier configuration:

```typescript
export function createCardAnimation(
  card: DivinationCard,
  startX: number,
  startY: number,
  popUp: boolean = false
): CardAnimation {
  // ... existing initialization code ...
  
  // Initialize beam state from tier configuration
  let beamColor: string | null = null;
  let beamEnabled = false;
  
  try {
    const tier = tierService.getTierForCard(card.name);
    if (tier?.config?.lightBeam) {
      beamEnabled = tier.config.lightBeam.enabled;
      beamColor = tier.config.lightBeam.color;
    }
  } catch (error) {
    // Tier service not available, use defaults
    console.warn('Tier service not available for beam config:', error);
  }
  
  // Calculate initial beam height (30-40% of typical canvas height)
  const initialBeamHeight = 200; // Will be adjusted based on canvas size
  
  return {
    // ... existing fields ...
    beamColor,
    beamEnabled,
    beamAge: 0,
    beamHeight: initialBeamHeight
  };
}
```

**Validation**: Cards should initialize with beam state (check console for warnings).

---

### Step 5: Update Beam Age in updateCardAnimation

**File**: `src/lib/canvas/cardAnimation.ts`

Update `updateCardAnimation()` to increment beam age:

```typescript
export function updateCardAnimation(
  animation: CardAnimation,
  deltaTime: number,
  canvasHeight: number,
  canvasWidth: number,
  scene: Scene,
  gravity: number = 0.2,
  friction: number = 0.97,
  airResistance: number = 0.99
): void {
  // ... existing physics code ...
  
  // Update beam age
  animation.beamAge += deltaTime;
  
  // Calculate beam fade (exponential fade over 5-8 seconds)
  const beamFadeStart = 2000; // Start fading after 2 seconds
  const beamFadeDuration = 6000; // Fade over 6 seconds
  if (animation.beamAge > beamFadeStart) {
    const fadeProgress = Math.min(1, (animation.beamAge - beamFadeStart) / beamFadeDuration);
    // Exponential fade: opacity = (1 - fadeProgress)^2
    const beamOpacity = Math.pow(1 - fadeProgress, 2);
    // Store opacity in animation for rendering (add beamOpacity field if needed)
  }
}
```

**Validation**: Beam age should increment each frame.

---

### Step 6: Add Beam Rendering Method to Scene

**File**: `src/lib/canvas/scene.ts`

Add `drawLightBeams()` method:

```typescript
/**
 * Draw all light beam effects for cards with beams enabled.
 */
private drawLightBeams(ctx: CanvasRenderingContext2D): void {
  const beamMaxHeight = this.canvasHeight * 0.35; // 35% of canvas height
  const beamBaseWidth = 8; // Width at base
  const beamTopWidth = 2; // Width at top
  
  for (const card of this.cards) {
    if (!card.beamEnabled || !card.beamColor) {
      continue; // Skip cards without beams
    }
    
    // Calculate beam opacity (exponential fade)
    const beamFadeStart = 2000;
    const beamFadeDuration = 6000;
    let beamOpacity = 1.0;
    
    if (card.beamAge > beamFadeStart) {
      const fadeProgress = Math.min(1, (card.beamAge - beamFadeStart) / beamFadeDuration);
      beamOpacity = Math.pow(1 - fadeProgress, 2);
    }
    
    if (beamOpacity <= 0) {
      continue; // Beam fully faded
    }
    
    // Calculate beam height (may reduce slightly during fade)
    const currentBeamHeight = beamMaxHeight * (1 - fadeProgress * 0.2);
    
    // Create vertical gradient
    const gradient = ctx.createLinearGradient(
      card.x, card.y,                    // Start (card position)
      card.x, card.y - currentBeamHeight  // End (top of beam)
    );
    
    // Gradient color stops: full color at bottom, transparent at top
    const colorWithAlpha = card.beamColor + Math.floor(beamOpacity * 255).toString(16).padStart(2, '0');
    gradient.addColorStop(0, colorWithAlpha);
    gradient.addColorStop(0.5, card.beamColor + Math.floor(beamOpacity * 0.5 * 255).toString(16).padStart(2, '0'));
    gradient.addColorStop(1, card.beamColor + '00'); // Fully transparent
    
    // Draw beam as tapered rectangle
    ctx.save();
    ctx.globalAlpha = beamOpacity;
    ctx.fillStyle = gradient;
    
    // Draw beam (tapered from base to top)
    const startX = card.x - beamBaseWidth / 2;
    const endX = card.x - beamTopWidth / 2;
    const startY = card.y;
    const endY = card.y - currentBeamHeight;
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX + beamBaseWidth, startY);
    ctx.lineTo(endX + beamTopWidth, endY);
    ctx.lineTo(endX, endY);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }
}
```

**Validation**: Beams should render (test with tier that has beam enabled).

---

### Step 7: Integrate Beam Rendering into Scene.render()

**File**: `src/lib/canvas/scene.ts`

Update `render()` method to call `drawLightBeams()`:

```typescript
render(ctx: CanvasRenderingContext2D): void {
  // ... existing background and overlay code ...
  
  // Draw particle effects if enabled
  if (this.customizations.get('particleEffects')) {
    this.drawParticleEffects(ctx);
  }
  
  // First pass: Draw all card objects (lower z-layer)
  for (const card of this.cards) {
    drawCardObject(ctx, card);
  }
  
  // Draw light beam effects (between cards and labels)
  this.drawLightBeams(ctx);
  
  // Second pass: Draw all labels (higher z-layer, always on top)
  for (const card of this.cards) {
    const isHovered = card === this.hoveredCard;
    drawCardLabel(ctx, card, isHovered);
  }
  
  // Draw glowing border if enabled
  if (this.customizations.get('glowBorder')) {
    this.drawGlowBorder(ctx);
  }
}
```

**Validation**: Beams should appear between cards and labels.

---

### Step 8: Add Beam Configuration UI to TierSettings

**File**: `src/lib/components/TierSettings.svelte`

Add beam configuration section in the tier collapsible:

```svelte
<!-- In the tier collapsible section, after sound configuration -->
{#if editingTierId === tier.id && editingColorScheme && editingSound}
  <!-- ... existing color scheme and sound editors ... -->
  
  <!-- Light Beam Effect Configuration -->
  <div class="light-beam-config">
    <h3>Light Beam Effect</h3>
    
    <!-- Enable/Disable Toggle -->
    <div class="beam-toggle">
      <label>
        <input
          type="checkbox"
          checked={editingLightBeam?.enabled || false}
          on:change={(e) => handleBeamEnabledChange(e.currentTarget.checked)}
        />
        Enable light beam effect
      </label>
    </div>
    
    <!-- Beam Color Picker (only if enabled) -->
    {#if editingLightBeam?.enabled}
      <div class="beam-color-editor">
        <label for="beam-color-{tier.id}">Beam Color:</label>
        <input
          id="beam-color-{tier.id}"
          type="color"
          value={editingLightBeam.color || '#FF0000'}
          on:input={(e) => handleBeamColorInput(e)}
          aria-label="Beam color picker"
        />
        <input
          type="text"
          value={editingLightBeam.color || '#FF0000'}
          on:input={(e) => handleBeamColorTextInput(e)}
          placeholder="#RRGGBB"
          aria-label="Beam color hex value"
        />
      </div>
      
      <!-- Beam Color Preview -->
      <div class="beam-preview" style="background: linear-gradient(to top, {editingLightBeam.color || '#FF0000'}, transparent);">
        <p>Beam Preview</p>
      </div>
    {/if}
  </div>
{/if}
```

Add state and handlers:

```typescript
let editingLightBeam: LightBeamConfiguration | null = null;

function loadTierForEditing(tierId: string) {
  // ... existing code ...
  editingLightBeam = tier.config.lightBeam || { enabled: false, color: null };
}

function handleBeamEnabledChange(enabled: boolean) {
  if (!editingLightBeam) {
    editingLightBeam = { enabled: false, color: null };
  }
  editingLightBeam = { ...editingLightBeam, enabled };
}

function handleBeamColorInput(event: Event) {
  const target = event.currentTarget as HTMLInputElement;
  if (target && editingLightBeam) {
    editingLightBeam = { ...editingLightBeam, color: target.value };
  }
}

function handleBeamColorTextInput(event: Event) {
  const target = event.currentTarget as HTMLInputElement;
  if (target && editingLightBeam) {
    const hexValue = target.value.startsWith('#') ? target.value : `#${target.value}`;
    editingLightBeam = { ...editingLightBeam, color: hexValue };
  }
}

async function handleSave() {
  // ... existing validation ...
  
  await tierService.updateTierConfiguration(editingTierId, {
    colorScheme: editingColorScheme,
    sound: editingSound,
    enabled: editingEnabled,
    lightBeam: editingLightBeam  // Add this line
  });
  
  // ... rest of save logic ...
}
```

**Validation**: Beam configuration should save and apply to dropped cards.

---

### Step 9: Add Validation for Beam Configuration

**File**: `src/lib/utils/colorValidation.ts` (or create new validation file)

Add beam configuration validation:

```typescript
export function validateLightBeamConfig(
  config: LightBeamConfiguration
): ValidationResult {
  if (typeof config.enabled !== 'boolean') {
    return { isValid: false, error: 'enabled must be a boolean' };
  }
  
  if (config.color !== null && !/^#[0-9A-Fa-f]{6}$/.test(config.color)) {
    return { isValid: false, error: 'color must be a valid hex color code (#RRGGBB) or null' };
  }
  
  return { isValid: true };
}
```

Use in `handleSave()`:

```typescript
const beamValidation = validateLightBeamConfig(editingLightBeam);
if (!beamValidation.isValid) {
  errorMessage = beamValidation.error || 'Invalid beam configuration';
  return;
}
```

**Validation**: Invalid beam colors should show error messages.

---

### Step 10: Handle Backward Compatibility

**File**: `src/lib/services/tierService.ts` (or wherever tier configs are loaded)

Ensure existing configurations without `lightBeam` get defaults:

```typescript
// When loading tier configuration
function loadTierConfiguration(config: TierConfiguration): TierConfiguration {
  // Ensure lightBeam property exists
  if (!config.lightBeam) {
    config.lightBeam = { enabled: false, color: null };
  }
  return config;
}
```

**Validation**: Existing tier configurations should work without errors.

---

### Step 11: Write Tests

**Files**: 
- `tests/unit/canvas/lightBeamEffect.test.ts`
- `tests/integration/lightBeamEffect.test.ts`
- `tests/e2e/light-beam-effect.spec.ts`

Follow existing test patterns. Test:
- Beam initialization from tier config
- Beam rendering with correct colors
- Beam fade-out animation
- Beam configuration UI
- Performance with multiple beams

**Validation**: All tests pass, coverage ≥80% for critical paths.

---

## Testing Checklist

- [ ] Beam effects appear when cards from configured tiers are dropped
- [ ] Beam colors match tier configuration
- [ ] Beams fade out over 5-8 seconds
- [ ] Beam configuration saves correctly in Tier Settings
- [ ] Beam enable/disable toggle works
- [ ] Color picker updates beam preview
- [ ] Invalid beam colors show validation errors
- [ ] Existing tier configurations work (backward compatibility)
- [ ] Performance maintained with 20+ simultaneous beams
- [ ] Beams render in correct z-order (between cards and labels)

## Next Steps

After completing implementation:
1. Run full test suite
2. Performance testing with 50+ cards
3. Accessibility testing (keyboard navigation, screen readers)
4. Visual testing (beam appearance, fade effects)
5. Update documentation if needed

