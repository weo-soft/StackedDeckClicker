<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { zoneLayoutService } from '../services/zoneLayoutService.js';
  import type { ZoneLayout } from '../models/ZoneLayout.js';
  import { ZoneType } from '../models/ZoneLayout.js';
  import type { GameState } from '../models/GameState.js';
  import type { UpgradeType } from '../models/types.js';
  import AmbientSceneZone from './AmbientSceneZone.svelte';
  import UpgradeStoreZone from './UpgradeStoreZone.svelte';
  import StateInfoZone from './StateInfoZone.svelte';
  import InventoryZone from './InventoryZone.svelte';
  import LastCardZone from './LastCardZone.svelte';
  import type { CardDrawResult } from '../models/CardDrawResult.js';

  export let gameState: GameState;
  export let onDeckOpen: (() => void) | undefined = undefined;
  export let onUpgradePurchase: ((upgradeType: UpgradeType) => void) | undefined = undefined;
  export let onAddDecks: (() => void) | undefined = undefined;
  export let onAddChaos: (() => void) | undefined = undefined;
  export let lastCardDraw: CardDrawResult | null = null;

  // State for clicked card
  let clickedCard: CardDrawResult | null = null;

  // Handle card label click event from GameCanvas
  function handleCardLabelClick(event: CustomEvent<CardDrawResult>): void {
    // Validate event data
    if (!event.detail || !event.detail.card) {
      console.warn('Invalid card data in click event:', event.detail);
      return;
    }
    
    clickedCard = event.detail;
  }

  // Track the timestamp of lastCardDraw to detect when it changes
  let lastCardDrawTimestamp: number | null = null;

  // Clear clicked card when a new card is dropped, so the purple zone shows the newly dropped card
  // This ensures that when a new card is drawn, it takes precedence over any previously clicked card
  $: {
    try {
      if (lastCardDraw && lastCardDraw.timestamp !== undefined) {
        const currentTimestamp = lastCardDraw.timestamp;
        // If lastCardDraw has changed (different timestamp), clear clickedCard
        if (lastCardDrawTimestamp !== null && lastCardDrawTimestamp !== currentTimestamp && clickedCard) {
          clickedCard = null;
        }
        lastCardDrawTimestamp = currentTimestamp;
      } else {
        // If lastCardDraw is cleared, also clear the timestamp
        lastCardDrawTimestamp = null;
      }
    } catch (error) {
      // Silently handle any errors in the reactive statement to prevent breaking the app
      console.warn('Error in GameAreaLayout reactive statement:', error);
    }
  }

  let containerElement: HTMLDivElement;
  // Default dimensions (will be updated by ResizeObserver to actual container size)
  let containerWidth = 1280;
  let containerHeight = 720;
  let ambientSceneZoneRef: AmbientSceneZone | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let resizeDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  const RESIZE_DEBOUNCE_MS = 150; // Debounce resize events by 150ms
  
  // Track if ResizeObserver is set up to avoid duplicate setup
  let resizeObserverSetup = false;
  
  // Initialize layout with default dimensions (will be updated when container is measured)
  // All coordinates are now relative and will scale automatically with container size
  let layout: ZoneLayout = zoneLayoutService.initializeLayout(containerWidth, containerHeight);

  // Expose ambient scene zone for card adding
  export function getAmbientSceneZone(): AmbientSceneZone | null {
    return ambientSceneZoneRef;
  }

  onMount(() => {
    // Wait for next tick to ensure container is fully rendered with proper dimensions
    setTimeout(() => {
      if (!containerElement) return;
      
      // Get actual rendered dimensions from CSS
      const rect = containerElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        console.warn('GameAreaLayout: Container has invalid dimensions on mount', rect);
        // Try again after a short delay
        setTimeout(() => {
          if (containerElement) {
            const retryRect = containerElement.getBoundingClientRect();
            if (retryRect.width > 0 && retryRect.height > 0) {
              // Update layout with actual container dimensions
              updateLayout(retryRect.width, retryRect.height);
              setupResizeObserver();
            } else {
              console.error('GameAreaLayout: Container still has invalid dimensions after retry', retryRect);
            }
          }
        }, 100);
        return;
      }

      // Update layout with actual container dimensions (from CSS)
      updateLayout(rect.width, rect.height);
      
      // Log for debugging
      console.log('GameAreaLayout on mount:', {
        containerWidth: rect.width,
        containerHeight: rect.height,
        zones: Array.from(layout.zones.entries()).map(([type, zone]) => ({
          type,
          x: zone.x,
          y: zone.y,
          width: zone.width,
          height: zone.height
        })),
        hasYellowZone: layout.zones.has(ZoneType.YELLOW),
        yellowZone: layout.zones.has(ZoneType.YELLOW) ? layout.zones.get(ZoneType.YELLOW) : null
      });

      setupResizeObserver();
    }, 0);
  });

  function setupResizeObserver() {
    if (!containerElement || typeof ResizeObserver === 'undefined' || resizeObserverSetup) return;
    
    resizeObserverSetup = true;

    resizeObserver = new ResizeObserver((entries) => {
      // Clear existing debounce timer
      if (resizeDebounceTimer) {
        clearTimeout(resizeDebounceTimer);
      }

      // Debounce resize handling
      resizeDebounceTimer = setTimeout(() => {
        const entry = entries[0];
        if (entry) {
          const { width, height } = entry.contentRect;
          // Validate dimensions before resizing (must be > 0)
          if (width > 0 && height > 0) {
            // Only update if dimensions actually changed significantly (>10px difference)
            if (Math.abs(width - containerWidth) > 10 || Math.abs(height - containerHeight) > 10) {
              handleLayoutResize(width, height);
            }
          } else {
            console.warn('ResizeObserver: Invalid dimensions detected', { width, height });
          }
        }
      }, RESIZE_DEBOUNCE_MS);
    });

    resizeObserver.observe(containerElement);
  }

  onDestroy(() => {
    // Cleanup resize observer and debounce timer
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    if (resizeDebounceTimer) {
      clearTimeout(resizeDebounceTimer);
      resizeDebounceTimer = null;
    }
  });

  function updateLayout(newWidth: number = containerWidth, newHeight: number = containerHeight) {
    // Validate dimensions before updating
    if (newWidth <= 0 || newHeight <= 0) {
      console.warn('updateLayout: Invalid dimensions, skipping update', { newWidth, newHeight });
      return;
    }
    // Update container dimensions
    containerWidth = newWidth;
    containerHeight = newHeight;
    // Resize layout with new dimensions (relative coordinates automatically scale)
    layout = zoneLayoutService.resizeLayout(layout, newWidth, newHeight);
  }

  function handleZoneInteraction(zoneType: ZoneType, event: MouseEvent | KeyboardEvent) {
    // Route interactions to correct zone handlers
    // This will be expanded as zone components are implemented
  }

  function handleLayoutResize(newWidth: number, newHeight: number) {
    // Validate dimensions before handling resize
    if (newWidth <= 0 || newHeight <= 0) {
      console.warn('handleLayoutResize: Invalid dimensions, skipping resize', { newWidth, newHeight });
      return;
    }
    updateLayout(newWidth, newHeight);
  }
