/**
 * Zone Layout Models
 * 
 * Defines the data structures for the zone-based game area layout.
 */

/**
 * Zone type enumeration representing the five distinct functional zones.
 */
export enum ZoneType {
  WHITE = 'white',      // Ambient Scene
  YELLOW = 'yellow',    // Card Drop Area (logical, within white)
  BLUE = 'blue',        // Upgrade Store
  ORANGE = 'orange',    // State Information
  GREEN = 'green',      // Inventory
  PURPLE = 'purple'     // Last Card Display (overlay on white zone)
}

/**
 * Represents the proportional layout configuration for zones.
 * @deprecated Zones now use absolute coordinates. This interface is kept for backward compatibility.
 */
export interface ZoneProportions {
  /** Width proportion for white zone (e.g., 0.67 for 67%) */
  whiteZoneWidth: number;
  /** Width proportion for right side zones (e.g., 0.33 for 33%) */
  rightZoneWidth: number;
  /** Height proportion for blue zone (e.g., 0.5 for 50%) */
  blueZoneHeight: number;
  /** Height proportion for orange zone (e.g., 0.25 for 25%) */
  orangeZoneHeight: number;
  /** Height proportion for green zone (e.g., 0.25 for 25%) */
  greenZoneHeight: number;
}

/**
 * Relative zone coordinates as proportions of the container (0.0 to 1.0).
 * All zones use relative coordinates that scale with the container size.
 * 
 * Coordinates are relative to container dimensions:
 * - x, width: proportion of container width (0.0 = left edge, 1.0 = right edge)
 * - y, height: proportion of container height (0.0 = top edge, 1.0 = bottom edge)
 */
export interface RelativeZoneCoordinates {
  /** White zone: Ambient Scene */
  whiteZone: { x: number; y: number; width: number; height: number };
  /** Yellow zone: Card Drop Area (within white zone) */
  yellowZone: { x: number; y: number; width: number; height: number };
  /** Orange zone: State Information */
  orangeZone: { x: number; y: number; width: number; height: number };
  /** Blue zone: Upgrade Store */
  blueZone: { x: number; y: number; width: number; height: number };
  /** Green zone: Inventory */
  greenZone: { x: number; y: number; width: number; height: number };
  /** Purple zone: Last Card Display (overlay on white zone, top-left) */
  purpleZone: { x: number; y: number; width: number; height: number };
}

/**
 * Relative zone coordinates as proportions (0.0 to 1.0).
 * These coordinates are multiplied by the actual container dimensions to get absolute positions.
 * 
 * Based on original 1280x720 layout, converted to proportions:
 * - whiteZone: left side, top 83.3% (0, 0, 0.625, 0.833)
 * - yellowZone: centered in white zone (0.416, 0.351, 0.166, 0.296)
 * - orangeZone: left side, bottom 16.7% (0, 0.833, 0.625, 0.167)
 * - blueZone: right side, top 50% (0.625, 0, 0.375, 0.5)
 * - greenZone: right side, bottom 50% (0.625, 0.5, 0.375, 0.5)
 * - purpleZone: overlay on white, top-left (0.005, 0.010, 0.182, 0.490)
 */
export const RELATIVE_ZONE_COORDINATES: RelativeZoneCoordinates = {
  whiteZone: { x: 0, y: 0, width: 0.625, height: 0.833333 },
  yellowZone: { x: 0.41640625, y: 0.3513889, width: 0.16640625, height: 0.2958333 },
  orangeZone: { x: 0, y: 0.833333, width: 0.625, height: 0.166667 },
  blueZone: { x: 0.625, y: 0, width: 0.375, height: 0.5 },
  greenZone: { x: 0.625, y: 0.5, width: 0.375, height: 0.5 },
  purpleZone: { x: 0.00546875, y: 0.0097222, width: 0.18203125, height: 0.4902778 } // Top-left overlay on white zone
};

/**
 * @deprecated Use RELATIVE_ZONE_COORDINATES instead. Kept for backward compatibility.
 */
export interface BaseZoneCoordinates extends RelativeZoneCoordinates {}

/**
 * @deprecated Use RELATIVE_ZONE_COORDINATES instead. Kept for backward compatibility.
 */
export const BASE_ZONE_COORDINATES = RELATIVE_ZONE_COORDINATES;

/**
 * Represents the content displayed within a zone.
 */
export interface ZoneContent {
  /** Component identifier to render (e.g., "GameCanvas", "UpgradeShop") */
  component: string;
  /** Props to pass to component */
  props: Record<string, any>;
  /** Zone-specific data (e.g., upgrades list, state info) */
  data: any;
}

/**
 * Represents a single functional zone within the game area layout.
 */
export interface Zone {
  /** Type identifier (white, yellow, blue, orange, green) */
  type: ZoneType;
  /** X coordinate of zone origin (top-left) */
  x: number;
  /** Y coordinate of zone origin (top-left) */
  y: number;
  /** Zone width in pixels */
  width: number;
  /** Zone height in pixels */
  height: number;
  /** Content displayed in this zone */
  content: ZoneContent;
  /** Whether zone accepts user interactions */
  interactive: boolean;
}

/**
 * Represents the boundary definition for interaction containment.
 */
export interface ZoneBoundary {
  /** Zone this boundary belongs to */
  zoneType: ZoneType;
  /** Minimum X coordinate */
  minX: number;
  /** Maximum X coordinate */
  maxX: number;
  /** Minimum Y coordinate */
  minY: number;
  /** Maximum Y coordinate */
  maxY: number;
}

/**
 * Represents the overall zone-based layout configuration and state.
 */
export interface ZoneLayout {
  /** Map of zone type to zone instance */
  zones: Map<ZoneType, Zone>;
  /** Total width of the game area container */
  containerWidth: number;
  /** Total height of the game area container */
  containerHeight: number;
  /** Layout proportions configuration */
  proportions: ZoneProportions;
}

/**
 * Default zone proportions matching the reference image layout.
 * 
 * Layout structure:
 * - Left side (67% width): White zone on top, Orange zone at bottom
 * - Right side (33% width): Blue zone on top, Green zone at bottom
 */
export const DEFAULT_ZONE_PROPORTIONS: ZoneProportions = {
  whiteZoneWidth: 0.67,    // 67% of total width (left side)
  rightZoneWidth: 0.33,    // 33% of total width (right side)
  blueZoneHeight: 0.5,     // 50% of right side height (top half)
  orangeZoneHeight: 0.25,  // 25% of total height (bottom of left side)
  greenZoneHeight: 0.5     // 50% of right side height (bottom half)
};

/**
 * Validation result for zone layout structure and boundaries.
 */
export interface ValidationResult {
  /** Whether the layout is valid */
  valid: boolean;
  /** List of validation errors if any */
  errors: string[];
}

