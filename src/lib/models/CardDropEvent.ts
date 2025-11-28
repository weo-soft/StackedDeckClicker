/**
 * Represents a single card drop event that contributes to scoreboard statistics.
 */
export interface CardDropEvent {
  /** Card name */
  cardName: string;
  /** Unix timestamp when card was dropped */
  timestamp: number;
  /** Card value (chaos value) */
  cardValue: number;
  /** Tier identifier at time of drop */
  tierId: string | null;
  /** Whether card was visible when dropped (based on tier filter) */
  wasVisible: boolean;
}

