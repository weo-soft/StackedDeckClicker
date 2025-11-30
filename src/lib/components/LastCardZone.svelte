<script lang="ts">
  import { onMount } from 'svelte';
  import type { CardDrawResult } from '../models/CardDrawResult.js';
  import type { CardDisplayData, CardImageState, CardDisplayConfig } from '../models/CardDisplayData.js';
  import { convertToCardDisplayData } from '../models/CardDisplayData.js';
  import { cardImageService } from '../services/cardImageService.js';
  import { cardDataService } from '../services/cardDataService.js';
  import { calculateCardDisplayConfig, formatRewardText, formatFlavourText } from '../utils/cardRendering.js';
  import { resolvePath } from '../utils/paths.js';

  export let width: number;
  export let height: number;
  export let lastCardDraw: CardDrawResult | null = null;
  /** Clicked card takes precedence over lastCardDraw when provided */
  export let clickedCard: CardDrawResult | null = null;
  export let style: string = '';

  let cardDisplayData: CardDisplayData | null = null;
  let imageState: CardImageState = { url: null, loading: false, error: false };
  let displayConfig: CardDisplayConfig;
  let currentLoadAbort: AbortController | null = null;

  // Frame and separator URLs (preload these)
  const frameUrl = resolvePath('/cards/Divination_card_frame.png');
  const separatorUrl = resolvePath('/cards/Divination_card_separator.png');

  // Calculate display config
  $: displayConfig = calculateCardDisplayConfig(width, height);

  // Preload cards.json and static images on mount to avoid blocking later
  onMount(() => {
    // Preload cards data in background
    setTimeout(() => {
      cardDataService.loadCardsData().catch(() => {
        // Silently fail - will retry when needed
      });
    }, 100);

    // Preload frame and separator images
    const preloadImage = (url: string) => {
      const img = new Image();
      img.src = url;
    };
    preloadImage(frameUrl);
    preloadImage(separatorUrl);
  });

  // Track the current card to avoid re-processing
  let currentCardId: string | null = null;

  // Determine which card to display (clickedCard takes precedence)
  $: displayCard = clickedCard || lastCardDraw;

  // Handle card draw changes - reactive statement
  $: if (displayCard) {
    // Validate card data
    if (!displayCard.card || !displayCard.card.name) {
      console.warn('Invalid card data in LastCardZone:', displayCard);
      cardDisplayData = null;
      imageState = { url: null, loading: false, error: true, errorMessage: 'Invalid card data' };
      currentCardId = null;
    } else {
      const cardId = `${displayCard.card.name}-${displayCard.timestamp}`;
      // Only process if it's a new card
      if (cardId !== currentCardId) {
        currentCardId = cardId;
        loadCardData(displayCard);
      }
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

  async function loadCardData(cardDraw: CardDrawResult) {
    // Cancel previous load
    if (currentLoadAbort) {
      currentLoadAbort.abort();
    }
    currentLoadAbort = new AbortController();
    const abortSignal = currentLoadAbort.signal;
    
    // Immediately show basic card info (synchronous, fast)
    const basicDisplayData = convertToCardDisplayData(cardDraw);
    cardDisplayData = basicDisplayData;
    imageState = { url: null, loading: true, error: false };
    
    // Defer async work slightly to avoid blocking
    await new Promise(resolve => setTimeout(resolve, 10));
    
    if (abortSignal.aborted) return;
    
    try {
      // Load full card data (should be cached after preload)
      const fullCardData = await cardDataService.loadFullCardData(cardDraw.card.name);
      
      if (abortSignal.aborted) return;
      
      // Update with full data
      const updatedDisplayData = convertToCardDisplayData(cardDraw, fullCardData || undefined);
      cardDisplayData = updatedDisplayData;

      // Resolve image URL and preload it
      if (updatedDisplayData.artFilename) {
        const url = cardImageService.resolveCardImageUrl(updatedDisplayData.artFilename);
        if (url) {
          // Preload the image to improve loading performance
          cardImageService.preloadCardImage(updatedDisplayData.artFilename).catch(() => {
            // Silently fail - image will still load when displayed
          });
          imageState = { url, loading: true, error: false };
        } else {
          imageState = { url: null, loading: false, error: true };
        }
      } else {
        imageState = { url: null, loading: false, error: true };
      }
    } catch (error) {
      if (!abortSignal.aborted) {
        console.error('Failed to load card data:', error);
        imageState = { url: null, loading: false, error: true, errorMessage: String(error) };
      }
    } finally {
      if (!abortSignal.aborted) {
        currentLoadAbort = null;
      }
    }
  }

  // Dynamic font sizes based on scale
  $: titleFontSize = `${16 * displayConfig.scaleFactor}px`;
  $: rewardFontSize = `${14 * displayConfig.scaleFactor}px`;
  $: flavourFontSize = `${12 * displayConfig.scaleFactor}px`;
  $: stackFontSize = `${12 * displayConfig.scaleFactor}px`;
  $: letterSpacing = `${0.5 * displayConfig.scaleFactor}px`;

  // Container style
  $: containerStyle = `width: ${displayConfig.baseWidth * displayConfig.scaleFactor}px; height: ${displayConfig.baseHeight * displayConfig.scaleFactor}px; margin: 0 auto;`;
</script>

<div
  class="last-card-zone"
  style={style || `width: ${width}px; height: ${height}px;`}
  role="region"
  aria-label="Last card drawn display"
>
  {#if cardDisplayData}
    <div class="card-display" style={containerStyle}>
      <!-- Frame overlay -->
      <img 
        class="card-frame" 
        src={frameUrl} 
        alt="Card frame"
        role="presentation"
        aria-hidden="true"
      />
      
      <!-- Card title -->
      <div 
        class="card-title" 
        style="font-size: {titleFontSize}; letter-spacing: {letterSpacing}"
      >
        {cardDisplayData.card.name}
      </div>

      <!-- Card artwork -->
      {#if imageState.url}
        <img 
          class="card-art" 
          src={imageState.url} 
          alt={cardDisplayData.card.name}
          class:card-art-error={imageState.error}
          on:load={() => {
            // Update state when image loads successfully
            imageState = { ...imageState, loading: false, error: false };
          }}
          on:error={() => {
            // Update state when image fails to load
            imageState = { url: imageState.url, loading: false, error: true, errorMessage: 'Image failed to load' };
          }}
        />
        {#if imageState.loading}
          <div class="card-art-loading">Loading...</div>
        {/if}
        {#if imageState.error && imageState.url}
          <div class="card-art-placeholder">No image</div>
        {/if}
      {:else if imageState.loading}
        <div class="card-art-loading">Loading...</div>
      {:else}
        <div class="card-art-placeholder">No image</div>
      {/if}

      <!-- Stack size -->
      {#if cardDisplayData.fullCardData?.stackSize}
        <div class="card-stack" style="font-size: {stackFontSize}">
          {cardDisplayData.fullCardData.stackSize}
        </div>
      {/if}

      <!-- Rewards text -->
      {#if cardDisplayData.fullCardData?.explicitModifiers}
        <div 
          class="card-reward" 
          style="font-size: {rewardFontSize}"
        >
          {@html formatRewardText(cardDisplayData.fullCardData.explicitModifiers)}
        </div>
      {/if}

      <!-- Separator -->
      <img 
        class="card-separator" 
        src={separatorUrl} 
        alt="Separator"
        role="presentation"
        aria-hidden="true"
      />

      <!-- Flavour text -->
      {#if cardDisplayData.fullCardData?.flavourText}
        <div class="card-flavour" style="font-size: {flavourFontSize}">
          {formatFlavourText(cardDisplayData.fullCardData.flavourText)}
        </div>
      {/if}

      <!-- Card information (weight, value) -->
      <div class="card-info">
        <p class="card-info-line">
          Weight: {cardDisplayData.fullCardData?.dropWeight ?? cardDisplayData.card.weight} | <span class="value-part">Value: {cardDisplayData.card.value.toFixed(2)} Chaos</span>
        </p>
      </div>
    </div>
  {:else}
    <div class="card-display empty">
    </div>
  {/if}
</div>

<style>
  .last-card-zone {
    position: relative;
    overflow: visible;
    background-color: transparent;
    border: none;
    border-radius: 0;
    padding: 0;
    box-sizing: border-box;
    backdrop-filter: none;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .card-display {
    position: relative;
    overflow: hidden;
  }

  .card-display.empty {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .card-frame {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    z-index: 2;
    pointer-events: none;
  }

  .card-art {
    position: absolute;
    left: 4.5%;
    right: 4.5%;
    top: 9%;
    height: 43%;
    width: 91%;
    object-fit: cover;
    z-index: 1;
    opacity: 1;
    transition: opacity 0.2s;
  }

  .card-art.card-art-error {
    opacity: 0;
  }

  .card-art-loading,
  .card-art-placeholder {
    position: absolute;
    left: 4.5%;
    right: 4.5%;
    top: 9%;
    height: 43%;
    width: 91%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.3);
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.75rem;
    z-index: 1;
  }

  .card-title {
    position: absolute;
    top: 4%;
    left: 8%;
    right: 8%;
    text-align: center;
    color: #1a1a1a;
    font-weight: 700;
    text-transform: uppercase;
    z-index: 4;
    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.4), 0 -1px 0 rgba(0, 0, 0, 0.3);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    text-rendering: optimizeLegibility;
    margin: 0;
    line-height: 1.2;
  }

  .card-stack {
    position: absolute;
    top: 46.5%;
    left: 13%;
    width: 8.5%;
    height: 5%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-weight: 700;
    line-height: 1;
    z-index: 4;
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.8);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  }

  .card-reward {
    position: absolute;
    top: 53%;
    left: 8%;
    right: 8%;
    text-align: center;
    color: #d7a14d;
    text-transform: uppercase;
    font-weight: 700;
    z-index: 3;
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.6), 0 -1px 0 rgba(255, 255, 255, 0.15);
    white-space: normal;
    line-height: 1.2;
    transform: translateY(-2%);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    text-rendering: optimizeLegibility;
  }

  .card-reward :global(br) {
    display: block;
    content: "";
    margin: 0;
  }

  .card-separator {
    position: absolute;
    left: 8%;
    right: 8%;
    top: 66%;
    width: 84%;
    object-fit: contain;
    z-index: 3;
    pointer-events: none;
    opacity: 0.8;
  }

  .card-flavour {
    position: absolute;
    top: 73%;
    left: 8%;
    right: 8%;
    text-align: center;
    color: #d4a46a;
    font-style: italic;
    line-height: 1.3;
    z-index: 3;
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.5);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    text-rendering: optimizeLegibility;
    margin: 0;
  }

  .card-info {
    position: absolute;
    top: 92%;
    left: 10%;
    right: 10%;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    z-index: 4;
    font-size: 0.7rem;
  }

  .card-info-line {
    margin: 0;
    color: rgba(255, 255, 255, 0.7);
  }

  .card-info-line :global(.value-part) {
    color: #ffd700;
  }

  /* Path of Exile styling metadata classes */
  .card-reward :global(.poe-style-uniqueitem) {
    color: #ff8c42 !important;
    text-transform: uppercase !important;
    font-weight: 700 !important;
  }

  .card-reward :global(.poe-style-rareitem) {
    color: #ffeb3b !important;
    text-transform: uppercase !important;
    font-weight: 700 !important;
  }

  .card-reward :global(.poe-style-magicitem) {
    color: #8888ff !important;
    text-transform: uppercase !important;
    font-weight: 700 !important;
  }

  .card-reward :global(.poe-style-whiteitem) {
    color: #ffffff !important;
    text-transform: none !important;
    font-weight: 700 !important;
  }

  .card-reward :global(.poe-style-currencyitem) {
    color: #d7a14d !important;
    text-transform: uppercase !important;
    font-weight: 700 !important;
  }

  .card-reward :global(.poe-style-gemitem) {
    color: #1ba29b !important;
    text-transform: uppercase !important;
    font-weight: 700 !important;
  }

  .card-reward :global(.poe-style-divination) {
    color: #5fb3d3 !important;
    text-transform: uppercase !important;
    font-weight: 700 !important;
  }

  .card-reward :global(.poe-style-default) {
    color: #888888 !important;
    font-weight: 400 !important;
    text-transform: none !important;
  }

  .card-reward :global(.poe-style-normal) {
    color: #888888 !important;
    font-weight: 400 !important;
    text-transform: none !important;
  }

  .card-reward :global(.poe-style-augmented) {
    color: #a080ff !important;
    font-weight: 400 !important;
    text-transform: uppercase !important;
  }

  .card-reward :global(.poe-style-corrupted) {
    color: #e00000 !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
  }

  .card-reward :global(.poe-style-fractured) {
    color: #b8860b !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
  }

  .card-reward :global(.poe-style-enchanted) {
    color: #888888 !important;
    font-weight: 400 !important;
    text-transform: none !important;
  }

  .card-reward :global(.poe-style-size-24) {
    font-size: calc(24 / 32 * 1em) !important;
  }

  .card-reward :global(.poe-style-size-25) {
    font-size: calc(25 / 32 * 1em) !important;
  }

  .card-reward :global(.poe-style-size-26) {
    font-size: calc(26 / 32 * 1em) !important;
  }

  .card-reward :global(.poe-style-size-27) {
    font-size: calc(27 / 32 * 1em) !important;
  }

  .card-reward :global(.poe-style-size-28) {
    font-size: calc(28 / 32 * 1em) !important;
  }

  .card-reward :global(.poe-style-size-29) {
    font-size: calc(29 / 32 * 1em) !important;
  }

  .card-reward :global(.poe-style-size-30) {
    font-size: calc(30 / 32 * 1em) !important;
  }

  .card-reward :global(.poe-style-size-31) {
    font-size: calc(31 / 32 * 1em) !important;
  }
</style>
