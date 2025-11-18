import type { CardPool } from '../models/CardPool.js';
import type { DivinationCard } from '../models/Card.js';
import type { UpgradeCollection } from '../models/UpgradeCollection.js';
import { selectWeightedCard } from '../utils/weightedRandom.js';
import type { UpgradeType } from '../models/types.js';

/**
 * Service for handling card drawing and weighted random selection.
 */
export class CardService {
  /**
   * Draw a single card from the card pool using weighted random selection.
   * Applies upgrade effects (rarity improvements, luck bonuses) before drawing.
   */
  drawCard(
    cardPool: CardPool,
    upgrades: UpgradeCollection,
    prng: () => number
  ): DivinationCard {
    // Apply upgrade effects to card pool
    let modifiedPool = cardPool;

    // Apply improved rarity upgrade
    const rarityUpgrade = upgrades.upgrades.get('improvedRarity');
    if (rarityUpgrade && rarityUpgrade.level > 0) {
      modifiedPool = this.applyRarityUpgrade(cardPool, rarityUpgrade.level);
    }

    // Apply luck upgrade (best-of-N selection)
    const luckUpgrade = upgrades.upgrades.get('luck');
    if (luckUpgrade && luckUpgrade.level > 0) {
      return this.applyLuckUpgrade(modifiedPool, luckUpgrade.level, prng);
    }

    // Standard weighted selection
    return selectWeightedCard(modifiedPool, prng);
  }

  /**
   * Draw multiple cards at once (for multidraw upgrade).
   */
  drawMultipleCards(
    count: number,
    cardPool: CardPool,
    upgrades: UpgradeCollection,
    prng: () => number
  ): DivinationCard[] {
    const cards: DivinationCard[] = [];
    for (let i = 0; i < count; i++) {
      cards.push(this.drawCard(cardPool, upgrades, prng));
    }
    return cards;
  }

  /**
   * Apply upgrade effects to card pool weights (for improved rarity).
   * Returns modified weights without mutating original pool.
   */
  applyRarityUpgrade(cardPool: CardPool, rarityLevel: number): CardPool {
    // Calculate rarity multiplier (higher level = more rare cards)
    // Formula: reduce common card weights, increase rare card weights
    const multiplier = 1 + rarityLevel * 0.1; // 10% per level

    const modifiedCards = cardPool.cards.map((card) => {
      let newWeight = card.weight;

      // Reduce weight for common cards (make them rarer)
      if (card.qualityTier === 'common') {
        newWeight = card.weight / multiplier;
      }
      // Increase weight for rare+ cards (make them more common)
      else if (card.qualityTier === 'rare' || card.qualityTier === 'epic' || card.qualityTier === 'legendary') {
        newWeight = card.weight * multiplier;
      }

      return {
        ...card,
        weight: Math.max(1, newWeight) // Ensure weight is at least 1
      };
    });

    const totalWeight = modifiedCards.reduce((sum, card) => sum + card.weight, 0);
    const cumulativeWeights = modifiedCards.reduce<number[]>((acc, card, index) => {
      const prev = index > 0 ? acc[index - 1] : 0;
      acc.push(prev + card.weight);
      return acc;
    }, []);

    return {
      cards: modifiedCards,
      totalWeight,
      cumulativeWeights
    };
  }

  /**
   * Apply luck upgrade (best-of-N selection).
   */
  applyLuckUpgrade(
    cardPool: CardPool,
    luckLevel: number,
    prng: () => number
  ): DivinationCard {
    // Number of draws = 1 + luckLevel (level 1 = 2 draws, level 2 = 3 draws, etc.)
    const numDraws = 1 + luckLevel;
    const draws: DivinationCard[] = [];

    for (let i = 0; i < numDraws; i++) {
      draws.push(selectWeightedCard(cardPool, prng));
    }

    // Return the card with the highest value (best card)
    return draws.reduce((best, current) => (current.value > best.value ? current : best));
  }
}

// Export singleton instance
export const cardService = new CardService();

