/**
 * Integration tests for zone layout
 * 
 * Tests zone interactions and boundary containment.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { zoneLayoutService } from '$lib/services/zoneLayoutService.js';
import { ZoneType } from '$lib/models/ZoneLayout.js';
import type { ZoneLayout } from '$lib/models/ZoneLayout.js';

describe('Zone Layout Integration', () => {
  let layout: ZoneLayout;

  beforeEach(() => {
    layout = zoneLayoutService.initializeLayout(800, 600);
  });

  describe('Zone Layout Rendering', () => {
    it('should create layout with all five zones', () => {
      expect(layout.zones.size).toBe(5);
      expect(layout.zones.has(ZoneType.WHITE)).toBe(true);
      expect(layout.zones.has(ZoneType.YELLOW)).toBe(true);
      expect(layout.zones.has(ZoneType.BLUE)).toBe(true);
      expect(layout.zones.has(ZoneType.ORANGE)).toBe(true);
      expect(layout.zones.has(ZoneType.GREEN)).toBe(true);
    });

    it('should maintain zone boundaries correctly', () => {
      const whiteZone = layout.zones.get(ZoneType.WHITE)!;
      const blueZone = layout.zones.get(ZoneType.BLUE)!;
      
      // White zone should be on the left
      expect(whiteZone.x).toBe(0);
      expect(whiteZone.x + whiteZone.width).toBeLessThanOrEqual(layout.containerWidth);
      
      // Blue zone should be on the right
      expect(blueZone.x).toBeGreaterThan(whiteZone.x + whiteZone.width - 1);
      expect(blueZone.x + blueZone.width).toBeLessThanOrEqual(layout.containerWidth);
    });

    it('should not have overlapping zones', () => {
      expect(zoneLayoutService.hasOverlappingZones(layout)).toBe(false);
    });
  });

  describe('Card Drop within Zone Boundaries', () => {
    it('should validate card drop positions within yellow zone', () => {
      const yellowZone = layout.zones.get(ZoneType.YELLOW)!;
      const centerX = yellowZone.x + yellowZone.width / 2;
      const centerY = yellowZone.y + yellowZone.height / 2;
      
      expect(zoneLayoutService.isValidCardDropPosition(layout, centerX, centerY)).toBe(true);
    });

    it('should reject card drop positions outside yellow zone', () => {
      const blueZone = layout.zones.get(ZoneType.BLUE)!;
      const centerX = blueZone.x + blueZone.width / 2;
      const centerY = blueZone.y + blueZone.height / 2;
      
      expect(zoneLayoutService.isValidCardDropPosition(layout, centerX, centerY)).toBe(false);
    });

    it('should generate random drop positions within yellow zone', () => {
      for (let i = 0; i < 10; i++) {
        const position = zoneLayoutService.getRandomDropPosition(layout);
        expect(position).not.toBeNull();
        expect(zoneLayoutService.isValidCardDropPosition(layout, position!.x, position!.y)).toBe(true);
      }
    });
  });

  describe('Zone Interaction Containment', () => {
    it('should correctly identify zone at point', () => {
      const whiteZone = layout.zones.get(ZoneType.WHITE)!;
      const whiteCenterX = whiteZone.x + whiteZone.width / 2;
      const whiteCenterY = whiteZone.y + whiteZone.height / 2;
      
      expect(zoneLayoutService.getZoneAtPoint(layout, whiteCenterX, whiteCenterY)).toBe(ZoneType.YELLOW); // Yellow is logical within white
    });

    it('should correctly identify blue zone at point', () => {
      const blueZone = layout.zones.get(ZoneType.BLUE)!;
      const blueCenterX = blueZone.x + blueZone.width / 2;
      const blueCenterY = blueZone.y + blueZone.height / 2;
      
      expect(zoneLayoutService.getZoneAtPoint(layout, blueCenterX, blueCenterY)).toBe(ZoneType.BLUE);
    });

    it('should return null for point outside all zones', () => {
      expect(zoneLayoutService.getZoneAtPoint(layout, -10, -10)).toBeNull();
      expect(zoneLayoutService.getZoneAtPoint(layout, 10000, 10000)).toBeNull();
    });
  });

  describe('Layout Resizing', () => {
    it('should maintain proportions on resize', () => {
      const resizedLayout = zoneLayoutService.resizeLayout(layout, 1200, 800);
      
      expect(resizedLayout.containerWidth).toBe(1200);
      expect(resizedLayout.containerHeight).toBe(800);
      
      const whiteZone = resizedLayout.zones.get(ZoneType.WHITE)!;
      expect(whiteZone.width / resizedLayout.containerWidth).toBeCloseTo(0.67, 2);
    });

    it('should maintain zone relationships on resize', () => {
      const resizedLayout = zoneLayoutService.resizeLayout(layout, 1200, 800);
      
      const whiteZone = resizedLayout.zones.get(ZoneType.WHITE)!;
      const blueZone = resizedLayout.zones.get(ZoneType.BLUE)!;
      
      // Blue zone should still be to the right of white zone
      expect(blueZone.x).toBeGreaterThan(whiteZone.x + whiteZone.width - 1);
    });
  });
});

