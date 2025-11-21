# Quickstart Guide: Card Tier Filter System

**Feature**: 004-card-tier-filter  
**Date**: 2025-01-27

## Overview

This guide provides step-by-step instructions for implementing the tier-based card filtering system. Follow these steps in order to ensure proper implementation and integration with existing systems.

## Prerequisites

- Understanding of Svelte component structure and stores
- Familiarity with TypeScript interfaces
- Knowledge of existing services (StorageService, AudioManager, gameStateService)
- Understanding of IndexedDB via localforage
- Access to card data (cards.json, cardValues.json)

## Implementation Steps

### Step 1: Create Tier Data Models

Create `src/lib/models/Tier.ts`:

```typescript
export type DefaultTier = 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface ColorScheme {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  borderWidth?: number;
}

export interface SoundConfiguration {
  filePath: string | null;
  volume?: number;
  enabled?: boolean;
}

export interface TierConfiguration {
  colorScheme: ColorScheme;
  sound: SoundConfiguration;
  enabled: boolean;
  modifiedAt: number;
}

export interface Tier {
  id: string;
  name: string;
  type: 'default' | 'custom';
  order: number;
  config: TierConfiguration;
  createdAt?: number;
  modifiedAt: number;
}

export interface CardTierAssignment {
  cardName: string;
  tierId: string;
  source: 'default' | 'user';
  assignedAt: number;
  modifiedAt?: number;
}

export interface TierConfigurationState {
  version: number;
  tiers: Map<string, Tier>;
  cardAssignments: Map<string, string>;
  savedAt: number;
}
```

### Step 2: Create Tier Assignment Utilities

Create `src/lib/utils/tierAssignment.ts`:

```typescript
import type { DivinationCard } from '../models/Card.js';
import type { DefaultTier } from '../models/Tier.js';

/**
 * Assign card to default tier based on value.
 */
export function assignCardToDefaultTier(card: DivinationCard): DefaultTier {
  const value = card.value;
  
  if (value > 1000) return 'S';
  if (value > 500) return 'A';
  if (value > 200) return 'B';
  if (value > 50) return 'C';
  if (value > 10) return 'D';
  if (value > 1) return 'E';
  return 'F';
}

/**
 * Create default tier configurations.
 */
export function createDefaultTierConfigurations(): Map<string, TierConfiguration> {
  const configs = new Map<string, TierConfiguration>();
  const now = Date.now();
  
  // Default color schemes from research.md
  const defaultColors: Record<DefaultTier, ColorScheme> = {
    S: { backgroundColor: '#FFD700', textColor: '#000000', borderColor: '#FFA500' },
    A: { backgroundColor: '#FF6B6B', textColor: '#FFFFFF', borderColor: '#FF4757' },
    B: { backgroundColor: '#4ECDC4', textColor: '#000000', borderColor: '#45B7B8' },
    C: { backgroundColor: '#95E1D3', textColor: '#000000', borderColor: '#6BC5B8' },
    D: { backgroundColor: '#F38181', textColor: '#000000', borderColor: '#E85A4F' },
    E: { backgroundColor: '#AA96DA', textColor: '#FFFFFF', borderColor: '#8B7FB8' },
    F: { backgroundColor: '#C7CEEA', textColor: '#000000', borderColor: '#A8B5D1' }
  };
  
  const defaultTiers: DefaultTier[] = ['S', 'A', 'B', 'C', 'D', 'E', 'F'];
  
  for (let i = 0; i < defaultTiers.length; i++) {
    const tierId = defaultTiers[i];
    configs.set(tierId, {
      colorScheme: defaultColors[tierId],
      sound: { filePath: null, volume: 1.0, enabled: true },
      enabled: true,
      modifiedAt: now
    });
  }
  
  return configs;
}

/**
 * Create default tiers.
 */
export function createDefaultTiers(): Map<string, Tier> {
  const tiers = new Map<string, Tier>();
  const configs = createDefaultTierConfigurations();
  const now = Date.now();
  
  const defaultTiers: DefaultTier[] = ['S', 'A', 'B', 'C', 'D', 'E', 'F'];
  
  for (let i = 0; i < defaultTiers.length; i++) {
    const tierId = defaultTiers[i];
    tiers.set(tierId, {
      id: tierId,
      name: tierId,
      type: 'default',
      order: i,
      config: configs.get(tierId)!,
      modifiedAt: now
    });
  }
  
  return tiers;
}
```

### Step 3: Create Color Validation Utilities

Create `src/lib/utils/colorValidation.ts`:

