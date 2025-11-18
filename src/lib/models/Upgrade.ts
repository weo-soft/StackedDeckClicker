import type { UpgradeType } from './types.js';

/**
 * Represents a purchased enhancement that modifies gameplay mechanics.
 */
export interface Upgrade {
  /** Category of upgrade */
  type: UpgradeType;
  /** Current level of the upgrade (starts at 0, increases with purchases) */
  level: number;
  /** Base cost for first purchase */
  baseCost: number;
  /** Multiplier for cost increase per level (typically 1.5-2.0) */
  costMultiplier: number;
}

