# Feature Specification: Data Auto-Update System

**Feature Branch**: `005-data-auto-update`  
**Created**: 2025-01-27  
**Status**: Draft  
**Input**: User description: "to provide the latest price and weighting data, the page must regularly fetch the most recent data files. the files are provided at a static url https://data.poeatlas.app/ .  the Palyer should also be able to view the current version of data used and trigger an update of the data."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automatic Data Updates (Priority: P1)

A player uses the application and benefits from automatically updated card price and weighting data without manual intervention. The system periodically checks for and fetches updated data files from the remote source to ensure the game uses current market prices and card information.

**Why this priority**: This is the core value proposition - ensuring players always have access to the latest data without requiring manual updates. Without automatic updates, the game would quickly become outdated as market prices change, reducing player trust and engagement.

**Independent Test**: Can be fully tested by running the application, verifying that data is fetched from the remote source on initial load, and confirming that the system checks for updates at regular intervals. Delivers immediate value by ensuring data freshness without user action.

**Acceptance Scenarios**:

1. **Given** the application is launched for the first time, **When** the game initializes, **Then** the system fetches the latest data files from https://data.poeatlas.app/ and uses them for gameplay
2. **Given** the application is running, **When** a configured time interval elapses, **Then** the system automatically checks metadata.json for updates and fetches new data files if available
3. **Given** cached data exists and is still valid, **When** the application loads, **Then** the system uses cached data immediately while checking for updates in the background
4. **Given** the remote data source is unavailable, **When** the system attempts to fetch data, **Then** the system gracefully falls back to cached data and continues functioning without disruption

---

### User Story 2 - View Current Data Version (Priority: P2)

A player can view information about the data version currently in use, including when it was last updated, the data source (remote or cached), and whether newer data is available.

**Why this priority**: Transparency builds trust. Players need to know if they're using current data or stale information, especially when making decisions based on card values. This enables informed gameplay decisions.

**Independent Test**: Can be fully tested by accessing a data version information display, verifying that it shows the current data timestamp, source indicator, and update availability status. Delivers user confidence and transparency.

**Acceptance Scenarios**:

1. **Given** data has been loaded into the application, **When** a player views the data version information, **Then** the system displays the timestamp of when the data was last updated, the data source (remote or local cache), and a hash or version identifier
2. **Given** the system has checked for updates, **When** a player views the data version information, **Then** the system indicates whether newer data is available on the server
3. **Given** data is being fetched, **When** a player views the data version information, **Then** the system shows a loading state or progress indicator
4. **Given** data fetch fails, **When** a player views the data version information, **Then** the system clearly indicates that cached data is being used and when it was last successfully updated

---

### User Story 3 - Manual Data Update Trigger (Priority: P2)

A player can manually trigger a data update at any time to immediately fetch the latest data files, bypassing the automatic update schedule.

**Why this priority**: Players may want immediate updates when they know new data is available, or when they suspect their data is stale. Manual control provides user agency and addresses edge cases where automatic updates may not have triggered yet.

**Independent Test**: Can be fully tested by clicking a manual update button, verifying that the system fetches fresh data from the remote source, and confirming that the updated data is immediately available for use. Delivers user control and immediate satisfaction.

**Acceptance Scenarios**:

1. **Given** a player wants to update data, **When** the player clicks a manual update button, **Then** the system immediately checks metadata.json and fetches updated data files if available
2. **Given** a player triggers a manual update, **When** the update is in progress, **Then** the system displays a clear loading indicator and prevents duplicate update requests
3. **Given** a player triggers a manual update, **When** the update completes successfully, **Then** the system displays a success message and immediately uses the new data for gameplay
4. **Given** a player triggers a manual update, **When** the update fails, **Then** the system displays an error message explaining the failure and continues using existing cached data
5. **Given** a player triggers a manual update, **When** no new data is available, **Then** the system indicates that the current data is already up to date

---

### Edge Cases

