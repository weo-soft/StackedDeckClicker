/**
 * Zone Layout Service
 * 
 * Handles zone layout calculations, boundary detection, and zone management.
 * Uses absolute coordinates with a scaling factor for different container sizes.
 */

import type {
  ZoneLayout,
  Zone,
  ZoneProportions,
  ZoneBoundary,
  ValidationResult
} from '../models/ZoneLayout.js';
import { ZoneType, DEFAULT_ZONE_PROPORTIONS, RELATIVE_ZONE_COORDINATES } from '../models/ZoneLayout.js';
import { createBoundary, contains, intersects } from '../utils/zoneBoundaries.js';
import { performanceMonitor } from '../utils/performance.js';

/**
 * Service for managing zone layout calculations and boundaries.
 */
export class ZoneLayoutService {
  /**
   * Initialize zone layout using relative coordinates that scale with container size.
   * 
   * @param containerWidth - Width of the game area container (any positive value)
   * @param containerHeight - Height of the game area container (any positive value)
   * @param proportions - Optional custom proportions (kept for backward compatibility, not used)
   * @returns ZoneLayout instance with all zones calculated based on actual container dimensions
   * @throws Error if container dimensions are invalid
   */
  initializeLayout(
    containerWidth: number,
    containerHeight: number,
    proportions?: ZoneProportions
  ): ZoneLayout {
    return performanceMonitor.trackInteraction(() => {
      if (containerWidth <= 0 || containerHeight <= 0) {
        throw new Error(`Invalid container dimensions: width=${containerWidth}, height=${containerHeight}`);
      }

      // Use relative coordinates (proportions 0.0 to 1.0) and convert to absolute pixels
      const relative = RELATIVE_ZONE_COORDINATES;
      
      // Convert relative coordinates to absolute pixels based on actual container size
      const toAbsolute = {
        x: (relX: number) => relX * containerWidth,
        y: (relY: number) => relY * containerHeight,
        width: (relW: number) => relW * containerWidth,
        height: (relH: number) => relH * containerHeight
      };
      
      // Calculate zone positions and sizes using relative coordinates scaled to container
      const whiteZone: Zone = {
        type: ZoneType.WHITE,
        x: toAbsolute.x(relative.whiteZone.x),
        y: toAbsolute.y(relative.whiteZone.y),
        width: toAbsolute.width(relative.whiteZone.width),
        height: toAbsolute.height(relative.whiteZone.height),
        content: {
          component: 'GameCanvas',
          props: {},
          data: null
        },
        interactive: false
      };

      // Yellow zone (Card Drop Area - logical, within white)
      const yellowZone: Zone = {
        type: ZoneType.YELLOW,
        x: toAbsolute.x(relative.yellowZone.x),
        y: toAbsolute.y(relative.yellowZone.y),
        width: toAbsolute.width(relative.yellowZone.width),
        height: toAbsolute.height(relative.yellowZone.height),
        content: {
          component: 'DropArea',
          props: {},
          data: null
        },
        interactive: false
      };

      // Orange zone (State Information) - bottom of LEFT side
      const orangeZone: Zone = {
        type: ZoneType.ORANGE,
        x: toAbsolute.x(relative.orangeZone.x),
        y: toAbsolute.y(relative.orangeZone.y),
        width: toAbsolute.width(relative.orangeZone.width),
        height: toAbsolute.height(relative.orangeZone.height),
        content: {
          component: 'StateInfoZone',
          props: {},
          data: null
        },
        interactive: false
      };

      // Blue zone (Upgrade Store) - top half of RIGHT side
      const blueZone: Zone = {
        type: ZoneType.BLUE,
        x: toAbsolute.x(relative.blueZone.x),
        y: toAbsolute.y(relative.blueZone.y),
        width: toAbsolute.width(relative.blueZone.width),
        height: toAbsolute.height(relative.blueZone.height),
        content: {
          component: 'UpgradeShop',
          props: {},
          data: null
        },
        interactive: true
      };

      // Green zone (Inventory) - bottom half of RIGHT side
      const greenZone: Zone = {
        type: ZoneType.GREEN,
        x: toAbsolute.x(relative.greenZone.x),
        y: toAbsolute.y(relative.greenZone.y),
        width: toAbsolute.width(relative.greenZone.width),
        height: toAbsolute.height(relative.greenZone.height),
        content: {
          component: 'InventoryZone',
          props: {},
          data: null
        },
        interactive: true
      };

      // Purple zone (Last Card Display) - overlay on white zone, top-left
      const purpleZone: Zone = {
        type: ZoneType.PURPLE,
        x: toAbsolute.x(relative.purpleZone.x),
        y: toAbsolute.y(relative.purpleZone.y),
        width: toAbsolute.width(relative.purpleZone.width),
        height: toAbsolute.height(relative.purpleZone.height),
        content: {
          component: 'LastCardZone',
          props: {},
          data: null
        },
        interactive: false
      };

      const zones = new Map<ZoneType, Zone>();
      zones.set(ZoneType.WHITE, whiteZone);
      zones.set(ZoneType.YELLOW, yellowZone);
      zones.set(ZoneType.BLUE, blueZone);
      zones.set(ZoneType.ORANGE, orangeZone);
      zones.set(ZoneType.GREEN, greenZone);
      zones.set(ZoneType.PURPLE, purpleZone);

      const layout: ZoneLayout = {
        zones,
        containerWidth,
        containerHeight,
        proportions: DEFAULT_ZONE_PROPORTIONS // Keep for backward compatibility
      };

      return layout;
    });
  }

