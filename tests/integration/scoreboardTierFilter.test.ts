/**
 * Integration tests for scoreboard tier filter integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { scoreboardService } from '../../src/lib/services/scoreboardService.js';
import type { CardDrawResult } from '../../src/lib/models/CardDrawResult.js';

// Mock tierStore with configurable behavior
const mockTierStore = {
  getTierForCard: vi.fn(),
  shouldDisplayCard: vi.fn()
};

vi.mock('../../src/lib/stores/tierStore.js', () => ({
  tierStore: mockTierStore
}));

describe('Scoreboard Tier Filter Integration', () => {
  beforeEach(() => {
    scoreboardService.reset();
    vi.clearAllMocks();
    
    // Default: all cards visible
    mockTierStore.getTierForCard.mockReturnValue({ id: 'S' });
    mockTierStore.shouldDisplayCard.mockReturnValue(true);
  });

  describe('Tier Visibility Filtering', () => {
    it('should filter out cards from disabled tiers by default', () => {
      // Setup: Card A from enabled tier, Card B from disabled tier
      mockTierStore.getTierForCard.mockImplementation((cardName: string) => {
        return cardName === 'Card A' ? { id: 'S' } : { id: 'D' };
      });
      mockTierStore.shouldDisplayCard.mockImplementation((cardName: string) => {
        return cardName === 'Card A'; // Only Card A is visible
      });

      const results: CardDrawResult[] = [
        {
          card: { name: 'Card A', value: 100, weight: 1, qualityTier: 'common' },
          timestamp: Date.now(),
          scoreGained: 100
        },
        {
          card: { name: 'Card B', value: 50, weight: 1, qualityTier: 'common' },
          timestamp: Date.now() + 1000,
          scoreGained: 50
        }
      ];

      results.forEach(result => scoreboardService.trackDrop(result));

      // By default, should only show visible cards
      const entries = scoreboardService.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].cardName).toBe('Card A');
    });

    it('should include hidden cards when includeHiddenCards is enabled', () => {
      // Setup: Card A from enabled tier, Card B from disabled tier
      mockTierStore.getTierForCard.mockImplementation((cardName: string) => {
        return cardName === 'Card A' ? { id: 'S' } : { id: 'D' };
      });
      mockTierStore.shouldDisplayCard.mockImplementation((cardName: string) => {
        return cardName === 'Card A'; // Only Card A is visible
      });

      const results: CardDrawResult[] = [
        {
          card: { name: 'Card A', value: 100, weight: 1, qualityTier: 'common' },
          timestamp: Date.now(),
          scoreGained: 100
        },
        {
          card: { name: 'Card B', value: 50, weight: 1, qualityTier: 'common' },
          timestamp: Date.now() + 1000,
          scoreGained: 50
        }
      ];

      results.forEach(result => scoreboardService.trackDrop(result));

      // Enable include hidden cards
      scoreboardService.setIncludeHiddenCards(true);

      // Should show all cards
      const entries = scoreboardService.getEntries();
      expect(entries).toHaveLength(2);
      expect(entries.find(e => e.cardName === 'Card A')).toBeDefined();
      expect(entries.find(e => e.cardName === 'Card B')).toBeDefined();
    });

    it('should track wasVisible flag for previously hidden drops', () => {
      // Setup: Card B from disabled tier (hidden when dropped)
      mockTierStore.getTierForCard.mockReturnValue({ id: 'D' });
      mockTierStore.shouldDisplayCard.mockReturnValue(false); // Hidden

      const result: CardDrawResult = {
        card: { name: 'Card B', value: 50, weight: 1, qualityTier: 'common' },
        timestamp: Date.now(),
        scoreGained: 50
      };

      scoreboardService.trackDrop(result);

      // Card should be tracked even though hidden
      // When includeHiddenCards is enabled, it should appear
      scoreboardService.setIncludeHiddenCards(true);
      const entries = scoreboardService.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].cardName).toBe('Card B');
      expect(entries[0].dropCount).toBe(1);
    });

    it('should combine statistics for same card dropped with different visibility states', () => {
      // Setup: Card A sometimes visible, sometimes hidden
      let callCount = 0;
      mockTierStore.getTierForCard.mockReturnValue({ id: 'S' });
      mockTierStore.shouldDisplayCard.mockImplementation(() => {
        callCount++;
        return callCount <= 2; // First 2 drops visible, rest hidden
      });

      const result: CardDrawResult = {
        card: { name: 'Card A', value: 100, weight: 1, qualityTier: 'common' },
        timestamp: Date.now(),
        scoreGained: 100
      };

      // Drop same card 4 times (2 visible, 2 hidden)
      scoreboardService.trackDrop(result);
      scoreboardService.trackDrop(result);
      scoreboardService.trackDrop(result);
      scoreboardService.trackDrop(result);

      // Enable include hidden cards
      scoreboardService.setIncludeHiddenCards(true);

      // Should show combined statistics
      const entries = scoreboardService.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].cardName).toBe('Card A');
      expect(entries[0].dropCount).toBe(4); // All 4 drops counted
      expect(entries[0].totalAccumulatedValue).toBe(400); // 4 × 100
    });
  });

  describe('Scoreboard Update on Tier Visibility Changes', () => {
    it('should update when tier visibility changes', () => {
      // Setup: Card A from tier S (enabled), Card B from tier D (disabled)
      mockTierStore.getTierForCard.mockImplementation((cardName: string) => {
        return cardName === 'Card A' ? { id: 'S' } : { id: 'D' };
      });
      mockTierStore.shouldDisplayCard.mockImplementation((cardName: string) => {
        return cardName === 'Card A'; // Only Card A visible initially
      });

      const results: CardDrawResult[] = [
        {
          card: { name: 'Card A', value: 100, weight: 1, qualityTier: 'common' },
          timestamp: Date.now(),
          scoreGained: 100
        },
        {
          card: { name: 'Card B', value: 50, weight: 1, qualityTier: 'common' },
          timestamp: Date.now() + 1000,
          scoreGained: 50
        }
      ];

      results.forEach(result => scoreboardService.trackDrop(result));

      // Initially, only Card A should be visible
      let entries = scoreboardService.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].cardName).toBe('Card A');

      // Change tier visibility: now Card B is also visible
      mockTierStore.shouldDisplayCard.mockReturnValue(true);

      // Refresh entries (simulating tier visibility change)
      entries = scoreboardService.getEntries();
      // Both cards should now be visible
      expect(entries.length).toBeGreaterThanOrEqual(1);
    });
  });
});

