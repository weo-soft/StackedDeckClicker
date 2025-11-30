import type { UpgradeCollection } from './UpgradeCollection.js';

/**
 * Complete game state that must be persisted between sessions.
 */
export interface GameState {
  /** Current player score (accumulated from card values, spent on upgrades) */
  score: number;
  /** Number of Stacked Decks available to open */
  decks: number;
  /** Unix timestamp of last game session (for offline progression) */
  lastSessionTimestamp: number;
  /** All owned upgrades and their levels */
  upgrades: UpgradeCollection;
  /** Active scene customizations (key = customization ID) */
  customizations: Map<string, boolean>;
  /** Optional: Track count of each card collected (key = card name) */
  cardCollection?: Map<string, number>;
  /** Optional: Custom rarity percentage override (0-100, overrides level-based calculation) */
  customRarityPercentage?: number;
}

