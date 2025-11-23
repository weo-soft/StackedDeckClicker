/**
 * Svelte store for reactive data version state management
 */

import { writable, derived, get } from 'svelte/store';
import type { UpdateStatus, DataVersionInfo } from '../models/DataVersion.js';
import { getCacheInfo } from '../utils/dataFetcher.js';

/**
 * Store mapping file names to their update status
 */
export const dataVersionStore = writable<Record<string, UpdateStatus>>({});

/**
 * Get update status for a file
 */
export function getUpdateStatus(fileName: string): UpdateStatus | null {
  const store = get(dataVersionStore);
  return store[fileName] || null;
}

/**
 * Update status for a file
 */
export function setUpdateStatus(fileName: string, status: UpdateStatus): void {
  dataVersionStore.update((store) => ({
    ...store,
    [fileName]: status,
  }));
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp: number | null): string {
  if (!timestamp) return 'Not loaded';
  const date = new Date(timestamp);
  return date.toLocaleString();
}

/**
 * Get formatted version info for display
 */
export function getVersionInfo(fileName: string, displayName: string): DataVersionInfo {
  const status = getUpdateStatus(fileName);
  const localInfo = getCacheInfo(fileName);

  // Get display timestamp (prefer server, fallback to local)
  const displayTimestamp = status?.serverTimestamp || localInfo.timestamp;

  // Determine status based on update availability and timestamps
  if (status) {
    if (status.hasUpdate) {
      return {
        fileName,
        displayName,
        timestamp: displayTimestamp,
        timestampText: displayTimestamp ? formatTimestamp(displayTimestamp) : 'Not available',
        statusText: 'Update Available',
        statusColor: 'warning',
        timestampClass:
          status.serverTimestamp && localInfo.timestamp && status.serverTimestamp > localInfo.timestamp
            ? 'text-error'
            : 'text-grey',
        isLocal: localInfo.isLocal,
        hash: status.serverHash || localInfo.hash,
      };
    }

    // Check if timestamps match (up to date)
    if (status.serverTimestamp && localInfo.timestamp) {
      const timeDiff = Math.abs(status.serverTimestamp - localInfo.timestamp);
      if (timeDiff <= 1000) {
        return {
          fileName,
          displayName,
          timestamp: displayTimestamp,
          timestampText: formatTimestamp(displayTimestamp),
          statusText: 'Up to Date',
          statusColor: 'success',
          timestampClass: 'text-success',
          isLocal: localInfo.isLocal,
          hash: status.serverHash || localInfo.hash,
        };
      }

      // Server is newer
      if (status.serverTimestamp > localInfo.timestamp) {
        return {
          fileName,
          displayName,
          timestamp: displayTimestamp,
          timestampText: formatTimestamp(displayTimestamp),
          statusText: 'Outdated',
          statusColor: 'error',
          timestampClass: 'text-error',
          isLocal: localInfo.isLocal,
          hash: status.serverHash || localInfo.hash,
        };
      }
    }

    // Default: up to date
    return {
      fileName,
      displayName,
      timestamp: displayTimestamp,
      timestampText: displayTimestamp ? formatTimestamp(displayTimestamp) : 'Not available',
      statusText: 'Up to Date',
      statusColor: 'success',
      timestampClass: displayTimestamp ? 'text-success' : 'text-grey',
      isLocal: localInfo.isLocal,
      hash: status.serverHash || localInfo.hash,
    };
  }

  // No status yet - show local info
  if (localInfo.timestamp) {
    // If there's a status with isUpdating, show that
    if (status?.isUpdating) {
      return {
        fileName,
        displayName,
        timestamp: localInfo.timestamp,
        timestampText: formatTimestamp(localInfo.timestamp),
        statusText: 'Checking...',
        statusColor: 'grey',
        timestampClass: 'text-grey',
        isLocal: localInfo.isLocal,
        hash: localInfo.hash,
      };
    }
    
    return {
      fileName,
      displayName,
      timestamp: localInfo.timestamp,
      timestampText: formatTimestamp(localInfo.timestamp),
      statusText: localInfo.isLocal ? 'Local' : 'Cached',
      statusColor: 'grey',
      timestampClass: 'text-grey',
      isLocal: localInfo.isLocal,
      hash: localInfo.hash,
    };
  }

  return {
    fileName,
    displayName,
    timestamp: null,
    timestampText: 'Not loaded',
    statusText: 'Unknown',
    statusColor: 'grey',
    timestampClass: 'text-grey',
    isLocal: false,
    hash: null,
  };
}

/**
 * Check if any files have updates available
 */
export function hasAnyUpdates(): boolean {
  const store = get(dataVersionStore);
  return Object.values(store).some((status) => status.hasUpdate);
}

/**
 * Derived store for checking if any updates are available
 */
export const hasUpdatesStore = derived(dataVersionStore, ($store) => {
  return Object.values($store).some((status) => status.hasUpdate);
});

