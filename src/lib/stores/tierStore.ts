import { writable, derived, get } from 'svelte/store';
import type { Tier, TierConfiguration } from '../models/Tier.js';
import { tierService } from '../services/tierService.js';
import type { DivinationCard } from '../models/Card.js';

interface TierStoreState {
  initialized: boolean;
  tiers: Map<string, Tier>;
  cardAssignments: Map<string, string>;
}

/**
 * Reactive Svelte store for tier system state management.
 */
const createTierStore = () => {
  const { subscribe, set, update } = writable<TierStoreState>({
    initialized: false,
    tiers: new Map(),
    cardAssignments: new Map()
  });

  return {
    subscribe,
    
    /**
     * Initialize tier system with cards.
     * @param cards - Array of all cards to assign to default tiers
     */
    initialize: async (cards: DivinationCard[]) => {
      await tierService.initialize(cards);
      const state = tierService.getState();
      
      if (state) {
        update(() => ({
          initialized: true,
          tiers: new Map(state.tiers),
          cardAssignments: new Map(state.cardAssignments)
        }));
      }
    },
    
    /**
     * Get tier for a specific card (reactive).
     * @param cardName - Card name to lookup
     * @returns Tier object or null if card not assigned
     */
    getTierForCard: (cardName: string): Tier | null => {
      return tierService.getTierForCard(cardName);
    },
    
    /**
     * Get tier configuration for a tier ID (reactive).
     * @param tierId - Tier identifier
     * @returns TierConfiguration or null if tier not found
     */
    getTierConfiguration: (tierId: string): TierConfiguration | null => {
      return tierService.getTierConfiguration(tierId);
    },
    
    /**
     * Check if a card should be displayed based on its tier (reactive).
     * @param cardName - Card name to check
     * @returns true if card's tier is enabled, false otherwise
     */
    shouldDisplayCard: (cardName: string): boolean => {
      return tierService.shouldDisplayCard(cardName);
    },
    
    /**
     * Refresh tier store from service state.
     * Call this after tier operations to update reactive state.
     */
    refresh: () => {
      const state = tierService.getState();
      if (state) {
        update(() => ({
          initialized: true,
          tiers: new Map(state.tiers),
          cardAssignments: new Map(state.cardAssignments)
        }));
      }
    },
    
    /**
     * Get all tiers (reactive).
     * @returns Array of Tier objects, ordered by display order
     */
    getAllTiers: (): Tier[] => {
      return tierService.getAllTiers();
    },
    
    /**
     * Get default tiers only (reactive).
     * @returns Array of default Tier objects
     */
    getDefaultTiers: (): Tier[] => {
      return tierService.getDefaultTiers();
    },
    
    /**
     * Get custom tiers only (reactive).
     * @returns Array of custom Tier objects
     */
    getCustomTiers: (): Tier[] => {
      return tierService.getCustomTiers();
    }
  };
};

export const tierStore = createTierStore();