```typescript
import type { ColorScheme } from '../models/Tier.js';

export interface ValidationResult {
  isValid: boolean;
  contrastRatio?: number;
  error?: string;
}

/**
 * Calculate contrast ratio between two colors (WCAG formula).
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 1.0;
  
  const l1 = getLuminance(rgb1);
  const l2 = getLuminance(rgb2);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Validate color scheme meets WCAG 2.1 AA requirements.
 */
export function validateColorScheme(colors: ColorScheme): ValidationResult {
  // Validate hex format
  if (!isValidHexColor(colors.backgroundColor) ||
      !isValidHexColor(colors.textColor) ||
      !isValidHexColor(colors.borderColor)) {
    return {
      isValid: false,
      error: 'All colors must be valid hex format (#RRGGBB)'
    };
  }
  
  // Calculate contrast ratio
  const contrastRatio = calculateContrastRatio(
    colors.backgroundColor,
    colors.textColor
  );
  
  // Check WCAG AA requirements (4.5:1 for normal text, 3:1 for large text)
  const minContrast = 4.5; // Using normal text requirement
  const isValid = contrastRatio >= minContrast;
  
  return {
    isValid,
    contrastRatio,
    error: isValid ? undefined : `Contrast ratio ${contrastRatio.toFixed(2)} is below WCAG AA requirement (4.5:1)`
  };
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function getLuminance(rgb: { r: number; g: number; b: number }): number {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function isValidHexColor(hex: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}
```

### Step 4: Create Tier Storage Service

Create `src/lib/services/tierStorageService.ts`:

```typescript
import localforage from 'localforage';
import type { TierConfigurationState } from '../models/Tier.js';
import { createDefaultTiers } from '../utils/tierAssignment.js';

const TIER_CONFIG_KEY = 'tierConfigurations';
const DB_NAME = 'stackedDeckClicker';

export class TierStorageService {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      localforage.config({
        name: DB_NAME,
        version: 1.0,
        storeName: 'gameData'
      });
      this.initialized = true;
    } catch (error) {
      console.warn('Failed to configure localforage:', error);
    }
  }

  async loadTierConfigurations(): Promise<TierConfigurationState | null> {
    await this.initialize();
    
    try {
      const data = await localforage.getItem<any>(TIER_CONFIG_KEY);
      if (!data) return null;

      // Deserialize Maps
      const state: TierConfigurationState = {
        version: data.version || 1,
        tiers: new Map(Object.entries(data.tiers || {})),
        cardAssignments: new Map(Object.entries(data.cardAssignments || {})),
        savedAt: data.savedAt || Date.now()
      };

      // Validate and ensure default tiers exist
      const defaultTiers = createDefaultTiers();
      for (const [id, tier] of defaultTiers) {
        if (!state.tiers.has(id)) {
          state.tiers.set(id, tier);
        }
      }

      return state;
    } catch (error) {
      console.warn('Failed to load tier configurations:', error);
      return null;
    }
  }

  async saveTierConfigurations(state: TierConfigurationState): Promise<void> {
    await this.initialize();
    
    try {
      // Serialize Maps to objects
      const serializable = {
        version: state.version,
        tiers: Object.fromEntries(state.tiers),
        cardAssignments: Object.fromEntries(state.cardAssignments),
        savedAt: Date.now()
      };

      await localforage.setItem(TIER_CONFIG_KEY, serializable);
    } catch (error: any) {
      if (error?.name === 'QuotaExceededError' || error?.code === 22) {
        throw new Error('Storage quota exceeded. Please free up space and try again.');
      }
      throw new Error('Failed to save tier configurations');
    }
  }

  async isStorageAvailable(): Promise<boolean> {
    await this.initialize();
    try {
      await localforage.setItem('_test', 'test');
      await localforage.removeItem('_test');
      return true;
    } catch {
      return false;
    }
  }

  async clearTierConfigurations(): Promise<void> {
    await this.initialize();
    await localforage.removeItem(TIER_CONFIG_KEY);
  }
}

export const tierStorageService = new TierStorageService();
```

### Step 5: Create Tier Service

Create `src/lib/services/tierService.ts`:

