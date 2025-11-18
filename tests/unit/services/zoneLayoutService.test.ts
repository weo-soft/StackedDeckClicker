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

    it('should create layout with default proportions', () => {
      const layout = service.initializeLayout(800, 600);
      
      expect(layout.containerWidth).toBe(800);
      expect(layout.containerHeight).toBe(600);
      expect(layout.zones.size).toBe(5);
      expect(layout.zones.has(ZoneType.WHITE)).toBe(true);
      expect(layout.zones.has(ZoneType.YELLOW)).toBe(true);
      expect(layout.zones.has(ZoneType.BLUE)).toBe(true);
      expect(layout.zones.has(ZoneType.ORANGE)).toBe(true);
      expect(layout.zones.has(ZoneType.GREEN)).toBe(true);
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
      expect(whiteZone!.width).toBeCloseTo(536, 1); // 800 * 0.67
      expect(whiteZone!.height).toBe(600);
    });

    it('should calculate right side zones correctly', () => {
      const layout = service.initializeLayout(800, 600);
      const blueZone = layout.zones.get(ZoneType.BLUE);
      const orangeZone = layout.zones.get(ZoneType.ORANGE);
      const greenZone = layout.zones.get(ZoneType.GREEN);
      
      expect(blueZone).toBeDefined();
      expect(blueZone!.x).toBeCloseTo(536, 1); // White zone width
      expect(blueZone!.width).toBeCloseTo(264, 1); // 800 * 0.33
      expect(blueZone!.height).toBe(300); // 600 * 0.5
      
      expect(orangeZone).toBeDefined();
      expect(orangeZone!.x).toBeCloseTo(536, 1);
      expect(orangeZone!.y).toBe(300);
      expect(orangeZone!.height).toBe(150); // 600 * 0.25
      
      expect(greenZone).toBeDefined();
      expect(greenZone!.x).toBeCloseTo(536, 1);
      expect(greenZone!.y).toBe(450);
      expect(greenZone!.height).toBe(150); // 600 * 0.25
    });
  });

  describe('resizeLayout', () => {
    it('should recalculate zone positions and sizes on resize', () => {
      const layout = service.initializeLayout(800, 600);
      const resizedLayout = service.resizeLayout(layout, 1200, 800);
      
      expect(resizedLayout.containerWidth).toBe(1200);
      expect(resizedLayout.containerHeight).toBe(800);
      
      const whiteZone = resizedLayout.zones.get(ZoneType.WHITE);
      expect(whiteZone!.width).toBeCloseTo(804, 1); // 1200 * 0.67
      expect(whiteZone!.height).toBe(800);
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
      expect(boundary.maxX).toBeCloseTo(536, 1);
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

  describe('hasOverlappingZones', () => {
    it('should return false for valid layout without overlaps', () => {
      const layout = service.initializeLayout(800, 600);
      
      expect(service.hasOverlappingZones(layout)).toBe(false);
    });

    it('should return true for layout with overlapping zones', () => {
      const layout = service.initializeLayout(800, 600);
      // Manually create overlapping zones
      const whiteZone = layout.zones.get(ZoneType.WHITE)!;
      const blueZone = layout.zones.get(ZoneType.BLUE)!;
      blueZone.x = whiteZone.x + whiteZone.width - 50; // Overlap
      
      expect(service.hasOverlappingZones(layout)).toBe(true);
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

    it('should return errors for layout with overlapping zones', () => {
      const layout = service.initializeLayout(800, 600);
      const whiteZone = layout.zones.get(ZoneType.WHITE)!;
      const blueZone = layout.zones.get(ZoneType.BLUE)!;
      blueZone.x = whiteZone.x + whiteZone.width - 50; // Overlap
      
      const result = service.validateLayout(layout);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('overlap'))).toBe(true);
    });
  });

  describe('User Story 1: Zone Layout Initialization', () => {
    it('should initialize layout with all five zones visible', () => {
      const layout = service.initializeLayout(800, 600);
      
      expect(layout.zones.size).toBe(5);
      expect(layout.zones.has(ZoneType.WHITE)).toBe(true);
      expect(layout.zones.has(ZoneType.YELLOW)).toBe(true);
      expect(layout.zones.has(ZoneType.BLUE)).toBe(true);
      expect(layout.zones.has(ZoneType.ORANGE)).toBe(true);
      expect(layout.zones.has(ZoneType.GREEN)).toBe(true);
    });

    it('should position zones according to reference image proportions', () => {
      const layout = service.initializeLayout(800, 600);
      
      const whiteZone = layout.zones.get(ZoneType.WHITE)!;
      const blueZone = layout.zones.get(ZoneType.BLUE)!;
      
      // White zone should be ~67% of width on left
      expect(whiteZone.width / layout.containerWidth).toBeCloseTo(0.67, 2);
      expect(whiteZone.x).toBe(0);
      
      // Blue zone should be on right side
      expect(blueZone.x).toBeGreaterThan(whiteZone.x + whiteZone.width - 1);
    });

    it('should size zones correctly', () => {
      const layout = service.initializeLayout(800, 600);
      
      const blueZone = layout.zones.get(ZoneType.BLUE)!;
      const orangeZone = layout.zones.get(ZoneType.ORANGE)!;
      const greenZone = layout.zones.get(ZoneType.GREEN)!;
      
      // Blue zone should be 50% of right side height
      expect(blueZone.height / layout.containerHeight).toBeCloseTo(0.5, 2);
      
      // Orange and green zones should each be 25% of right side height
      expect(orangeZone.height / layout.containerHeight).toBeCloseTo(0.25, 2);
      expect(greenZone.height / layout.containerHeight).toBeCloseTo(0.25, 2);
    });
  });

  describe('User Story 1: Zone Position Calculations', () => {
    it('should calculate white zone position correctly', () => {
      const layout = service.initializeLayout(800, 600);
      const whiteZone = layout.zones.get(ZoneType.WHITE)!;
      
      expect(whiteZone.x).toBe(0);
      expect(whiteZone.y).toBe(0);
      expect(whiteZone.width).toBeCloseTo(536, 1); // 800 * 0.67
      expect(whiteZone.height).toBe(600);
    });

    it('should calculate right side zones positions correctly', () => {
      const layout = service.initializeLayout(800, 600);
      const whiteZone = layout.zones.get(ZoneType.WHITE)!;
      const blueZone = layout.zones.get(ZoneType.BLUE)!;
      const orangeZone = layout.zones.get(ZoneType.ORANGE)!;
      const greenZone = layout.zones.get(ZoneType.GREEN)!;
      
      // All right side zones should start at same X (after white zone)
      expect(blueZone.x).toBeCloseTo(whiteZone.width, 1);
      expect(orangeZone.x).toBeCloseTo(whiteZone.width, 1);
      expect(greenZone.x).toBeCloseTo(whiteZone.width, 1);
      
      // Blue zone at top
      expect(blueZone.y).toBe(0);
      
      // Orange zone below blue
      expect(orangeZone.y).toBe(blueZone.height);
      
      // Green zone below orange
      expect(greenZone.y).toBe(orangeZone.y + orangeZone.height);
    });
  });

  describe('User Story 1: Zone Size Calculations', () => {
    it('should calculate zone sizes based on proportions', () => {
      const layout = service.initializeLayout(800, 600);
      
      const whiteZone = layout.zones.get(ZoneType.WHITE)!;
      const blueZone = layout.zones.get(ZoneType.BLUE)!;
      const orangeZone = layout.zones.get(ZoneType.ORANGE)!;
      const greenZone = layout.zones.get(ZoneType.GREEN)!;
      
      // White zone: 67% width, 100% height
      expect(whiteZone.width / layout.containerWidth).toBeCloseTo(0.67, 2);
      expect(whiteZone.height).toBe(layout.containerHeight);
      
      // Right side zones: 33% width
      expect(blueZone.width / layout.containerWidth).toBeCloseTo(0.33, 2);
      expect(orangeZone.width / layout.containerWidth).toBeCloseTo(0.33, 2);
      expect(greenZone.width / layout.containerWidth).toBeCloseTo(0.33, 2);
      
      // Blue: 50% height, Orange: 25% height, Green: 25% height
      expect(blueZone.height / layout.containerHeight).toBeCloseTo(0.5, 2);
      expect(orangeZone.height / layout.containerHeight).toBeCloseTo(0.25, 2);
      expect(greenZone.height / layout.containerHeight).toBeCloseTo(0.25, 2);
    });
  });
});

