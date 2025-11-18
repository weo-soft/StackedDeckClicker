import type { GameState } from '../models/GameState.js';
import type { CardDrawResult } from '../models/CardDrawResult.js';
import type { OfflineProgressionResult } from '../models/OfflineProgressionResult.js';
import type { UpgradeType } from '../models/types.js';
import type { CardPool } from '../models/CardPool.js';
import { cardService } from './cardService.js';
import { storageService } from './storageService.js';
import { upgradeService } from './upgradeService.js';
import { offlineService } from './offlineService.js';
import { canvasService } from '../canvas/renderer.js';
import { createDefaultGameState } from '../utils/defaultGameState.js';
import { createDefaultCardPool } from '../utils/defaultCardPool.js';
import { InsufficientResourcesError, ERROR_MESSAGES } from '../utils/errors.js';
import { performanceMonitor } from '../utils/performance.js';
import seedrandom from 'seedrandom';
import { gameState } from '../stores/gameState.js';

/**
 * Service for managing game state updates and coordinating between services.
 */
export class GameStateService {
  private currentState: GameState | null = null;
  private cardPool: CardPool | null = null;
  private prng = seedrandom();
  private autoOpeningInterval: number | null = null;
  private lastOfflineProgression: OfflineProgressionResult | null = null;
  private saveDebounceTimer: number | null = null;
  private readonly SAVE_DEBOUNCE_MS = 500;

  /**
   * Get current game state.
   */
  getGameState(): GameState {
    if (!this.currentState) {
      throw new Error('Game state not initialized');
    }
    return this.currentState;
  }

  /**
   * Update game state (for internal use, triggers debounced save).
   */
  async updateGameState(updater: (state: GameState) => GameState, immediate: boolean = false): Promise<void> {
    if (!this.currentState) {
      throw new Error('Game state not initialized');
    }

    const newState = updater(this.currentState);
    // Update lastSessionTimestamp on every save
    newState.lastSessionTimestamp = Date.now();
    this.currentState = newState;
    // Create a new object reference with cloned Maps to ensure Svelte reactivity
    gameState.set({
      ...newState,
      upgrades: {
        upgrades: new Map(newState.upgrades.upgrades)
      },
      customizations: new Map(newState.customizations),
      cardCollection: newState.cardCollection ? new Map(newState.cardCollection) : undefined
    });

    // Debounced save (or immediate for critical events)
    if (immediate) {
      await this.saveGameState();
    } else {
      this.debouncedSave();
    }
  }

  /**
   * Debounced save to avoid excessive storage writes.
   */
  private debouncedSave(): void {
    if (this.saveDebounceTimer !== null) {
      clearTimeout(this.saveDebounceTimer);
    }

    this.saveDebounceTimer = window.setTimeout(async () => {
      await this.saveGameState();
      this.saveDebounceTimer = null;
    }, this.SAVE_DEBOUNCE_MS);
  }

  /**
   * Save game state to storage.
   */
  private async saveGameState(): Promise<void> {
    if (!this.currentState) return;

    try {
      await performanceMonitor.trackAsyncInteraction(() =>
        storageService.saveGameState(this.currentState!)
      );
    } catch (error) {
      console.error('Failed to save game state:', error);
      // Continue in memory even if save fails
    }
  }

  /**
   * Get the last offline progression result (if any).
   */
  getLastOfflineProgression(): OfflineProgressionResult | null {
    return this.lastOfflineProgression;
  }

  /**
   * Ensure card pool is loaded before operations.
   */
  private ensureCardPool(): CardPool {
    if (!this.cardPool) {
      throw new Error('Card pool not loaded yet. Please wait for initialization to complete.');
    }
    return this.cardPool;
  }

  /**
   * Open a single deck and update game state.
   */
  async openDeck(): Promise<CardDrawResult> {
    return performanceMonitor.trackAsyncInteraction(async () => {
      const state = this.getGameState();

      if (state.decks <= 0) {
        throw new InsufficientResourcesError(ERROR_MESSAGES.NO_DECKS, 'NO_DECKS');
      }

      // Ensure card pool is loaded
      const cardPool = this.ensureCardPool();
      
      // Draw card
      const card = cardService.drawCard(cardPool, state.upgrades, () => this.prng());

      // Create result
      const result: CardDrawResult = {
        card,
        timestamp: Date.now(),
        scoreGained: card.value
      };

      // Update game state (immediate save for critical events like deck opening)
      await this.updateGameState((s) => {
        const newState = {
        ...s,
        score: s.score + result.scoreGained,
        decks: s.decks - 1,
        cardCollection: (() => {
          const collection = s.cardCollection || new Map();
          const currentCount = collection.get(card.name) || 0;
          collection.set(card.name, currentCount + 1);
          return collection;
        })()
      };
      
      // Update current state reference
      this.currentState = newState;
      
        return newState;
      }, true); // Immediate save for deck opening

      return result;
    });
  }

