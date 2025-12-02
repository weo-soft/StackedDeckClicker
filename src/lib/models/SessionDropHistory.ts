import type { CardDropEvent } from './CardDropEvent.js';
import type { ScoreboardEntry } from './ScoreboardEntry.js';

/**
 * Represents the complete history of card drops for the current session.
 */
export interface SessionDropHistory {
  /** Session start timestamp */
  sessionStartTimestamp: number;
  /** Array of all card drop events in chronological order */
  dropEvents: CardDropEvent[];
  /** Aggregated statistics (Map of card name to ScoreboardEntry) */
  aggregatedStats: Map<string, ScoreboardEntry>;
  /** Last update timestamp */
  lastUpdateTimestamp: number;
}




