/**
 * Service for managing data fetching, caching, and updates from https://data.poeatlas.app/
 */

import {
  fetchDataWithFallback,
  getCacheInfo,
  checkForNewData,
  forceRefreshData,
} from '../utils/dataFetcher.js';
import { resolvePath } from '../utils/paths.js';
import type { UpdateStatus } from '../models/DataVersion.js';
import { setUpdateStatus } from '../stores/dataVersionStore.js';

/**
 * Configuration for data files
 */
interface DataFileConfig {
  fileName: string;
  displayName: string;
  localImport: () => Promise<{ default: unknown }>;
}

/**
 * Helper to create local import function that fetches from static directory
 */
function createLocalImport<T>(staticPath: string): () => Promise<{ default: T }> {
  return async () => {
    const response = await fetch(resolvePath(staticPath));
    if (!response.ok) {
      throw new Error(`Failed to load ${staticPath}: ${response.statusText}`);
    }
    const data = await response.json() as T;
    return { default: data };
  };
}

/**
 * Data file mapping configuration
 * Maps remote file names to local file imports
 */
const DATA_FILE_CONFIGS: DataFileConfig[] = [
  {
    fileName: 'divinationCardDetails.json',
    displayName: 'Divination Card Details',
    localImport: createLocalImport('/cards/cards.json'),
  },
  {
    fileName: 'divinationCardPrices.json',
    displayName: 'Divination Card Prices',
    localImport: createLocalImport('/cards/cardValues.json'),
  },
];

/**
 * Service for managing data updates
 */
export class DataUpdateService {
  private updateIntervalId: number | null = null;
  private readonly DEFAULT_UPDATE_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

  /**
   * Fetch data file with automatic fallback (remote → cached → local)
   * @param fileName - JSON file name (e.g., 'divinationCardDetails.json')
   * @param localImport - Function returning local data as default export
   * @returns Promise resolving to the data
   */
  async fetchDataWithFallback<T>(
    fileName: string,
    localImport: () => Promise<{ default: T }>
  ): Promise<T> {
    return await fetchDataWithFallback(fileName, localImport);
  }

  /**
   * Get cache information for a file
   * @param fileName - File to check
   * @returns Cache info with timestamp, hash, source
   */
  getCacheInfo(fileName: string) {
    return getCacheInfo(fileName);
  }

  /**
   * Check if new data is available for a file using metadata.json
   * @param fileName - File to check
   * @param bypassMetadataCache - If true, fetches fresh metadata
   * @returns Update availability status
   */
  async checkForNewData(
    fileName: string,
    bypassMetadataCache: boolean = true
  ) {
    return await checkForNewData(fileName, bypassMetadataCache);
  }

