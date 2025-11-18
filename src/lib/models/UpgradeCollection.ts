import type { Upgrade } from './Upgrade.js';
import type { UpgradeType } from './types.js';

/**
 * Collection of all upgrades owned by the player.
 */
export interface UpgradeCollection {
  /** Map of upgrade type to upgrade instance */
  upgrades: Map<UpgradeType, Upgrade>;
}

