/**
 * Zone Boundary Utilities
 * 
 * Utility functions for zone boundary calculations and checks.
 * Includes caching for performance optimization.
 */

import type { ZoneBoundary, Zone } from '../models/ZoneLayout.js';

// Cache for boundary calculations (key: zone hash, value: boundary)
const boundaryCache = new Map<string, ZoneBoundary>();
const CACHE_SIZE_LIMIT = 100; // Limit cache size to prevent memory issues

/**
 * Generate a cache key for a zone.
 */
function getZoneCacheKey(zone: Zone): string {
  return `${zone.type}-${zone.x}-${zone.y}-${zone.width}-${zone.height}`;
}

/**
 * Clear the boundary cache (useful for memory management).
 */
export function clearBoundaryCache(): void {
  boundaryCache.clear();
}

/**
 * Check if a point is within a boundary.
 * 
 * @param boundary - Zone boundary to check
 * @param x - X coordinate
 * @param y - Y coordinate
 * @returns True if point is within boundary
 */
export function contains(boundary: ZoneBoundary, x: number, y: number): boolean {
  return x >= boundary.minX && x <= boundary.maxX &&
         y >= boundary.minY && y <= boundary.maxY;
}

/**
 * Check if two boundaries intersect.
 * 
 * @param boundary1 - First boundary
 * @param boundary2 - Second boundary
 * @returns True if boundaries overlap
 */
export function intersects(boundary1: ZoneBoundary, boundary2: ZoneBoundary): boolean {
  return !(boundary1.maxX < boundary2.minX || boundary1.minX > boundary2.maxX ||
           boundary1.maxY < boundary2.minY || boundary1.minY > boundary2.maxY);
}

/**
 * Create boundary from zone position and size.
 * Uses caching for performance optimization.
 * 
 * @param zone - Zone to create boundary for
 * @returns ZoneBoundary instance
 * @throws Error if zone dimensions are invalid
 */
export function createBoundary(zone: Zone): ZoneBoundary {
  if (zone.width <= 0 || zone.height <= 0) {
    throw new Error(`Invalid zone dimensions: width=${zone.width}, height=${zone.height}`);
  }
  
  if (zone.x < 0 || zone.y < 0) {
    throw new Error(`Invalid zone position: x=${zone.x}, y=${zone.y}`);
  }

  // Check cache first
  const cacheKey = getZoneCacheKey(zone);
  const cached = boundaryCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Create new boundary
  const boundary: ZoneBoundary = {
    zoneType: zone.type,
    minX: zone.x,
    maxX: zone.x + zone.width,
    minY: zone.y,
    maxY: zone.y + zone.height
  };

  // Cache it (with size limit)
  if (boundaryCache.size >= CACHE_SIZE_LIMIT) {
    // Clear oldest entries (simple FIFO)
    const firstKey = boundaryCache.keys().next().value;
    if (firstKey) {
      boundaryCache.delete(firstKey);
    }
  }
  boundaryCache.set(cacheKey, boundary);

  return boundary;
}

/**
 * Get intersection area of two boundaries (for overlap detection).
 * 
 * @param boundary1 - First boundary
 * @param boundary2 - Second boundary
 * @returns Intersection area, or null if no intersection
 */
export function getIntersection(
  boundary1: ZoneBoundary,
  boundary2: ZoneBoundary
): ZoneBoundary | null {
  if (!intersects(boundary1, boundary2)) {
    return null;
  }

  const minX = Math.max(boundary1.minX, boundary2.minX);
  const maxX = Math.min(boundary1.maxX, boundary2.maxX);
  const minY = Math.max(boundary1.minY, boundary2.minY);
  const maxY = Math.min(boundary1.maxY, boundary2.maxY);

  // Return intersection boundary (use first zone type as default)
  return {
    zoneType: boundary1.zoneType,
    minX,
    maxX,
    minY,
    maxY
  };
}

