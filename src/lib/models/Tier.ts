/**
 * Tier system models for card tier filtering and organization.
 */

export type DefaultTier = 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

/**
 * Color scheme configuration for tier card label display.
 */
export interface ColorScheme {
  /** Background color (hex format, e.g., "#FFD700") */
  backgroundColor: string;
  /** Text color (hex format, e.g., "#000000") */
  textColor: string;
  /** Border color (hex format, e.g., "#FFA500") */
  borderColor: string;
  /** Border width in pixels (default: 2) */
  borderWidth?: number;
}

/**
 * Sound file configuration for tier drop audio.
 */
export interface SoundConfiguration {
  /** Sound file path (relative to /static/sounds/ or absolute URL) */
  filePath: string | null;
  /** Sound volume (0.0 to 1.0, default: 1.0) */
  volume?: number;
  /** Whether sound is enabled (default: true) */
  enabled?: boolean;
}

/**
 * Light beam effect configuration for a tier group.
 */
export interface LightBeamConfiguration {
  /** Whether light beam effect is enabled for this tier */
  enabled: boolean;
  /** Beam color in hex format (e.g., "#FF0000" for red). Null if not configured. */
  color: string | null;
}

/**
 * User-customizable properties of a tier (color scheme, drop sound, enabled state).
 */
export interface TierConfiguration {
  /** Color scheme for card label display */
  colorScheme: ColorScheme;
  /** Drop sound configuration */
  sound: SoundConfiguration;
  /** Whether cards from this tier should be displayed when dropped */
  enabled: boolean;
  /** Light beam effect configuration */
  lightBeam?: LightBeamConfiguration;
  /** Last modification timestamp */
  modifiedAt: number;
}

/**
 * Represents a grouping of cards with shared properties (color scheme, drop sound, enabled state).
 */
export interface Tier {
  /** Unique tier identifier (default tier name or custom tier ID) */
  id: string;
  /** Tier display name */
  name: string;
  /** Tier type: 'default' for S-A-B-C-D-E-F, 'custom' for user-created tiers */
  type: 'default' | 'custom';
  /** Display order (default tiers: S=0, A=1, B=2, C=3, D=4, E=5, F=6, custom tiers: 7+) */
  order: number;
  /** Tier configuration (colors, sound, enabled state) */
  config: TierConfiguration;
  /** Creation timestamp (for custom tiers only) */
  createdAt?: number;
  /** Last modification timestamp */
  modifiedAt: number;
}

/**
 * Represents the relationship between a card and its assigned tier.
 */
export interface CardTierAssignment {
  /** Card name (unique identifier) */
  cardName: string;
  /** Tier ID this card is assigned to */
  tierId: string;
  /** Assignment source: 'default' for automatic assignment, 'user' for user modification */
  source: 'default' | 'user';
  /** Timestamp when assignment was created */
  assignedAt: number;
  /** Timestamp when assignment was last modified (if user-modified) */
  modifiedAt?: number;
}

/**
 * Complete state of the tier system, persisted to IndexedDB.
 */
export interface TierConfigurationState {
  /** Version of tier system schema (for migration) */
  version: number;
  /** Map of tier ID to Tier object */
  tiers: Map<string, Tier>;
  /** Map of card name to tier ID (card assignments) */
  cardAssignments: Map<string, string>;
  /** Timestamp when state was last saved */
  savedAt: number;
}

/**
 * Validation result for tier operations.
 */
export interface ValidationResult {
  /** Whether validation passed */
  isValid: boolean;
  /** Contrast ratio (for color validation) */
  contrastRatio?: number;
  /** Error message if validation failed */
  error?: string;
}

