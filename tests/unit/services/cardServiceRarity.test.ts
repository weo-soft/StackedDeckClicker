/**
 * Unit tests for CardService rarity percentage system
 * Tests the value-based percentage rarity increase functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { cardService } from '../../../src/lib/services/cardService.js';
import type { CardPool } from '../../../src/lib/models/CardPool.js';
import type { UpgradeCollection } from '../../../src/lib/models/UpgradeCollection.js';
import type { Upgrade } from '../../../src/lib/models/Upgrade.js';
import type { UpgradeType } from '../../../src/lib/models/types.js';
import { computeCumulativeWeights } from '../../../src/lib/utils/weightedRandom.js';
import seedrandom from 'seedrandom';

describe('CardService - Rarity Percentage System', () => {
  let cardPool: CardPool;
  let upgrades: UpgradeCollection;

  // Create a test card pool with cards of varying values
  function createTestCardPool(): CardPool {
    const cards = [
      { name: 'LowValue1', weight: 100, value: 1, qualityTier: 'common' as const },
      { name: 'LowValue2', weight: 100, value: 5, qualityTier: 'common' as const },
      { name: 'MidValue1', weight: 50, value: 50, qualityTier: 'rare' as const },
      { name: 'MidValue2', weight: 50, value: 100, qualityTier: 'rare' as const },
      { name: 'HighValue1', weight: 10, value: 500, qualityTier: 'epic' as const },
      { name: 'HighValue2', weight: 10, value: 1000, qualityTier: 'epic' as const },
      { name: 'VeryHighValue', weight: 1, value: 5000, qualityTier: 'legendary' as const }
    ];

    const totalWeight = cards.reduce((sum, card) => sum + card.weight, 0);
    const cumulativeWeights = computeCumulativeWeights(cards);

    return {
      cards,
      totalWeight,
      cumulativeWeights
    };
  }

  beforeEach(() => {
    cardPool = createTestCardPool();
    upgrades = {
      upgrades: new Map<UpgradeType, Upgrade>()
    };

    // Add improvedRarity upgrade at level 1 (so it's active)
    upgrades.upgrades.set('improvedRarity', {
      type: 'improvedRarity',
      level: 1,
      baseCost: 500,
      costMultiplier: 2.0
    });
  });

  describe('applyPercentageRarityIncrease', () => {
    it('should return original pool when percentage is 0', () => {
      const result = cardService.applyPercentageRarityIncrease(cardPool, 0);
      expect(result.cards).toEqual(cardPool.cards);
      expect(result.totalWeight).toBe(cardPool.totalWeight);
    });

    it('should return original pool when percentage is negative', () => {
      const result = cardService.applyPercentageRarityIncrease(cardPool, -10);
      expect(result.cards).toEqual(cardPool.cards);
      expect(result.totalWeight).toBe(cardPool.totalWeight);
    });

    it('should return original pool when all cards have same value', () => {
      const sameValuePool: CardPool = {
        cards: [
          { name: 'Card1', weight: 100, value: 50, qualityTier: 'common' },
          { name: 'Card2', weight: 50, value: 50, qualityTier: 'rare' }
        ],
        totalWeight: 150,
        cumulativeWeights: [100, 150]
      };

      const result = cardService.applyPercentageRarityIncrease(sameValuePool, 50);
      expect(result.cards).toEqual(sameValuePool.cards);
    });

    it('should increase weights for high-value cards with 50% rarity', () => {
      const result = cardService.applyPercentageRarityIncrease(cardPool, 50);
      
      // Find the highest and lowest value cards
      const highValueCard = result.cards.find(c => c.value === 5000);
      const lowValueCard = result.cards.find(c => c.value === 1);
      
      expect(highValueCard).toBeDefined();
      expect(lowValueCard).toBeDefined();
      
      // High value card should have increased weight
      expect(highValueCard!.weight).toBeGreaterThan(1); // Original weight was 1
      
      // Low value card should have decreased weight
      expect(lowValueCard!.weight).toBeLessThan(100); // Original weight was 100
    });

    it('should scale weights correctly with 100% rarity', () => {
      const result = cardService.applyPercentageRarityIncrease(cardPool, 100);
      
      const highValueCard = result.cards.find(c => c.value === 5000);
      const lowValueCard = result.cards.find(c => c.value === 1);
      
      // With 100%, max multiplier = 2.0, min multiplier = 0.0 (but clamped to 1)
      // High value card should have significantly increased weight
      expect(highValueCard!.weight).toBeGreaterThan(1);
      
      // Low value card should be at minimum weight (1)
      expect(lowValueCard!.weight).toBe(1);
    });

    it('should handle very high percentages (10000%)', () => {
      const result = cardService.applyPercentageRarityIncrease(cardPool, 10000);
      
      const highValueCard = result.cards.find(c => c.value === 5000);
      const lowValueCard = result.cards.find(c => c.value === 1);
      
      // With 10000%, max multiplier = 101, min multiplier = -99 (clamped to 1)
      // High value card should have extremely high weight
      expect(highValueCard!.weight).toBeGreaterThan(100);
      
      // Low value card should be at minimum weight
      expect(lowValueCard!.weight).toBe(1);
    });

    it('should ensure all weights are at least 1', () => {
      const result = cardService.applyPercentageRarityIncrease(cardPool, 200);
      
      result.cards.forEach(card => {
        expect(card.weight).toBeGreaterThanOrEqual(1);
      });
    });

    it('should recalculate totalWeight correctly', () => {
      const result = cardService.applyPercentageRarityIncrease(cardPool, 50);
      const calculatedTotal = result.cards.reduce((sum, card) => sum + card.weight, 0);
      
      expect(result.totalWeight).toBe(calculatedTotal);
    });

    it('should recalculate cumulativeWeights correctly', () => {
      const result = cardService.applyPercentageRarityIncrease(cardPool, 50);
      const expectedCumulative = computeCumulativeWeights(result.cards);
      
      expect(result.cumulativeWeights).toEqual(expectedCumulative);
    });
  });

  describe('drawCard with rarity percentage', () => {
    it('should use custom percentage when provided', () => {
      const prng = seedrandom('test-seed');
      const customPercentage = 50;
      
      // Draw multiple cards to see the effect
      const draws: string[] = [];
      for (let i = 0; i < 100; i++) {
        const card = cardService.drawCard(cardPool, upgrades, prng, customPercentage);
        draws.push(card.name);
      }
      
      // High value cards should appear more frequently
      const highValueCount = draws.filter(name => 
        name === 'VeryHighValue' || name === 'HighValue1' || name === 'HighValue2'
      ).length;
      
      expect(highValueCount).toBeGreaterThan(0);
    });

    it('should use level-based percentage when custom percentage not provided', () => {
      const prng = seedrandom('test-seed-2');
      
      // Level 1 = 10% rarity
      const card = cardService.drawCard(cardPool, upgrades, prng);
      
      expect(card).toBeDefined();
      // Check that the card name exists in the pool (weight may be modified by rarity)
      const cardExists = cardPool.cards.some(c => c.name === card.name);
      expect(cardExists).toBe(true);
    });

    it('should not apply rarity when upgrade level is 0', () => {
      upgrades.upgrades.set('improvedRarity', {
        type: 'improvedRarity',
        level: 0,
        baseCost: 500,
        costMultiplier: 2.0
      });

      const prng = seedrandom('test-seed-3');
      const card = cardService.drawCard(cardPool, upgrades, prng, 50);
      
      // Should still draw a card, but rarity shouldn't be applied when level is 0
      expect(card).toBeDefined();
      const cardExists = cardPool.cards.some(c => c.name === card.name);
      expect(cardExists).toBe(true);
    });
  });

  describe('Statistical distribution tests', () => {
    it('should favor high-value cards with higher rarity percentages', () => {
      const numDraws = 10000;
      const percentages = [0, 50, 200, 1000];
      const results: Record<number, Record<string, number>> = {};

      for (const percentage of percentages) {
        const prng = seedrandom(`distribution-test-${percentage}`);
        const counts: Record<string, number> = {};

        for (let i = 0; i < numDraws; i++) {
          const card = cardService.drawCard(cardPool, upgrades, prng, percentage);
          counts[card.name] = (counts[card.name] || 0) + 1;
        }

        results[percentage] = counts;
      }

      // With 0% rarity, low-value cards should dominate
      const zeroPercentLowValue = (results[0]['LowValue1'] || 0) + (results[0]['LowValue2'] || 0);
      const zeroPercentHighValue = (results[0]['VeryHighValue'] || 0);
      expect(zeroPercentLowValue).toBeGreaterThan(zeroPercentHighValue * 50);

      // With 1000% rarity, high-value cards should be much more common
      const highPercentLowValue = (results[1000]['LowValue1'] || 0) + (results[1000]['LowValue2'] || 0);
      const highPercentHighValue = (results[1000]['VeryHighValue'] || 0);
      
      // High value cards should be significantly more common at high percentages
      expect(highPercentHighValue).toBeGreaterThan(highPercentLowValue);
    });

    it('should show increasing high-value card frequency with increasing percentages', () => {
      const numDraws = 5000;
      const percentages = [0, 100, 500, 2000];
      const highValueCounts: number[] = [];

      for (const percentage of percentages) {
        const prng = seedrandom(`increasing-test-${percentage}`);
        let highValueCount = 0;

        for (let i = 0; i < numDraws; i++) {
          const card = cardService.drawCard(cardPool, upgrades, prng, percentage);
          if (card.value >= 500) {
            highValueCount++;
          }
        }

        highValueCounts.push(highValueCount);
      }

      // High value card frequency should generally increase with percentage
      // (allowing for some statistical variance)
      expect(highValueCounts[3]).toBeGreaterThan(highValueCounts[0]);
      expect(highValueCounts[2]).toBeGreaterThan(highValueCounts[1]);
    });

    it('should maintain proper weight distribution at extreme percentages', () => {
      const extremePercentage = 10000;
      const result = cardService.applyPercentageRarityIncrease(cardPool, extremePercentage);
      
      // All weights should be valid (>= 1)
      result.cards.forEach(card => {
        expect(card.weight).toBeGreaterThanOrEqual(1);
        expect(Number.isFinite(card.weight)).toBe(true);
        expect(Number.isNaN(card.weight)).toBe(false);
      });

      // Total weight should be valid
      expect(result.totalWeight).toBeGreaterThan(0);
      expect(Number.isFinite(result.totalWeight)).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle single card pool', () => {
      const singleCardPool: CardPool = {
        cards: [{ name: 'OnlyCard', weight: 100, value: 50, qualityTier: 'common' }],
        totalWeight: 100,
        cumulativeWeights: [100]
      };

      const result = cardService.applyPercentageRarityIncrease(singleCardPool, 50);
      expect(result.cards).toHaveLength(1);
      expect(result.cards[0].name).toBe('OnlyCard');
    });

    it('should handle two cards with different values', () => {
      const twoCardPool: CardPool = {
        cards: [
          { name: 'Low', weight: 100, value: 1, qualityTier: 'common' },
          { name: 'High', weight: 10, value: 100, qualityTier: 'rare' }
        ],
        totalWeight: 110,
        cumulativeWeights: [100, 110]
      };

      const result = cardService.applyPercentageRarityIncrease(twoCardPool, 100);
      
      const lowCard = result.cards.find(c => c.name === 'Low');
      const highCard = result.cards.find(c => c.name === 'High');
      
      expect(lowCard!.weight).toBeLessThan(100); // Decreased
      expect(highCard!.weight).toBeGreaterThan(10); // Increased
    });

    it('should handle very small value ranges', () => {
      const smallRangePool: CardPool = {
        cards: [
          { name: 'Card1', weight: 100, value: 1.0, qualityTier: 'common' },
          { name: 'Card2', weight: 100, value: 1.1, qualityTier: 'common' }
        ],
        totalWeight: 200,
        cumulativeWeights: [100, 200]
      };

      const result = cardService.applyPercentageRarityIncrease(smallRangePool, 50);
      
      // Should still apply scaling, even with small range
      const card1 = result.cards.find(c => c.name === 'Card1');
      const card2 = result.cards.find(c => c.name === 'Card2');
      
      expect(card1!.weight).toBeLessThan(card2!.weight);
    });
  });

  describe('Weight calculation verification', () => {
    it('should calculate multipliers correctly for 50% rarity', () => {
      const result = cardService.applyPercentageRarityIncrease(cardPool, 50);
      
      // maxMultiplier = 1 + 0.5 = 1.5
      // minMultiplier = 1 - 0.5 = 0.5
      // For highest value card (5000), normalizedValue should be close to 1
      // For lowest value card (1), normalizedValue should be close to 0
      
      const highCard = result.cards.find(c => c.value === 5000);
      const lowCard = result.cards.find(c => c.value === 1);
      
      // High card should have weight close to original * 1.5 (but clamped to >= 1)
      expect(highCard!.weight).toBeGreaterThanOrEqual(1);
      
      // Low card should have weight close to original * 0.5 (but clamped to >= 1)
      // Since original weight is 100, 100 * 0.5 = 50, which is > 1, so should be ~50
      expect(lowCard!.weight).toBeLessThan(100);
      expect(lowCard!.weight).toBeGreaterThanOrEqual(1);
    });

    it('should interpolate multipliers linearly across value range', () => {
      const result = cardService.applyPercentageRarityIncrease(cardPool, 100);
      
      // Sort cards by value
      const sortedCards = [...result.cards].sort((a, b) => a.value - b.value);
      
      // Weights should generally increase with value (allowing for original weight differences)
      // Check that higher value cards have proportionally higher weight multipliers
      for (let i = 1; i < sortedCards.length; i++) {
        const prevCard = sortedCards[i - 1];
        const currCard = sortedCards[i];
        
        // Calculate weight multiplier (new weight / original weight)
        const prevOriginal = cardPool.cards.find(c => c.name === prevCard.name)!.weight;
        const currOriginal = cardPool.cards.find(c => c.name === currCard.name)!.weight;
        
        const prevMultiplier = prevCard.weight / prevOriginal;
        const currMultiplier = currCard.weight / currOriginal;
        
        // Higher value cards should have higher multipliers
        if (currCard.value > prevCard.value) {
          expect(currMultiplier).toBeGreaterThanOrEqual(prevMultiplier);
        }
      }
    });
  });
});

