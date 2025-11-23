# Quickstart Guide: Card Label Click to View Details

**Feature**: 006-card-details-click  
**Date**: 2025-01-27

## Overview

This guide provides step-by-step instructions for implementing click detection on card labels in the yellow zone and displaying clicked card details in the purple zone. Follow these steps in order to ensure proper implementation.

## Prerequisites

- Understanding of Svelte component structure and events
- Familiarity with TypeScript interfaces
- Knowledge of HTML5 Canvas API and mouse events
- Understanding of existing canvas rendering system (Scene, CardAnimation)
- Access to existing LastCardZone component

## Implementation Steps

### Step 1: Extend Scene Class with Hit Testing

Update `src/lib/canvas/scene.ts`:

```typescript
export class Scene {
  // ... existing properties ...
  private hoveredCard: CardAnimation | null = null;

  /**
   * Get the card animation at a given label position.
   * Performs hit testing against all card labels, returning the topmost match.
   */
  getCardAtLabelPosition(x: number, y: number): CardAnimation | null {
    if (!this.cards || this.cards.length === 0) {
      return null;
    }

    // Iterate in reverse order (newest first, topmost)
    for (let i = this.cards.length - 1; i >= 0; i--) {
      const animation = this.cards[i];
      
      // Skip if card is too faded or removed
      if (animation.labelAlpha <= 0) {
        continue;
      }

      // Calculate absolute label position
      const labelX = animation.x + animation.labelX - animation.labelWidth / 2;
      const labelY = animation.y + animation.labelY;

      // Check if point is within label bounds
      if (
        x >= labelX &&
        x <= labelX + animation.labelWidth &&
        y >= labelY &&
        y <= labelY + animation.labelHeight
      ) {
        return animation;
      }
    }

    return null;
  }

  /**
   * Set the hovered card animation for visual feedback.
   */
  setHoveredCard(cardAnimation: CardAnimation | null): void {
    this.hoveredCard = cardAnimation;
  }

  /**
   * Get the currently hovered card animation.
   */
  getHoveredCard(): CardAnimation | null {
    return this.hoveredCard;
  }

  // ... existing methods ...
}
```

**Testing**: Create unit tests for `getCardAtLabelPosition()` with various scenarios (overlapping labels, empty array, edge cases).

### Step 2: Extend CanvasService with Click Handling

Update `src/lib/canvas/renderer.ts`:

```typescript
export class CanvasService {
  // ... existing properties ...
  private clickCallback: ((cardAnimation: CardAnimation) => void) | null = null;
  private hoverDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private lastHoverCheck: number = 0;
  private hoveredCard: CardAnimation | null = null;

  /**
   * Handle click event on canvas.
   */
  handleClick(x: number, y: number, event: MouseEvent): CardAnimation | null {
    if (!this.scene || !this.canvas) {
      return null;
    }

    // Validate coordinates
    if (x < 0 || x > this.canvas.width || y < 0 || y > this.canvas.height) {
      return null;
    }

    const cardAnimation = this.scene.getCardAtLabelPosition(x, y);
    
    if (cardAnimation && this.clickCallback) {
      this.clickCallback(cardAnimation);
    }

    return cardAnimation;
  }

  /**
   * Handle mouse move event on canvas for hover detection.
   */
  handleMouseMove(x: number, y: number, event: MouseEvent): void {
    if (!this.scene || !this.canvas) {
      return;
    }

    // Debounce hover checks (50ms)
    if (this.hoverDebounceTimer) {
      clearTimeout(this.hoverDebounceTimer);
    }

    this.hoverDebounceTimer = setTimeout(() => {
      const cardAnimation = this.scene?.getCardAtLabelPosition(x, y) || null;
      
      if (cardAnimation !== this.hoveredCard) {
        this.hoveredCard = cardAnimation;
        this.scene?.setHoveredCard(cardAnimation);
        this.updateCursorStyle();
      }

      this.lastHoverCheck = Date.now();
    }, 50);
  }

  /**
   * Handle mouse leave event on canvas.
   */
  handleMouseLeave(): void {
    if (this.hoverDebounceTimer) {
      clearTimeout(this.hoverDebounceTimer);
      this.hoverDebounceTimer = null;
    }

    this.hoveredCard = null;
    this.scene?.setHoveredCard(null);
    this.updateCursorStyle();
  }

  /**
   * Set callback for click events.
   */
  setClickCallback(callback: ((cardAnimation: CardAnimation) => void) | null): void {
    this.clickCallback = callback;
  }

  /**
   * Update canvas cursor style based on hover state.
   */
  private updateCursorStyle(): void {
    if (this.canvas) {
      this.canvas.style.cursor = this.hoveredCard ? 'pointer' : 'default';
    }
  }

  // ... existing methods ...
}
```