  /**
   * Force refresh data for a file, bypassing cache
   * @param fileName - File to refresh
   * @param localImport - Function returning local data as fallback
   * @param bypassMetadataCheck - If true, bypasses metadata check
   * @returns Promise resolving to fresh data
   */
  async forceRefreshData<T>(
    fileName: string,
    localImport: () => Promise<{ default: T }>,
    bypassMetadataCheck: boolean = false
  ): Promise<T> {
    // Set updating status
    setUpdateStatus(fileName, {
      fileName,
      hasUpdate: false,
      serverHash: null,
      serverTimestamp: null,
      localTimestamp: null,
      metadataChecked: false,
      fileNotFound: false,
      isUpdating: true,
      lastError: null,
    });

    try {
      const data = await forceRefreshData(fileName, localImport, bypassMetadataCheck);
      
      // Update store after successful refresh
      const cacheInfo = this.getCacheInfo(fileName);
      setUpdateStatus(fileName, {
        fileName,
        hasUpdate: false,
        serverHash: null,
        serverTimestamp: null,
        localTimestamp: cacheInfo.timestamp,
        metadataChecked: true,
        fileNotFound: false,
        isUpdating: false,
        lastError: null,
      });

      return data;
    } catch (error) {
      // Update store with error status
      setUpdateStatus(fileName, {
        fileName,
        hasUpdate: false,
        serverHash: null,
        serverTimestamp: null,
        localTimestamp: null,
        metadataChecked: false,
        fileNotFound: false,
        isUpdating: false,
        lastError: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Start automatic background update checking
   * @param intervalMs - Check interval in milliseconds (default: 1 hour)
   */
  startAutomaticUpdates(intervalMs?: number): void {
    // Stop existing interval if running
    this.stopAutomaticUpdates();

    const interval = intervalMs ?? this.DEFAULT_UPDATE_INTERVAL_MS;

    // Check immediately on start
    this.checkAllForUpdates().catch((error) => {
      console.error('Error during initial update check:', error);
    });

    // Set up periodic checks
    this.updateIntervalId = window.setInterval(() => {
      this.checkAllForUpdates().catch((error) => {
        console.error('Error during automatic update check:', error);
      });
    }, interval);

    console.log(`✓ Started automatic data updates (interval: ${interval / 1000 / 60} minutes)`);
  }

  /**
   * Stop automatic background update checking
   */
  stopAutomaticUpdates(): void {
    if (this.updateIntervalId !== null) {
      clearInterval(this.updateIntervalId);
      this.updateIntervalId = null;
      console.log('✓ Stopped automatic data updates');
    }
  }

  /**
   * Check for updates for all configured data files
   * @returns Promise resolving when all checks complete
   */
  async checkAllForUpdates(): Promise<void> {
    const promises = DATA_FILE_CONFIGS.map(async (config) => {
      try {
        const result = await this.checkForNewData(config.fileName, true);
        const cacheInfo = this.getCacheInfo(config.fileName);

        // Update store with status
        setUpdateStatus(config.fileName, {
          fileName: config.fileName,
          hasUpdate: result.hasUpdate,
          serverHash: result.serverHash,
          serverTimestamp: result.serverTimestamp,
          localTimestamp: cacheInfo.timestamp,
          metadataChecked: result.metadataChecked,
          fileNotFound: result.fileNotFound,
          isUpdating: false,
          lastError: null,
        });
      } catch (error) {
        console.error(`Failed to check updates for ${config.fileName}:`, error);
        // Update store with error status
        setUpdateStatus(config.fileName, {
          fileName: config.fileName,
          hasUpdate: false,
          serverHash: null,
          serverTimestamp: null,
          localTimestamp: null,
          metadataChecked: false,
          fileNotFound: false,
          isUpdating: false,
          lastError: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    await Promise.all(promises);
  }

  /**
   * Force refresh all configured data files
   * @returns Promise resolving when all refreshes complete
   */
  async forceRefreshAll(): Promise<void> {
    // Set updating status for all files
    for (const config of DATA_FILE_CONFIGS) {
      setUpdateStatus(config.fileName, {
        fileName: config.fileName,
        hasUpdate: false,
        serverHash: null,
        serverTimestamp: null,
        localTimestamp: null,
        metadataChecked: false,
        fileNotFound: false,
        isUpdating: true,
        lastError: null,
      });
    }

    const promises = DATA_FILE_CONFIGS.map(async (config) => {
      try {
        await this.forceRefreshData(
          config.fileName,
          config.localImport as () => Promise<{ default: unknown }>,
          false
        );

        // Update store after successful refresh
        const cacheInfo = this.getCacheInfo(config.fileName);
        setUpdateStatus(config.fileName, {
          fileName: config.fileName,
          hasUpdate: false,
          serverHash: null,
          serverTimestamp: null,
          localTimestamp: cacheInfo.timestamp,
          metadataChecked: true,
          fileNotFound: false,
          isUpdating: false,
          lastError: null,
        });
      } catch (error) {
        console.error(`Failed to refresh ${config.fileName}:`, error);
        // Update store with error status
        setUpdateStatus(config.fileName, {
          fileName: config.fileName,
          hasUpdate: false,
          serverHash: null,
          serverTimestamp: null,
          localTimestamp: null,
          metadataChecked: false,
          fileNotFound: false,
          isUpdating: false,
          lastError: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    });

    await Promise.all(promises);
  }

  /**
   * Get all configured data file configs
   */
  getDataFileConfigs(): readonly DataFileConfig[] {
    return DATA_FILE_CONFIGS;
  }
}

// Export singleton instance
export const dataUpdateService = new DataUpdateService();

