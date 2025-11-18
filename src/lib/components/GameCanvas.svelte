<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { canvasService } from '../canvas/renderer.js';
  import type { DivinationCard } from '../models/Card.js';
  import type { ZoneLayout } from '../models/ZoneLayout.js';

  export let width: number = 800;
  export let height: number = 600;
  export let zoneLayout: ZoneLayout | null = null;
  export let zoneBoundaryValidator: ((x: number, y: number) => boolean) | null = null;

  let canvasElement: HTMLCanvasElement;
  let initialized = false;
  let lastZoneLayout: ZoneLayout | null = null;
  let lastZoneBoundaryValidator: ((x: number, y: number) => boolean) | null = null;

  onMount(() => {
    if (canvasElement) {
      try {
        canvasService.initialize(canvasElement, width, height, zoneLayout, zoneBoundaryValidator);
        canvasService.start();
        initialized = true;
        lastZoneLayout = zoneLayout;
        lastZoneBoundaryValidator = zoneBoundaryValidator;
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
  aria-label="Game canvas showing card drops and visual effects"
  aria-describedby="canvas-description"
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