```typescript
import type { DivinationCard } from '../models/Card.js';
import type { Tier, TierConfiguration, TierConfigurationState, DefaultTier } from '../models/Tier.js';
import { tierStorageService } from './tierStorageService.js';
import { assignCardToDefaultTier, createDefaultTiers } from '../utils/tierAssignment.js';
import { validateColorScheme } from '../utils/colorValidation.js';

export class TierService {
  private state: TierConfigurationState | null = null;
  private initialized = false;

  async initialize(cards: DivinationCard[]): Promise<void> {
    if (this.initialized) return;

    // Load from storage or create defaults
    let state = await tierStorageService.loadTierConfigurations();

    if (!state) {
      // Create default state
      const defaultTiers = createDefaultTiers();
      const cardAssignments = new Map<string, string>();

      // Assign cards to default tiers
      for (const card of cards) {
        const tierId = assignCardToDefaultTier(card);
        cardAssignments.set(card.name, tierId);
      }

      state = {
        version: 1,
        tiers: defaultTiers,
        cardAssignments,
        savedAt: Date.now()
      };

      // Save defaults
      await tierStorageService.saveTierConfigurations(state);
    }

    this.state = state;
    this.initialized = true;
  }

  getTierForCard(cardName: string): Tier | null {
    if (!this.state) return null;
    
    const tierId = this.state.cardAssignments.get(cardName);
    if (!tierId) return null;
    
    return this.state.tiers.get(tierId) || null;
  }

  getTierConfiguration(tierId: string): TierConfiguration | null {
    if (!this.state) return null;
    
    const tier = this.state.tiers.get(tierId);
    return tier?.config || null;
  }

  getAllTiers(): Tier[] {
    if (!this.state) return [];
    
    return Array.from(this.state.tiers.values())
      .sort((a, b) => a.order - b.order);
  }

  getDefaultTiers(): Tier[] {
    return this.getAllTiers().filter(t => t.type === 'default');
  }

  getCustomTiers(): Tier[] {
    return this.getAllTiers().filter(t => t.type === 'custom');
  }

  async moveCardToTier(cardName: string, targetTierId: string): Promise<void> {
    if (!this.state) throw new Error('Tier system not initialized');
    if (!this.state.tiers.has(targetTierId)) {
      throw new Error(`Tier not found: ${targetTierId}`);
    }

    this.state.cardAssignments.set(cardName, targetTierId);
    await this.saveState();
  }

  async moveCardsToTier(cardNames: string[], targetTierId: string): Promise<void> {
    if (!this.state) throw new Error('Tier system not initialized');
    if (!this.state.tiers.has(targetTierId)) {
      throw new Error(`Tier not found: ${targetTierId}`);
    }

    for (const cardName of cardNames) {
      this.state.cardAssignments.set(cardName, targetTierId);
    }
    await this.saveState();
  }

  async updateTierConfiguration(
    tierId: string,
    config: Partial<TierConfiguration>
  ): Promise<void> {
    if (!this.state) throw new Error('Tier system not initialized');
    
    const tier = this.state.tiers.get(tierId);
    if (!tier) throw new Error(`Tier not found: ${tierId}`);

    // Validate color scheme if provided
    if (config.colorScheme) {
      const validation = validateColorScheme(config.colorScheme);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid color scheme');
      }
    }

    // Update configuration
    tier.config = {
      ...tier.config,
      ...config,
      modifiedAt: Date.now()
    };
    tier.modifiedAt = Date.now();

    await this.saveState();
  }

  async setTierEnabled(tierId: string, enabled: boolean): Promise<void> {
    await this.updateTierConfiguration(tierId, { enabled });
  }

  isTierEnabled(tierId: string): boolean {
    const config = this.getTierConfiguration(tierId);
    return config?.enabled ?? true;
  }

  shouldDisplayCard(cardName: string): boolean {
    const tier = this.getTierForCard(cardName);
    if (!tier) return true; // Default to showing if no tier assigned
    return this.isTierEnabled(tier.id);
  }

  getCardsInTier(tierId: string): string[] {
    if (!this.state) return [];
    
    return Array.from(this.state.cardAssignments.entries())
      .filter(([_, id]) => id === tierId)
      .map(([cardName]) => cardName);
  }

  private async saveState(): Promise<void> {
    if (!this.state) return;
    
    this.state.savedAt = Date.now();
    await tierStorageService.saveTierConfigurations(this.state);
  }
}

export const tierService = new TierService();
```

### Step 6: Create Tier Store

Create `src/lib/stores/tierStore.ts`:

```typescript
import { writable, derived, get } from 'svelte/store';
import type { Tier, TierConfiguration } from '../models/Tier.js';
import { tierService } from '../services/tierService.js';

interface TierStoreState {
  initialized: boolean;
  tiers: Map<string, Tier>;
  cardAssignments: Map<string, string>;
}

const createTierStore = () => {
  const { subscribe, set, update } = writable<TierStoreState>({
    initialized: false,
    tiers: new Map(),
    cardAssignments: new Map()
  });

  return {
    subscribe,
    initialize: async (cards: any[]) => {
      await tierService.initialize(cards);
      update(state => ({
        initialized: true,
        tiers: new Map(tierService.getAllTiers().map(t => [t.id, t])),
        cardAssignments: new Map(
          cards.map(card => {
            const tier = tierService.getTierForCard(card.name);
            return [card.name, tier?.id || ''];
          })
        )
      }));
    },
    getTierForCard: (cardName: string): Tier | null => {
      return tierService.getTierForCard(cardName);
    },
    getTierConfiguration: (tierId: string): TierConfiguration | null => {
      return tierService.getTierConfiguration(tierId);
    },
    shouldDisplayCard: (cardName: string): boolean => {
      return tierService.shouldDisplayCard(cardName);
    },
    refresh: () => {
      update(state => ({
        ...state,
        tiers: new Map(tierService.getAllTiers().map(t => [t.id, t])),
      }));
    }
  };
};

export const tierStore = createTierStore();
```

