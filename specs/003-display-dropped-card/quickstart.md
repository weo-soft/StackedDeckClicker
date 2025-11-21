# Quickstart Guide: Purple Zone Card Graphical Display

**Feature**: 003-display-dropped-card  
**Date**: 2025-01-27

## Overview

This guide provides step-by-step instructions for implementing the graphical card display in the purple zone. Follow these steps in order to ensure proper implementation.

## Prerequisites

- Understanding of Svelte component structure
- Familiarity with TypeScript interfaces
- Knowledge of the existing LastCardZone component
- Access to card art files in `/static/cards/cardArt/`

## Implementation Steps

### Step 1: Create Card Image Service

Create `src/lib/services/cardImageService.ts`:

```typescript
import { resolvePath } from '../utils/paths.js';
import type { CardImageState } from '../models/CardDisplayData.js';

// Build-time optimized imports
const cardArtModules = import.meta.glob('/static/cards/cardArt/*.png', { 
  eager: false 
}) as Record<string, { default: string }>;

export class CardImageService {
  private imageCache = new Map<string, string | null>();

  resolveCardImageUrl(artFilename: string | null): string | null {
    if (!artFilename) return null;
    
    // Check cache first
    if (this.imageCache.has(artFilename)) {
      return this.imageCache.get(artFilename) || null;
    }

    // Try optimized import
    const expectedFilename = `${artFilename}.png`;
    const modulePath = Object.keys(cardArtModules).find(path =>
      path.toLowerCase().includes(expectedFilename.toLowerCase())
    );

    let url: string | null = null;
    if (modulePath && cardArtModules[modulePath]) {
      url = cardArtModules[modulePath].default;
    } else {
      // Fallback to runtime path
      url = resolvePath(`/cards/cardArt/${expectedFilename}`);
    }

    // Cache result
    this.imageCache.set(artFilename, url);
    return url;
  }

  async loadCardImage(artFilename: string | null): Promise<CardImageState> {
    const url = this.resolveCardImageUrl(artFilename);
    
    if (!url) {
      return {
        url: null,
        loading: false,
        error: true,
        errorMessage: `Artwork not found: ${artFilename}`
      };
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          url,
          loading: false,
          error: false
        });
      };
      img.onerror = () => {
        resolve({
          url: null,
          loading: false,
          error: true,
          errorMessage: `Failed to load image: ${url}`
        });
      };
      img.src = url;
    });
  }

  // ... other methods
}

export const cardImageService = new CardImageService();
```

### Step 2: Create Card Data Models

Create `src/lib/models/CardDisplayData.ts`:

```typescript
import type { DivinationCard } from './Card.js';
import type { CardDrawResult } from './CardDrawResult.js';

export interface FullCardData {
  name: string;
  artFilename: string;
  stackSize?: number;
  explicitModifiers?: Array<{ text: string; optional: boolean }>;
  flavourText?: string;
  detailsId: string;
  id: string;
  dropWeight: number;
}

export interface CardDisplayData {
  card: DivinationCard;
  timestamp: number;
  scoreGained: number;
  artFilename: string | null;
  fullCardData?: FullCardData;
}

export interface CardImageState {
  url: string | null;
  loading: boolean;
  error: boolean;
  errorMessage?: string;
}

export interface CardDisplayConfig {
  baseWidth: number;
  baseHeight: number;
  scaleFactor: number;
  zoneWidth: number;
  zoneHeight: number;
}

export function convertToCardDisplayData(
  cardDraw: CardDrawResult,
  fullCardData?: FullCardData
): CardDisplayData {
  return {
    card: cardDraw.card,
    timestamp: cardDraw.timestamp,
    scoreGained: cardDraw.scoreGained,
    artFilename: fullCardData?.artFilename || null,
    fullCardData
  };
}
```

### Step 3: Create Card Data Service

Create `src/lib/services/cardDataService.ts`:

