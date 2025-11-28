/**
 * Unit tests for scoreboard data models
 */

import { describe, it, expect } from 'vitest';
import type { ScoreboardEntry } from '../../../src/lib/models/ScoreboardEntry.js';
import type { ScoreboardState, SortColumn, SortOrder } from '../../../src/lib/models/ScoreboardState.js';
import type { CardDropEvent } from '../../../src/lib/models/CardDropEvent.js';
import type { SessionDropHistory } from '../../../src/lib/models/SessionDropHistory.js';

describe('ScoreboardEntry', () => {
  it('should have all required fields', () => {
    const entry: ScoreboardEntry = {
      cardName: 'Test Card',
      dropCount: 5,
      cardValue: 100,
      totalAccumulatedValue: 500,
      tierId: 'S',
      firstDropTimestamp: 1000,
      lastDropTimestamp: 5000
    };

    expect(entry.cardName).toBe('Test Card');
    expect(entry.dropCount).toBe(5);
    expect(entry.cardValue).toBe(100);
    expect(entry.totalAccumulatedValue).toBe(500);
    expect(entry.tierId).toBe('S');
    expect(entry.firstDropTimestamp).toBe(1000);
    expect(entry.lastDropTimestamp).toBe(5000);
  });

  it('should allow null tierId', () => {
    const entry: ScoreboardEntry = {
      cardName: 'Test Card',
      dropCount: 1,
      cardValue: 50,
      totalAccumulatedValue: 50,
      tierId: null,
      firstDropTimestamp: 1000,
      lastDropTimestamp: 1000
    };

    expect(entry.tierId).toBeNull();
  });

  it('should have totalAccumulatedValue equal to dropCount × cardValue', () => {
    const entry: ScoreboardEntry = {
      cardName: 'Test Card',
      dropCount: 3,
      cardValue: 200,
      totalAccumulatedValue: 600, // 3 × 200
      tierId: 'A',
      firstDropTimestamp: 1000,
      lastDropTimestamp: 3000
    };

    expect(entry.totalAccumulatedValue).toBe(entry.dropCount * entry.cardValue);
  });
});

describe('ScoreboardState', () => {
  it('should have all required fields with default values', () => {
    const state: ScoreboardState = {
      entries: new Map(),
      sortColumn: 'cardValue',
      sortOrder: 'desc',
      includeHiddenCards: false,
      lastUpdateTimestamp: Date.now(),
      sessionStartTimestamp: Date.now()
    };

    expect(state.entries).toBeInstanceOf(Map);
    expect(state.sortColumn).toBe('cardValue');
    expect(state.sortOrder).toBe('desc');
    expect(state.includeHiddenCards).toBe(false);
    expect(state.lastUpdateTimestamp).toBeGreaterThan(0);
    expect(state.sessionStartTimestamp).toBeGreaterThan(0);
  });

  it('should support all sort column types', () => {
    const columns: SortColumn[] = ['name', 'dropCount', 'cardValue', 'totalValue'];
    
    columns.forEach((column) => {
      const state: ScoreboardState = {
        entries: new Map(),
        sortColumn: column,
        sortOrder: 'asc',
        includeHiddenCards: false,
        lastUpdateTimestamp: Date.now(),
        sessionStartTimestamp: Date.now()
      };
      expect(state.sortColumn).toBe(column);
    });
  });

  it('should support both sort orders', () => {
    const orders: SortOrder[] = ['asc', 'desc'];
    
    orders.forEach((order) => {
      const state: ScoreboardState = {
        entries: new Map(),
        sortColumn: 'cardValue',
        sortOrder: order,
        includeHiddenCards: false,
        lastUpdateTimestamp: Date.now(),
        sessionStartTimestamp: Date.now()
      };
      expect(state.sortOrder).toBe(order);
    });
  });
});

describe('CardDropEvent', () => {
  it('should have all required fields', () => {
    const event: CardDropEvent = {
      cardName: 'Test Card',
      timestamp: 1000,
      cardValue: 100,
      tierId: 'S',
      wasVisible: true
    };

    expect(event.cardName).toBe('Test Card');
    expect(event.timestamp).toBe(1000);
    expect(event.cardValue).toBe(100);
    expect(event.tierId).toBe('S');
    expect(event.wasVisible).toBe(true);
  });

  it('should allow null tierId', () => {
    const event: CardDropEvent = {
      cardName: 'Test Card',
      timestamp: 1000,
      cardValue: 50,
      tierId: null,
      wasVisible: true
    };

    expect(event.tierId).toBeNull();
  });

  it('should track visibility state', () => {
    const visibleEvent: CardDropEvent = {
      cardName: 'Test Card',
      timestamp: 1000,
      cardValue: 100,
      tierId: 'S',
      wasVisible: true
    };

    const hiddenEvent: CardDropEvent = {
      cardName: 'Test Card',
      timestamp: 2000,
      cardValue: 100,
      tierId: 'D',
      wasVisible: false
    };

    expect(visibleEvent.wasVisible).toBe(true);
    expect(hiddenEvent.wasVisible).toBe(false);
  });
});

describe('SessionDropHistory', () => {
  it('should have all required fields', () => {
    const history: SessionDropHistory = {
      sessionStartTimestamp: 1000,
      dropEvents: [],
      aggregatedStats: new Map(),
      lastUpdateTimestamp: 1000
    };

    expect(history.sessionStartTimestamp).toBe(1000);
    expect(history.dropEvents).toEqual([]);
    expect(history.aggregatedStats).toBeInstanceOf(Map);
    expect(history.lastUpdateTimestamp).toBe(1000);
  });

  it('should store drop events in chronological order', () => {
    const events: CardDropEvent[] = [
      {
        cardName: 'Card A',
        timestamp: 1000,
        cardValue: 100,
        tierId: 'S',
        wasVisible: true
      },
      {
        cardName: 'Card B',
        timestamp: 2000,
        cardValue: 50,
        tierId: 'A',
        wasVisible: true
      }
    ];

    const history: SessionDropHistory = {
      sessionStartTimestamp: 500,
      dropEvents: events,
      aggregatedStats: new Map(),
      lastUpdateTimestamp: 2000
    };

    expect(history.dropEvents).toHaveLength(2);
    expect(history.dropEvents[0].timestamp).toBeLessThan(history.dropEvents[1].timestamp);
  });
});

