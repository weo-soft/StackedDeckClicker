/**
 * Unit tests for scoreboard service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock tierStore BEFORE importing scoreboardService
vi.mock('../../../src/lib/stores/tierStore.js', () => {
  const mockTierStore = {
    getTierForCard: vi.fn(() => ({ id: 'S' })),
    shouldDisplayCard: vi.fn(() => true)
  };
  return {
    tierStore: mockTierStore
  };
});

import { scoreboardService } from '../../../src/lib/services/scoreboardService.js';
import type { CardDrawResult } from '../../../src/lib/models/CardDrawResult.js';

describe('ScoreboardService', () => {
  beforeEach(() => {
    scoreboardService.reset();
  });

  describe('initialize', () => {
    it('should reset session drop history', () => {
      // Add some test data first
      const result: CardDrawResult = {
        card: { name: 'Test Card', value: 100, weight: 1, qualityTier: 'common' },
        timestamp: Date.now(),
        scoreGained: 100
      };
      scoreboardService.trackDrop(result);

      // Verify data exists
      expect(scoreboardService.getEntries().length).toBeGreaterThan(0);

      // Initialize (should reset)
      scoreboardService.initialize();

      // Verify reset
      expect(scoreboardService.getEntries()).toHaveLength(0);
      const state = scoreboardService.getState();
      expect(state.entries.size).toBe(0);
    });
  });

  describe('trackDrop', () => {
    it('should track a single card drop', () => {
      const result: CardDrawResult = {
        card: { name: 'Test Card', value: 100, weight: 1, qualityTier: 'common' },
        timestamp: Date.now(),
        scoreGained: 100
      };

      scoreboardService.trackDrop(result);
      const entries = scoreboardService.getEntries();

      expect(entries).toHaveLength(1);
      expect(entries[0].cardName).toBe('Test Card');
      expect(entries[0].dropCount).toBe(1);
      expect(entries[0].cardValue).toBe(100);
      expect(entries[0].totalAccumulatedValue).toBe(100);
    });

    it('should aggregate multiple drops of the same card', () => {
      const result: CardDrawResult = {
        card: { name: 'Test Card', value: 100, weight: 1, qualityTier: 'common' },
        timestamp: Date.now(),
        scoreGained: 100
      };

      // Drop the same card 3 times
      scoreboardService.trackDrop(result);
      scoreboardService.trackDrop(result);
      scoreboardService.trackDrop(result);

      const entries = scoreboardService.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].dropCount).toBe(3);
      expect(entries[0].totalAccumulatedValue).toBe(300); // 3 × 100
    });

    it('should track different cards separately', () => {
      const result1: CardDrawResult = {
        card: { name: 'Card A', value: 100, weight: 1, qualityTier: 'common' },
        timestamp: Date.now(),
        scoreGained: 100
      };
      const result2: CardDrawResult = {
        card: { name: 'Card B', value: 200, weight: 1, qualityTier: 'rare' },
        timestamp: Date.now() + 1000,
        scoreGained: 200
      };

      scoreboardService.trackDrop(result1);
      scoreboardService.trackDrop(result2);

      const entries = scoreboardService.getEntries();
      expect(entries).toHaveLength(2);
      expect(entries.find(e => e.cardName === 'Card A')?.dropCount).toBe(1);
      expect(entries.find(e => e.cardName === 'Card B')?.dropCount).toBe(1);
    });
  });

  describe('getEntries', () => {
    it('should return empty array when no cards dropped', () => {
      const entries = scoreboardService.getEntries();
      expect(entries).toEqual([]);
    });

    it('should return entries sorted by cardValue descending by default', () => {
      const results: CardDrawResult[] = [
        {
          card: { name: 'Low Value', value: 10, weight: 1, qualityTier: 'common' },
          timestamp: Date.now(),
          scoreGained: 10
        },
        {
          card: { name: 'High Value', value: 1000, weight: 1, qualityTier: 'legendary' },
          timestamp: Date.now() + 1000,
          scoreGained: 1000
        },
        {
          card: { name: 'Mid Value', value: 100, weight: 1, qualityTier: 'rare' },
          timestamp: Date.now() + 2000,
          scoreGained: 100
        }
      ];

      results.forEach(result => scoreboardService.trackDrop(result));

      const entries = scoreboardService.getEntries();
      expect(entries).toHaveLength(3);
      expect(entries[0].cardName).toBe('High Value'); // Highest value first
      expect(entries[1].cardName).toBe('Mid Value');
      expect(entries[2].cardName).toBe('Low Value');
    });
  });

  describe('getState', () => {
    it('should return current scoreboard state', () => {
      const state = scoreboardService.getState();
      
      expect(state).toHaveProperty('entries');
      expect(state).toHaveProperty('sortColumn');
      expect(state).toHaveProperty('sortOrder');
      expect(state).toHaveProperty('includeHiddenCards');
      expect(state.sortColumn).toBe('cardValue');
      expect(state.sortOrder).toBe('desc');
      expect(state.includeHiddenCards).toBe(false);
    });
  });

  describe('reset', () => {
    it('should clear all drop history and reset state', () => {
      // Add some test data
      const result: CardDrawResult = {
        card: { name: 'Test Card', value: 100, weight: 1, qualityTier: 'common' },
        timestamp: Date.now(),
        scoreGained: 100
      };
      scoreboardService.trackDrop(result);
      scoreboardService.setSortColumn('name');
      scoreboardService.setIncludeHiddenCards(true);

      // Verify data exists
      expect(scoreboardService.getEntries().length).toBeGreaterThan(0);
      const stateBefore = scoreboardService.getState();
      expect(stateBefore.sortColumn).toBe('name');
      expect(stateBefore.includeHiddenCards).toBe(true);

      // Reset
      scoreboardService.reset();

      // Verify reset
      expect(scoreboardService.getEntries()).toHaveLength(0);
      const stateAfter = scoreboardService.getState();
      expect(stateAfter.entries.size).toBe(0);
      expect(stateAfter.sortColumn).toBe('cardValue'); // Back to default
      expect(stateAfter.includeHiddenCards).toBe(false); // Back to default
    });
  });

  describe('setSortColumn', () => {
    it('should change sort column', () => {
      scoreboardService.setSortColumn('name');
      const state = scoreboardService.getState();
      expect(state.sortColumn).toBe('name');
    });

    it('should support all column types', () => {
      const columns: Array<'name' | 'dropCount' | 'cardValue' | 'totalValue'> = [
        'name',
        'dropCount',
        'cardValue',
        'totalValue'
      ];

      columns.forEach((column) => {
        scoreboardService.setSortColumn(column);
        const state = scoreboardService.getState();
        expect(state.sortColumn).toBe(column);
      });
    });
  });

  describe('toggleSort', () => {
    it('should toggle sort order when clicking same column', () => {
      scoreboardService.setSortColumn('cardValue');
      scoreboardService.setSortOrder('desc');

      // Toggle same column
      scoreboardService.toggleSort('cardValue');
      let state = scoreboardService.getState();
      expect(state.sortOrder).toBe('asc');

      // Toggle again
      scoreboardService.toggleSort('cardValue');
      state = scoreboardService.getState();
      expect(state.sortOrder).toBe('desc');
    });

    it('should set to descending when clicking different column', () => {
      scoreboardService.setSortColumn('cardValue');
      scoreboardService.setSortOrder('asc');

      // Toggle different column
      scoreboardService.toggleSort('name');
      const state = scoreboardService.getState();
      expect(state.sortColumn).toBe('name');
      expect(state.sortOrder).toBe('desc'); // Should default to desc for new column
    });
  });

  describe('sorting by different columns', () => {
    beforeEach(() => {
      const results: CardDrawResult[] = [
        {
          card: { name: 'Card A', value: 100, weight: 1, qualityTier: 'common' },
          timestamp: Date.now(),
          scoreGained: 100
        },
        {
          card: { name: 'Card B', value: 200, weight: 1, qualityTier: 'rare' },
          timestamp: Date.now() + 1000,
          scoreGained: 200
        },
        {
          card: { name: 'Card C', value: 50, weight: 1, qualityTier: 'common' },
          timestamp: Date.now() + 2000,
          scoreGained: 50
        }
      ];

      results.forEach(result => scoreboardService.trackDrop(result));
    });

    it('should sort by name alphabetically', () => {
      scoreboardService.setSortColumn('name');
      scoreboardService.setSortOrder('asc');

      const entries = scoreboardService.getEntries();
      expect(entries[0].cardName).toBe('Card A');
      expect(entries[1].cardName).toBe('Card B');
      expect(entries[2].cardName).toBe('Card C');
    });

    it('should sort by cardValue descending', () => {
      scoreboardService.setSortColumn('cardValue');
      scoreboardService.setSortOrder('desc');

      const entries = scoreboardService.getEntries();
      expect(entries[0].cardValue).toBe(200); // Highest first
      expect(entries[1].cardValue).toBe(100);
      expect(entries[2].cardValue).toBe(50);
    });

    it('should sort by totalValue when multiple drops exist', () => {
      // Drop Card A again to increase its total
      const result: CardDrawResult = {
        card: { name: 'Card A', value: 100, weight: 1, qualityTier: 'common' },
        timestamp: Date.now() + 3000,
        scoreGained: 100
      };
      scoreboardService.trackDrop(result);

      scoreboardService.setSortColumn('totalValue');
      scoreboardService.setSortOrder('desc');

      const entries = scoreboardService.getEntries();
      // Card A should be first (2 drops × 100 = 200 total)
      expect(entries[0].cardName).toBe('Card A');
      expect(entries[0].totalAccumulatedValue).toBe(200);
    });

    it('should use secondary sort by name when primary values are equal', () => {
      // Add cards with same value
      const results: CardDrawResult[] = [
        {
          card: { name: 'Card Z', value: 100, weight: 1, qualityTier: 'common' },
          timestamp: Date.now() + 4000,
          scoreGained: 100
        },
        {
          card: { name: 'Card A', value: 100, weight: 1, qualityTier: 'common' },
          timestamp: Date.now() + 5000,
          scoreGained: 100
        }
      ];

      results.forEach(result => scoreboardService.trackDrop(result));

      scoreboardService.setSortColumn('cardValue');
      scoreboardService.setSortOrder('asc');

      const entries = scoreboardService.getEntries();
      // Cards with same value should be sorted alphabetically
      const sameValueCards = entries.filter(e => e.cardValue === 100);
      expect(sameValueCards.length).toBeGreaterThan(1);
      // Verify alphabetical order
      for (let i = 0; i < sameValueCards.length - 1; i++) {
        expect(sameValueCards[i].cardName.localeCompare(sameValueCards[i + 1].cardName)).toBeLessThanOrEqual(0);
      }
    });
  });

  describe('setIncludeHiddenCards', () => {
    it('should set includeHiddenCards flag', () => {
      scoreboardService.setIncludeHiddenCards(true);
      let state = scoreboardService.getState();
      expect(state.includeHiddenCards).toBe(true);

      scoreboardService.setIncludeHiddenCards(false);
      state = scoreboardService.getState();
      expect(state.includeHiddenCards).toBe(false);
    });
  });
});

