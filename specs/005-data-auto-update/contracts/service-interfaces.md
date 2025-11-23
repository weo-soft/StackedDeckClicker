# Service Interfaces: Data Auto-Update System

**Feature**: 005-data-auto-update  
**Date**: 2025-01-27  
**Purpose**: Define service API contracts for data fetching and update management

## DataUpdateService

Primary service for managing data fetching, caching, and updates from https://data.poeatlas.app/

### Interface

```typescript
class DataUpdateService {
  /**
   * Fetch data file with automatic fallback (remote → cached → local)
   * @param fileName - JSON file name (e.g., 'divinationCardDetails.json')
   * @param localImport - Function returning local data as default export
   * @returns Promise resolving to the data
   */
  async fetchDataWithFallback<T>(
    fileName: string,
    localImport: () => Promise<{ default: T }>
  ): Promise<T>

  /**
   * Get cache information for a file
   * @param fileName - File to check
   * @returns Cache info with timestamp, hash, source
   */
  getCacheInfo(fileName: string): {
    hasCache: boolean
    timestamp: number | null
    hash: string | null
    isLocal: boolean
    age: number | null
  }

  /**
   * Check if new data is available for a file using metadata.json
   * @param fileName - File to check
   * @param bypassMetadataCache - If true, fetches fresh metadata
   * @returns Update availability status
   */
  async checkForNewData(
    fileName: string,
    bypassMetadataCache?: boolean
  ): Promise<{
    hasUpdate: boolean
    serverHash: string | null
    serverTimestamp: number | null
    metadataChecked: boolean
    fileNotFound: boolean
  }>

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
    bypassMetadataCheck?: boolean
  ): Promise<T>

  /**
   * Start automatic background update checking
   * @param intervalMs - Check interval in milliseconds (default: 1 hour)
   */
  startAutomaticUpdates(intervalMs?: number): void

  /**
   * Stop automatic background update checking
   */
  stopAutomaticUpdates(): void

  /**
   * Check for updates for all configured data files
   * @returns Promise resolving when all checks complete
   */
  async checkAllForUpdates(): Promise<void>

  /**
   * Force refresh all configured data files
   * @returns Promise resolving when all refreshes complete
   */
  async forceRefreshAll(): Promise<void>
}
```

### Error Handling

All methods throw errors in these cases:
- Network failure: `Error` with message "Failed to fetch {fileName}: {status} {statusText}"
- Invalid JSON: `Error` with message "Invalid JSON data for {fileName}"
- All sources failed: `Error` with message "Unable to load {fileName} from any source"

Methods return fallback data when possible instead of throwing:
- `fetchDataWithFallback`: Returns cached data if remote fails
- `fetchDataWithFallback`: Returns local data if both remote and cache fail
- `checkForNewData`: Returns safe defaults if metadata fetch fails

### Testing Requirements

**Unit Tests**:
- `fetchDataWithFallback`: Success path, cache hit, cache miss, remote failure, local fallback
- `getCacheInfo`: With cache, without cache, expired cache, local cache
- `checkForNewData`: Update available, up to date, metadata failure, file not found
- `forceRefreshData`: Success, failure, bypass metadata
- Cache expiration logic
- Hash comparison logic

**Integration Tests**:
- Full update workflow: check → refresh → verify
- Background update scheduling
- Multiple file updates
- Error recovery scenarios

**Mock Requirements**:
- Mock `fetch()` API responses
- Mock metadata.json structure
- Mock network failures
- Mock invalid JSON responses

### Performance Requirements

- `fetchDataWithFallback` (cache hit): <50ms (PERF-005)
- `fetchDataWithFallback` (cache miss): <3s for initial load (PERF-001)
- `checkForNewData`: <2s for metadata check (PERF-002)
- `forceRefreshData`: <10s for full refresh (PERF-003)
- Background updates: Non-blocking, no UI lag (PERF-006)

## DataVersionStore

Svelte store for reactive data version state management.

### Interface

```typescript
import { writable } from 'svelte/store'

interface UpdateStatusMap {
  [fileName: string]: UpdateStatus
}

const dataVersionStore = writable<UpdateStatusMap>({})

/**
 * Get update status for a file
 */
function getUpdateStatus(fileName: string): UpdateStatus | null

/**
 * Update status for a file
 */
function setUpdateStatus(fileName: string, status: UpdateStatus): void

/**
 * Get formatted version info for display
 */
function getVersionInfo(fileName: string, displayName: string): DataVersionInfo

/**
 * Check if any files have updates available
 */
function hasAnyUpdates(): boolean
```

