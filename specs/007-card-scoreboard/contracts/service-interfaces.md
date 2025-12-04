# Service Interfaces: Card Drop Scoreboard

**Feature**: 007-card-scoreboard  
**Date**: 2025-01-27

## Overview

This document defines the service interfaces and API contracts for the scoreboard feature. These interfaces define the public API for scoreboard functionality, ensuring consistent implementation and testability.

## ScoreboardService

Core service for scoreboard business logic, drop tracking, and statistics aggregation.

### Interface

```typescript
interface ScoreboardService {
  /**
   * Initialize the scoreboard service.
   * Called once on application startup.
   * Resets session drop history.
   */
  initialize(): void;

  /**
   * Track a card drop event.
   * Called when a card is dropped (from gameStateService.openDeck()).
   * @param cardDrawResult - The card draw result from gameStateService
   * @returns void
   */
  trackDrop(cardDrawResult: CardDrawResult): void;

  /**
   * Get all scoreboard entries.
   * Returns entries filtered by tier visibility and sorted by current sort settings.
   * @returns Array of ScoreboardEntry objects
   */
  getEntries(): ScoreboardEntry[];

  /**
   * Get scoreboard state.
   * Returns current configuration (sort column, sort order, include hidden cards flag).
   * @returns ScoreboardState object
   */
  getState(): ScoreboardState;

  /**
   * Set sort column.
   * @param column - Column to sort by ('name', 'dropCount', 'cardValue', 'totalValue')
   * @returns void
   */
  setSortColumn(column: SortColumn): void;

  /**
   * Set sort order.
   * @param order - Sort order ('asc' or 'desc')
   * @returns void
   */
  setSortOrder(order: SortOrder): void;

  /**
   * Toggle sort order.
   * If sorting by the same column, toggles between asc/desc.
   * If sorting by different column, sets to descending.
   * @param column - Column to sort by
   * @returns void
   */
  toggleSort(column: SortColumn): void;

  /**
   * Set whether to include hidden cards (from disabled tiers).
   * @param include - Whether to include hidden cards
   * @returns void
   */
  setIncludeHiddenCards(include: boolean): void;

  /**
   * Reset scoreboard for new session.
   * Clears all drop history and resets state to defaults.
   * @returns void
   */
  reset(): void;

  /**
   * Get session statistics.
   * Returns summary statistics for the current session.
   * @returns SessionStatistics object
   */
  getSessionStatistics(): SessionStatistics;
}
```

### SessionStatistics

```typescript
interface SessionStatistics {
  /** Total number of cards dropped in session */
  totalDrops: number;
  /** Number of unique cards dropped */
  uniqueCards: number;
  /** Total accumulated value from all drops */
  totalValue: number;
  /** Session start timestamp */
  sessionStartTimestamp: number;
  /** Last drop timestamp */
  lastDropTimestamp: number | null;
}
```

### Error Handling

- **Invalid sort column**: Throws TypeError if column is not one of the valid SortColumn values
- **Service not initialized**: Methods may return empty results if service not initialized (graceful degradation)
- **Missing card data**: If card value is missing, defaults to 0 (defensive programming)

---

## ScoreboardStore

Reactive Svelte store for scoreboard state management.

### Interface

```typescript
interface ScoreboardStore {
  /**
   * Subscribe to scoreboard state changes.
   * Returns unsubscribe function.
   * @param callback - Callback function called when state changes
   * @returns Unsubscribe function
   */
  subscribe(callback: (state: ScoreboardState) => void): () => void;

  /**
   * Get current scoreboard entries (reactive).
   * Returns filtered and sorted entries.
   * @returns Array of ScoreboardEntry objects
   */
  getEntries(): ScoreboardEntry[];

  /**
   * Get current scoreboard state (reactive).
   * @returns ScoreboardState object
   */
  getState(): ScoreboardState;

  /**
   * Set sort column (reactive).
   * Updates store and triggers reactive updates.
   * @param column - Column to sort by
   * @returns void
   */
  setSortColumn(column: SortColumn): void;

  /**
   * Toggle sort order for a column (reactive).
   * @param column - Column to sort by
   * @returns void
   */
  toggleSort(column: SortColumn): void;

  /**
   * Set include hidden cards flag (reactive).
   * @param include - Whether to include hidden cards
   * @returns void
   */
  setIncludeHiddenCards(include: boolean): void;

  /**
   * Refresh store from service state.
   * Call after service operations to update reactive state.
   * @returns void
   */
  refresh(): void;

  /**
   * Reset scoreboard (reactive).
   * Clears all data and resets to defaults.
   * @returns void
   */
  reset(): void;
}
```

### Reactive Behavior

- Store automatically updates when scoreboardService state changes
- Components subscribing to store automatically re-render on state changes
- Store maintains reactive references to tierStore for visibility filtering

---

## Integration Points

### gameStateService Integration

**Event**: Card drop (via `openDeck()` result)

```typescript
// In gameStateService or component handling card drops:
const result = await gameStateService.openDeck();
scoreboardService.trackDrop(result);
```

**Contract**:
- `trackDrop()` is called synchronously after card drop
- `CardDrawResult` contains: `card`, `timestamp`, `scoreGained`
- Service extracts card name, value, and queries tier visibility

---

### tierService Integration

**Query**: Card visibility (via `tierStore.shouldDisplayCard()`)

```typescript
// In scoreboardService.getVisibleEntries():
const shouldDisplay = tierStore.shouldDisplayCard(cardName);
```

**Contract**:
- `shouldDisplayCard()` returns boolean (true if tier enabled, false if disabled)
- Returns true if card not assigned to tier (default behavior)
- Reactive: updates when tier visibility changes

---

### Component Integration

**Component**: Scoreboard.svelte

```typescript
// Component subscribes to store:
$: entries = scoreboardStore.getEntries();
$: state = scoreboardStore.getState();

// User interactions:
function handleSortClick(column: SortColumn) {
  scoreboardStore.toggleSort(column);
}

function handleIncludeHiddenToggle(include: boolean) {
  scoreboardStore.setIncludeHiddenCards(include);
}
```

**Contract**:
- Component receives reactive state from store
- User interactions update store, which triggers service updates
- Store provides filtered and sorted entries ready for display

---

## Performance Contracts

### Response Time Guarantees

- `getEntries()`: Returns within 50ms for 200 cards (includes filtering and sorting)
- `trackDrop()`: Completes within 10ms (adds event, updates aggregation)
- `setSortColumn()` / `toggleSort()`: Completes within 5ms (updates state only, sorting deferred)
- `setIncludeHiddenCards()`: Completes within 5ms (updates state only, filtering deferred)

### Memory Guarantees

- SessionDropHistory memory usage: ~1KB per 100 drops (CardDropEvent objects)
- ScoreboardState memory usage: ~2KB per 100 unique cards (ScoreboardEntry objects)
- Total memory for 200 cards, 1000 drops: ~30KB

---

## Testing Contracts

### Unit Test Requirements

- All service methods must be testable in isolation
- Mock dependencies (tierStore, gameStateService) for unit tests
- Test error handling and edge cases

### Integration Test Requirements

- Test scoreboardService with real tierStore
- Test reactive updates in scoreboardStore
- Test component integration with store

### E2E Test Requirements

- Test full user workflow: drop cards → view scoreboard → sort → filter
- Test real-time updates when cards are dropped
- Test tier visibility changes affecting scoreboard








