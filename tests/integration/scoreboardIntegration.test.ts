/**
 * Integration tests for scoreboard
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { scoreboardService } from '../../src/lib/services/scoreboardService.js';
import type { CardDrawResult } from '../../src/lib/models/CardDrawResult.js';

describe('Scoreboard Integration', () => {
  beforeEach(() => {
    scoreboardService.reset();
  });

  describe('Initialization and Reset', () => {
    it('should initialize with empty state', () => {
      scoreboardService.initialize();
      const entries = scoreboardService.getEntries();
      const state = scoreboardService.getState();

      expect(entries).toHaveLength(0);
      expect(state.entries.size).toBe(0);
      expect(state.sortColumn).toBe('cardValue');
      expect(state.sortOrder).toBe('desc');
      expect(state.includeHiddenCards).toBe(false);
    });

    it('should reset session data correctly', () => {
      // Add some drops
      const result: CardDrawResult = {
        card: { name: 'Test Card', value: 100, weight: 1, qualityTier: 'common' },
        timestamp: Date.now(),
        scoreGained: 100
      };
      scoreboardService.trackDrop(result);
      scoreboardService.trackDrop(result);

      // Verify data exists
      expect(scoreboardService.getEntries().length).toBeGreaterThan(0);

      // Reset
      scoreboardService.reset();

      // Verify reset
      expect(scoreboardService.getEntries()).toHaveLength(0);
      const stats = scoreboardService.getSessionStatistics();
      expect(stats.totalDrops).toBe(0);
      expect(stats.uniqueCards).toBe(0);
    });
  });

  describe('Session Statistics', () => {
    it('should calculate session statistics correctly', () => {
      const results: CardDrawResult[] = [
        {
          card: { name: 'Card A', value: 100, weight: 1, qualityTier: 'common' },
          timestamp: 1000,
          scoreGained: 100
        },
        {
          card: { name: 'Card A', value: 100, weight: 1, qualityTier: 'common' },
          timestamp: 2000,
          scoreGained: 100
        },
        {
          card: { name: 'Card B', value: 200, weight: 1, qualityTier: 'rare' },
          timestamp: 3000,
          scoreGained: 200
        }
      ];

      results.forEach(result => scoreboardService.trackDrop(result));

      const stats = scoreboardService.getSessionStatistics();
      expect(stats.totalDrops).toBe(3);
      expect(stats.uniqueCards).toBe(2);
      expect(stats.totalValue).toBe(400); // 100 + 100 + 200
      expect(stats.lastDropTimestamp).toBe(3000);
    });
  });
});