```typescript
import { resolvePath } from '../utils/paths.js';
import type { FullCardData } from '../models/CardDisplayData.js';

let cardsDataCache: FullCardData[] | null = null;

export class CardDataService {
  async loadCardsData(): Promise<FullCardData[]> {
    if (cardsDataCache) {
      return cardsDataCache;
    }

    try {
      const response = await fetch(resolvePath('/cards/cards.json'));
      if (!response.ok) {
        throw new Error(`Failed to load cards.json: ${response.statusText}`);
      }
      cardsDataCache = await response.json();
      return cardsDataCache;
    } catch (error) {
      console.error('Failed to load cards data:', error);
      return [];
    }
  }

  async loadFullCardData(cardName: string): Promise<FullCardData | null> {
    const cards = await this.loadCardsData();
    return cards.find(card => card.name === cardName) || null;
  }

  async loadFullCardDataByArt(artFilename: string): Promise<FullCardData | null> {
    const cards = await this.loadCardsData();
    return cards.find(card => card.artFilename === artFilename) || null;
  }
}

export const cardDataService = new CardDataService();
```

### Step 4: Create Card Rendering Utilities

Create `src/lib/utils/cardRendering.ts`:

```typescript
export function calculateCardDisplayConfig(
  zoneWidth: number,
  zoneHeight: number,
  baseWidth: number = 300
): CardDisplayConfig {
  const baseHeight = Math.round(baseWidth * (455 / 300));
  const scaleFactor = zoneWidth / baseWidth;

  return {
    baseWidth,
    baseHeight,
    scaleFactor,
    zoneWidth,
    zoneHeight
  };
}

export function parseStyledText(text: string): string {
  // Implementation from research.md
  // Parse PoE metadata tags and convert to HTML
  // ... (see DivinationCard.vue reference for full implementation)
}

export function formatRewardText(explicitModifiers?: Array<{ text: string }>): string {
  if (!explicitModifiers || explicitModifiers.length === 0) {
    return '';
  }
  const raw = explicitModifiers.map(m => m.text).join('\n');
  return parseStyledText(raw);
}

export function formatFlavourText(flavourText?: string): string {
  if (!flavourText) return '';
  
  // Remove wiki/markup tags
  let text = flavourText.replace(/<[^>]*>/g, '');
  // Remove surrounding braces
  text = text.replace(/^\s*[\{\[\(\"'""']+/, '').replace(/[\}\]\)\"'""']+\s*$/, '');
  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}
```

### Step 5: Update LastCardZone Component

Update `src/lib/components/LastCardZone.svelte`:

```svelte
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
  export let style: string = '';

  let cardDisplayData: CardDisplayData | null = null;
  let imageState: CardImageState = { url: null, loading: false, error: false };
  let displayConfig: CardDisplayConfig;

  // Frame and separator URLs (preload these)
  const frameUrl = resolvePath('/cards/Divination_card_frame.png');
  const separatorUrl = resolvePath('/cards/Divination_card_separator.png');

  // Calculate display config
  $: displayConfig = calculateCardDisplayConfig(width, height);

  // Convert CardDrawResult to CardDisplayData
  $: if (lastCardDraw) {
    loadCardData(lastCardDraw);
  } else {
    cardDisplayData = null;
    imageState = { url: null, loading: false, error: false };
  }

  async function loadCardData(cardDraw: CardDrawResult) {
    // Load full card data
    const fullCardData = await cardDataService.loadFullCardData(cardDraw.card.name);
    
    // Convert to display data
    cardDisplayData = convertToCardDisplayData(cardDraw, fullCardData || undefined);

    // Load card image
    if (cardDisplayData.artFilename) {
      imageState = { url: null, loading: true, error: false };
      imageState = await cardImageService.loadCardImage(cardDisplayData.artFilename);
    } else {
      imageState = { url: null, loading: false, error: true };
    }
  }

  // Dynamic font sizes based on scale
  $: titleFontSize = `${16 * displayConfig.scaleFactor}px`;
  $: rewardFontSize = `${14 * displayConfig.scaleFactor}px`;
  $: flavourFontSize = `${12 * displayConfig.scaleFactor}px`;
  $: stackFontSize = `${12 * displayConfig.scaleFactor}px`;

  // Container style
  $: containerStyle = {
    width: `${displayConfig.baseWidth * displayConfig.scaleFactor}px`,
    height: `${displayConfig.baseHeight * displayConfig.scaleFactor}px`
  };
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
      <img class="card-frame" src={frameUrl} alt="Card frame" />
      
      <!-- Card title -->
      <div class="card-title" style="font-size: {titleFontSize}">
        {cardDisplayData.card.name}
      </div>

      <!-- Card artwork -->
      {#if imageState.url && !imageState.error}
        <img 
          class="card-art" 
          src={imageState.url} 
          alt={cardDisplayData.card.name}
          loading="lazy"
        />
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
      <img class="card-separator" src={separatorUrl} alt="Separator" />

      <!-- Flavour text -->
      {#if cardDisplayData.fullCardData?.flavourText}
        <div class="card-flavour" style="font-size: {flavourFontSize}">
          {formatFlavourText(cardDisplayData.fullCardData.flavourText)}
        </div>
      {/if}
    </div>
  {:else}
    <div class="card-display empty">
      <p class="no-card">No card drawn yet</p>
    </div>
  {/if}
</div>

<style>
  /* Styles adapted from DivinationCard.vue */
  /* See reference component for full styling */
</style>
```

