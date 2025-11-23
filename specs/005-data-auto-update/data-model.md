# Data Model: Data Auto-Update System

**Feature**: 005-data-auto-update  
**Date**: 2025-01-27  
**Purpose**: Define entities, relationships, validation rules, and state transitions

## Entities

### DataFile

Represents a JSON data file from the remote source or local fallback.

**TypeScript Interface**:
```typescript
interface DataFile {
  fileName: string              // e.g., 'divinationCardDetails.json'
  content: unknown              // Parsed JSON data (type depends on file)
  hash: string | null           // Hash from metadata.json
  lastModified: number | null   // Timestamp from metadata.json (ISO date converted)
  source: 'remote' | 'cached' | 'local'  // Where data came from
  size?: number                 // File size in bytes (optional)
}
```

**Attributes**:
- `fileName`: Unique identifier, matches key in metadata.json files map
- `content`: The actual data (typed as unknown, cast by consumers)
- `hash`: SHA hash from metadata.json, used for change detection
- `lastModified`: ISO date string converted to timestamp, represents when data was last modified on server
- `source`: Indicates data origin for display and fallback logic
- `size`: Optional file size for monitoring and debugging

**Validation Rules**:
- `fileName` must match pattern: `^[a-zA-Z0-9._-]+\.json$`
- `hash` must be valid hex string if present
- `lastModified` must be valid timestamp if present
- `source` must be one of the three allowed values

**Relationships**:
- Referenced by CacheEntry (cached version)
- Referenced by UpdateStatus (current state)

### MetadataFile

Represents the metadata.json file containing version information for all data files.

**TypeScript Interface**:
```typescript
interface MetadataFile {
  version?: string               // Optional version identifier
  generated?: string            // ISO timestamp when metadata was generated
  files: {                       // Map of filename to file metadata
    [fileName: string]: FileMetadata
  }
}

interface FileMetadata {
  hash: string                  // SHA hash of file content
  lastModified: string          // ISO date string
  size?: number                 // File size in bytes (optional)
}
```

**Attributes**:
- `version`: Optional version string for tracking metadata format changes
- `generated`: ISO timestamp when metadata.json was generated
- `files`: Map of all available data files with their metadata

**Validation Rules**:
- `files` must be non-empty object
- Each `FileMetadata.hash` must be valid hex string
- Each `FileMetadata.lastModified` must be valid ISO date string
- `generated` must be valid ISO date string if present

**Relationships**:
- Contains FileMetadata for each DataFile
- Used by DataUpdateService to check for updates

### CacheEntry

Represents a cached data file in memory with metadata for expiration and update checking.

**TypeScript Interface**:
```typescript
interface CacheEntry<T> {
  data: T                       // The cached data (generic type)
  timestamp: number             // When data was fetched/cached (Date.now())
  dataTimestamp: number | null  // Actual data timestamp from metadata lastModified
  hash: string | null           // Hash from metadata.json
  isLocal: boolean              // True if loaded from local files, false if from remote
}
```

**Attributes**:
- `data`: The actual cached data, typed generically for type safety
- `timestamp`: When the entry was created/fetched (for cache expiration)
- `dataTimestamp`: The actual data modification time from metadata (for display)
- `hash`: Hash value for comparison with server metadata
- `isLocal`: Flag indicating if data came from local files (always check for updates)

**Validation Rules**:
- `timestamp` must be valid timestamp (Date.now() value)
- `dataTimestamp` must be valid timestamp or null
- `hash` must be valid hex string or null
- `isLocal` boolean flag

**State Transitions**:
- Created: When data is first fetched (remote or local)
- Updated: When data is refreshed (timestamp and hash updated)
- Expired: When `timestamp + CACHE_EXPIRATION_MS < Date.now()`
- Invalidated: When explicitly cleared (manual refresh)

**Relationships**:
- Contains DataFile content
- Referenced by DataUpdateService cache Map

### UpdateStatus

Represents the current state of data update operations for a specific file.

**TypeScript Interface**:
```typescript
interface UpdateStatus {
  fileName: string
  hasUpdate: boolean            // True if newer data available on server
  serverHash: string | null     // Hash from server metadata
  serverTimestamp: number | null  // Timestamp from server metadata
  localTimestamp: number | null   // Timestamp of currently loaded data
  metadataChecked: boolean      // True if metadata was successfully fetched
  fileNotFound: boolean         // True if file not in metadata (error case)
  isUpdating: boolean           // True if update operation in progress
  lastError: string | null      // Error message if last operation failed
}
```

