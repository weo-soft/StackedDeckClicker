# Research: Data Auto-Update System

**Feature**: 005-data-auto-update  
**Date**: 2025-01-27  
**Purpose**: Document technical decisions and approaches for implementing automatic data updates

## Data Fetching Approach

**Decision**: Adapt the proven data fetching utility from `example_files/data-fetcher.ts` to SvelteKit/TypeScript architecture.

**Rationale**: 
- The example implementation already handles all required scenarios: metadata checking, hash comparison, caching, fallback to local data
- Uses efficient metadata.json checking to avoid unnecessary full file downloads
- Implements proper cache expiration and background update checking
- Handles network failures gracefully with fallback strategies

**Key Patterns to Adopt**:
- In-memory Map-based cache with CacheEntry<T> structure
- Separate metadata.json caching with shorter expiration (5 minutes)
- Hash comparison before full file fetch
- Background update checking when cache is 80% expired
- Force refresh capability for manual updates

**Alternatives Considered**:
- Service Worker caching: Rejected - adds complexity, not needed for single-page app
- IndexedDB persistence: Considered for future enhancement, but in-memory cache sufficient for MVP
- Polling library: Rejected - native setInterval sufficient, no external dependency needed

## Caching Strategy

**Decision**: In-memory Map cache with CacheEntry structure containing data, timestamps, hash, and source indicator.

**Rationale**:
- Fast lookups (<50ms requirement met)
- No serialization overhead
- Simple invalidation and expiration logic
- Can be enhanced with IndexedDB persistence later if needed

**Cache Structure**:
```typescript
interface CacheEntry<T> {
  data: T
  timestamp: number        // When fetched
  dataTimestamp: number | null  // Data timestamp from metadata
  hash?: string
  isLocal: boolean
}
```

**Cache Expiration**:
- Data files: 1 hour (CACHE_EXPIRATION_MS = 60 * 60 * 1000)
- Metadata: 5 minutes (METADATA_CACHE_EXPIRATION_MS = 5 * 60 * 1000)
- Local data always considered stale to check for updates

**Alternatives Considered**:
- localStorage: Rejected - size limits, synchronous API
- IndexedDB: Considered but deferred - in-memory sufficient for MVP, can add later
- HTTP cache headers: Rejected - need more control, metadata.json checking is more efficient

## Metadata Checking Pattern

**Decision**: Always check metadata.json first to compare hashes before downloading full files.

**Rationale**:
- Reduces bandwidth usage significantly
- Faster update detection (<2 seconds for metadata vs potentially 10+ seconds for full files)
- Allows background checking without blocking
- Enables "update available" indication without downloading

**Flow**:
1. Fetch metadata.json (cached for 5 minutes)
2. Compare hash of cached file with server hash
3. If hash matches, use cached data (extend cache timestamp)
4. If hash differs, fetch full file
5. If metadata unavailable, fall back to full fetch

**Alternatives Considered**:
- ETag/Last-Modified headers: Rejected - metadata.json provides more information (hash, timestamp)
- Polling full files: Rejected - wasteful, slow, violates performance requirements

## Background Update Scheduling

**Decision**: Use setInterval with configurable interval (default: 1 hour) for automatic update checks.

**Rationale**:
- Simple, native JavaScript API
- No external dependencies
- Easy to configure and test
- Can be paused/resumed as needed
- Background checks use metadata.json only (fast, non-blocking)

**Implementation**:
- Check metadata.json in background when cache is 80% expired
- Full update check runs at configured interval
- Manual updates bypass schedule
- Can be disabled/enabled via service configuration

**Alternatives Considered**:
- requestIdleCallback: Considered but rejected - not available in all browsers, setInterval is sufficient
- Web Workers: Rejected - overkill for simple polling, adds complexity
- Server-Sent Events: Rejected - requires server changes, static URL approach is simpler

## UI Component Approach

**Decision**: Create Svelte component `DataVersionOverlay.svelte` adapted from `example_files/AboutOverlay.vue` patterns.

**Rationale**:
- Example shows proven UI patterns: table display, status chips, update buttons, loading states
- Follows existing modal/overlay patterns in codebase (TierSettings, TierManagement)
- Can reuse existing modal styling and accessibility patterns

**Key Features to Adapt**:
- Table showing file name, timestamp, status
- Status chips (Up to Date, Update Available, Outdated, Local)
- "Check for Updates" button (metadata check only)
- "Refresh Data" button (force full update)
- Loading indicators during operations
- Alert banner when updates available

**Integration Points**:
- Add button/trigger in main page (similar to Tier Settings button)
- Use existing modal overlay patterns
- Follow existing button styles and interactions