**Testing**: Create unit tests for click and hover handling, including debouncing behavior.

### Step 3: Update GameCanvas Component with Event Handlers

Update `src/lib/components/GameCanvas.svelte`:

```typescript
<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { canvasService } from '../canvas/renderer.js';
  import type { DivinationCard } from '../models/Card.js';
  import type { ZoneLayout } from '../models/ZoneLayout.js';
  import type { CardDrawResult } from '../models/CardDrawResult.js';
  import type { CardAnimation } from '../canvas/cardAnimation.js';

  export let width: number = 800;
  export let height: number = 600;
  export let zoneLayout: ZoneLayout | null = null;
  export let zoneBoundaryValidator: ((x: number, y: number) => boolean) | null = null;

  let canvasElement: HTMLCanvasElement;
  let initialized = false;
  let lastZoneLayout: ZoneLayout | null = null;
  let lastZoneBoundaryValidator: ((x: number, y: number) => boolean) | null = null;

  const dispatch = createEventDispatcher<{
    cardLabelClick: CardDrawResult;
  }>();

  // Convert CardAnimation to CardDrawResult
  function convertAnimationToCardDraw(animation: CardAnimation): CardDrawResult {
    return {
      card: animation.card,
      timestamp: Date.now(),
      scoreGained: animation.card.value
    };
  }

  // Handle canvas click
  function handleCanvasClick(event: MouseEvent): void {
    if (!initialized || !canvasElement) {
      return;
    }

    const rect = canvasElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convert to canvas coordinates (account for scaling if needed)
    const scaleX = canvasElement.width / rect.width;
    const scaleY = canvasElement.height / rect.height;
    const canvasX = x * scaleX;
    const canvasY = y * scaleY;

    const cardAnimation = canvasService.handleClick(canvasX, canvasY, event);
    
    if (cardAnimation) {
      const cardDrawResult = convertAnimationToCardDraw(cardAnimation);
      dispatch('cardLabelClick', cardDrawResult);
    }
  }

  // Handle canvas mouse move
  function handleCanvasMouseMove(event: MouseEvent): void {
    if (!initialized || !canvasElement) {
      return;
    }

    const rect = canvasElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const scaleX = canvasElement.width / rect.width;
    const scaleY = canvasElement.height / rect.height;
    const canvasX = x * scaleX;
    const canvasY = y * scaleY;

    canvasService.handleMouseMove(canvasX, canvasY, event);
  }

  // Handle canvas mouse leave
  function handleCanvasMouseLeave(): void {
    if (initialized) {
      canvasService.handleMouseLeave();
    }
  }

  onMount(() => {
    if (canvasElement) {
      try {
        canvasService.initialize(canvasElement, width, height, zoneLayout, zoneBoundaryValidator);
        canvasService.start();
        initialized = true;
        lastZoneLayout = zoneLayout;
        lastZoneBoundaryValidator = zoneBoundaryValidator;

        // Set up click callback
        canvasService.setClickCallback((cardAnimation) => {
          const cardDrawResult = convertAnimationToCardDraw(cardAnimation);
          dispatch('cardLabelClick', cardDrawResult);
        });

        // Add event listeners
        canvasElement.addEventListener('click', handleCanvasClick);
        canvasElement.addEventListener('mousemove', handleCanvasMouseMove);
        canvasElement.addEventListener('mouseleave', handleCanvasMouseLeave);
      } catch (error) {
        console.error('Failed to initialize canvas:', error);
      }
    }
  });

  // ... existing reactive statements for zone layout updates ...

  onDestroy(() => {
    if (canvasElement) {
      canvasElement.removeEventListener('click', handleCanvasClick);
      canvasElement.removeEventListener('mousemove', handleCanvasMouseMove);
      canvasElement.removeEventListener('mouseleave', handleCanvasMouseLeave);
    }
    canvasService.destroy();
  });

  // ... existing methods (addCard, clearCards) ...
</script>

<canvas
  bind:this={canvasElement}
  width={width}
  height={height}
  style="display: block; border: 1px solid #444; border-radius: 4px; background-color: #1a1a2e;"
  aria-label="Game canvas showing card drops and visual effects"
  aria-describedby="canvas-description"
  tabindex="0"
  role="application"
></canvas>
```

**Testing**: Create integration tests for event handling and event dispatch.

### Step 4: Update drawCardLabel for Hover Feedback