### Step 7: Extend AudioManager

Update `src/lib/audio/audioManager.ts` to add tier sound support:

```typescript
// Add to existing AudioManager class

playTierSound(tierId: string, qualityTier: QualityTier): void {
  if (this.muted) return;

  // Get tier configuration
  const tierConfig = tierService.getTierConfiguration(tierId);
  
  // Check if tier sound is enabled
  if (!tierConfig?.sound.enabled) return;

  // Try to play tier-specific sound
  if (tierConfig.sound.filePath) {
    const sound = this.sounds.get(`tier-${tierId}`);
    if (sound) {
      sound.volume(tierConfig.sound.volume ?? 1.0);
      sound.play();
      return;
    }
  }

  // Fallback to qualityTier-based sound
  this.playCardDropSound(qualityTier);
}

async preloadTierSounds(tierIds: string[]): Promise<void> {
  // Implementation for preloading tier sounds
  // Similar to existing preloadAudio method
}

isTierSoundAvailable(tierId: string): boolean {
  return this.sounds.has(`tier-${tierId}`);
}
```

### Step 8: Update LastCardZone Component

Update `src/lib/components/LastCardZone.svelte` to apply tier color schemes:

```svelte
<script lang="ts">
  // ... existing imports
  import { tierStore } from '../stores/tierStore.js';
  import type { ColorScheme } from '../models/Tier.js';

  // ... existing props and state

  let tierColorScheme: ColorScheme | null = null;

  // Reactive: Update tier color scheme when card changes
  $: if (lastCardDraw) {
    const tier = tierStore.getTierForCard(lastCardDraw.card.name);
    tierColorScheme = tier?.config.colorScheme || null;
  } else {
    tierColorScheme = null;
  }

  // Apply tier color scheme to card label
  $: labelStyle = tierColorScheme
    ? `background-color: ${tierColorScheme.backgroundColor}; color: ${tierColorScheme.textColor}; border: ${tierColorScheme.borderWidth || 2}px solid ${tierColorScheme.borderColor};`
    : '';
</script>

<!-- Apply style to card label element -->
<div class="card-label" style={labelStyle}>
  <!-- ... existing card label content -->
</div>
```

### Step 9: Update Card Drop Flow

Update `src/routes/+page.svelte` to integrate tier system:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { tierStore } from '$lib/stores/tierStore.js';
  import { tierService } from '$lib/services/tierService.js';
  import { audioService } from '$lib/audio/audioManager.js';
  // ... other imports

  onMount(async () => {
    // Initialize tier system after card pool is loaded
    const cardPool = await cardDataService.loadCardPool();
    if (cardPool) {
      await tierStore.initialize(cardPool.cards);
    }
  });

  async function handleOpenDeck() {
    // ... existing deck opening logic
    
    const result = await gameStateService.openDeck();
    lastCardDraw = result;

    // Check if card should be displayed
    const shouldDisplay = tierStore.shouldDisplayCard(result.card.name);
    if (!shouldDisplay) {
      // Card is processed but not displayed
      return;
    }

    // Get tier for card
    const tier = tierStore.getTierForCard(result.card.name);
    if (tier) {
      // Play tier sound
      audioService.playTierSound(tier.id, result.card.qualityTier);
    } else {
      // Fallback to qualityTier sound
      audioService.playCardDropSound(result.card.qualityTier);
    }

    // ... rest of existing logic
  }
</script>
```

### Step 10: Create Tier Management UI Components

Create `src/lib/components/TierSettings.svelte` and `TierManagement.svelte` following the component contracts in `contracts/service-interfaces.md`. These components provide the UI for:
- Viewing and editing tier configurations
- Moving cards between tiers
- Creating custom tiers
- Enabling/disabling tiers

## Testing Checklist

- [ ] Tier system initializes with default tiers and card assignments
- [ ] Cards are assigned to correct default tiers based on value
- [ ] Tier color schemes are applied to card labels
- [ ] Tier sounds play when cards are dropped
- [ ] Cards from disabled tiers are not displayed
- [ ] Cards can be moved between tiers
- [ ] Custom tiers can be created and configured
- [ ] Tier configurations persist across app restarts
- [ ] Color scheme validation works correctly
- [ ] Performance requirements are met (<2s init, <50ms lookup)

## Next Steps

After completing these steps, implement the UI components (TierSettings, TierManagement) and add comprehensive tests following the testing contracts in `contracts/service-interfaces.md`.