  /**
   * Update layout when container is resized.
   * 
   * @param layout - Current zone layout (not used, kept for API compatibility)
   * @param newWidth - New container width
   * @param newHeight - New container height
   * @returns Updated ZoneLayout with recalculated zone positions and sizes based on new dimensions
   * @throws Error if new dimensions are invalid
   */
  resizeLayout(
    layout: ZoneLayout,
    newWidth: number,
    newHeight: number
  ): ZoneLayout {
    if (newWidth <= 0 || newHeight <= 0) {
      throw new Error(`Invalid container dimensions: width=${newWidth}, height=${newHeight}`);
    }

    // Reinitialize layout with new dimensions (relative coordinates automatically scale)
    return this.initializeLayout(newWidth, newHeight);
  }

  /**
   * Get zone boundary for a specific zone type.
   * 
   * @param layout - Current zone layout
   * @param zoneType - Type of zone to get boundary for
   * @returns ZoneBoundary for the specified zone
   * @throws Error if zone type not found
   */
  getZoneBoundary(layout: ZoneLayout, zoneType: ZoneType): ZoneBoundary {
    const zone = layout.zones.get(zoneType);
    if (!zone) {
      throw new Error(`Zone type ${zoneType} not found in layout`);
    }

    return createBoundary(zone);
  }

  /**
   * Check if a point is within a specific zone.
   * 
   * @param layout - Current zone layout
   * @param zoneType - Type of zone to check
   * @param x - X coordinate of point
   * @param y - Y coordinate of point
   * @returns True if point is within the zone
   */
  isPointInZone(layout: ZoneLayout, zoneType: ZoneType, x: number, y: number): boolean {
    const zone = layout.zones.get(zoneType);
    if (!zone) {
      return false;
    }

    const boundary = createBoundary(zone);
    return contains(boundary, x, y);
  }