Update `src/lib/canvas/cardAnimation.ts`:

```typescript
/**
 * Draw a prominent label showing the card name.
 * Style varies based on card value tier.
 * Exported for use in layered rendering.
 */
export function drawCardLabel(
  ctx: CanvasRenderingContext2D,
  animation: CardAnimation,
  isHovered: boolean = false
): void {
  ctx.save();

  const labelPadding = 10;
  const labelHeight = 26;
  const fontSize = 15;
  
  // Measure text to determine label width
  ctx.font = `bold ${fontSize}px Arial`;
  const textMetrics = ctx.measureText(animation.card.name.toUpperCase());
  const labelWidth = textMetrics.width + labelPadding * 2;
  
  // Cache label dimensions for collision detection
  animation.labelWidth = labelWidth;
  animation.labelHeight = labelHeight;

  // Position label using stored offsets (adjusted to avoid overlaps)
  const labelX = animation.x + animation.labelX - labelWidth / 2;
  const labelY = animation.y + animation.labelY;

  // Get label style from tier system (with fallback)
  const style = getLabelStyle(animation.card);

  // Apply hover effect if hovered
  let backgroundColor = style.backgroundColor;
  let borderWidth = style.borderWidth;
  let borderColor = style.borderColor;

  if (isHovered) {
    // Lighten background or add border for hover feedback
    backgroundColor = lightenColor(backgroundColor, 0.2);
    borderWidth = Math.max(borderWidth, 2);
    borderColor = '#ffffff';
  }

  // Draw label background
  ctx.globalAlpha = animation.labelAlpha * style.opacity;
  ctx.fillStyle = backgroundColor;
  
  // Draw rectangle (no rounded corners)
  ctx.fillRect(labelX, labelY, labelWidth, labelHeight);

  // Only draw border if borderWidth > 0
  if (borderWidth > 0) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(labelX, labelY, labelWidth, labelHeight);
  }

  // Draw card name text
  ctx.globalAlpha = animation.labelAlpha;
  ctx.fillStyle = style.textColor;
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    animation.card.name.toUpperCase(),
    labelX + labelWidth / 2,
    labelY + labelHeight / 2
  );

  ctx.restore();
}

// Helper function to lighten color
function lightenColor(color: string, amount: number): string {
  // Simple color lightening - can be enhanced
  if (color.startsWith('#')) {
    const num = parseInt(color.slice(1), 16);
    const r = Math.min(255, ((num >> 16) & 0xff) + Math.floor(255 * amount));
    const g = Math.min(255, ((num >> 8) & 0xff) + Math.floor(255 * amount));
    const b = Math.min(255, (num & 0xff) + Math.floor(255 * amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }
  return color;
}
```

Update `src/lib/canvas/scene.ts` render method to pass hover state:

```typescript
render(ctx: CanvasRenderingContext2D): void {
  // ... existing rendering code ...

  // Draw labels
  for (const animation of this.cards) {
    if (animation.labelAlpha > 0) {
      const isHovered = animation === this.hoveredCard;
      drawCardLabel(ctx, animation, isHovered);
    }
  }
}
```

**Testing**: Create visual regression tests for hover effects.

### Step 5: Update LastCardZone to Accept Clicked Card

Update `src/lib/components/LastCardZone.svelte`:

```typescript
<script lang="ts">
  // ... existing imports ...

  export let width: number;
  export let height: number;
  export let lastCardDraw: CardDrawResult | null = null;
  export let clickedCard: CardDrawResult | null = null; // NEW prop
  export let style: string = '';

  // ... existing state variables ...

  // Determine which card to display (clickedCard takes precedence)
  $: displayCard = clickedCard || lastCardDraw;

  // Handle card draw changes - reactive statement
  $: if (displayCard) {
    const cardId = `${displayCard.card.name}-${displayCard.timestamp}`;
    // Only process if it's a new card
    if (cardId !== currentCardId) {
      currentCardId = cardId;
      loadCardData(displayCard);
    }
  } else {
    currentCardId = null;
    cardDisplayData = null;
    imageState = { url: null, loading: false, error: false };
    if (currentLoadAbort) {
      currentLoadAbort.abort();
      currentLoadAbort = null;
    }
  }

  // ... rest of existing code ...
</script>
```

**Testing**: Create integration tests for prop precedence (clickedCard over lastCardDraw).

### Step 6: Update GameAreaLayout to Handle Click Events

Update `src/lib/components/GameAreaLayout.svelte`:

