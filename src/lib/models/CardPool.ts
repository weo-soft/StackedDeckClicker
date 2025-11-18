import type { DivinationCard } from './Card.js';

/**
 * Collection of all available Divination Cards that can be drawn.
 */
export interface CardPool {
  /** Array of all cards in the pool */
  cards: DivinationCard[];
  /** Sum of all card weights (cached for performance) */
  totalWeight: number;
  /** Precomputed cumulative weights for weighted random selection */
  cumulativeWeights: number[];
}

