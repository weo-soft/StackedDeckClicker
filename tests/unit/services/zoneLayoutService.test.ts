/**
 * Unit tests for ZoneLayoutService
 * 
 * Tests must fail initially per TDD approach.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ZoneLayoutService } from '$lib/services/zoneLayoutService.js';
import { ZoneType, DEFAULT_ZONE_PROPORTIONS } from '$lib/models/ZoneLayout.js';
import type { ZoneLayout, ZoneProportions } from '$lib/models/ZoneLayout.js';

describe('ZoneLayoutService', () => {
  let service: ZoneLayoutService;

  beforeEach(() => {
    service = new ZoneLayoutService();
  });

  describe('initializeLayout', () => {
    it('should throw error for invalid container width', () => {
      expect(() => {
        service.initializeLayout(0, 600);
      }).toThrow();
    });

    it('should throw error for invalid container height', () => {
      expect(() => {
        service.initializeLayout(800, 0);
      }).toThrow();
    });

    it('should create layout with all zones', () => {
      const layout = service.initializeLayout(800, 600);
      
      expect(layout.containerWidth).toBe(800);
      expect(layout.containerHeight).toBe(600);
      expect(layout.zones.size).toBe(6); // Includes PURPLE zone
      expect(layout.zones.has(ZoneType.WHITE)).toBe(true);
      expect(layout.zones.has(ZoneType.YELLOW)).toBe(true);
      expect(layout.zones.has(ZoneType.BLUE)).toBe(true);
      expect(layout.zones.has(ZoneType.ORANGE)).toBe(true);
      expect(layout.zones.has(ZoneType.GREEN)).toBe(true);
      expect(layout.zones.has(ZoneType.PURPLE)).toBe(true);
    });

    it('should create layout with custom proportions', () => {
      const customProportions: ZoneProportions = {
        whiteZoneWidth: 0.7,
        rightZoneWidth: 0.3,
        blueZoneHeight: 0.5,
        orangeZoneHeight: 0.25,
        greenZoneHeight: 0.25
      };

      const layout = service.initializeLayout(800, 600, customProportions);
      
      expect(layout.proportions).toEqual(customProportions);
    });

    it('should calculate zone positions correctly', () => {
      const layout = service.initializeLayout(800, 600);
      const whiteZone = layout.zones.get(ZoneType.WHITE);
      
      expect(whiteZone).toBeDefined();
      expect(whiteZone!.x).toBe(0);
      expect(whiteZone!.y).toBe(0);
      expect(whiteZone!.width).toBeCloseTo(500, 1); // 800 * 0.625
      expect(whiteZone!.height).toBeCloseTo(500, 1); // 600 * 0.833333
    });

    it('should calculate right side zones correctly', () => {
      const layout = service.initializeLayout(800, 600);
      const blueZone = layout.zones.get(ZoneType.BLUE);
      const orangeZone = layout.zones.get(ZoneType.ORANGE);
      const greenZone = layout.zones.get(ZoneType.GREEN);
      
      expect(blueZone).toBeDefined();
      expect(blueZone!.x).toBeCloseTo(500, 1); // 800 * 0.625 (white zone width)
      expect(blueZone!.width).toBeCloseTo(300, 1); // 800 * 0.375
      expect(blueZone!.height).toBeCloseTo(300, 1); // 600 * 0.5
      
      expect(orangeZone).toBeDefined();
      expect(orangeZone!.x).toBe(0); // Orange is on left side
      expect(orangeZone!.y).toBeCloseTo(500, 1); // 600 * 0.833333
      expect(orangeZone!.width).toBeCloseTo(500, 1); // 800 * 0.625
      expect(orangeZone!.height).toBeCloseTo(100, 1); // 600 * 0.166667
      
      expect(greenZone).toBeDefined();
      expect(greenZone!.x).toBeCloseTo(500, 1); // 800 * 0.625
      expect(greenZone!.y).toBeCloseTo(300, 1); // 600 * 0.5
      expect(greenZone!.width).toBeCloseTo(300, 1); // 800 * 0.375
      expect(greenZone!.height).toBeCloseTo(300, 1); // 600 * 0.5
    });
  });

  describe('resizeLayout', () => {
    it('should recalculate zone positions and sizes on resize', () => {
      const layout = service.initializeLayout(800, 600);
      const resizedLayout = service.resizeLayout(layout, 1200, 800);
      
      expect(resizedLayout.containerWidth).toBe(1200);
      expect(resizedLayout.containerHeight).toBe(800);
      
      const whiteZone = resizedLayout.zones.get(ZoneType.WHITE);
      expect(whiteZone!.width).toBeCloseTo(750, 1); // 1200 * 0.625
      expect(whiteZone!.height).toBeCloseTo(666.67, 1); // 800 * 0.833333
    });

    it('should throw error for invalid new dimensions', () => {
      const layout = service.initializeLayout(800, 600);
      
      expect(() => {
        service.resizeLayout(layout, 0, 600);
      }).toThrow();
    });
  });

  describe('getZoneBoundary', () => {
    it('should return boundary for existing zone', () => {
      const layout = service.initializeLayout(800, 600);
      const boundary = service.getZoneBoundary(layout, ZoneType.WHITE);
      
      expect(boundary.zoneType).toBe(ZoneType.WHITE);
      expect(boundary.minX).toBe(0);
      expect(boundary.maxX).toBeCloseTo(500, 1); // 800 * 0.625
    });

    it('should throw error for non-existent zone', () => {
      const layout = service.initializeLayout(800, 600);
      // Create invalid layout without all zones
      layout.zones.delete(ZoneType.BLUE);
      
      expect(() => {
        service.getZoneBoundary(layout, ZoneType.BLUE);
      }).toThrow();
    });
  });

  describe('isPointInZone', () => {
    it('should return true for point within zone', () => {
      const layout = service.initializeLayout(800, 600);
      
      expect(service.isPointInZone(layout, ZoneType.WHITE, 100, 100)).toBe(true);
    });

    it('should return false for point outside zone', () => {
      const layout = service.initializeLayout(800, 600);
      
      expect(service.isPointInZone(layout, ZoneType.WHITE, 700, 100)).toBe(false);
    });
  });

  describe('getZoneAtPoint', () => {
    it('should return correct zone type for point in white zone', () => {
      const layout = service.initializeLayout(800, 600);
      
      expect(service.getZoneAtPoint(layout, 100, 100)).toBe(ZoneType.WHITE);
    });

    it('should return correct zone type for point in blue zone', () => {
      const layout = service.initializeLayout(800, 600);
      
      expect(service.getZoneAtPoint(layout, 600, 100)).toBe(ZoneType.BLUE);
    });

    it('should return null for point outside all zones', () => {
      const layout = service.initializeLayout(800, 600);
      
      expect(service.getZoneAtPoint(layout, -10, -10)).toBeNull();
    });
  });

  describe('isValidCardDropPosition', () => {
    it('should return true for position within white zone', () => {
      const layout = service.initializeLayout(800, 600);
      
      expect(service.isValidCardDropPosition(layout, 100, 100)).toBe(true);
    });

    it('should return false for position outside white zone', () => {
      const layout = service.initializeLayout(800, 600);
      
      expect(service.isValidCardDropPosition(layout, 700, 100)).toBe(false);
    });
  });

  describe('getRandomDropPosition', () => {
    it('should return valid position within white zone', () => {
      const layout = service.initializeLayout(800, 600);
      const position = service.getRandomDropPosition(layout);
      
      expect(position).not.toBeNull();
      expect(service.isValidCardDropPosition(layout, position!.x, position!.y)).toBe(true);
    });

    it('should use provided PRNG function', () => {
      const layout = service.initializeLayout(800, 600);
      let callCount = 0;
      const prng = () => {
        callCount++;
        return 0.5; // Always return 0.5 for deterministic test
      };
      
      const position = service.getRandomDropPosition(layout, prng);
      
      expect(callCount).toBeGreaterThan(0);
      expect(position).not.toBeNull();
    });
  });


  describe('validateLayout', () => {
    it('should return valid result for correct layout', () => {
      const layout = service.initializeLayout(800, 600);
      const result = service.validateLayout(layout);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for layout with missing zones', () => {
      const layout = service.initializeLayout(800, 600);
      layout.zones.delete(ZoneType.BLUE);
      
      const result = service.validateLayout(layout);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

  });

  describe('User Story 1: Zone Layout Initialization', () => {
    it('should initialize layout with all zones visible', () => {
      const layout = service.initializeLayout(800, 600);
      
      expect(layout.zones.size).toBe(6); // Includes PURPLE zone
      expect(layout.zones.has(ZoneType.WHITE)).toBe(true);
      expect(layout.zones.has(ZoneType.YELLOW)).toBe(true);
      expect(layout.zones.has(ZoneType.BLUE)).toBe(true);
      expect(layout.zones.has(ZoneType.ORANGE)).toBe(true);
      expect(layout.zones.has(ZoneType.GREEN)).toBe(true);
      expect(layout.zones.has(ZoneType.PURPLE)).toBe(true);
    });

    it('should position zones according to relative coordinates', () => {
      const layout = service.initializeLayout(800, 600);
      
      const whiteZone = layout.zones.get(ZoneType.WHITE)!;
      const blueZone = layout.zones.get(ZoneType.BLUE)!;
      
      // White zone should be ~62.5% of width on left (0.625 relative)
      expect(whiteZone.width / layout.containerWidth).toBeCloseTo(0.625, 2);
      expect(whiteZone.x).toBe(0);
      
      // Blue zone should be on right side (starts at 62.5% of width)
      expect(blueZone.x / layout.containerWidth).toBeCloseTo(0.625, 2);
      expect(blueZone.x).toBeGreaterThan(whiteZone.x + whiteZone.width - 1);
    });

    it('should size zones correctly using relative coordinates', () => {
      const layout = service.initializeLayout(800, 600);
      
      const blueZone = layout.zones.get(ZoneType.BLUE)!;
      const orangeZone = layout.zones.get(ZoneType.ORANGE)!;
      const greenZone = layout.zones.get(ZoneType.GREEN)!;
      
      // Blue zone should be 50% of container height (0.5 relative)
      expect(blueZone.height / layout.containerHeight).toBeCloseTo(0.5, 2);
      
      // Orange zone should be ~16.7% of container height (0.166667 relative)
      expect(orangeZone.height / layout.containerHeight).toBeCloseTo(0.166667, 2);
      
      // Green zone should be 50% of container height (0.5 relative)
      expect(greenZone.height / layout.containerHeight).toBeCloseTo(0.5, 2);
    });
  });

  describe('User Story 1: Zone Position Calculations', () => {
    it('should calculate white zone position correctly', () => {
      const layout = service.initializeLayout(800, 600);
      const whiteZone = layout.zones.get(ZoneType.WHITE)!;
      
      expect(whiteZone.x).toBe(0);
      expect(whiteZone.y).toBe(0);
      expect(whiteZone.width).toBeCloseTo(500, 1); // 800 * 0.625
      expect(whiteZone.height).toBeCloseTo(500, 1); // 600 * 0.833333
    });

    it('should calculate zone positions correctly using relative coordinates', () => {
      const layout = service.initializeLayout(800, 600);
      const whiteZone = layout.zones.get(ZoneType.WHITE)!;
      const blueZone = layout.zones.get(ZoneType.BLUE)!;
      const orangeZone = layout.zones.get(ZoneType.ORANGE)!;
      const greenZone = layout.zones.get(ZoneType.GREEN)!;
      
      // Blue and green zones should start at same X (62.5% of width)
      expect(blueZone.x).toBeCloseTo(whiteZone.width, 1);
      expect(greenZone.x).toBeCloseTo(whiteZone.width, 1);
      
      // Orange zone is on left side (same X as white)
      expect(orangeZone.x).toBe(0);
      
      // Blue zone at top
      expect(blueZone.y).toBe(0);
      
      // Orange zone at bottom of left side
      expect(orangeZone.y).toBeCloseTo(whiteZone.height, 1);
      
      // Green zone starts at middle height
      expect(greenZone.y).toBeCloseTo(blueZone.height, 1);
    });
  });

  describe('User Story 1: Zone Size Calculations', () => {
    it('should calculate zone sizes based on relative coordinates', () => {
      const layout = service.initializeLayout(800, 600);
      
      const whiteZone = layout.zones.get(ZoneType.WHITE)!;
      const blueZone = layout.zones.get(ZoneType.BLUE)!;
      const orangeZone = layout.zones.get(ZoneType.ORANGE)!;
      const greenZone = layout.zones.get(ZoneType.GREEN)!;
      
      // White zone: 62.5% width, 83.3% height (relative coordinates)
      expect(whiteZone.width / layout.containerWidth).toBeCloseTo(0.625, 2);
      expect(whiteZone.height / layout.containerHeight).toBeCloseTo(0.833333, 2);
      
      // Right side zones: 37.5% width
      expect(blueZone.width / layout.containerWidth).toBeCloseTo(0.375, 2);
      expect(greenZone.width / layout.containerWidth).toBeCloseTo(0.375, 2);
      
      // Orange zone: same width as white (62.5%)
      expect(orangeZone.width / layout.containerWidth).toBeCloseTo(0.625, 2);
      
      // Blue: 50% height, Orange: 16.7% height, Green: 50% height
      expect(blueZone.height / layout.containerHeight).toBeCloseTo(0.5, 2);
      expect(orangeZone.height / layout.containerHeight).toBeCloseTo(0.166667, 2);
      expect(greenZone.height / layout.containerHeight).toBeCloseTo(0.5, 2);
    });
  });
});