**Alternatives Considered**:
- Inline component: Rejected - too much information, overlay is cleaner
- Separate page: Rejected - modal is more accessible, follows existing patterns
- Toast notifications: Considered but rejected - need detailed info display, overlay better

## Error Handling and Fallback Strategies

**Decision**: Multi-tier fallback: remote → cached → local files, with graceful degradation.

**Rationale**:
- Ensures application always functions (95% requirement)
- Provides best available data at all times
- Clear error messages guide user actions

**Fallback Chain**:
1. Try remote fetch from https://data.poeatlas.app/
2. If remote fails, use cached data (even if stale)
3. If no cache, use local files from static/cards/
4. If all fail, show error but don't crash application

**Error Handling**:
- Network errors: Log warning, use fallback, show user-friendly message
- Invalid JSON: Log error, reject data, keep existing cache
- Missing metadata: Continue with full fetch attempt
- Rate limiting: Exponential backoff for retries (future enhancement)

**Alternatives Considered**:
- Fail fast: Rejected - violates requirement for graceful degradation
- Retry indefinitely: Rejected - could block UI, fallback is better
- User notification only: Rejected - need automatic fallback for seamless experience

## Integration with Existing Card Data Loading

**Decision**: Integrate with existing `CardDataService` and `defaultCardPool.ts` to replace static file loading.

**Rationale**:
- Minimal changes to existing code
- Maintains existing interfaces
- Can be added incrementally
- Existing code already uses fetch() for cards.json and cardValues.json

**Integration Points**:
1. Update `defaultCardPool.ts` to use dataUpdateService for fetching
2. Update `CardDataService.loadCardsData()` to use dataUpdateService
3. Map remote file names to local file names:
   - `divinationCardDetails.json` → `cards.json`
   - `divinationCardPrices.json` → `cardValues.json`
4. Maintain backward compatibility with local files

**Migration Strategy**:
- Phase 1: Add dataUpdateService, keep existing loading as fallback
- Phase 2: Update card loading to prefer remote data
- Phase 3: Remove local file dependencies (optional)

**Alternatives Considered**:
- Complete replacement: Rejected - too risky, incremental is safer
- Separate loading path: Rejected - adds complexity, unified is better
- Service Worker: Rejected - overkill, fetch API sufficient

## Data File Mapping

**Decision**: Map remote data files to existing local file structure for seamless integration.

**Mapping**:
- `divinationCardDetails.json` (remote) → `cards.json` (local) → `CardData[]` (internal)
- `divinationCardPrices.json` (remote) → `cardValues.json` (local) → `CardValueData[]` (internal)
- `metadata.json` (remote) → used for update checking only

**Rationale**:
- Existing code expects specific file names and structures
- Mapping layer allows remote data to work with existing parsers
- Can transform data if structure differs slightly
- Maintains type safety with existing interfaces

**Alternatives Considered**:
- Direct replacement: Rejected - might break if remote structure differs
- New data model: Rejected - too much refactoring, mapping is safer
- Adapter pattern: Considered but mapping is simpler for this use case

## Performance Optimizations

**Decision**: Implement cache-first strategy with background updates and metadata checking.

**Rationale**:
- Meets all performance requirements (PERF-001 through PERF-008)
- Minimizes network requests
- Prevents UI blocking
- Provides instant data access from cache

**Optimizations**:
1. Cache hit returns immediately (<50ms)
2. Background metadata check when cache 80% expired (non-blocking)
3. Metadata check before full download (saves bandwidth and time)
4. Parallel fetching of multiple files when needed
5. Debounce rapid update requests

**Alternatives Considered**:
- Always fetch: Rejected - violates performance requirements
- No caching: Rejected - too slow, poor user experience
- Aggressive caching: Considered but 1 hour is good balance

## Testing Strategy

**Decision**: Comprehensive test coverage with mocked network responses and isolated cache state.

**Rationale**:
- Meets ≥80% coverage requirement for critical paths
- Avoids external dependencies (no real network calls in tests)
- Enables fast, deterministic tests
- Covers all error scenarios

**Test Approach**:
- Unit tests: Mock fetch, test cache logic, expiration, hash comparison
- Integration tests: Test full update workflow with mocked responses
- E2E tests: Test user interactions (check updates, manual refresh)
- Mock strategies: Use MSW (Mock Service Worker) or fetch mock library

**Alternatives Considered**:
- Real network calls: Rejected - slow, flaky, violates isolation principle
- Manual testing only: Rejected - doesn't meet coverage requirements
- Snapshot testing: Considered but unit/integration more valuable

