# Research: Purple Zone Card Graphical Display

**Feature**: 003-display-dropped-card  
**Date**: 2025-01-27  
**Purpose**: Resolve technical unknowns and establish implementation patterns

## Research Tasks

### 1. Adapting Vue Component to Svelte

**Task**: Research how to convert the Vue-based DivinationCard component to Svelte while maintaining the same visual layout and styling.

**Findings**:
- **Decision**: Use Svelte's reactive statements (`$:`) for computed properties, `<img>` tags with `src` bindings for images, and scoped styles for CSS
- **Rationale**: 
  - Svelte compiles to vanilla JavaScript, making it more performant than Vue's runtime
  - Reactive statements provide the same functionality as Vue's computed properties
  - Svelte's template syntax is similar enough to Vue that the structure can be directly adapted
  - Scoped styles in Svelte work similarly to Vue's scoped styles
- **Alternatives considered**:
  - Using a Vue component within Svelte: Rejected - adds unnecessary complexity and bundle size
  - Rewriting from scratch: Rejected - the Vue component provides a proven layout structure

**Implementation Notes**:
- Convert `computed()` to Svelte reactive statements: `$: cardWidth = props.width ?? 300`
- Convert `defineProps<PropsInterface>()` to Svelte props: `export let card: DivinationCard`
- Use Svelte's `{#if}` blocks instead of Vue's `v-if`
- Use `:style` bindings directly (same syntax in both)
- Convert `v-html` to Svelte's `{@html}` directive for styled text rendering

### 2. Image Loading Patterns in SvelteKit

**Task**: Determine the best approach for loading card art images in SvelteKit, considering static assets and dynamic image paths.

**Findings**:
- **Decision**: Use Vite's static asset imports with `import.meta.glob()` for build-time optimization, with fallback to runtime path resolution using `resolvePath()` utility
- **Rationale**:
  - `import.meta.glob()` allows Vite to optimize and bundle images at build time
  - Static assets in `/static/` are served directly and can be referenced with absolute paths
  - The existing `resolvePath()` utility handles base URL for deployment scenarios
  - Runtime path resolution provides flexibility for dynamic card selection
- **Alternatives considered**:
  - Only static imports: Rejected - would require importing 450+ images individually, increasing bundle size
  - Only runtime paths: Rejected - misses Vite's optimization benefits
  - Hybrid approach: **Selected** - Use glob for known images, runtime paths with error handling for missing images

**Implementation Pattern**:
```typescript
// Build-time optimization for common cards
const cardArtModules = import.meta.glob('/static/cards/cardArt/*.png', { eager: false });

// Runtime path resolution with fallback
function getCardArtUrl(artFilename: string): string | undefined {
  const modulePath = Object.keys(cardArtModules).find(path => 
    path.includes(`${artFilename}.png`)
  );
  return modulePath ? cardArtModules[modulePath]?.default : resolvePath(`/cards/cardArt/${artFilename}.png`);
}
```

### 3. Card Rendering with Frame and Separator Overlays

**Task**: Research best practices for layering card artwork, frame, and separator images using CSS positioning.

**Findings**:
- **Decision**: Use absolute positioning with z-index layering, similar to the Vue component structure
- **Rationale**:
  - Absolute positioning allows precise control over element placement
  - Z-index ensures proper layering: frame (top), separator (middle), art (bottom)
  - CSS `object-fit: cover` for artwork ensures proper aspect ratio handling
  - Percentage-based positioning (4%, 8%, 9%, etc.) provides responsive scaling
- **Alternatives considered**:
  - Canvas rendering: Rejected - more complex, harder to maintain, less accessible
  - SVG overlays: Rejected - frame/separator are PNG images, not vector graphics
  - CSS Grid: Rejected - absolute positioning provides more precise control for overlay effects

**Layer Structure** (z-index order, bottom to top):
1. Card artwork image (z-index: 1)
2. Separator image (z-index: 3)
3. Frame image (z-index: 2, but pointer-events: none)
4. Text content (z-index: 4)

### 4. Handling Missing Card Artwork Gracefully

**Task**: Determine fallback strategy when card artwork files are missing or fail to load.

**Findings**:
- **Decision**: Multi-tier fallback: try optimized import → try runtime path → display placeholder → fallback to text-only display
- **Rationale**:
  - Graceful degradation ensures the feature never breaks the UI
  - Placeholder image provides visual consistency
  - Text-only fallback maintains existing functionality
  - Error handling prevents console errors and user-facing issues