- What happens when the network connection is lost during a data fetch?
- How does the system handle corrupted or invalid JSON data from the remote source?
- What occurs when metadata.json indicates an update but the actual data file fetch fails?
- How does the system handle multiple simultaneous update requests (automatic and manual)?
- What happens when the remote server returns a different data structure than expected?
- How does the system behave when cache storage is full or unavailable?
- What occurs when the application is closed during an active data fetch?
- How does the system handle rate limiting or server errors (429, 503, etc.) from the remote source?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST automatically fetch data files from https://data.poeatlas.app/ on application initialization
- **FR-002**: System MUST periodically check metadata.json for data updates at configurable intervals
- **FR-003**: System MUST use cached data when available and valid to minimize network requests and improve load times
- **FR-004**: System MUST compare hash values from metadata.json to determine if data updates are available without downloading full files
- **FR-005**: System MUST fall back to cached data when remote fetch fails to ensure application continues functioning
- **FR-006**: System MUST fall back to local data files when both remote fetch and cache are unavailable
- **FR-007**: System MUST display the current data version information including timestamp, source, and hash/version identifier
- **FR-008**: System MUST indicate when newer data is available on the server compared to currently loaded data
- **FR-009**: System MUST provide a manual trigger for immediate data updates that bypasses automatic update schedule
- **FR-010**: System MUST prevent duplicate update requests when an update is already in progress
- **FR-011**: System MUST display loading states during data fetch operations
- **FR-012**: System MUST display success or error messages after update attempts complete
- **FR-013**: System MUST update gameplay data immediately after successful data fetch without requiring application restart
- **FR-014**: System MUST handle network errors gracefully without disrupting gameplay
- **FR-015**: System MUST validate fetched data structure before replacing cached data
- **FR-016**: System MUST cache metadata.json separately with shorter expiration to minimize unnecessary full data checks

### Key Entities *(include if feature involves data)*

- **Data File**: Represents a JSON data file from the remote source (e.g., divinationCardDetails.json, divinationCardPrices.json). Contains the actual card information, prices, or other game data. Has attributes: filename, content, hash, lastModified timestamp, source (remote/cached/local).

- **Metadata File**: Represents metadata.json from the remote source. Contains version information, file hashes, timestamps, and file sizes for all available data files. Used to check for updates without downloading full files. Has attributes: version, generated timestamp, files map (filename to metadata).

- **Cache Entry**: Represents a cached data file in local storage. Contains the data content, fetch timestamp, data timestamp (from metadata), hash, and source indicator. Used to avoid redundant network requests and provide offline functionality.

- **Update Status**: Represents the current state of data update operations. Contains information about whether an update is in progress, last update time, update availability, and any error states. Used to inform the user interface about data freshness and update operations.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users receive updated data automatically within 24 hours of data changes on the remote server (assuming network connectivity)
- **SC-002**: Data version information is accessible to users within 2 seconds of page load
- **SC-003**: Manual data updates complete successfully in under 10 seconds for standard data file sizes on typical network connections
- **SC-004**: Application continues functioning normally in 95% of cases when remote data source is unavailable (using cached or local fallback)
- **SC-005**: Users can successfully trigger manual updates 100% of the time when network connectivity is available
- **SC-006**: Data fetch operations do not block or delay application initialization by more than 3 seconds
- **SC-007**: Background update checks do not impact application performance or user experience (no noticeable lag or stuttering)

## Testing Requirements *(mandatory)*

### Test Coverage Requirements

- **TC-001**: All data fetching functions must have unit tests covering success, failure, and edge case scenarios
- **TC-002**: Data version display functionality must have integration tests verifying correct information display
- **TC-003**: Manual update trigger workflow must have end-to-end tests covering the complete user flow
- **TC-004**: Critical data update paths must achieve ≥80% test coverage including network failure scenarios
- **TC-005**: Tests must use isolated test data and mock network responses to avoid external dependencies
- **TC-006**: Cache management logic must have unit tests covering cache hit, miss, expiration, and invalidation scenarios