### Store Structure

```typescript
{
  'divinationCardDetails.json': UpdateStatus,
  'divinationCardPrices.json': UpdateStatus,
  // ... other files
}
```

### Reactivity

Store updates trigger reactive UI updates:
- Status changes → Update status chips
- Timestamp changes → Update timestamp display
- Update availability → Show/hide update alerts
- Loading states → Show/hide loading indicators

## DataFetcher Utility

Low-level utility functions for data fetching (adapted from example_files/data-fetcher.ts).

### Exported Functions

```typescript
/**
 * Core fetch with fallback logic
 */
export async function fetchDataWithFallback<T>(
  fileName: string,
  localImport: () => Promise<{ default: T }>
): Promise<T>

/**
 * Get cache information
 */
export function getCacheInfo(fileName: string): CacheInfo

/**
 * Check for new data
 */
export async function checkForNewData(
  fileName: string,
  bypassMetadataCache?: boolean
): Promise<UpdateCheckResult>

/**
 * Force refresh data
 */
export async function forceRefreshData<T>(
  fileName: string,
  localImport: () => Promise<{ default: T }>,
  bypassMetadataCheck?: boolean
): Promise<T>
```

### Internal Functions (not exported)

```typescript
/**
 * Fetch metadata.json
 */
async function fetchMetadata(bypassCache?: boolean): Promise<MetadataFile | null>

/**
 * Check if cache is stale
 */
function isCacheStale(entry: CacheEntry<unknown>): boolean

/**
 * Check for updates in background
 */
async function checkForUpdates<T>(
  fileName: string,
  url: string,
  localImport: () => Promise<{ default: T }>
): Promise<void>

/**
 * Fetch fresh data from server or fallback
 */
async function fetchFreshData<T>(
  fileName: string,
  url: string,
  localImport: () => Promise<{ default: T }>,
  cachedEntry?: CacheEntry<T>,
  bypassMetadataCheck?: boolean
): Promise<T>
```

## Integration Points

### With CardDataService

```typescript
// In CardDataService.loadCardsData()
const data = await dataUpdateService.fetchDataWithFallback(
  'divinationCardDetails.json',
  () => import('$static/cards/cards.json')
)
```

### With defaultCardPool

```typescript
// In createDefaultCardPool()
const cardsData = await dataUpdateService.fetchDataWithFallback(
  'divinationCardDetails.json',
  () => import('$static/cards/cards.json')
)

const valuesData = await dataUpdateService.fetchDataWithFallback(
  'divinationCardPrices.json',
  () => import('$static/cards/cardValues.json')
)
```

### With UI Components

```typescript
// In DataVersionOverlay.svelte
import { dataVersionStore } from '$lib/stores/dataVersionStore'
import { dataUpdateService } from '$lib/services/dataUpdateService'

// Check for updates
await dataUpdateService.checkAllForUpdates()

// Force refresh
await dataUpdateService.forceRefreshAll()
```

## Configuration

### Constants

```typescript
const DATA_BASE_URL = 'https://data.poeatlas.app/'
const METADATA_URL = `${DATA_BASE_URL}metadata.json`
const CACHE_EXPIRATION_MS = 60 * 60 * 1000  // 1 hour
const METADATA_CACHE_EXPIRATION_MS = 5 * 60 * 1000  // 5 minutes
const BACKGROUND_CHECK_THRESHOLD = 0.8  // Check when 80% expired
const DEFAULT_UPDATE_INTERVAL_MS = 60 * 60 * 1000  // 1 hour
```

### Configurable Options

```typescript
interface DataUpdateConfig {
  updateInterval?: number        // Automatic check interval (default: 1 hour)
  cacheExpiration?: number      // Cache expiration time (default: 1 hour)
  enableBackgroundChecks?: boolean  // Enable background metadata checks (default: true)
}
```

## Error Types

```typescript
class DataFetchError extends Error {
  fileName: string
  source: 'remote' | 'cache' | 'local'
  originalError?: Error
}

class MetadataFetchError extends Error {
  originalError?: Error
}

class DataValidationError extends Error {
  fileName: string
  validationIssue: string
}
```

