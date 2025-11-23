/**
 * Data version and update status models for data auto-update system
 */

/**
 * Represents a JSON data file from the remote source or local fallback.
 */
export interface DataFile {
  /** File name (e.g., 'divinationCardDetails.json') */
  fileName: string;
  /** Parsed JSON data (type depends on file) */
  content: unknown;
  /** Hash from metadata.json */
  hash: string | null;
  /** Timestamp from metadata.json (ISO date converted) */
  lastModified: number | null;
  /** Where data came from */
  source: 'remote' | 'cached' | 'local';
  /** File size in bytes (optional) */
  size?: number;
}

/**
 * Metadata for a single file from metadata.json
 */
export interface FileMetadata {
  /** SHA hash of file content */
  hash: string;
  /** ISO date string */
  lastModified: string;
  /** File size in bytes (optional) */
  size?: number;
}

/**
 * Structure of metadata.json from the remote source
 */
export interface MetadataFile {
  /** Optional version identifier */
  version?: string;
  /** ISO timestamp when metadata was generated */
  generated?: string;
  /** Map of filename to file metadata */
  files: {
    [fileName: string]: FileMetadata;
  };
}

/**
 * Represents a cached data file in memory with metadata for expiration and update checking.
 */
export interface CacheEntry<T> {
  /** The cached data (generic type) */
  data: T;
  /** When data was fetched/cached (Date.now()) */
  timestamp: number;
  /** Actual data timestamp from metadata lastModified */
  dataTimestamp: number | null;
  /** Hash from metadata.json */
  hash: string | null;
  /** True if loaded from local files, false if from remote */
  isLocal: boolean;
}

/**
 * Represents the current state of data update operations for a specific file.
 */
export interface UpdateStatus {
  /** Which file this status applies to */
  fileName: string;
  /** True if newer data available on server */
  hasUpdate: boolean;
  /** Hash from server metadata */
  serverHash: string | null;
  /** Timestamp from server metadata */
  serverTimestamp: number | null;
  /** Timestamp of currently loaded data */
  localTimestamp: number | null;
  /** True if metadata was successfully fetched */
  metadataChecked: boolean;
  /** True if file not in metadata (error case) */
  fileNotFound: boolean;
  /** True if update operation is currently running */
  isUpdating: boolean;
  /** Error message if last operation failed */
  lastError: string | null;
}

/**
 * Aggregated information about data version for display to users.
 */
export interface DataVersionInfo {
  /** File identifier */
  fileName: string;
  /** Human-readable name (e.g., "Divination Card Details") */
  displayName: string;
  /** Best available timestamp (server or local) */
  timestamp: number | null;
  /** Formatted timestamp for display */
  timestampText: string;
  /** Status text: "Up to Date", "Update Available", "Outdated", "Local", "Checking..." */
  statusText: string;
  /** Color for status chip */
  statusColor: 'success' | 'warning' | 'error' | 'grey';
  /** CSS class for timestamp styling */
  timestampClass: string;
  /** Whether using local fallback data */
  isLocal: boolean;
  /** Current hash (for debugging/advanced users) */
  hash: string | null;
}

/**
 * Cache information returned by getCacheInfo
 */
export interface CacheInfo {
  /** Whether cache exists for this file */
  hasCache: boolean;
  /** Data timestamp (from metadata lastModified) */
  timestamp: number | null;
  /** Hash value */
  hash: string | null;
  /** Whether data is from local files */
  isLocal: boolean;
  /** Age of cache in milliseconds */
  age: number | null;
}

/**
 * Result from checkForNewData
 */
export interface UpdateCheckResult {
  /** Whether update is available */
  hasUpdate: boolean;
  /** Hash from server */
  serverHash: string | null;
  /** Timestamp from server */
  serverTimestamp: number | null;
  /** Whether metadata was successfully fetched */
  metadataChecked: boolean;
  /** Whether file entry is missing from metadata */
  fileNotFound: boolean;
}

