import type { CardPool } from '../models/CardPool.js';
import type { DivinationCard } from '../models/Card.js';

/**
 * Selects a card from the pool using weighted random selection (CDF algorithm).
 * Uses binary search for O(log n) selection.
 *
 * @param pool - The card pool to draw from
 * @param random - Random number generator function (0-1)
 * @returns The selected DivinationCard
 */
export function selectWeightedCard(pool: CardPool, random: () => number): DivinationCard {
  if (pool.cards.length === 0) {
    throw new Error('Card pool is empty');
  }

  if (pool.cards.length === 1) {
    return pool.cards[0];
  }

  // Generate random value in range [0, totalWeight)
  const r = random() * pool.totalWeight;

  // Binary search for the card
  let left = 0;
  let right = pool.cumulativeWeights.length - 1;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (pool.cumulativeWeights[mid] < r) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  return pool.cards[left];
}

/**
 * Precomputes cumulative weights array for a card pool.
 * Should be called whenever the card pool or weights change.
 *
 * @param cards - Array of cards with weights
 * @returns Array of cumulative weights
 */
export function computeCumulativeWeights(cards: DivinationCard[]): number[] {
  const cumulative: number[] = [];
  let sum = 0;

  for (const card of cards) {
    sum += card.weight;
    cumulative.push(sum);
  }

  return cumulative;
}

