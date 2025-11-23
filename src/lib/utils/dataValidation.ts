/**
 * Validation functions for data version system
 */

/**
 * Validate file name format
 * Pattern: ^[a-zA-Z0-9._-]+\.json$
 * @param fileName - File name to validate
 * @returns True if valid
 */
export function validateFileName(fileName: string): boolean {
  const pattern = /^[a-zA-Z0-9._-]+\.json$/;
  return pattern.test(fileName);
}

/**
 * Validate hash format (hex string)
 * @param hash - Hash to validate
 * @returns True if valid or null
 */
export function validateHash(hash: string | null): boolean {
  if (hash === null) {
    return true;
  }
  // Hex string validation
  const hexPattern = /^[0-9a-f]+$/i;
  return hexPattern.test(hash);
}

/**
 * Validate timestamp
 * Must be positive number if present
 * Must be <= Date.now() + 1000 (allow 1s future for clock skew)
 * @param timestamp - Timestamp to validate
 * @returns True if valid or null
 */
export function validateTimestamp(timestamp: number | null): boolean {
  if (timestamp === null) {
    return true;
  }
  if (typeof timestamp !== 'number' || !isFinite(timestamp)) {
    return false;
  }
  if (timestamp < 0) {
    return false;
  }
  // Allow 1 second future for clock skew
  const maxFuture = Date.now() + 1000;
  return timestamp <= maxFuture;
}

/**
 * Check if cache entry is expired
 * @param entry - Cache entry to check
 * @param cacheExpirationMs - Cache expiration time in milliseconds
 * @returns True if expired
 */
export function isCacheExpired<T>(
  entry: CacheEntry<T>,
  cacheExpirationMs: number
): boolean {
  if (entry.isLocal) {
    // Always consider local data stale to check for updates
    return true;
  }
  const age = Date.now() - entry.timestamp;
  return age > cacheExpirationMs;
}

/**
 * Check if data has changed by comparing hashes
 * @param localHash - Local hash value
 * @param serverHash - Server hash value
 * @returns True if hashes differ (and both are non-null)
 */
export function hasDataChanged(
  localHash: string | null,
  serverHash: string | null
): boolean {
  if (localHash === null || serverHash === null) {
    return false;
  }
  return localHash !== serverHash;
}

// Import CacheEntry type
import type { CacheEntry } from '../models/DataVersion.js';

