import type { CardDrawResult } from './CardDrawResult.js';

/**
 * Result of calculating offline progression when game reopens.
 */
export interface OfflineProgressionResult {
  /** Time elapsed since last session */
  elapsedSeconds: number;
  /** Number of decks that were auto-opened */
  decksOpened: number;
  /** All cards drawn during offline period */
  cardsDrawn: CardDrawResult[];
  /** Total score accumulated during offline period */
  scoreGained: number;
  /** Whether elapsed time was capped to maximum (e.g., 7 days) */
  capped: boolean;
}

