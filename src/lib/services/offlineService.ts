import type { GameState } from '../models/GameState.js';
import type { CardPool } from '../models/CardPool.js';
import type { OfflineProgressionResult } from '../models/OfflineProgressionResult.js';
import type { CardDrawResult } from '../models/CardDrawResult.js';
import { cardService } from './cardService.js';
import { upgradeService } from './upgradeService.js';
import seedrandom from 'seedrandom';

/**
 * Maximum offline time to calculate (7 days in seconds).
 */
const MAX_OFFLINE_SECONDS = 7 * 24 * 60 * 60;

/**
 * Service for calculating offline progression when the game reopens.
 */
export class OfflineService {
  /**
   * Calculate offline progression based on elapsed time and upgrades.
   * Returns null if no auto-opening upgrade is active or if elapsed time is invalid.
   */
  calculateOfflineProgression(
    gameState: GameState,
    currentTimestamp: number,
    cardPool: CardPool
  ): OfflineProgressionResult | null {
    // Check if auto-opening upgrade is active
    const autoOpeningUpgrade = gameState.upgrades.upgrades.get('autoOpening');
    if (!autoOpeningUpgrade || autoOpeningUpgrade.level === 0) {
      return null;
    }

    // Calculate elapsed time
    const elapsedMs = currentTimestamp - gameState.lastSessionTimestamp;
    
    // Handle negative elapsed time (clock changed backward)
    if (elapsedMs < 0) {
      return null;
    }

    const elapsedSeconds = Math.floor(elapsedMs / 1000);
    
    // Cap elapsed time to maximum
    let capped = false;
    let cappedElapsedSeconds = elapsedSeconds;
    if (elapsedSeconds > MAX_OFFLINE_SECONDS) {
      cappedElapsedSeconds = MAX_OFFLINE_SECONDS;
      capped = true;
    }

    // Calculate auto-opening rate
    const autoOpeningRate = upgradeService.calculateAutoOpeningRate(autoOpeningUpgrade.level);
    
    // Calculate deck production rate
    const deckProductionUpgrade = gameState.upgrades.upgrades.get('deckProduction');
    const deckProductionRate = deckProductionUpgrade
      ? upgradeService.calculateDeckProductionRate(deckProductionUpgrade.level)
      : 0;

    // Calculate decks that would have been produced during offline time
    const decksProduced = Math.floor(cappedElapsedSeconds * deckProductionRate);
    
    // Calculate decks that would have been opened
    const decksToOpen = Math.floor(cappedElapsedSeconds * autoOpeningRate);
    
    // Limit to available decks (including produced decks)
    const availableDecks = gameState.decks + decksProduced;
    const actualDecksOpened = Math.min(decksToOpen, availableDecks);

    if (actualDecksOpened <= 0) {
      return {
        elapsedSeconds: cappedElapsedSeconds,
        decksOpened: 0,
        cardsDrawn: [],
        scoreGained: 0,
        capped
      };
    }

    // Simulate deck openings using deterministic PRNG
    const cardsDrawn = this.simulateDeckOpening(
      actualDecksOpened,
      gameState,
      cardPool,
      gameState.lastSessionTimestamp
    );

    // Calculate total score gained
    const scoreGained = cardsDrawn.reduce((sum, result) => sum + result.scoreGained, 0);

    return {
      elapsedSeconds: cappedElapsedSeconds,
      decksOpened: actualDecksOpened,
      cardsDrawn,
      scoreGained,
      capped
    };
  }

  /**
   * Simulate opening multiple decks using deterministic PRNG.
   * Uses the last session timestamp as seed for reproducibility.
   */
  private simulateDeckOpening(
    count: number,
    gameState: GameState,
    cardPool: CardPool,
    seed: number
  ): CardDrawResult[] {
    // Create deterministic PRNG using timestamp as seed
    const prng = seedrandom(seed.toString());

    const results: CardDrawResult[] = [];

    for (let i = 0; i < count; i++) {
      // Draw card with upgrade effects applied
      const card = cardService.drawCard(
        cardPool,
        gameState.upgrades,
        () => prng()
      );

      results.push({
        card,
        timestamp: gameState.lastSessionTimestamp + i * 1000, // Approximate timestamps
        scoreGained: card.value
      });
    }

    return results;
  }
}

// Export singleton instance
export const offlineService = new OfflineService();

