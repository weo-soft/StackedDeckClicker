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

  /**
   * Convert CardAnimation to CardDrawResult for display in purple zone.
   * 
   * @param animation - CardAnimation to convert
   * @returns CardDrawResult with card data, current timestamp, and card value as score
   */
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

  // Keyboard navigation state
  let focusedCardIndex: number = -1;

  // Handle keyboard navigation
  function handleKeyDown(event: KeyboardEvent): void {
    if (!initialized || !canvasElement) {
      return;
    }

    // Get visible cards from canvas service
    const visibleCards = canvasService.getCards();
    
    if (visibleCards.length === 0) {
      return;
    }
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (focusedCardIndex === -1) {
          focusedCardIndex = 0;
        } else {
          focusedCardIndex = (focusedCardIndex + 1) % visibleCards.length;
        }
        // Visual feedback for focused card could be added here
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        if (focusedCardIndex === -1) {
          focusedCardIndex = visibleCards.length - 1;
        } else {
          focusedCardIndex = (focusedCardIndex - 1 + visibleCards.length) % visibleCards.length;
        }
        // Visual feedback for focused card could be added here
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
        canvasElement.addEventListener('keydown', handleKeyDown);
      } catch (error) {
        console.error('Failed to initialize canvas:', error);
      }
    }
  });

  // Update zone layout when it changes (including when it changes from null to a value)
  $: if (initialized && canvasElement) {
    // Check if zone layout actually changed
    const layoutChanged = zoneLayout !== lastZoneLayout;
    const validatorChanged = zoneBoundaryValidator !== lastZoneBoundaryValidator;
    
    if (layoutChanged || validatorChanged) {
      // Reinitialize with new zone layout
      console.log('GameCanvas: Zone layout changed, reinitializing canvas', {
        hasZoneLayout: !!zoneLayout,
        hasValidator: !!zoneBoundaryValidator,
        layoutChanged,
        validatorChanged,
        wasNull: lastZoneLayout === null,
        isNowNull: zoneLayout === null
      });
      canvasService.destroy();
      try {
        canvasService.initialize(canvasElement, width, height, zoneLayout, zoneBoundaryValidator);
        canvasService.start();
        lastZoneLayout = zoneLayout;
        lastZoneBoundaryValidator = zoneBoundaryValidator;
      } catch (error) {
        console.error('Failed to reinitialize canvas with zone layout:', error);
      }
    }
  }

  onDestroy(() => {
    if (canvasElement) {
      canvasElement.removeEventListener('click', handleCanvasClick);
      canvasElement.removeEventListener('mousemove', handleCanvasMouseMove);
      canvasElement.removeEventListener('mouseleave', handleCanvasMouseLeave);
      canvasElement.removeEventListener('keydown', handleKeyDown);
    }
    canvasService.destroy();
  });

  /**
   * Add a card to the canvas (called from parent).
   */
  export function addCard(card: DivinationCard, position?: { x: number; y: number }): void {
    if (initialized) {
      canvasService.addCard(card, position);
    }
  }

  /**
   * Clear all cards from canvas.
   */
  export function clearCards(): void {
    if (initialized) {
      canvasService.clearCards();
    }
  }
</script>

<canvas
  bind:this={canvasElement}
  width={width}
  height={height}
  style="display: block; border: 1px solid #444; border-radius: 4px; background-color: #1a1a2e;"
  aria-label="Game canvas showing card drops and visual effects. Use arrow keys to navigate cards, Enter or Space to view details."
  aria-describedby="canvas-description"
  tabindex="0"
  role="application"
  aria-keyshortcuts="ArrowDown ArrowUp Enter Space"
></canvas>
<div id="canvas-description" class="sr-only">
  Interactive canvas displaying divination cards as they are drawn. Cards appear with blue labels showing their names.
</div>

<style>
  canvas {
    max-width: 100%;
    height: auto;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>

