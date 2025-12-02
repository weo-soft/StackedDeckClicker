import type { ScoreboardEntry } from './ScoreboardEntry.js';

/**
 * Column types that can be used for sorting the scoreboard.
 */
export type SortColumn = 'name' | 'dropCount' | 'cardValue' | 'totalValue';

/**
 * Sort order direction.
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Represents the current state and configuration of the scoreboard.
 */
export interface ScoreboardState {
  /** Collection of scoreboard entries (Map for O(1) lookup by card name) */
  entries: Map<string, ScoreboardEntry>;
  /** Which column is currently used for sorting */
  sortColumn: SortColumn;
  /** Sort order (ascending or descending) */
  sortOrder: SortOrder;
  /** Whether to include cards from disabled tiers (hidden cards) */
  includeHiddenCards: boolean;
  /** Timestamp when scoreboard was last updated */
  lastUpdateTimestamp: number;
  /** Session start timestamp */
  sessionStartTimestamp: number;
}




