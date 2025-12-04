import type { CardDrawResult } from '../models/CardDrawResult.js';
import type { ScoreboardEntry } from '../models/ScoreboardEntry.js';
import type { ScoreboardState, SortColumn, SortOrder } from '../models/ScoreboardState.js';
import type { CardDropEvent } from '../models/CardDropEvent.js';
import type { SessionDropHistory } from '../models/SessionDropHistory.js';
import { tierStore } from '../stores/tierStore.js';
import { scoreboardStore } from '../stores/scoreboardStore.js';

/**
 * Service for scoreboard business logic, drop tracking, and statistics aggregation.
 */
export class ScoreboardService {
  private history: SessionDropHistory;
  private state: ScoreboardState;
  private updateThrottleTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingUpdate = false;
  private readonly THROTTLE_DELAY = 100; // 100ms throttle for rapid drops

  constructor() {
    this.history = this.createEmptyHistory();
    this.state = this.createDefaultState();
  }

  /**
   * Initialize the scoreboard service.
   * Called once on application startup.
   * Resets session drop history.
   */
  initialize(): void {
    this.history = this.createEmptyHistory();
    this.state = this.createDefaultState();
  }

  /**
   * Track a card drop event.
   * Called when a card is dropped (from gameStateService.openDeck()).
   * Uses throttling for rapid card drops to improve performance while still updating incrementally.
   * @param cardDrawResult - The card draw result from gameStateService
   */
  trackDrop(cardDrawResult: CardDrawResult): void {
    const card = cardDrawResult.card;
    
    // Error handling: ensure tierStore is available
    let tier: { id: string } | null = null;
    let wasVisible = true;
    try {
      tier = tierStore.getTierForCard(card.name);
      wasVisible = tierStore.shouldDisplayCard(card.name);
    } catch (error) {
      console.warn('ScoreboardService: tierStore not available, defaulting to visible', error);
      // Continue with defaults if tierStore fails
    }

    const event: CardDropEvent = {
      cardName: card.name,
      timestamp: cardDrawResult.timestamp,
      cardValue: card.value,
      tierId: tier?.id ?? null,
      wasVisible
    };

    this.history.dropEvents.push(event);
    
    // Log drop event (debug mode only)
    if (import.meta.env.DEV) {
      console.debug('[ScoreboardService] Card dropped:', {
        cardName: card.name,
        value: card.value,
        tierId: tier?.id ?? null,
        wasVisible,
        totalDrops: this.history.dropEvents.length
      });
    }
    
    // Throttle rapid updates for performance while still updating incrementally
    // Mark that we have a pending update
    this.pendingUpdate = true;
    
    // If no throttle timer is running, start one
    if (!this.updateThrottleTimer) {
      this.updateThrottleTimer = setTimeout(() => {
        this.updateAggregatedStats();
        this.state.lastUpdateTimestamp = Date.now();
        this.updateThrottleTimer = null;
        this.pendingUpdate = false;
        // Notify store to trigger reactive updates in components
        scoreboardStore.refresh();
      }, this.THROTTLE_DELAY);
    }
    // If timer is already running, it will pick up the pending update when it fires
  }

  /**
   * Get all scoreboard entries.
   * Returns entries filtered by tier visibility and sorted by current sort settings.
   * @returns Array of ScoreboardEntry objects, sorted and filtered according to current state
   * @throws Error if tierStore is not available and filtering is required
   */
  getEntries(): ScoreboardEntry[] {
    try {
      const entries = Array.from(this.history.aggregatedStats.values());
      return this.filterAndSort(entries);
    } catch (error) {
      console.error('ScoreboardService.getEntries: Error filtering/sorting entries', error);
      // Return empty array on error to prevent UI breakage
      return [];
    }
  }

  /**
   * Get scoreboard state.
   * Returns current configuration (sort column, sort order, include hidden cards flag).
   * @returns ScoreboardState object
   */
  getState(): ScoreboardState {
    return {
      entries: new Map(this.state.entries),
      sortColumn: this.state.sortColumn,
      sortOrder: this.state.sortOrder,
      includeHiddenCards: this.state.includeHiddenCards,
      lastUpdateTimestamp: this.state.lastUpdateTimestamp,
      sessionStartTimestamp: this.state.sessionStartTimestamp
    };
  }

  /**
   * Set sort column.
   * @param column - Column to sort by ('name', 'dropCount', 'cardValue', 'totalValue')
   */
  setSortColumn(column: SortColumn): void {
    this.state.sortColumn = column;
  }

  /**
   * Set sort order.
   * @param order - Sort order ('asc' or 'desc')
   */
  setSortOrder(order: SortOrder): void {
    this.state.sortOrder = order;
  }

