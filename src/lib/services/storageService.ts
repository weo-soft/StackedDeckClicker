import localforage from 'localforage';
import type { GameState } from '../models/GameState.js';
import type { CardPool } from '../models/CardPool.js';
import { validateGameState } from '../utils/validation.js';
import { StorageError, ERROR_MESSAGES } from '../utils/errors.js';

const DB_NAME = 'stackedDeckClicker';
const GAME_STATE_KEY = 'current';
const CARD_POOL_KEY = 'default';

// Configure localforage - wrap in try-catch to prevent blocking
try {
  localforage.config({
    name: DB_NAME,
    version: 1.0,
    storeName: 'gameData'
  });
} catch (error) {
  console.warn('Failed to configure localforage:', error);
}

/**
 * Service for handling game state persistence to IndexedDB.
 */
export class StorageService {
  /**
   * Load game state from IndexedDB.
   */
  async loadGameState(): Promise<GameState | null> {
    try {
      const data = await localforage.getItem<GameState>(GAME_STATE_KEY);
      if (!data) return null;

      // Validate loaded data
      if (!validateGameState(data)) {
        console.warn('Invalid game state data detected, attempting recovery...');
        // Attempt recovery by returning null to use defaults
        return null;
      }

      // Convert Maps from JSON (localforage serializes Maps as objects)
      if (data.upgrades?.upgrades && !(data.upgrades.upgrades instanceof Map)) {
        data.upgrades.upgrades = new Map(
          Object.entries(data.upgrades.upgrades)
        ) as Map<import('../models/types.js').UpgradeType, import('../models/Upgrade.js').Upgrade>;
      }
      if (data.customizations && !(data.customizations instanceof Map)) {
        data.customizations = new Map(Object.entries(data.customizations));
      }
      if (data.cardCollection && !(data.cardCollection instanceof Map)) {
        data.cardCollection = new Map(Object.entries(data.cardCollection));
      }

      return data;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw new StorageError(ERROR_MESSAGES.STORAGE_UNAVAILABLE, 'STORAGE_UNAVAILABLE');
    }
  }

  /**
   * Save game state to IndexedDB.
   */
  async saveGameState(gameState: GameState): Promise<void> {
    try {
      // Convert Maps to objects for JSON serialization
      const serializable: any = {
        ...gameState,
        upgrades: {
          upgrades: Object.fromEntries(gameState.upgrades.upgrades)
        },
        customizations: Object.fromEntries(gameState.customizations),
        cardCollection: gameState.cardCollection
          ? Object.fromEntries(gameState.cardCollection)
          : undefined
      };

      // Validate before saving
      if (!validateGameState(gameState)) {
        throw new StorageError('Invalid game state data', 'INVALID_DATA');
      }
      
      await localforage.setItem(GAME_STATE_KEY, serializable);
    } catch (error: any) {
      // Handle quota exceeded errors
      if (error?.name === 'QuotaExceededError' || error?.code === 22) {
        throw new StorageError('Storage quota exceeded. Please free up space and try again.', 'QUOTA_EXCEEDED');
      }
      throw new StorageError(ERROR_MESSAGES.STORAGE_UNAVAILABLE, 'STORAGE_UNAVAILABLE');
    }
  }

  /**
   * Load card pool definition from IndexedDB.
   */
  async loadCardPool(): Promise<CardPool | null> {
    try {
      return await localforage.getItem<CardPool>(CARD_POOL_KEY);
    } catch (error) {
      return null;
    }
  }

  /**
   * Save card pool definition to IndexedDB.
   */
  async saveCardPool(cardPool: CardPool): Promise<void> {
    try {
      await localforage.setItem(CARD_POOL_KEY, cardPool);
    } catch (error) {
      throw new StorageError(ERROR_MESSAGES.STORAGE_UNAVAILABLE, 'STORAGE_UNAVAILABLE');
    }
  }

  /**
   * Check if storage is available and has sufficient quota.
   */
  async isStorageAvailable(): Promise<boolean> {
    try {
      // Check if IndexedDB is available
      if (typeof indexedDB === 'undefined') {
        return false;
      }
      await localforage.setItem('_test', 'test');
      await localforage.removeItem('_test');
      return true;
    } catch (error) {
      console.warn('Storage not available:', error);
      return false;
    }
  }

  /**
   * Get estimated storage usage.
   */
  async getStorageUsage(): Promise<number> {
    try {
      const keys = await localforage.keys();
      let total = 0;
      for (const key of keys) {
        const item = await localforage.getItem(key);
        total += JSON.stringify(item).length;
      }
      return total;
    } catch {
      return 0;
    }
  }

  /**
   * Clear all saved game data (for testing or reset).
   */
  async clearAll(): Promise<void> {
    try {
      await localforage.clear();
    } catch (error) {
      throw new StorageError(ERROR_MESSAGES.STORAGE_UNAVAILABLE, 'STORAGE_UNAVAILABLE');
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();

