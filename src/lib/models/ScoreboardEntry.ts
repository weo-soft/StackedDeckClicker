/**
 * Represents a single card's statistics in the scoreboard.
 */
export interface ScoreboardEntry {
  /** Card name (unique identifier) */
  cardName: string;
  /** Number of times this card was dropped in the current session */
  dropCount: number;
  /** Card value (chaos value from card definition) */
  cardValue: number;
  /** Total accumulated value (dropCount × cardValue) */
  totalAccumulatedValue: number;
  /** Tier identifier for this card (for visibility filtering) */
  tierId: string | null;
  /** Timestamp when this card was first dropped in the session */
  firstDropTimestamp: number;
  /** Timestamp when this card was most recently dropped */
  lastDropTimestamp: number;
}

