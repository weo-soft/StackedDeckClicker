import { describe, it, expect, beforeEach } from 'vitest';
import { selectWeightedCard, computeCumulativeWeights } from '../../../src/lib/utils/weightedRandom.js';
import type { CardPool } from '../../../src/lib/models/CardPool.js';
import type { DivinationCard } from '../../../src/lib/models/Card.js';
import seedrandom from 'seedrandom';

describe('weightedRandom', () => {
  let cardPool: CardPool;
  let cards: DivinationCard[];

  beforeEach(() => {
    cards = [
      { name: 'Common1', weight: 100, value: 1, qualityTier: 'common' },
      { name: 'Common2', weight: 100, value: 2, qualityTier: 'common' },
      { name: 'Rare1', weight: 10, value: 10, qualityTier: 'rare' },
      { name: 'Epic1', weight: 1, value: 100, qualityTier: 'epic' }
    ];

    const totalWeight = cards.reduce((sum, card) => sum + card.weight, 0);
    const cumulativeWeights = computeCumulativeWeights(cards);

    cardPool = {
      cards,
      totalWeight,
      cumulativeWeights
    };
  });

  describe('computeCumulativeWeights', () => {
    it('should compute cumulative weights correctly', () => {
      const cumulative = computeCumulativeWeights(cards);
      expect(cumulative).toEqual([100, 200, 210, 211]);
    });

    it('should handle single card', () => {
      const singleCard = [cards[0]];
      const cumulative = computeCumulativeWeights(singleCard);
      expect(cumulative).toEqual([100]);
    });

    it('should handle empty array', () => {
      const cumulative = computeCumulativeWeights([]);
      expect(cumulative).toEqual([]);
    });
  });

  describe('selectWeightedCard', () => {
    it('should select a card from the pool', () => {
      const prng = seedrandom('test-seed');
      const selected = selectWeightedCard(cardPool, prng);
      expect(cards).toContainEqual(selected);
    });

    it('should return the only card when pool has one card', () => {
      const singleCardPool: CardPool = {
        cards: [cards[0]],
        totalWeight: cards[0].weight,
        cumulativeWeights: [cards[0].weight]
      };
      const prng = seedrandom('test-seed');
      const selected = selectWeightedCard(singleCardPool, prng);
      expect(selected).toEqual(cards[0]);
    });

    it('should throw error for empty pool', () => {
      const emptyPool: CardPool = {
        cards: [],
        totalWeight: 0,
        cumulativeWeights: []
      };
      const prng = seedrandom('test-seed');
      expect(() => selectWeightedCard(emptyPool, prng)).toThrow('Card pool is empty');
    });

    it('should respect weights in distribution over many draws', () => {
      const prng = seedrandom('distribution-test');
      const draws = 10000;
      const counts: Record<string, number> = {};

      for (let i = 0; i < draws; i++) {
        const selected = selectWeightedCard(cardPool, prng);
        counts[selected.name] = (counts[selected.name] || 0) + 1;
      }

      // Common cards should be drawn much more frequently than rare/epic
      expect(counts['Common1'] + counts['Common2']).toBeGreaterThan(counts['Rare1'] * 10);
      expect(counts['Rare1']).toBeGreaterThan(counts['Epic1'] * 5);
    });

    it('should be deterministic with same seed', () => {
      const seed = 'deterministic-test';
      const prng1 = seedrandom(seed);
      const prng2 = seedrandom(seed);

      const selected1 = selectWeightedCard(cardPool, prng1);
      const selected2 = selectWeightedCard(cardPool, prng2);

      expect(selected1).toEqual(selected2);
    });
  });
});

