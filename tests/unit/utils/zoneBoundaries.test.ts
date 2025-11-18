/**
 * Unit tests for zone boundary utilities
 * 
 * Tests must fail initially per TDD approach.
 */

import { describe, it, expect } from 'vitest';
import { contains, intersects, createBoundary, getIntersection } from '$lib/utils/zoneBoundaries.js';
import type { Zone, ZoneBoundary } from '$lib/models/ZoneLayout.js';
import { ZoneType } from '$lib/models/ZoneLayout.js';

describe('zoneBoundaries utilities', () => {
  describe('contains', () => {
    it('should return true when point is within boundary', () => {
      const boundary: ZoneBoundary = {
        zoneType: ZoneType.WHITE,
        minX: 0,
        maxX: 100,
        minY: 0,
        maxY: 100
      };

      expect(contains(boundary, 50, 50)).toBe(true);
      expect(contains(boundary, 0, 0)).toBe(true);
      expect(contains(boundary, 100, 100)).toBe(true);
    });

    it('should return false when point is outside boundary', () => {
      const boundary: ZoneBoundary = {
        zoneType: ZoneType.WHITE,
        minX: 0,
        maxX: 100,
        minY: 0,
        maxY: 100
      };

      expect(contains(boundary, 150, 50)).toBe(false);
      expect(contains(boundary, 50, 150)).toBe(false);
      expect(contains(boundary, -10, 50)).toBe(false);
    });

    it('should return true for points on boundary edges', () => {
      const boundary: ZoneBoundary = {
        zoneType: ZoneType.WHITE,
        minX: 0,
        maxX: 100,
        minY: 0,
        maxY: 100
      };

      expect(contains(boundary, 0, 50)).toBe(true);
      expect(contains(boundary, 100, 50)).toBe(true);
      expect(contains(boundary, 50, 0)).toBe(true);
      expect(contains(boundary, 50, 100)).toBe(true);
    });
  });

  describe('intersects', () => {
    it('should return true when boundaries overlap', () => {
      const boundary1: ZoneBoundary = {
        zoneType: ZoneType.WHITE,
        minX: 0,
        maxX: 100,
        minY: 0,
        maxY: 100
      };

      const boundary2: ZoneBoundary = {
        zoneType: ZoneType.BLUE,
        minX: 50,
        maxX: 150,
        minY: 50,
        maxY: 150
      };

      expect(intersects(boundary1, boundary2)).toBe(true);
    });

    it('should return false when boundaries do not overlap', () => {
      const boundary1: ZoneBoundary = {
        zoneType: ZoneType.WHITE,
        minX: 0,
        maxX: 100,
        minY: 0,
        maxY: 100
      };

      const boundary2: ZoneBoundary = {
        zoneType: ZoneType.BLUE,
        minX: 150,
        maxX: 250,
        minY: 150,
        maxY: 250
      };

      expect(intersects(boundary1, boundary2)).toBe(false);
    });

    it('should return true when boundaries touch at edges', () => {
      const boundary1: ZoneBoundary = {
        zoneType: ZoneType.WHITE,
        minX: 0,
        maxX: 100,
        minY: 0,
        maxY: 100
      };

      const boundary2: ZoneBoundary = {
        zoneType: ZoneType.BLUE,
        minX: 100,
        maxX: 200,
        minY: 0,
        maxY: 100
      };

      expect(intersects(boundary1, boundary2)).toBe(true);
    });
  });

  describe('createBoundary', () => {
    it('should create boundary from valid zone', () => {
      const zone: Zone = {
        type: ZoneType.WHITE,
        x: 10,
        y: 20,
        width: 100,
        height: 200,
        content: {
          component: 'GameCanvas',
          props: {},
          data: null
        },
        interactive: false
      };

      const boundary = createBoundary(zone);

      expect(boundary.zoneType).toBe(ZoneType.WHITE);
      expect(boundary.minX).toBe(10);
      expect(boundary.maxX).toBe(110);
      expect(boundary.minY).toBe(20);
      expect(boundary.maxY).toBe(220);
    });

    it('should throw error for invalid zone dimensions', () => {
      const zone: Zone = {
        type: ZoneType.WHITE,
        x: 10,
        y: 20,
        width: 0,
        height: 200,
        content: {
          component: 'GameCanvas',
          props: {},
          data: null
        },
        interactive: false
      };

      expect(() => createBoundary(zone)).toThrow('Invalid zone dimensions');
    });

    it('should throw error for negative zone position', () => {
      const zone: Zone = {
        type: ZoneType.WHITE,
        x: -10,
        y: 20,
        width: 100,
        height: 200,
        content: {
          component: 'GameCanvas',
          props: {},
          data: null
        },
        interactive: false
      };

      expect(() => createBoundary(zone)).toThrow('Invalid zone position');
    });
  });

  describe('getIntersection', () => {
    it('should return intersection when boundaries overlap', () => {
      const boundary1: ZoneBoundary = {
        zoneType: ZoneType.WHITE,
        minX: 0,
        maxX: 100,
        minY: 0,
        maxY: 100
      };

      const boundary2: ZoneBoundary = {
        zoneType: ZoneType.BLUE,
        minX: 50,
        maxX: 150,
        minY: 50,
        maxY: 150
      };

      const intersection = getIntersection(boundary1, boundary2);

      expect(intersection).not.toBeNull();
      expect(intersection!.minX).toBe(50);
      expect(intersection!.maxX).toBe(100);
      expect(intersection!.minY).toBe(50);
      expect(intersection!.maxY).toBe(100);
    });

    it('should return null when boundaries do not overlap', () => {
      const boundary1: ZoneBoundary = {
        zoneType: ZoneType.WHITE,
        minX: 0,
        maxX: 100,
        minY: 0,
        maxY: 100
      };

      const boundary2: ZoneBoundary = {
        zoneType: ZoneType.BLUE,
        minX: 150,
        maxX: 250,
        minY: 150,
        maxY: 250
      };

      const intersection = getIntersection(boundary1, boundary2);

      expect(intersection).toBeNull();
    });
  });
});