  /**
   * Open multiple decks at once (multidraw).
   */
  async openMultipleDecks(count: number): Promise<CardDrawResult[]> {
    const state = this.getGameState();

    if (state.decks < count) {
      throw new InsufficientResourcesError(
        `Not enough decks. Need ${count}, have ${state.decks}`,
        'INSUFFICIENT_DECKS'
      );
    }

    const results: CardDrawResult[] = [];

    for (let i = 0; i < count; i++) {
      const result = await this.openDeck();
      results.push(result);
    }

    return results;
  }

  /**
   * Purchase an upgrade and update game state.
   */
  async purchaseUpgrade(upgradeType: UpgradeType): Promise<void> {
    return performanceMonitor.trackAsyncInteraction(async () => {
      const state = this.getGameState();
    const upgrade = state.upgrades.upgrades.get(upgradeType);
    
    if (!upgrade) {
      throw new Error(ERROR_MESSAGES.INVALID_UPGRADE);
    }

    // Check if player can afford
    if (!upgradeService.canAffordUpgrade(upgrade, state.score)) {
      throw new InsufficientResourcesError(
        ERROR_MESSAGES.INSUFFICIENT_SCORE,
        'INSUFFICIENT_SCORE'
      );
    }

    const cost = upgradeService.calculateUpgradeCost(upgrade);

    // Update game state
    await this.updateGameState((s) => {
      const newUpgrades = new Map(s.upgrades.upgrades);
      const updatedUpgrade = { ...upgrade, level: upgrade.level + 1 };
      newUpgrades.set(upgradeType, updatedUpgrade);

      const newState = {
        ...s,
        score: s.score - cost,
        upgrades: {
          upgrades: newUpgrades
        }
      };
      
      // Update current state reference
      this.currentState = newState;
      
      // Restart auto-opening if auto-opening upgrade was purchased
      if (upgradeType === 'autoOpening') {
        this.startAutoOpening();
      }
      
      return newState;
    }, true); // Immediate save for upgrade purchase
    });
  }

  /**
   * Purchase a scene customization.
   */
  async purchaseCustomization(customizationId: string, cost: number): Promise<void> {
    const state = this.getGameState();

    // Validate affordability
    if (state.score < cost) {
      throw new InsufficientResourcesError(
        ERROR_MESSAGES.INSUFFICIENT_SCORE,
        'INSUFFICIENT_SCORE'
      );
    }

    // Update game state
    await this.updateGameState((s) => {
      const newCustomizations = new Map(s.customizations);
      newCustomizations.set(customizationId, true);

      const newState = {
        ...s,
        score: s.score - cost,
        customizations: newCustomizations
      };

      // Update current state reference
      this.currentState = newState;

      // Update canvas customizations
      canvasService.updateCustomizations(newCustomizations);

      return newState;
    }, true); // Immediate save for customization purchase
  }


  /**
   * Add chaos orbs to the player's score (for testing/debugging).
   */
  async addChaos(count: number): Promise<void> {
    if (count <= 0) {
      throw new Error('Count must be positive');
    }

    await this.updateGameState((s) => ({
      ...s,
      score: s.score + count
    }));
  }

  /**
   * Add decks to available decks (for testing/debugging purposes).
   */
  async addDecks(count: number): Promise<void> {
    if (count <= 0) {
      throw new Error('Count must be positive');
    }

    await this.updateGameState((s) => ({
      ...s,
      decks: s.decks + count
    }));
  }

  /**
   * Initialize game state (load from storage or create default).
   */
  async initialize(): Promise<void> {
    performanceMonitor.startLoadTracking();
    
    // Set default state immediately so UI can render
    this.currentState = createDefaultGameState();
    gameState.set(this.currentState);
    console.log('Default state set immediately');
    
    // Load card pool asynchronously from JSON files
    try {
      this.cardPool = await createDefaultCardPool();
      console.log(`Loaded ${this.cardPool.cards.length} cards from JSON files`);
      
      // Save card pool to storage for future use
      try {
        await storageService.saveCardPool(this.cardPool);
      } catch (saveError) {
        console.warn('Failed to save card pool to storage:', saveError);
      }
    } catch (error) {
      console.error('Failed to load card pool from JSON files:', error);
      // Try to load from storage as fallback
      try {
        const savedPool = await storageService.loadCardPool();
        if (savedPool) {
          this.cardPool = savedPool;
          console.log('Loaded card pool from storage as fallback');
        }
      } catch (poolError) {
        console.warn('Failed to load card pool from storage:', poolError);
      }
    }

    // Then try to load from storage asynchronously (non-blocking)
    try {
      const storageAvailable = await Promise.race([
        storageService.isStorageAvailable(),
        new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 1000))
      ]);
      
