import localforage from 'localforage';
import type { TierConfigurationState } from '../models/Tier.js';
import { createDefaultTiers } from '../utils/tierAssignment.js';

const TIER_CONFIG_KEY = 'tierConfigurations';
const DB_NAME = 'stackedDeckClicker';

/**
 * Service for persisting tier configurations to IndexedDB via localforage.
 */
export class TierStorageService {
  private initialized = false;

  /**
   * Initialize localforage configuration.
   */
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

  /**
   * Load tier configurations from IndexedDB.
   * @returns Tier configuration state or null if not found
   */
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

  /**
   * Save tier configurations to IndexedDB.
   * @param state - Tier configuration state to save
   * @throws Error if storage quota exceeded or save fails
   */
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

  /**
   * Check if storage is available.
   * @returns true if storage is available
   */
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

  /**
   * Clear all tier configurations (reset to defaults).
   */
  async clearTierConfigurations(): Promise<void> {
    await this.initialize();
    await localforage.removeItem(TIER_CONFIG_KEY);
  }

  /**
   * Export tier configurations as JSON string.
   * @returns JSON string representation
   */
  async exportTierConfigurations(): Promise<string> {
    const state = await this.loadTierConfigurations();
    if (!state) {
      throw new Error('No tier configurations to export');
    }
    
    const serializable = {
      version: state.version,
      tiers: Object.fromEntries(state.tiers),
      cardAssignments: Object.fromEntries(state.cardAssignments),
      savedAt: state.savedAt
    };
    
    return JSON.stringify(serializable, null, 2);
  }

  /**
   * Import tier configurations from JSON string.
   * @param json - JSON string to import
   * @throws Error if JSON is invalid or validation fails
   */
  async importTierConfigurations(json: string): Promise<void> {
    try {
      const data = JSON.parse(json);
      
      // Validate structure
      if (!data.version || !data.tiers || !data.cardAssignments) {
        throw new Error('Invalid tier configuration format');
      }
      
      const state: TierConfigurationState = {
        version: data.version,
        tiers: new Map(Object.entries(data.tiers)),
        cardAssignments: new Map(Object.entries(data.cardAssignments)),
        savedAt: data.savedAt || Date.now()
      };
      
      // Ensure default tiers exist
      const defaultTiers = createDefaultTiers();
      for (const [id, tier] of defaultTiers) {
        if (!state.tiers.has(id)) {
          state.tiers.set(id, tier);
        }
      }
      
      await this.saveTierConfigurations(state);
    } catch (error: any) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to parse tier configuration JSON');
    }
  }
}

export const tierStorageService = new TierStorageService();

