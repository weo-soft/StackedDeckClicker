import type { QualityTier } from './types.js';

/**
 * Represents a collectible card that can be drawn from a Stacked Deck.
 */
export interface DivinationCard {
  /** Unique identifier for the card (e.g., "The Doctor", "House of Mirrors") */
  name: string;
  /** Probability weight for random selection (lower = rarer, must be > 0) */
  weight: number;
  /** Score contribution when card is drawn (must be >= 0) */
  value: number;
  /** Categorical value for visual/audio effects */
  qualityTier: QualityTier;
}