      if (storageAvailable) {
        try {
          const savedState = await Promise.race([
            storageService.loadGameState(),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500))
          ]);
          
          if (savedState) {
            console.log('Loaded saved state from storage');
            this.currentState = savedState;
            gameState.set(this.currentState);

            // Apply customizations to canvas
            canvasService.updateCustomizations(savedState.customizations);

            // Process offline progression if state was loaded
            const offlineResult = await this.processOfflineProgression();
            if (offlineResult) {
              this.lastOfflineProgression = offlineResult;
              console.log(`Offline progression: ${offlineResult.decksOpened} decks opened, ${offlineResult.scoreGained} score gained`);
            }
          }

          // Card pool is already loaded from JSON files above
          // No need to load from storage since we load from JSON files first
        } catch (loadError) {
          console.warn('Storage load failed, using default state:', loadError);
        }
      } else {
        console.log('Storage not available, using default state');
      }
    } catch (error) {
      console.warn('Storage check failed, using default state:', error);
      // Already have default state set, so just continue
    }
    
    // Start auto-opening if enabled (after state is loaded)
    this.startAutoOpening();
    
    // End load tracking
    performanceMonitor.endLoadTracking();
  }

  /**
   * Process offline progression on game load.
   */
  async processOfflineProgression(): Promise<OfflineProgressionResult | null> {
    if (!this.currentState) {
      return null;
    }

    // Ensure card pool is loaded
    const cardPool = this.ensureCardPool();

    const currentTimestamp = Date.now();
    const result = offlineService.calculateOfflineProgression(
      this.currentState,
      currentTimestamp,
      cardPool
    );

    if (!result || result.decksOpened === 0) {
      return null;
    }

    // Update game state with offline progression results
    await this.updateGameState((s) => {
      const newCardCollection = new Map(s.cardCollection || new Map());
      
      // Add all cards drawn to collection
      for (const cardResult of result.cardsDrawn) {
        const currentCount = newCardCollection.get(cardResult.card.name) || 0;
        newCardCollection.set(cardResult.card.name, currentCount + 1);
      }

      // Calculate deck production
      const deckProductionUpgrade = s.upgrades.upgrades.get('deckProduction');
      const deckProductionRate = deckProductionUpgrade
        ? upgradeService.calculateDeckProductionRate(deckProductionUpgrade.level)
        : 0;
      const decksProduced = Math.floor(result.elapsedSeconds * deckProductionRate);

      return {
        ...s,
        score: s.score + result.scoreGained,
        decks: s.decks - result.decksOpened + decksProduced,
        cardCollection: newCardCollection,
        lastSessionTimestamp: currentTimestamp
      };
    }, true); // Immediate save for offline progression

    return result;
  }

  /**
   * Start auto-opening decks if the upgrade is active.
   */
  private startAutoOpening(): void {
    if (!this.currentState) return;

    // Clear existing interval
    if (this.autoOpeningInterval !== null) {
      clearInterval(this.autoOpeningInterval);
      this.autoOpeningInterval = null;
    }

    const autoOpeningUpgrade = this.currentState.upgrades.upgrades.get('autoOpening');
    if (!autoOpeningUpgrade || autoOpeningUpgrade.level === 0) {
      return;
    }

    const rate = upgradeService.calculateAutoOpeningRate(autoOpeningUpgrade.level);
    if (rate <= 0) return;

    // Convert decks per second to interval (e.g., 0.1 decks/sec = 1 deck per 10 seconds)
    const intervalMs = (1 / rate) * 1000;

    this.autoOpeningInterval = window.setInterval(async () => {
      try {
        if (this.currentState && this.currentState.decks > 0) {
          await this.openDeck();
        } else {
          // Stop if no decks available
          if (this.autoOpeningInterval !== null) {
            clearInterval(this.autoOpeningInterval);
            this.autoOpeningInterval = null;
          }
        }
      } catch (error) {
        console.error('Auto-opening error:', error);
      }
    }, intervalMs);
  }

  /**
   * Stop auto-opening.
   */
  private stopAutoOpening(): void {
    if (this.autoOpeningInterval !== null) {
      clearInterval(this.autoOpeningInterval);
      this.autoOpeningInterval = null;
    }
  }
}

// Export singleton instance
export const gameStateService = new GameStateService();