**Attributes**:
- `fileName`: Which file this status applies to
- `hasUpdate`: Whether newer version is available (hash comparison)
- `serverHash`: Latest hash from server metadata
- `serverTimestamp`: Latest timestamp from server metadata
- `localTimestamp`: Timestamp of currently cached/loaded data
- `metadataChecked`: Whether metadata fetch succeeded
- `fileNotFound`: Whether file exists in metadata (error indicator)
- `isUpdating`: Whether update operation is currently running
- `lastError`: Error message from last failed operation

**Validation Rules**:
- `fileName` must match DataFile validation pattern
- `serverHash` and `localTimestamp` must be valid if present
- `isUpdating` must be false when no operation in progress

**State Transitions**:
- Initial: All false/null, `metadataChecked: false`
- Checking: `isUpdating: true`, `metadataChecked: false`
- Checked (up to date): `hasUpdate: false`, `metadataChecked: true`, `isUpdating: false`
- Checked (update available): `hasUpdate: true`, `metadataChecked: true`, `isUpdating: false`
- Updating: `isUpdating: true`
- Updated: `isUpdating: false`, `hasUpdate: false` (after successful update)
- Error: `lastError` set, `isUpdating: false`

**Relationships**:
- References DataFile by fileName
- Used by DataVersionStore for reactive UI updates

### DataVersionInfo

Aggregated information about data version for display to users.

**TypeScript Interface**:
```typescript
interface DataVersionInfo {
  fileName: string
  displayName: string           // Human-readable name (e.g., "Divination Card Details")
  timestamp: number | null       // Best available timestamp (server or local)
  timestampText: string         // Formatted timestamp for display
  statusText: string           // "Up to Date", "Update Available", "Outdated", "Local", "Checking..."
  statusColor: 'success' | 'warning' | 'error' | 'grey'  // Color for status chip
  timestampClass: string       // CSS class for timestamp styling
  isLocal: boolean             // Whether using local fallback data
  hash: string | null          // Current hash (for debugging/advanced users)
}
```

**Attributes**:
- `fileName`: File identifier
- `displayName`: User-friendly name for UI display
- `timestamp`: Best available timestamp (prefer server, fallback to local)
- `timestampText`: Formatted string (e.g., "2025-01-27 10:30 AM")
- `statusText`: Human-readable status
- `statusColor`: Semantic color for status chip
- `timestampClass`: CSS class for conditional styling
- `isLocal`: Whether data is from local fallback
- `hash`: Hash value (optional, for advanced display)

**Validation Rules**:
- `statusColor` must be one of allowed values
- `timestampText` must be non-empty if timestamp exists
- `statusText` must be non-empty

**Relationships**:
- Aggregates data from CacheEntry and UpdateStatus
- Used by DataVersionOverlay component for display

## Relationships Summary

```
MetadataFile
  ├── contains → FileMetadata (for each DataFile)
  └── used by → DataUpdateService (for update checking)

DataFile
  ├── cached as → CacheEntry
  └── status tracked in → UpdateStatus

CacheEntry
  ├── contains → DataFile.content
  └── referenced by → DataUpdateService.cache Map

UpdateStatus
  ├── references → DataFile (by fileName)
  └── used by → DataVersionStore

DataVersionInfo
  ├── aggregates → CacheEntry + UpdateStatus
  └── used by → DataVersionOverlay component
```

## State Machine: UpdateStatus

```
[Initial]
  │
  ├─ checkForUpdates() → [Checking]
  │                        │
  │                        ├─ metadata fetch success → [Checked: Up to Date] or [Checked: Update Available]
  │                        │
  │                        └─ metadata fetch failure → [Error]
  │
  ├─ forceRefresh() → [Updating]
  │                     │
  │                     ├─ fetch success → [Updated] → [Checked: Up to Date]
  │                     │
  │                     └─ fetch failure → [Error]
  │
  └─ (timeout/expiration) → [Checking] (automatic background check)
```

## Validation Functions

### validateFileName(fileName: string): boolean
- Pattern: `^[a-zA-Z0-9._-]+\.json$`
- Returns true if valid

### validateHash(hash: string | null): boolean
- Must be hex string if present
- Returns true if valid or null

### validateTimestamp(timestamp: number | null): boolean
- Must be positive number if present
- Must be <= Date.now() + 1000 (allow 1s future for clock skew)
- Returns true if valid or null

### isCacheExpired(entry: CacheEntry<unknown>): boolean
- Returns true if `Date.now() - entry.timestamp > CACHE_EXPIRATION_MS`
- Local entries always return true (always check for updates)

### hasDataChanged(localHash: string | null, serverHash: string | null): boolean
- Returns true if hashes differ (and both are non-null)
- Returns false if hashes match or either is null

