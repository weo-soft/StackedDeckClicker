/**
 * Utility to fetch JSON data from online URL with fallback to local imports
 * Uses metadata.json to check for updates before fetching actual data
 * Adapted from example_files/data-fetcher.ts for SvelteKit architecture
 */

import type {
  MetadataFile,
  FileMetadata,
  CacheEntry,
  CacheInfo,
  UpdateCheckResult,
} from '../models/DataVersion.js';
import { isCacheExpired, hasDataChanged } from './dataValidation.js';

const DATA_BASE_URL = 'https://data.poeatlas.app/';
const METADATA_URL = `${DATA_BASE_URL}metadata.json`;

// Cache expiration time in milliseconds (1 hour)
const CACHE_EXPIRATION_MS = 60 * 60 * 1000;

// Cache for fetched data with metadata
const dataCache = new Map<string, CacheEntry<any>>();

// Cache for metadata.json itself
let metadataCache: MetadataFile | null = null;
let metadataCacheTimestamp: number = 0;
const METADATA_CACHE_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Check if cached data is stale based on expiration time
 */
function isCacheStale(entry: CacheEntry<any>): boolean {
  return isCacheExpired(entry, CACHE_EXPIRATION_MS);
}

/**
 * Fetch metadata.json from the server
 * Caches the metadata for a short period to avoid excessive requests
 * @param bypassCache - If true, bypasses the cache and fetches fresh metadata
 */
async function fetchMetadata(bypassCache: boolean = false): Promise<MetadataFile | null> {
  // Return cached metadata if it's still fresh and not bypassing
  if (!bypassCache) {
    const metadataAge = Date.now() - metadataCacheTimestamp;
    if (metadataCache && metadataAge < METADATA_CACHE_EXPIRATION_MS) {
      return metadataCache;
    }
  }

  try {
    const response = await fetch(METADATA_URL, {
      cache: 'no-cache',
    });

    if (!response.ok) {
      console.warn(`⚠ Failed to fetch metadata.json: ${response.status} ${response.statusText}`);
      return metadataCache; // Return stale cache if available
    }

    const metadata = await response.json() as MetadataFile;
    metadataCache = metadata;
    metadataCacheTimestamp = Date.now();
    return metadata;
  } catch (error) {
    console.warn(`⚠ Failed to fetch metadata.json, using cached version if available:`, error);
    return metadataCache; // Return stale cache if available
  }
}

/**
 * Check for updates using metadata.json
 * This allows us to verify if data has changed without downloading it
 */
async function checkForUpdates<T>(
  fileName: string,
  url: string,
  localImport: () => Promise<{ default: T }>
): Promise<void> {
  const cachedEntry = dataCache.get(fileName);
  if (!cachedEntry || !cachedEntry.hash) {
    // No hash available, skip background check
    return;
  }

  try {
    const metadata = await fetchMetadata();
    if (!metadata || !metadata.files || !metadata.files[fileName]) {
      // No metadata available, skip check
      return;
    }

    const fileMetadata = metadata.files[fileName];

    // Compare hashes to see if data has changed
    if (!hasDataChanged(cachedEntry.hash, fileMetadata.hash)) {
      // Data hasn't changed, update timestamp to extend cache life
      cachedEntry.timestamp = Date.now();
      // Update dataTimestamp from metadata if available
      if (fileMetadata.lastModified) {
        cachedEntry.dataTimestamp = new Date(fileMetadata.lastModified).getTime();
      }
      return;
    }

    // Hash has changed, fetch fresh data
    console.log(`✓ Background update: ${fileName} has new version (hash changed)`);
    await fetchFreshData(fileName, url, localImport, cachedEntry);
  } catch (error) {
    // Silently fail background update check - we'll try again when cache expires
    console.debug(`Background update check failed for ${fileName}:`, error);
  }
}

/**
 * Fetch fresh data from the server or fallback to local
 * Checks metadata.json first to see if data has changed before fetching
 * @param bypassMetadataCheck - If true, bypasses metadata check to force a full fetch
 */