### Test Scenarios

- [ ] Happy path: Application loads, fetches data successfully, displays version information
- [ ] Happy path: Automatic update check detects new data and fetches it in background
- [ ] Happy path: Manual update trigger successfully fetches and applies new data
- [ ] Error handling: Network failure during initial data fetch falls back to cache
- [ ] Error handling: Network failure during manual update shows error message and preserves existing data
- [ ] Error handling: Invalid JSON data from remote source is rejected and cached data is retained
- [ ] Edge case: Multiple simultaneous update requests are prevented or queued properly
- [ ] Edge case: Application closed during active fetch handles cleanup gracefully
- [ ] Edge case: Cache storage full or unavailable falls back to local data files
- [ ] Edge case: Metadata indicates update but data file fetch fails handles gracefully
- [ ] Performance: Large data files fetch without blocking UI for more than 3 seconds
- [ ] Performance: Background update checks do not cause performance degradation

## User Experience Requirements *(mandatory)*

### Accessibility Requirements

- **UX-001**: Feature MUST meet WCAG 2.1 Level AA standards
- **UX-002**: All data version information and update controls must be keyboard navigable
- **UX-003**: Loading states and status messages must be announced to screen readers
- **UX-004**: Error messages must be clearly readable with sufficient color contrast ratios meeting WCAG standards
- **UX-005**: Update buttons and controls must have clear focus indicators for keyboard navigation

### Consistency Requirements

- **UX-006**: Feature MUST use established design system components and patterns consistent with existing application UI
- **UX-007**: Data version display must follow existing information display patterns and styling
- **UX-008**: Update buttons must match existing button styles and interaction patterns
- **UX-009**: Loading indicators must use the same visual style as other loading states in the application
- **UX-010**: Error messages must follow the standard error message format and tone used throughout the application

### User Feedback Requirements

- **UX-011**: Loading states must be shown for data fetch operations exceeding 100ms
- **UX-012**: Success messages must clearly indicate when data has been updated and is ready for use
- **UX-013**: Error messages must be clear, actionable, and explain what went wrong and what the user can do
- **UX-014**: Data version information must be clearly visible and easy to understand for non-technical users
- **UX-015**: Update availability indicators must be visually distinct and attention-grabbing without being intrusive
- **UX-016**: Manual update button must provide visual feedback (disabled state, loading state) during update operations

## Performance Requirements *(mandatory)*

### Performance Benchmarks

- **PERF-001**: Initial data fetch must not delay application initialization by more than 3 seconds
- **PERF-002**: Background update checks must complete metadata.json fetch in under 2 seconds on standard connections
- **PERF-003**: Manual data update must complete full data fetch in under 10 seconds for typical data file sizes
- **PERF-004**: Data version information display must render within 100ms of component mount
- **PERF-005**: Cache lookups must complete in under 50ms to avoid UI blocking
- **PERF-006**: Background update operations must not cause frame rate drops or noticeable UI lag
- **PERF-007**: Memory usage for cached data must not exceed reasonable limits (data files should be efficiently stored)
- **PERF-008**: Network requests must be efficiently batched or debounced to avoid excessive API calls

## Assumptions

- The remote data source (https://data.poeatlas.app/) provides stable, reliable access to data files
- The metadata.json file structure follows the documented format with hash, lastModified, and file entries
- Data files (divinationCardDetails.json, divinationCardPrices.json) maintain consistent structure across updates
- Network connectivity is available for most users, with offline scenarios being edge cases
- Browser local storage or IndexedDB is available for caching data files
- Data file sizes are reasonable for browser-based caching (under 10MB per file)
- The application has existing error handling and user feedback patterns to follow
- Users understand basic concepts of data updates and version information
- Automatic update intervals will be configured to balance freshness with network efficiency (e.g., hourly or daily checks)