  /**
   * Get the zone type at a specific point.
   * 
   * @param layout - Current zone layout
   * @param x - X coordinate
   * @param y - Y coordinate
   * @returns ZoneType if point is within a zone, null otherwise
   */
  getZoneAtPoint(layout: ZoneLayout, x: number, y: number): ZoneType | null {
    // Check zones in reverse order (top-most zones first)
    // This ensures overlapping zones (like yellow within white) are handled correctly
    const zoneOrder = [
      ZoneType.YELLOW, // Check yellow first (it's within white)
      ZoneType.ORANGE,
      ZoneType.BLUE,
      ZoneType.GREEN,
      ZoneType.WHITE  // Check white last (it's the largest)
    ];

    for (const zoneType of zoneOrder) {
      if (this.isPointInZone(layout, zoneType, x, y)) {
        // Special case: if point is in yellow zone, return yellow (not white)
        if (zoneType === ZoneType.YELLOW) {
          return ZoneType.YELLOW;
        }
        return zoneType;
      }
    }
    
    return null;
  }

  /**
   * Validate that card drop position is within the card drop area (yellow zone, logical within white).
   * 
   * @param layout - Current zone layout
   * @param x - X coordinate of card drop
   * @param y - Y coordinate of card drop
   * @returns True if position is valid for card drop
   * @throws Error if layout is invalid or zone not found
   */
  isValidCardDropPosition(
    layout: ZoneLayout,
    x: number,
    y: number
  ): boolean {
    try {
      // Validate layout first
      const validation = this.validateLayout(layout);
      if (!validation.valid) {
        console.warn('Invalid layout in isValidCardDropPosition:', validation.errors);
        return false;
      }

      // Yellow zone is the logical drop area (within white zone)
      return this.isPointInZone(layout, ZoneType.YELLOW, x, y);
    } catch (error) {
      console.error('Error validating card drop position:', error);
      return false;
    }
  }

  /**
   * Get a random valid position within the card drop area.
   * 
   * @param layout - Current zone layout
   * @param prng - Optional PRNG function (defaults to Math.random)
   * @returns Random position {x, y} within drop area, or null if no valid area
   * @throws Error if layout is invalid
   */
  getRandomDropPosition(
    layout: ZoneLayout,
    prng?: () => number
  ): { x: number; y: number } | null {
    const random = prng || Math.random;
    
    const yellowZone = layout.zones.get(ZoneType.YELLOW);
    if (!yellowZone) {
      console.warn('Yellow zone not found in layout');
      return null;
    }

    // Generate random position within yellow zone bounds
    const x = yellowZone.x + random() * yellowZone.width;
    const y = yellowZone.y + random() * yellowZone.height;

    return { x, y };
  }

  /**
   * Validate zone layout structure and boundaries.
   * 
   * @param layout - Zone layout to validate
   * @returns ValidationResult with validation status and any errors
   */
  validateLayout(layout: ZoneLayout): ValidationResult {
    const errors: string[] = [];

    // Check required zones exist
    const requiredZones = [ZoneType.WHITE, ZoneType.YELLOW, ZoneType.BLUE, ZoneType.ORANGE, ZoneType.GREEN, ZoneType.PURPLE];
    for (const zoneType of requiredZones) {
      if (!layout.zones.has(zoneType)) {
        errors.push(`Missing required zone: ${zoneType}`);
      }
    }

    // Check zone dimensions
    for (const [zoneType, zone] of layout.zones.entries()) {
      if (zone.width <= 0 || zone.height <= 0) {
        errors.push(`Zone ${zoneType} has invalid dimensions: ${zone.width}x${zone.height}`);
      }
      if (zone.x < 0 || zone.y < 0) {
        errors.push(`Zone ${zoneType} has negative position: (${zone.x}, ${zone.y})`);
      }
    }

    // Check yellow zone is within white zone
    const whiteZone = layout.zones.get(ZoneType.WHITE);
    const yellowZone = layout.zones.get(ZoneType.YELLOW);
    if (whiteZone && yellowZone) {
      if (yellowZone.x < whiteZone.x || 
          yellowZone.y < whiteZone.y ||
          yellowZone.x + yellowZone.width > whiteZone.x + whiteZone.width ||
          yellowZone.y + yellowZone.height > whiteZone.y + whiteZone.height) {
        errors.push('Yellow zone is not fully contained within white zone');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const zoneLayoutService = new ZoneLayoutService();