</script>

<div
  bind:this={containerElement}
  class="game-area-layout"
  role="main"
  aria-label="Game area with zone-based layout"
  data-testid="game-area-layout"
>
  <!-- White Zone: Ambient Scene -->
    {#if layout.zones.has(ZoneType.WHITE)}
      {@const whiteZone = layout.zones.get(ZoneType.WHITE)}
      {#if whiteZone}
        <AmbientSceneZone
          bind:this={ambientSceneZoneRef}
          width={whiteZone.width}
          height={whiteZone.height}
          {gameState}
          zoneLayout={layout}
          on:cardLabelClick={handleCardLabelClick}
          style="position: absolute; left: {whiteZone.x}px; top: {whiteZone.y}px; width: {whiteZone.width}px; height: {whiteZone.height}px; z-index: 1;"
          role="region"
          aria-label="Ambient scene zone where cards drop"
        />
      {/if}
    {/if}

    <!-- Blue Zone: Upgrade Store -->
    {#if layout.zones.has(ZoneType.BLUE)}
      {@const blueZone = layout.zones.get(ZoneType.BLUE)}
      {#if blueZone}
        <UpgradeStoreZone
          width={blueZone.width}
          height={blueZone.height}
          {gameState}
          onUpgradePurchase={onUpgradePurchase}
          style="position: absolute; left: {blueZone.x}px; top: {blueZone.y}px; width: {blueZone.width}px; height: {blueZone.height}px; z-index: 10;"
          role="region"
          aria-label="Upgrade store zone"
        />
      {/if}
    {/if}

    <!-- Orange Zone: State Information -->
    {#if layout.zones.has(ZoneType.ORANGE)}
      {@const orangeZone = layout.zones.get(ZoneType.ORANGE)}
      {#if orangeZone}
        <StateInfoZone
          width={orangeZone.width}
          height={orangeZone.height}
          {gameState}
          style="position: absolute; left: {orangeZone.x}px; top: {orangeZone.y}px; width: {orangeZone.width}px; height: {orangeZone.height}px; z-index: 10;"
          role="region"
          aria-label="State information zone"
        />
      {/if}
    {/if}

    <!-- Green Zone: Inventory -->
    {#if layout.zones.has(ZoneType.GREEN)}
      {@const greenZone = layout.zones.get(ZoneType.GREEN)}
      {#if greenZone}
        <InventoryZone
          width={greenZone.width}
          height={greenZone.height}
          {gameState}
          onDeckOpen={onDeckOpen}
          onAddDecks={onAddDecks}
          onAddChaos={onAddChaos}
          style="position: absolute; left: {greenZone.x}px; top: {greenZone.y}px; width: {greenZone.width}px; height: {greenZone.height}px; z-index: 10;"
          role="region"
          aria-label="Inventory zone for deck opening"
        />
      {/if}
    {/if}

    <!-- Purple Zone: Last Card Display (overlay on white zone) -->
    {#if layout.zones.has(ZoneType.PURPLE)}
      {@const purpleZone = layout.zones.get(ZoneType.PURPLE)}
      {#if purpleZone}
        <LastCardZone
          width={purpleZone.width}
          height={purpleZone.height}
          {lastCardDraw}
          clickedCard={clickedCard}
          style="position: absolute; left: {purpleZone.x}px; top: {purpleZone.y}px; width: {purpleZone.width}px; height: {purpleZone.height}px; z-index: 20;"
          role="region"
          aria-label="Last card drawn display"
        />
      {/if}
    {/if}
</div>

<style>
  .game-area-layout {
    position: relative;
    /* Default size - can be overridden by CSS variables or media queries */
    width: var(--game-area-width, 1280px);
    height: var(--game-area-height, 720px);
    min-width: var(--game-area-min-width, 640px);
    min-height: var(--game-area-min-height, 360px);
    display: block;
    background-color: #1a1a2e;
    overflow: hidden;
    box-sizing: border-box;
    margin: 0 auto;
    /* Constrain to viewport on all screen sizes */
    max-width: 100vw;
    max-height: 100vh;
    /* Center horizontally */
    margin-left: auto;
    margin-right: auto;
    /* Maintain 16:9 aspect ratio */
    aspect-ratio: 16 / 9;
  }

  /* Scale down on smaller screens while maintaining aspect ratio */
  @media (max-width: 1280px) {
    .game-area-layout {
      width: 100%;
      height: auto;
      min-width: 0;
      min-height: 0;
      max-height: 100vh;
      max-width: 100vw;
    }
  }

  /* Scale down on short screens while maintaining aspect ratio */
  @media (max-height: 720px) {
    .game-area-layout {
      height: 100vh;
      width: auto;
      min-width: 0;
      min-height: 0;
      max-width: 100vw;
      max-height: 100vh;
    }
  }

  /* On larger screens, use default size and center */
  @media (min-width: 1281px) and (min-height: 721px) {
    .game-area-layout {
      width: var(--game-area-width, 1280px);
      height: var(--game-area-height, 720px);
      min-width: var(--game-area-min-width, 1280px);
      min-height: var(--game-area-min-height, 720px);
      max-width: var(--game-area-max-width, 1280px);
      max-height: var(--game-area-max-height, 720px);
    }
  }
</style>