  /**
   * Toggle sort order.
   * If sorting by the same column, toggles between asc/desc.
   * If sorting by different column, sets to descending.
   * @param column - Column to sort by
   */
  toggleSort(column: SortColumn): void {
    const previousColumn = this.state.sortColumn;
    const previousOrder = this.state.sortOrder;
    
    if (this.state.sortColumn === column) {
      this.state.sortOrder = this.state.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.state.sortColumn = column;
      this.state.sortOrder = 'desc';
    }
    
    // Log sort change (debug mode only)
    if (import.meta.env.DEV) {
      console.debug('[ScoreboardService] Sort changed:', {
        from: { column: previousColumn, order: previousOrder },
        to: { column: this.state.sortColumn, order: this.state.sortOrder }
      });
    }
  }

  /**
   * Set whether to include hidden cards (from disabled tiers).
   * @param include - Whether to include hidden cards
   */
  setIncludeHiddenCards(include: boolean): void {
    const previous = this.state.includeHiddenCards;
    this.state.includeHiddenCards = include;
    
    // Log filter change (debug mode only)
    if (import.meta.env.DEV) {
      console.debug('[ScoreboardService] Filter changed:', {
        includeHiddenCards: { from: previous, to: include }
      });
    }
  }

  /**
   * Reset scoreboard for new session.
   * Clears all drop history and resets state to defaults.
   */
  reset(): void {
    this.history = this.createEmptyHistory();
    this.state = this.createDefaultState();
  }

  /**
   * Get session statistics.
   * Returns summary statistics for the current session.
   */
  getSessionStatistics(): {
    totalDrops: number;
    uniqueCards: number;
    totalValue: number;
    sessionStartTimestamp: number;
    lastDropTimestamp: number | null;
  } {
    return {
      totalDrops: this.history.dropEvents.length,
      uniqueCards: this.history.aggregatedStats.size,
      totalValue: Array.from(this.history.aggregatedStats.values()).reduce(
        (sum, entry) => sum + entry.totalAccumulatedValue,
        0
      ),
      sessionStartTimestamp: this.history.sessionStartTimestamp,
      lastDropTimestamp:
        this.history.dropEvents.length > 0
          ? this.history.dropEvents[this.history.dropEvents.length - 1].timestamp
          : null
    };
  }

  /**
   * Create empty session drop history.
   */
  private createEmptyHistory(): SessionDropHistory {
    return {
      sessionStartTimestamp: Date.now(),
      dropEvents: [],
      aggregatedStats: new Map(),
      lastUpdateTimestamp: Date.now()
    };
  }

  /**
   * Create default scoreboard state.
   */
  private createDefaultState(): ScoreboardState {
    return {
      entries: new Map(),
      sortColumn: 'cardValue',
      sortOrder: 'desc',
      includeHiddenCards: false,
      lastUpdateTimestamp: Date.now(),
      sessionStartTimestamp: Date.now()
    };
  }

  /**
   * Update aggregated statistics from drop events.
   * Memoizes totalAccumulatedValue calculation (dropCount × cardValue).
   * Performance: O(n) where n is number of unique cards.
   */
  private updateAggregatedStats(): void {
    const stats = new Map<string, ScoreboardEntry>();

    for (const event of this.history.dropEvents) {
      const existing = stats.get(event.cardName);
      if (existing) {
        existing.dropCount++;
        // Memoized calculation: totalAccumulatedValue = dropCount × cardValue
        existing.totalAccumulatedValue = existing.dropCount * existing.cardValue;
        existing.lastDropTimestamp = event.timestamp;
        if (event.tierId) existing.tierId = event.tierId;
      } else {
        // First drop for this card
        stats.set(event.cardName, {
          cardName: event.cardName,
          dropCount: 1,
          cardValue: event.cardValue,
          totalAccumulatedValue: event.cardValue, // 1 × cardValue
          tierId: event.tierId,
          firstDropTimestamp: event.timestamp,
          lastDropTimestamp: event.timestamp
        });
      }
    }

    this.history.aggregatedStats = stats;
    this.state.entries = stats;
    this.history.lastUpdateTimestamp = Date.now();
  }

  /**
   * Filter and sort entries based on current state.
   * @param entries - Array of entries to filter and sort
   * @returns Filtered and sorted array of entries
   */
  private filterAndSort(entries: ScoreboardEntry[]): ScoreboardEntry[] {
    // Filter by tier visibility
    let filtered = entries;
    if (!this.state.includeHiddenCards) {
      filtered = entries.filter((entry) => {
        if (!entry.tierId) return true; // No tier = visible by default
        try {
          return tierStore.shouldDisplayCard(entry.cardName);
        } catch (error) {
          console.warn(`ScoreboardService: Error checking visibility for ${entry.cardName}`, error);
          // Default to visible if tierStore check fails
          return true;
        }
      });
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (this.state.sortColumn) {
        case 'name':
          comparison = a.cardName.localeCompare(b.cardName);
          break;
        case 'dropCount':
          comparison = a.dropCount - b.dropCount;
          break;
        case 'cardValue':
          comparison = a.cardValue - b.cardValue;
          break;
        case 'totalValue':
          comparison = a.totalAccumulatedValue - b.totalAccumulatedValue;
          break;
      }

      if (comparison === 0) {
        // Secondary sort by name
        comparison = a.cardName.localeCompare(b.cardName);
      }

      return this.state.sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }
}

export const scoreboardService = new ScoreboardService();