- **Alternatives considered**:
  - Fail silently: Rejected - users should see something, even if not the full card
  - Throw errors: Rejected - breaks user experience
  - Only text fallback: Rejected - doesn't meet the graphical display requirement

**Implementation Strategy**:
```typescript
interface CardImageState {
  url: string | null;
  loading: boolean;
  error: boolean;
}

function loadCardImage(artFilename: string): Promise<CardImageState> {
  // Try optimized import first
  // Then try runtime path
  // On error, return error state for placeholder/fallback
}
```

### 5. Performance Optimization for Image Loading

**Task**: Research techniques to optimize card image loading to meet <500ms load time requirement.

**Findings**:
- **Decision**: Implement image preloading for recently drawn cards, lazy loading for card art, and image caching
- **Rationale**:
  - Preloading next likely cards reduces perceived load time
  - Lazy loading prevents loading all 450+ images upfront
  - Browser caching handles repeat views efficiently
  - Vite's build-time optimization reduces image sizes
- **Alternatives considered**:
  - Load all images upfront: Rejected - too slow initial load, wastes bandwidth
  - No preloading: Rejected - doesn't meet <500ms requirement for common cards
  - Service worker caching: Considered but deferred - browser cache is sufficient for MVP

**Optimization Techniques**:
1. Preload frame and separator images (used for all cards)
2. Lazy load card art only when card is drawn
3. Use `<img loading="lazy">` attribute for non-critical images
4. Implement image loading state to show placeholder during load
5. Cache loaded images in memory to avoid re-fetching

### 6. Styled Text Rendering (PoE Metadata Parsing)

**Task**: Research how to parse and render Path of Exile styled text metadata (`<tag>{text}`) in Svelte.

**Findings**:
- **Decision**: Adapt the Vue component's `parseStyledText()` function to Svelte, using `{@html}` directive for rendering
- **Rationale**:
  - The Vue implementation provides a proven parsing algorithm
  - Svelte's `{@html}` directive works similarly to Vue's `v-html`
  - HTML escaping is still required for security (XSS prevention)
  - CSS classes for styling can be directly ported
- **Alternatives considered**:
  - Markdown parsing: Rejected - PoE uses custom metadata format, not markdown
  - Rich text editor: Rejected - overkill for simple tag parsing
  - Plain text: Rejected - loses important visual styling information

**Security Considerations**:
- Always escape HTML before parsing tags
- Use `{@html}` only for trusted, parsed content
- Validate tag names against whitelist
- Sanitize text content to prevent XSS

### 7. Responsive Scaling for Purple Zone

**Task**: Determine how to scale card display appropriately when purple zone is resized.

**Findings**:
- **Decision**: Use CSS `transform: scale()` or percentage-based sizing with container queries, maintaining aspect ratio
- **Rationale**:
  - Purple zone has fixed base dimensions (200x220px from zone layout)
  - Card display should scale proportionally with zone size
  - Aspect ratio of card (300:455) must be maintained
  - Percentage-based positioning scales automatically
- **Alternatives considered**:
  - Fixed pixel sizes: Rejected - doesn't scale with zone resizing
  - Viewport units: Rejected - not tied to zone dimensions
  - JavaScript-based scaling: Rejected - CSS is more performant

**Scaling Approach**:
- Base card width: 300px (from Vue component)
- Calculate scale factor: `zoneWidth / 300`
- Apply scale to all font sizes and positioning
- Use `transform: scale()` or percentage-based calculations

## Summary of Decisions

| Decision Area | Chosen Approach | Key Rationale |
|---------------|----------------|---------------|
| Component Framework | Svelte (adapt from Vue) | Direct adaptation possible, better performance |
| Image Loading | Hybrid (glob + runtime paths) | Optimizes common cases, flexible for all cards |
| Overlay Rendering | CSS absolute positioning | Precise control, proven pattern |
| Missing Image Handling | Multi-tier fallback | Graceful degradation, maintains UX |
| Performance | Preloading + lazy loading | Meets <500ms requirement |
| Text Styling | Parse PoE metadata to HTML | Preserves visual styling |
| Responsive Scaling | CSS-based with scale factor | Maintains aspect ratio, performs well |

## Open Questions Resolved

All technical unknowns have been resolved through research. No [NEEDS CLARIFICATION] markers remain.

## Next Steps

Proceed to Phase 1: Design & Contracts to define data models, API contracts, and implementation structure.