```typescript
<script lang="ts">
  // ... existing imports ...
  import type { CardDrawResult } from '../models/CardDrawResult.js';

  // ... existing props and state ...

  // State for clicked card
  let clickedCard: CardDrawResult | null = null;

  // Handle card label click event from GameCanvas
  function handleCardLabelClick(event: CustomEvent<CardDrawResult>): void {
    clickedCard = event.detail;
  }

  // Optional: Clear clicked card when new card is drawn
  $: if (lastCardDraw && clickedCard) {
    // Option 1: Keep clicked card (user explicitly selected it)
    // Do nothing - clickedCard remains
    
    // Option 2: Clear clicked card to show new draw
    // clickedCard = null;
  }
</script>

<!-- ... existing template ... -->

<AmbientSceneZone
  bind:this={ambientSceneZoneRef}
  width={whiteZone.width}
  height={whiteZone.height}
  gameState={gameState}
  zoneLayout={layout}
  onCardDrop={handleCardDrop}
  style={whiteZoneStyle}
>
  <GameCanvas
    slot="canvas"
    width={whiteZone.width}
    height={whiteZone.height}
    zoneLayout={layout}
    zoneBoundaryValidator={zoneBoundaryValidator}
    on:cardLabelClick={handleCardLabelClick}
  />
</AmbientSceneZone>

<!-- ... other zones ... -->

<LastCardZone
  width={purpleZone.width}
  height={purpleZone.height}
  lastCardDraw={lastCardDraw}
  clickedCard={clickedCard}
  style={purpleZoneStyle}
/>
```

**Testing**: Create E2E tests for complete click flow.

### Step 7: Add Keyboard Accessibility (Optional but Recommended)

Update `GameCanvas.svelte` to add keyboard navigation:

```typescript
let focusedCardIndex: number = -1;

function handleKeyDown(event: KeyboardEvent): void {
  if (!initialized || !canvasElement) {
    return;
  }

  // Get all visible cards
  const visibleCards = scene?.getCards() || [];
  
  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowUp':
      event.preventDefault();
      if (visibleCards.length === 0) return;
      
      if (focusedCardIndex === -1) {
        focusedCardIndex = 0;
      } else {
        focusedCardIndex = event.key === 'ArrowDown'
          ? (focusedCardIndex + 1) % visibleCards.length
          : (focusedCardIndex - 1 + visibleCards.length) % visibleCards.length;
      }
      
      // Visual feedback for focused card
      // Could highlight focused card label
      break;
      
    case 'Enter':
    case ' ':
      event.preventDefault();
      if (focusedCardIndex >= 0 && focusedCardIndex < visibleCards.length) {
        const cardAnimation = visibleCards[focusedCardIndex];
        const cardDrawResult = convertAnimationToCardDraw(cardAnimation);
        dispatch('cardLabelClick', cardDrawResult);
      }
      break;
  }
}
```

**Testing**: Create accessibility tests for keyboard navigation.

## Testing Checklist

- [ ] Unit tests for Scene.getCardAtLabelPosition() with overlapping labels
- [ ] Unit tests for CanvasService click and hover handling
- [ ] Integration tests for GameCanvas event dispatch
- [ ] Integration tests for GameAreaLayout state management
- [ ] Integration tests for LastCardZone prop precedence
- [ ] E2E tests for user clicking labels
- [ ] E2E tests for hover visual feedback
- [ ] E2E tests for overlapping label handling
- [ ] Performance tests for click detection (<50ms)
- [ ] Performance tests for purple zone update (<200ms)
- [ ] Accessibility tests for keyboard navigation

## Common Issues and Solutions

### Issue: Clicks not detected

**Solution**: 
- Verify canvas coordinates are calculated correctly (account for scaling)
- Check that label bounds are calculated correctly
- Ensure event listeners are attached after canvas initialization

### Issue: Hover feedback not appearing

**Solution**:
- Verify debounce timer is working correctly
- Check that Scene.setHoveredCard() is called
- Ensure canvas redraw is triggered after hover state change

### Issue: Overlapping labels select wrong card

**Solution**:
- Verify iteration order (reverse, newest first)
- Check label bounds calculation
- Ensure hit test returns first match (topmost)

### Issue: Purple zone not updating

**Solution**:
- Verify event is dispatched correctly
- Check GameAreaLayout state update
- Ensure LastCardZone reactive statement triggers

## Next Steps

After completing these steps:

1. Run all tests to verify functionality
2. Test with various scenarios (overlapping labels, rapid clicks, etc.)
3. Verify performance meets requirements (<50ms click, <200ms update)
4. Test accessibility (keyboard navigation, screen readers)
5. Update documentation if needed

