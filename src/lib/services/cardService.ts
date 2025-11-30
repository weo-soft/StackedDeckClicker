import type { CardPool } from '../models/CardPool.js';
import type { DivinationCard } from '../models/Card.js';
import type { UpgradeCollection } from '../models/UpgradeCollection.js';
import { selectWeightedCard, computeCumulativeWeights } from '../utils/weightedRandom.js';
import type { UpgradeType } from '../models/types.js';

/**
 * Service for handling card drawing and weighted random selection.
 */
export class CardService {
  /**
   * Draw a single card from the card pool using weighted random selection.
   * Applies upgrade effects (rarity improvements, luck bonuses) before drawing.
   * 
   * @param cardPool - The card pool to draw from
   * @param upgrades - Collection of upgrades
   * @param prng - Random number generator function (0-1)
   * @param customRarityPercentage - Optional custom rarity percentage override (0-100)
   */
  drawCard(
    cardPool: CardPool,
    upgrades: UpgradeCollection,
    prng: () => number,
    customRarityPercentage?: number
  ): DivinationCard {
    // Apply upgrade effects to card pool
    let modifiedPool = cardPool;

    // Apply improved rarity upgrade (value-based percentage system)
    const rarityUpgrade = upgrades.upgrades.get('improvedRarity');
    // Apply rarity if: (1) upgrade is purchased (level > 0), OR (2) custom percentage is explicitly provided (debug mode)
    if ((rarityUpgrade && rarityUpgrade.level > 0) || customRarityPercentage !== undefined) {
      // Use custom percentage if provided, otherwise calculate from level
      const rarityPercentage = customRarityPercentage ?? (rarityUpgrade ? rarityUpgrade.level * 10 : 0);
      if (rarityPercentage > 0) {
        modifiedPool = this.applyPercentageRarityIncrease(cardPool, rarityPercentage);
      }
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
    prng: () => number,
    customRarityPercentage?: number
  ): DivinationCard[] {
    const cards: DivinationCard[] = [];
    for (let i = 0; i < count; i++) {
      cards.push(this.drawCard(cardPool, upgrades, prng, customRarityPercentage));
    }
    return cards;
  }

  /**
   * Apply percentage-based rarity increase to card pool weights.
   * Higher value cards get proportionally larger weight increases.
   * Scales weights smoothly based on card value (chaos value) rather than discrete tiers.
   * 
   * @param cardPool - The original card pool
   * @param rarityPercentage - Percentage increase (e.g., 50 for 50% increased rarity)
   * @returns Modified card pool with adjusted weights
   */
  applyPercentageRarityIncrease(cardPool: CardPool, rarityPercentage: number): CardPool {
    if (rarityPercentage <= 0) {
      return cardPool; // No change if percentage is 0 or negative
    }

    // Find min and max values in the pool for normalization
    const values = cardPool.cards.map(card => card.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue;

    // If all cards have the same value, no adjustment needed
    if (valueRange === 0) {
      return cardPool;
    }

    // Convert percentage to multiplier range
    // The effect scales from -rarityPercentage% for lowest value to +rarityPercentage% for highest value
    const maxMultiplier = 1 + (rarityPercentage / 100);
    const minMultiplier = 1 - (rarityPercentage / 100);

    const modifiedCards = cardPool.cards.map((card) => {
      // Normalize card value to 0-1 range
      const normalizedValue = (card.value - minValue) / valueRange;
      
      // Interpolate multiplier based on normalized value
      // Higher value cards get higher multiplier (more weight)
      // Lower value cards get lower multiplier (less weight)
      const multiplier = minMultiplier + (normalizedValue * (maxMultiplier - minMultiplier));
      
      const newWeight = card.weight * multiplier;

      return {
        ...card,
        weight: Math.max(1, newWeight) // Ensure weight is at least 1
      };
    });

    const totalWeight = modifiedCards.reduce((sum, card) => sum + card.weight, 0);
    const cumulativeWeights = computeCumulativeWeights(modifiedCards);

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

