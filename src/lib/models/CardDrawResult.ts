import type { DivinationCard } from './Card.js';

/**
 * Result of opening a single Stacked Deck.
 */
export interface CardDrawResult {
  /** The card that was drawn */
  card: DivinationCard;
  /** Unix timestamp when deck was opened */
  timestamp: number;
  /** Score value from this card (equals card.value) */
  scoreGained: number;
}