### Step 6: Add CSS Styling

Add card display styles to `LastCardZone.svelte`:

```css
.card-display {
  position: relative;
  margin: 0 auto;
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
  left: 4%;
  right: 4%;
  top: 9%;
  height: 44%;
  object-fit: cover;
  z-index: 1;
}

.card-title {
  position: absolute;
  top: 3%;
  left: 8%;
  right: 8%;
  text-align: center;
  color: #1a1a1a;
  font-weight: 700;
  text-transform: uppercase;
  z-index: 4;
  text-shadow: 0 1px 0 rgba(255,255,255,0.4);
}

/* ... additional styles from reference component */
```

### Step 7: Write Tests

Create `tests/unit/services/cardImageService.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { cardImageService } from '@/lib/services/cardImageService';

describe('CardImageService', () => {
  it('should resolve card image URL', () => {
    const url = cardImageService.resolveCardImageUrl('AChillingWind');
    expect(url).toBeTruthy();
  });

  it('should return null for missing artFilename', () => {
    const url = cardImageService.resolveCardImageUrl(null);
    expect(url).toBeNull();
  });

  // ... more tests
});
```

### Step 8: Test Implementation

1. Run development server: `npm run dev`
2. Open deck to draw a card
3. Verify purple zone displays card with artwork
4. Test missing artwork fallback
5. Test zone resizing
6. Run tests: `npm test`

## Common Issues and Solutions

### Issue: Images not loading

**Solution**: Check that:
- Art filenames match exactly (case-sensitive)
- Images exist in `/static/cards/cardArt/`
- `resolvePath()` is working correctly
- Browser console for 404 errors

### Issue: Styled text not rendering

**Solution**: 
- Verify `parseStyledText()` implementation
- Check that `{@html}` directive is used correctly
- Ensure CSS classes for PoE styles are defined

### Issue: Card not scaling properly

**Solution**:
- Verify `calculateCardDisplayConfig()` calculations
- Check that scaleFactor is applied to all sizes
- Ensure container dimensions match zone size

## Next Steps

After implementation:
1. Run all tests: `npm test`
2. Check test coverage: `npm run test:coverage`
3. Run E2E tests: `npm run test:e2e`
4. Verify performance targets are met
5. Test accessibility with screen reader
6. Review code with team

## References

- [Specification](./spec.md)
- [Research](./research.md)
- [Data Model](./data-model.md)
- [Service Interfaces](./contracts/service-interfaces.md)
- [Vue Reference Component](../../example_divination_card_redering_in_vue/DivinationCard.vue)

