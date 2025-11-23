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

  // Optional: Clear clicked card when new card is drawn (user preference)
  // Uncomment if you want clicked card to be cleared when new card is drawn:
  // $: if (lastCardDraw && clickedCard) {
  //   // Keep clicked card (user explicitly selected it)
  //   // Or clear: clickedCard = null;
  // }

  let containerElement: HTMLDivElement;
  // Base 1080p dimensions (1920x1080)
  const baseWidth = 1920;
  const baseHeight = 1080;
  // Scaling factor: 0.8 = 20% reduction (80% of original size)
  const scalingFactor: number = 0.8;
  // Scaled dimensions
  const containerWidth = baseWidth * scalingFactor; // 1536
  const containerHeight = baseHeight * scalingFactor; // 864
  let ambientSceneZoneRef: AmbientSceneZone | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let resizeDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  const RESIZE_DEBOUNCE_MS = 150; // Debounce resize events by 150ms
  
  // Track if ResizeObserver is set up to avoid duplicate setup
  let resizeObserverSetup = false;
  
  // Initialize layout immediately with base dimensions and scaling factor
  // The service will apply the scaling factor to all zone coordinates
  let layout: ZoneLayout = zoneLayoutService.initializeLayout(baseWidth, baseHeight, scalingFactor);

  // Expose ambient scene zone for card adding
  export function getAmbientSceneZone(): AmbientSceneZone | null {
    return ambientSceneZoneRef;
  }

  onMount(() => {
    // Layout is already initialized, just log for debugging
    console.log('GameAreaLayout on mount:', {
      containerWidth,
      containerHeight,
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

    // Wait for next tick to ensure container is fully rendered with proper dimensions
    setTimeout(() => {
      if (!containerElement) return;
      
      // Verify container has proper dimensions before setting up ResizeObserver
      const rect = containerElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        console.warn('GameAreaLayout: Container has invalid dimensions on mount', rect);
        // Try again after a short delay
        setTimeout(() => {
          if (containerElement) {
            const retryRect = containerElement.getBoundingClientRect();
            if (retryRect.width > 0 && retryRect.height > 0) {
              setupResizeObserver();
            } else {
              console.error('GameAreaLayout: Container still has invalid dimensions after retry', retryRect);
            }
          }
        }, 100);
        return;
      }

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
    // Calculate scaling factor based on new dimensions relative to base
    const newScalingFactor = newWidth / baseWidth;
    // Resize layout with base dimensions and new scaling factor
    layout = zoneLayoutService.resizeLayout(layout, baseWidth, baseHeight, newScalingFactor);
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
    width: 1536px;
    height: 864px;
    min-width: 1536px;
    min-height: 864px;
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
  }

  /* Scale down on screens smaller than 1536px wide while maintaining aspect ratio */
  @media (max-width: 1536px) {
    .game-area-layout {
      width: 100%;
      height: auto;
      min-width: 0;
      min-height: 0;
      aspect-ratio: 16 / 9;
      max-height: 100vh;
      /* Ensure it doesn't exceed viewport */
      max-width: 100vw;
    }
  }

  /* Scale down on screens smaller than 864px tall while maintaining aspect ratio */
  @media (max-height: 864px) {
    .game-area-layout {
      height: 100vh;
      width: auto;
      min-width: 0;
      min-height: 0;
      aspect-ratio: 16 / 9;
      max-width: 100vw;
      /* Ensure it doesn't exceed viewport */
      max-height: 100vh;
    }
  }

  /* On larger screens (2K, 4K), keep at 1536x864 and center */
  @media (min-width: 1537px) {
    .game-area-layout {
      width: 1536px;
      height: 864px;
      min-width: 1536px;
      min-height: 864px;
      max-width: 1536px;
      max-height: 864px;
    }
  }
</style>

