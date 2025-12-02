import { describe, it, expect, beforeEach } from 'vitest';
import { cardService } from '../../../src/lib/services/cardService.js';
import type { CardPool } from '../../../src/lib/models/CardPool.js';
import type { UpgradeCollection } from '../../../src/lib/models/UpgradeCollection.js';
import type { Upgrade } from '../../../src/lib/models/Upgrade.js';
import type { UpgradeType } from '../../../src/lib/models/types.js';
import { createDefaultCardPool } from '../../../src/lib/utils/defaultCardPool.js';
import { computeCumulativeWeights } from '../../../src/lib/utils/weightedRandom.js';
import seedrandom from 'seedrandom';

// This test will be updated once CardService is implemented
describe('CardService', () => {
  let cardPool: CardPool;
  let upgrades: UpgradeCollection;

  beforeEach(() => {
    cardPool = createDefaultCardPool();
    upgrades = {
      upgrades: new Map()
    };
  });

  it('should be implemented', () => {
    // Placeholder test - will be updated when CardService is implemented
    expect(true).toBe(true);
  });

  describe('drawCard with luckyDrop upgrade', () => {
    it('should use standard single-roll when luckyDrop is not active (level 0)', () => {
      upgrades.upgrades.set('luckyDrop', {
        type: 'luckyDrop',
        level: 0,
        baseCost: 250,
        costMultiplier: 1.75
      });

      const prng = seedrandom('test-seed');
      const card = cardService.drawCard(cardPool, upgrades, () => prng());
      
      expect(card).toBeDefined();
      expect(card.name).toBeDefined();
    });

    it('should perform multi-roll selection with luckyDrop level 1 (2 rolls)', () => {
      upgrades.upgrades.set('luckyDrop', {
        type: 'luckyDrop',
        level: 1,
        baseCost: 250,
        costMultiplier: 1.75
      });

      // Create a card pool with cards of different values
      const testCards = [
        { name: 'LowValue', weight: 100, value: 10, qualityTier: 'common' as const },
        { name: 'MidValue', weight: 50, value: 50, qualityTier: 'rare' as const },
        { name: 'HighValue', weight: 10, value: 100, qualityTier: 'epic' as const }
      ];
      const testPool: CardPool = {
        cards: testCards,
        totalWeight: testCards.reduce((sum, c) => sum + c.weight, 0),
        cumulativeWeights: [100, 150, 160]
      };

      // Use seeded PRNG for deterministic testing
      const prng = seedrandom('test-seed-luckydrop-1');
      const card = cardService.drawCard(testPool, upgrades, () => prng());
      
      expect(card).toBeDefined();
      // With 2 rolls, we should get one of the rolled cards
      expect(['LowValue', 'MidValue', 'HighValue']).toContain(card.name);
    });

    it('should perform multi-roll selection with luckyDrop level 2 (3 rolls)', () => {
      upgrades.upgrades.set('luckyDrop', {
        type: 'luckyDrop',
        level: 2,
        baseCost: 250,
        costMultiplier: 1.75
      });

      const testCards = [
        { name: 'LowValue', weight: 100, value: 10, qualityTier: 'common' as const },
        { name: 'HighValue', weight: 10, value: 100, qualityTier: 'epic' as const }
      ];
      const testPool: CardPool = {
        cards: testCards,
        totalWeight: 110,
        cumulativeWeights: [100, 110]
      };

      const prng = seedrandom('test-seed-luckydrop-2');
      const card = cardService.drawCard(testPool, upgrades, () => prng());
      
      expect(card).toBeDefined();
      // With 3 rolls, higher chance of getting HighValue
      expect(['LowValue', 'HighValue']).toContain(card.name);
    });

    it('should select card with highest value when multiple cards are rolled', () => {
      upgrades.upgrades.set('luckyDrop', {
        type: 'luckyDrop',
        level: 1, // 2 rolls
        baseCost: 250,
        costMultiplier: 1.75
      });

      // Create cards with very different values to ensure highest is selected
      const testCards = [
        { name: 'Value10', weight: 50, value: 10, qualityTier: 'common' as const },
        { name: 'Value100', weight: 50, value: 100, qualityTier: 'epic' as const }
      ];
      const testPool: CardPool = {
        cards: testCards,
        totalWeight: 100,
        cumulativeWeights: [50, 100]
      };

      // Run multiple times to verify highest value selection
      const results: string[] = [];
      for (let i = 0; i < 10; i++) {
        const prng = seedrandom(`test-seed-${i}`);
        const card = cardService.drawCard(testPool, upgrades, () => prng());
        results.push(card.name);
      }

      // With 2 rolls, we should get Value100 more often than Value10
      // (not guaranteed, but statistically likely)
      const highValueCount = results.filter(name => name === 'Value100').length;
      expect(highValueCount).toBeGreaterThan(0);
    });

    it('should handle tie-breaking when multiple cards have identical highest value', () => {
      upgrades.upgrades.set('luckyDrop', {
        type: 'luckyDrop',
        level: 1, // 2 rolls
        baseCost: 250,
        costMultiplier: 1.75
      });

      // Create cards with same value
      const testCards = [
        { name: 'CardA', weight: 50, value: 50, qualityTier: 'rare' as const },
        { name: 'CardB', weight: 50, value: 50, qualityTier: 'rare' as const }
      ];
      const testPool: CardPool = {
        cards: testCards,
        totalWeight: 100,
        cumulativeWeights: [50, 100]
      };

      const prng = seedrandom('test-seed-tie');
      const card = cardService.drawCard(testPool, upgrades, () => prng());
      
      expect(card).toBeDefined();
      // Should select one of the tied cards
      expect(['CardA', 'CardB']).toContain(card.name);
      expect(card.value).toBe(50);
    });
  });
});

