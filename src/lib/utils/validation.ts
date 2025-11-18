import type { GameState } from '../models/GameState.js';
import type { CardPool } from '../models/CardPool.js';
import type { Upgrade } from '../models/Upgrade.js';

/**
 * Validates complete game state structure and values.
 */
export function validateGameState(state: GameState): boolean {
  if (typeof state.score !== 'number' || state.score < 0) return false;
  if (typeof state.decks !== 'number' || state.decks < 0 || !Number.isInteger(state.decks))
    return false;
  if (typeof state.lastSessionTimestamp !== 'number' || state.lastSessionTimestamp < 0)
    return false;
  if (!state.upgrades || !(state.upgrades.upgrades instanceof Map)) return false;
  if (!(state.customizations instanceof Map)) return false;
  return true;
}

/**
 * Validates card pool structure and weights.
 */
export function validateCardPool(pool: CardPool): boolean {
  if (!pool.cards || pool.cards.length === 0) return false;
  if (typeof pool.totalWeight !== 'number' || pool.totalWeight <= 0) return false;
  if (!Array.isArray(pool.cumulativeWeights)) return false;

  // Check all cards have valid weights
  for (const card of pool.cards) {
    if (typeof card.weight !== 'number' || card.weight <= 0) return false;
  }

  // Check for duplicate card names
  const names = new Set(pool.cards.map((c) => c.name));
  if (names.size !== pool.cards.length) return false;

  // Verify total weight matches sum
  const calculatedTotal = pool.cards.reduce((sum, card) => sum + card.weight, 0);
  if (Math.abs(calculatedTotal - pool.totalWeight) > 0.0001) return false;

  return true;
}

/**
 * Validates upgrade structure and values.
 */
export function validateUpgrade(upgrade: Upgrade): boolean {
  if (!upgrade.type) return false;
  if (typeof upgrade.level !== 'number' || upgrade.level < 0 || !Number.isInteger(upgrade.level))
    return false;
  if (typeof upgrade.baseCost !== 'number' || upgrade.baseCost <= 0) return false;
  if (typeof upgrade.costMultiplier !== 'number' || upgrade.costMultiplier < 1.0) return false;
  return true;
}

