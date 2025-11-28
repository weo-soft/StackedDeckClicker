# Research: Light Beam Effect for Dropped Cards

**Feature**: 009-light-beam-effect  
**Date**: 2025-01-27  
**Status**: Complete

## Research Questions

### 1. Canvas API Best Practices for Rendering Light Beam Effects

**Question**: What is the most performant way to render upward-emitting light beam effects on HTML5 Canvas?

**Research Findings**:
- Canvas linear gradients are efficient for beam effects (similar to existing glow effects in codebase)
- Using `createLinearGradient()` with multiple color stops creates smooth beam fade
- Rendering order: background → effects → card objects → beams → labels (beams between cards and labels)
- Using `globalAlpha` for fade-out animation is performant
- Drawing beams as vertical rectangles with gradient fills is optimal for upward beams

**Decision**: Use `CanvasRenderingContext2D.createLinearGradient()` to create vertical gradients from card position upward. Apply gradient with color stops: full opacity at bottom (card position), fading to transparent at top. Use `globalAlpha` for overall fade-out animation over time.

**Rationale**: Linear gradients are native Canvas API, performant, and match existing visual effect patterns (glow borders, particle effects). Vertical gradient naturally creates upward beam effect.

**Alternatives Considered**:
- Radial gradients: More complex, less suitable for upward beam direction
- Image sprites: Higher memory usage, less flexible for color customization
- WebGL: Overkill for simple beam effect, adds complexity

---

### 2. Performance Optimization for Multiple Simultaneous Beam Effects

**Question**: How to maintain 60fps when rendering 20+ simultaneous beam effects?

**Research Findings**:
- Canvas operations are batched efficiently by browser
- Reusing gradient objects where possible reduces object creation overhead
- Limiting beam height and using efficient gradient color stops (3-4 stops max) improves performance
- Drawing beams in a single pass (loop through all cards) is more efficient than individual draws
- Using `requestAnimationFrame` (already in use) ensures smooth animation

**Decision**: 
- Render all beams in a single loop pass within Scene.render() method
- Create gradient objects once per beam (not per frame) and reuse during beam lifetime
- Limit gradient color stops to 3 (full color at bottom, mid fade, transparent at top)
- Use beam height proportional to canvas height (e.g., 30-40% of canvas height)
- Implement beam age tracking for fade-out (similar to card fade logic)

**Rationale**: Follows existing pattern from card rendering (single pass loops). Reusing gradient objects reduces GC pressure. Limited color stops maintain visual quality while optimizing performance.

**Alternatives Considered**:
- Offscreen canvas for beam effects: Adds complexity, minimal performance gain for this use case
- Web Workers for beam calculations: Overhead exceeds benefit for simple gradient rendering
- Beam pooling: Unnecessary for 20+ beams, adds complexity

---

### 3. Color Picker/Selection UI Patterns in Svelte

**Question**: What UI pattern should be used for beam color selection in TierSettings component?

**Research Findings**:
- Existing TierSettings component uses native HTML5 `<input type="color">` for color scheme editing
- Pattern includes both color picker and hex text input for flexibility
- Svelte reactivity handles color updates automatically
- Color validation follows existing color scheme validation patterns

**Decision**: Use the same pattern as existing color scheme editor:
- Native HTML5 color picker (`<input type="color">`)
- Hex text input for manual entry
- Visual preview showing beam color
- Reuse existing `handleColorChange` pattern for beam color updates

**Rationale**: Consistency with existing UI patterns reduces cognitive load. Users already familiar with color picker interface. Native color picker is accessible and keyboard navigable.

**Alternatives Considered**:
- Third-party color picker library: Adds dependency, unnecessary for simple use case
- Custom color picker component: Reinvents wheel, more maintenance overhead
- Predefined color palette: Less flexible, doesn't meet requirement for full color customization

---

### 4. Data Migration Strategy for Extending TierConfiguration

**Question**: How to extend TierConfiguration interface without breaking existing tier configurations?

**Research Findings**:
- Existing tier system uses versioned state (`TierConfigurationState.version`)
- Tier configurations are stored in IndexedDB via LocalForage
- Default tier configurations are created programmatically in `createDefaultTierConfigurations()`
- Tier service handles configuration updates via `updateTierConfiguration()`

**Decision**:
- Add optional `lightBeam` property to `TierConfiguration` interface (optional for backward compatibility)
- Default value: `{ enabled: false, color: null }` for existing tiers
- Migration: When loading existing configurations, check for `lightBeam` property; if missing, initialize with defaults
- Update `createDefaultTierConfigurations()` to include default beam settings (disabled by default)
- No version bump required (optional property maintains backward compatibility)

**Rationale**: Optional property ensures existing configurations continue to work. Default disabled state matches spec assumption. Migration happens transparently on first load.

**Alternatives Considered**:
- Version bump with explicit migration: Unnecessary for optional property addition
- Separate storage for beam config: Adds complexity, breaks tier configuration cohesion
- Required property with migration script: Risk of breaking existing configurations

---

### 5. Beam Effect Visual Layer and Z-Ordering

**Question**: Where should beam effects be rendered in the visual layer stack?

**Research Findings**:
- Current render order in Scene.render(): background → particle effects → card objects → labels → glow border
- Beam effects should be visible but not obscure card labels
- Beams should appear above card objects for visibility
- Labels must remain on top for readability

**Decision**: Render beams between card objects and labels:
- Render order: background → particle effects → card objects → **beams** → labels → glow border
- This ensures beams are visible above cards but don't obscure labels
- Beam opacity will fade over time, further reducing visual interference

**Rationale**: Matches spec requirement FR-013 (behind labels, above card objects). Maintains label readability while ensuring beam visibility. Follows existing layered rendering pattern.

**Alternatives Considered**:
- Beams above labels: Would obscure card names, violates spec requirement
- Beams below card objects: Would be hidden by cards, reduces visibility
- Separate beam pass after labels: Would require additional render pass, less efficient

---

### 6. Beam Effect Animation and Fade-Out

**Question**: How should beam effects animate and fade out over time?

**Research Findings**:
- Cards have age tracking (milliseconds since creation) in CardAnimation interface
- Cards fade out after 30 seconds (card object), labels fade after 40 seconds
- Beam effects should have finite duration per spec assumption
- Fade-out should be smooth and visually appealing

**Decision**:
- Track beam age in CardAnimation interface (reuse existing `age` property)
- Beam fades out over 5-8 second duration (shorter than card lifetime)
- Use exponential fade: full opacity for first 2 seconds, then fade to transparent over remaining duration
- Beam height can also reduce slightly during fade for more dynamic effect

**Rationale**: Finite duration prevents visual clutter. Shorter than card lifetime ensures beams don't persist unnecessarily. Exponential fade provides smooth visual transition. Reusing existing age tracking maintains consistency.

**Alternatives Considered**:
- Permanent beams: Violates spec assumption, creates visual clutter
- Instant disappearance: Less visually appealing, jarring user experience
- Linear fade only: Less dynamic, exponential fade more visually interesting

---

## Summary

All research questions resolved. Key decisions:
1. Use Canvas linear gradients for beam rendering (native, performant)
2. Render beams in single pass loop, reuse gradient objects
3. Use existing color picker pattern from TierSettings
4. Add optional `lightBeam` property to TierConfiguration (backward compatible)
5. Render beams between card objects and labels
6. Fade beams over 5-8 seconds using exponential fade

No blocking issues identified. Implementation can proceed to Phase 1 design.