async function fetchFreshData<T>(
  fileName: string,
  url: string,
  localImport: () => Promise<{ default: T }>,
  cachedEntry?: CacheEntry<T>,
  bypassMetadataCheck: boolean = false
): Promise<T> {
  // Check metadata.json first to see if we need to fetch (unless bypassing)
  if (cachedEntry && !bypassMetadataCheck && cachedEntry.hash) {
    try {
      const metadata = await fetchMetadata();
      if (metadata && metadata.files && metadata.files[fileName]) {
        const fileMetadata = metadata.files[fileName];

        // If hash matches, data hasn't changed, use cached data
        if (!hasDataChanged(cachedEntry.hash, fileMetadata.hash)) {
          // Update timestamp to extend cache life
          cachedEntry.timestamp = Date.now();
          // Update dataTimestamp from metadata
          if (fileMetadata.lastModified) {
            cachedEntry.dataTimestamp = new Date(fileMetadata.lastModified).getTime();
          }
          console.log(`✓ ${fileName} is up to date (hash matches metadata)`);
          return cachedEntry.data as T;
        }

        console.log(`✓ ${fileName} has new version (hash changed from ${cachedEntry.hash.substring(0, 8)}... to ${fileMetadata.hash.substring(0, 8)}...)`);
      }
    } catch (error) {
      // If metadata check fails, continue to fetch the data
      console.debug(`Metadata check failed for ${fileName}, proceeding with fetch:`, error);
    }
  }

  try {
    const response = await fetch(url, {
      cache: 'no-cache',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${fileName}: ${response.status} ${response.statusText}`);
    }

    // Log response details for debugging
    const contentLength = response.headers.get('Content-Length');
    const contentType = response.headers.get('Content-Type');
    if (bypassMetadataCheck) {
      console.log(`Force fetching ${fileName}: Content-Length=${contentLength}, Content-Type=${contentType}`);
    }

    const data = await response.json();

    // Log data structure for debugging
    if (bypassMetadataCheck && Array.isArray(data)) {
      console.log(`Fetched ${fileName}: ${data.length} items`);
    }

    // Get hash and lastModified from metadata.json for caching
    // Force refresh metadata cache when fetching fresh data to ensure we get the latest hash
    let hash: string | undefined;
    let dataTimestamp: number | null = null;
    try {
      const metadata = await fetchMetadata(true); // Bypass cache to get latest hash
      if (metadata && metadata.files && metadata.files[fileName]) {
        hash = metadata.files[fileName].hash;
        // Get the data timestamp from metadata's lastModified
        if (metadata.files[fileName].lastModified) {
          dataTimestamp = new Date(metadata.files[fileName].lastModified).getTime();
        }
      }
    } catch (error) {
      // If we can't get metadata, that's okay - we'll check next time
      console.debug(`Could not get hash from metadata for ${fileName}:`, error);
    }

    // Cache the successfully fetched data with metadata
    const cacheEntry: CacheEntry<T> = {
      data,
      timestamp: Date.now(), // When it was fetched
      dataTimestamp, // The actual data timestamp from metadata
      hash,
      isLocal: false,
    };
    dataCache.set(fileName, cacheEntry);

    console.log(`✓ Successfully loaded ${fileName} from ${url}${cachedEntry ? ' (updated)' : ''}`);
    return data as T;
  } catch (error) {
    console.warn(`⚠ Failed to fetch ${fileName} from ${url}, falling back to local data:`, error);

    // If we have cached data (even if stale), use it instead of local
    if (cachedEntry && !cachedEntry.isLocal) {
      console.log(`✓ Using cached ${fileName} (online fetch failed)`);
      return cachedEntry.data as T;
    }

    try {
      // Fallback to local import
      const localData = await localImport();
      const data = localData.default;

      // Cache the local data (marked as local so we always check for updates)
      // Try to get data timestamp from metadata if available
      let dataTimestamp: number | null = null;
      try {
        const metadata = await fetchMetadata();
        if (metadata && metadata.files && metadata.files[fileName] && metadata.files[fileName].lastModified) {
          dataTimestamp = new Date(metadata.files[fileName].lastModified).getTime();
        }
      } catch (error) {
        // If we can't get metadata, that's okay
        console.debug(`Could not get data timestamp from metadata for local ${fileName}:`, error);
      }

      const cacheEntry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        dataTimestamp,
        isLocal: true,
      };
      dataCache.set(fileName, cacheEntry);

      console.log(`✓ Loaded ${fileName} from local assets`);
      return data;
    } catch (localError) {
      console.error(`✗ Failed to load ${fileName} from both online and local sources:`, localError);
      throw new Error(`Unable to load ${fileName} from any source`);
    }
  }
}

/**
 * Fetch JSON data from online URL, falling back to local import if fetch fails
 * Uses metadata.json to check for updates when cache exists
 * @param fileName - The JSON file name (e.g., 'divinationCardDetails.json')
 * @param localImport - Function that returns the local import as default export
 * @returns Promise that resolves to the JSON data
 */
export async function fetchDataWithFallback<T>(
  fileName: string,
  localImport: () => Promise<{ default: T }>
): Promise<T> {
  const url = `${DATA_BASE_URL}${fileName}`;
  const cachedEntry = dataCache.get(fileName);

  // If we have cached data and it's not stale, return it immediately
  // But still check for updates in the background if it's getting old
  if (cachedEntry && !isCacheStale(cachedEntry)) {
    // Return cached data immediately
    // Optionally check for updates in background (non-blocking)
    if (cachedEntry.timestamp + (CACHE_EXPIRATION_MS * 0.8) < Date.now()) {
      // Cache is 80% expired, check for updates in background
      checkForUpdates(fileName, url, localImport).catch(() => {
        // Silently fail background update check
      });
    }
    return cachedEntry.data as T;
  }

  // Cache is stale or doesn't exist, fetch fresh data
  return await fetchFreshData(fileName, url, localImport, cachedEntry);
}

/**
 * Get cache information for a file
 */
export function getCacheInfo(fileName: string): CacheInfo {
  const cachedEntry = dataCache.get(fileName);
  if (!cachedEntry) {
    return {
      hasCache: false,
      timestamp: null,
      hash: null,
      isLocal: false,
      age: null,
    };
  }

  // Return dataTimestamp (the actual data timestamp) instead of fetch timestamp
  return {
    hasCache: true,
    timestamp: cachedEntry.dataTimestamp ?? cachedEntry.timestamp, // Use dataTimestamp if available, fallback to fetch timestamp
    hash: cachedEntry.hash || null,
    isLocal: cachedEntry.isLocal,
    age: cachedEntry.dataTimestamp ? Date.now() - cachedEntry.dataTimestamp : Date.now() - cachedEntry.timestamp,
  };
}

/**
 * Check if new data is available for a file using metadata.json
 * @param bypassMetadataCache - If true, bypasses metadata cache to fetch fresh metadata
 */
export async function checkForNewData(
  fileName: string,
  bypassMetadataCache: boolean = true
): Promise<UpdateCheckResult> {
  const cachedEntry = dataCache.get(fileName);

  try {
    // Always fetch fresh metadata when checking for updates (bypass cache)
    const metadata = await fetchMetadata(bypassMetadataCache);
    if (!metadata || !metadata.files) {
      // Metadata fetch failed or invalid structure
      if (!cachedEntry || !cachedEntry.hash) {
        // No cache and no metadata - can't determine status
        return {
          hasUpdate: true,
          serverHash: null,
          serverTimestamp: null,
          metadataChecked: false,
          fileNotFound: false,
        };
      }
      // Have cache but no metadata - assume no update (to avoid false positives)
      return {
        hasUpdate: false,
        serverHash: cachedEntry.hash || null,
        serverTimestamp: null,
        metadataChecked: false,
        fileNotFound: false,
      };
    }

    // Metadata was successfully fetched, check if file entry exists
    if (!metadata.files[fileName]) {
      // Metadata fetched but file entry is missing
      return {
        hasUpdate: false,
        serverHash: null,
        serverTimestamp: null,
        metadataChecked: true,
        fileNotFound: true,
      };
    }

    const fileMetadata = metadata.files[fileName];
    // Convert ISO date string to timestamp
    const serverTimestamp = fileMetadata.lastModified ? new Date(fileMetadata.lastModified).getTime() : null;

    // If no local cache, we still have server metadata to show
    if (!cachedEntry || !cachedEntry.hash) {
      return {
        hasUpdate: true, // No local data, so update is "available"
        serverHash: fileMetadata.hash,
        serverTimestamp: serverTimestamp,
        metadataChecked: true,
        fileNotFound: false,
      };
    }

    // Compare hashes to see if data has changed
    if (!hasDataChanged(cachedEntry.hash, fileMetadata.hash)) {
      // Data hasn't changed
      return {
        hasUpdate: false,
        serverHash: fileMetadata.hash,
        serverTimestamp: serverTimestamp,
        metadataChecked: true,
        fileNotFound: false,
      };
    }

    // Hash has changed, update available
    return {
      hasUpdate: true,
      serverHash: fileMetadata.hash,
      serverTimestamp: serverTimestamp,
      metadataChecked: true,
      fileNotFound: false,
    };
  } catch (error) {
    console.error(`Error checking for updates for ${fileName}:`, error);
    // If check fails, return what we know
    if (cachedEntry && cachedEntry.hash) {
      return {
        hasUpdate: false,
        serverHash: cachedEntry.hash || null,
        serverTimestamp: null,
        metadataChecked: false,
        fileNotFound: false,
      };
    }
    // No cache and check failed
    return {
      hasUpdate: true,
      serverHash: null,
      serverTimestamp: null,
      metadataChecked: false,
      fileNotFound: false,
    };
  }
}

/**
 * Force refresh data for a file, bypassing cache
 * Also clears metadata cache to ensure we get the latest hash
 * @param bypassMetadataCheck - If true, bypasses metadata check to force a full fetch
 */
export async function forceRefreshData<T>(
  fileName: string,
  localImport: () => Promise<{ default: T }>,
  bypassMetadataCheck: boolean = false
): Promise<T> {
  // Clear cache for this file
  dataCache.delete(fileName);

  // Clear metadata cache to ensure we get the latest hash after fetching
  metadataCache = null;
  metadataCacheTimestamp = 0;

  // Fetch fresh data
  const url = `${DATA_BASE_URL}${fileName}`;
  return await fetchFreshData(fileName, url, localImport, undefined, bypassMetadataCheck);
}

