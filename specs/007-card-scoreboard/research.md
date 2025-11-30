# Research: Card Drop Scoreboard

**Feature**: 007-card-scoreboard  
**Date**: 2025-01-27  
**Status**: Complete

## Research Questions & Decisions

### 1. Session Drop Tracking Strategy

**Question**: How should we track card drops for the scoreboard? Should we use the existing cardCollection in GameState, or create a separate session-only tracking system?

**Decision**: Use existing cardCollection from GameState as the source of truth for drop counts, but create a separate session-only tracking system (SessionDropHistory) that captures additional metadata needed for the scoreboard (tier visibility at time of drop, timestamps, etc.).

**Rationale**: 
- cardCollection already tracks drop counts per card and is updated on every card drop
- However, cardCollection doesn't track tier visibility state at time of drop, which is needed for the "include previously hidden drops" feature
- SessionDropHistory provides session-scoped tracking that resets on new session (as per spec requirement)
- This approach maintains separation of concerns: GameState tracks persistent game data, SessionDropHistory tracks session-specific statistics

**Alternatives Considered**:
- Use only cardCollection: Rejected because it doesn't track tier visibility at drop time, and it's persisted across sessions (scoreboard should reset per session)
- Create completely separate tracking: Rejected because it would duplicate drop count logic and create inconsistency with GameState

**Implementation Notes**:
- SessionDropHistory tracks CardDropEvent objects with metadata (timestamp, tier visibility, card value)
- Aggregates into ScoreboardEntry objects for display
- Resets when new session starts (application restart or explicit reset)

---

### 2. Real-time Update Mechanism

**Question**: How should the scoreboard update when new cards are dropped? Should it poll, use events, or reactive subscriptions?

**Decision**: Use reactive Svelte stores (scoreboardStore) that subscribe to gameStateService card drop events and tierService visibility changes.

**Rationale**:
- Svelte's reactive system provides efficient, automatic UI updates
- Follows existing pattern (tierStore, gameState store)
- No polling overhead, updates only when state changes
- Integrates naturally with Svelte component lifecycle

**Alternatives Considered**:
- Polling: Rejected due to performance overhead and unnecessary CPU usage
- Manual event listeners: Rejected because Svelte stores provide better integration and automatic cleanup
- Direct component updates: Rejected because it breaks separation of concerns and makes testing harder

**Implementation Notes**:
- scoreboardService listens to gameStateService.openDeck() results
- Updates SessionDropHistory on each card drop
- scoreboardStore provides reactive access to scoreboard state
- Components subscribe to store and automatically re-render on changes

---

### 3. Sorting Implementation Strategy

**Question**: How should we implement sorting for the scoreboard? Client-side sorting, or should we consider server-side sorting for large datasets?

**Decision**: Client-side sorting using JavaScript Array.sort() with custom comparators. No server-side needed since this is a single-user web application.

**Rationale**:
- Single-user application, all data is already in browser memory
- Performance requirements (200 cards, <200ms sort) are easily achievable with client-side sorting
- Simpler architecture, no API calls needed
- Follows existing patterns in the codebase (no backend API)

**Alternatives Considered**:
- Server-side sorting: Rejected because there's no backend API, and client-side is sufficient for the scale
- Virtual scrolling with lazy sorting: Rejected as premature optimization; 200 cards is manageable with standard sorting

**Implementation Notes**:
- Sort comparators for each column type (string for name, number for counts/values)
- Secondary sort by card name (alphabetical) when primary sort values are equal
- Sort state stored in ScoreboardState (sortColumn, sortOrder)
- Re-sort on: column header click, new card drop, filter change

---

### 4. Tier Filter Integration Pattern

**Question**: How should the scoreboard integrate with the tier filter system? Should it query tierService directly, or use tierStore?

**Decision**: Use tierStore for reactive tier visibility queries, following the existing pattern used throughout the application.

**Rationale**:
- tierStore provides reactive access to tier state, ensuring scoreboard updates when tier visibility changes
- Consistent with how other components (LastCardZone, TierManagement) access tier information
- tierStore.shouldDisplayCard() method already exists and provides the exact functionality needed
- Reactive updates ensure scoreboard reflects tier changes immediately

**Alternatives Considered**:
- Direct tierService calls: Rejected because it's not reactive and requires manual refresh logic
- Duplicate tier visibility logic: Rejected because it would create inconsistency and maintenance burden

**Implementation Notes**:
- scoreboardService.getVisibleEntries() calls tierStore.shouldDisplayCard() for each entry
- When "include hidden cards" is enabled, bypasses tier visibility check
- Listens to tierStore changes to update scoreboard when tier visibility changes
- Maintains CardDropEvent.wasVisible flag to track visibility at drop time

---

### 5. Performance Optimization for Large Datasets

**Question**: How should we optimize the scoreboard for handling 200+ cards and 1000+ drops efficiently?

**Decision**: Use efficient data structures (Map for lookups), memoized calculations, and debounced updates for rapid card drops.

**Rationale**:
- Map-based lookups provide O(1) access for card name lookups
- Memoized calculations prevent redundant total value calculations
- Debouncing prevents excessive re-renders during rapid card drops
- Array operations (sort, filter) are efficient for 200 items in modern browsers

**Alternatives Considered**:
- Virtual scrolling: Rejected as premature optimization; 200 items render quickly in modern browsers
- Web Workers for sorting: Rejected because the overhead of data transfer outweighs benefits for 200 items
- IndexedDB for session data: Rejected because in-memory is faster and session data doesn't need persistence

**Implementation Notes**:
- SessionDropHistory uses Map<string, ScoreboardEntry> for O(1) card lookups
- Total accumulated value calculated on-demand and cached in ScoreboardEntry
- Debounce rapid card drops (e.g., 100ms) to batch updates
- Sort only when necessary (on user interaction or filter change)

---

### 6. Empty State and Error Handling

**Question**: How should the scoreboard handle edge cases like empty state, missing card data, or tier service not initialized?

**Decision**: Provide clear empty state messaging, graceful degradation for missing data, and initialization checks.

**Rationale**:
- Empty state improves UX by explaining why scoreboard is empty
- Graceful degradation ensures scoreboard doesn't break if card data is missing
- Initialization checks prevent errors when tier service isn't ready

**Alternatives Considered**:
- Hide scoreboard when empty: Rejected because users should see that the feature exists and understand why it's empty
- Throw errors for missing data: Rejected because it breaks user experience unnecessarily

**Implementation Notes**:
- Empty state component shows message: "No cards dropped in this session"
- Missing card values default to 0 (shouldn't happen, but defensive programming)
- Check tierStore.initialized before filtering by tier visibility
- Log warnings for unexpected states but don't break functionality

---

### 7. Session Reset Detection

**Question**: How should we detect when a new session starts to reset the scoreboard?

**Decision**: Reset scoreboard on application startup and provide explicit reset functionality. Session is defined as time between application start and close.

**Rationale**:
- Application startup is a clear session boundary
- Explicit reset gives users control
- Matches user expectation that "session" means current browser session
- Simple to implement: clear SessionDropHistory on app init

**Alternatives Considered**:
- Time-based session (e.g., 24 hours): Rejected because it's unclear and doesn't match user expectations
- Persist session across browser restarts: Rejected because spec explicitly states session-only (not persisted)
- Manual session management UI: Rejected as unnecessary complexity; app restart is sufficient

**Implementation Notes**:
- scoreboardService.reset() clears SessionDropHistory
- Called on application initialization
- Can be called explicitly if needed (e.g., from settings)
- SessionDropHistory.sessionStartTimestamp tracks session start time


