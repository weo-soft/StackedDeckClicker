# Data Model: Card Drop Scoreboard

**Feature**: 007-card-scoreboard  
**Date**: 2025-01-27

## Overview

This document defines the data structures and models required for the card drop scoreboard feature. The models support session-based drop tracking, statistics aggregation, sorting, and tier filter integration.

## Core Entities

### ScoreboardEntry

Represents a single card's statistics in the scoreboard.

```typescript
interface ScoreboardEntry {
  /** Card name (unique identifier) */
  cardName: string;
  /** Number of times this card was dropped in the current session */
  dropCount: number;
  /** Card value (chaos value from card definition) */
  cardValue: number;
  /** Total accumulated value (dropCount × cardValue) */
  totalAccumulatedValue: number;
  /** Tier identifier for this card (for visibility filtering) */
  tierId: string | null;
  /** Timestamp when this card was first dropped in the session */
  firstDropTimestamp: number;
  /** Timestamp when this card was most recently dropped */
  lastDropTimestamp: number;
}
```

**Fields**:
- `cardName`: Unique identifier for the card, matches DivinationCard.name
- `dropCount`: Aggregated count of all drops for this card in the current session
- `cardValue`: Static value from card definition (doesn't change during session)
- `totalAccumulatedValue`: Calculated as dropCount × cardValue, cached for performance
- `tierId`: Current tier assignment for the card (from tierService), null if not assigned
- `firstDropTimestamp`: Unix timestamp of first drop in session
- `lastDropTimestamp`: Unix timestamp of most recent drop in session

**Validation Rules**:
- `cardName` must be non-empty string
- `dropCount` must be positive integer (>= 1)
- `cardValue` must be non-negative number (>= 0)
- `totalAccumulatedValue` must equal dropCount × cardValue
- `tierId` can be null if card is not assigned to a tier
- Timestamps must be valid Unix timestamps (positive numbers)

**State Transitions**:
- Created when first card drop occurs for a card
- Updated when same card is dropped again (increment dropCount, update lastDropTimestamp)
- Removed when session resets (all entries cleared)

---

### ScoreboardState

Represents the current state and configuration of the scoreboard.

```typescript
type SortColumn = 'name' | 'dropCount' | 'cardValue' | 'totalValue';
type SortOrder = 'asc' | 'desc';

interface ScoreboardState {
  /** Collection of scoreboard entries (Map for O(1) lookup by card name) */
  entries: Map<string, ScoreboardEntry>;
  /** Which column is currently used for sorting */
  sortColumn: SortColumn;
  /** Sort order (ascending or descending) */
  sortOrder: SortOrder;
  /** Whether to include cards from disabled tiers (hidden cards) */
  includeHiddenCards: boolean;
  /** Timestamp when scoreboard was last updated */
  lastUpdateTimestamp: number;
  /** Session start timestamp */
  sessionStartTimestamp: number;
}
```

**Fields**:
- `entries`: Map of card name to ScoreboardEntry for efficient lookups and updates
- `sortColumn`: Current sort column ('name', 'dropCount', 'cardValue', or 'totalValue')
- `sortOrder`: Current sort direction ('asc' or 'desc')
- `includeHiddenCards`: Boolean flag for tier filter integration (default: false)
- `lastUpdateTimestamp`: Unix timestamp of last scoreboard update (for UI refresh)
- `sessionStartTimestamp`: Unix timestamp when current session started

**Validation Rules**:
- `sortColumn` must be one of the defined SortColumn values
- `sortOrder` must be 'asc' or 'desc'
- `includeHiddenCards` must be boolean
- Timestamps must be valid Unix timestamps

**State Transitions**:
- Initialized with empty entries, default sort (cardValue desc), includeHiddenCards false
- Updated when cards are dropped (entries added/updated)
- Updated when sort column/order changes (user interaction)
- Updated when includeHiddenCards toggles (user interaction)
- Reset when new session starts (all state cleared, new sessionStartTimestamp)

---

### CardDropEvent

Represents a single card drop event that contributes to scoreboard statistics.

```typescript
interface CardDropEvent {
  /** Card name */
  cardName: string;
  /** Unix timestamp when card was dropped */
  timestamp: number;
  /** Card value (chaos value) */
  cardValue: number;
  /** Tier identifier at time of drop */
  tierId: string | null;
  /** Whether card was visible when dropped (based on tier filter) */
  wasVisible: boolean;
}
```

**Fields**:
- `cardName`: Card identifier, matches DivinationCard.name
- `timestamp`: Unix timestamp when deck was opened
- `cardValue`: Card's chaos value from card definition
- `tierId`: Tier assignment at time of drop (may change if card moved between tiers)
- `wasVisible`: Whether card was displayed when dropped (tier was enabled)

**Validation Rules**:
- `cardName` must be non-empty string
- `timestamp` must be valid Unix timestamp
- `cardValue` must be non-negative number
- `tierId` can be null if card not assigned to tier
- `wasVisible` must be boolean

**State Transitions**:
- Created when a card is dropped (from CardDrawResult)
- Stored in SessionDropHistory
- Used to aggregate into ScoreboardEntry
- Cleared when session resets

---

### SessionDropHistory

Represents the complete history of card drops for the current session.

```typescript
interface SessionDropHistory {
  /** Session start timestamp */
  sessionStartTimestamp: number;
  /** Array of all card drop events in chronological order */
  dropEvents: CardDropEvent[];
  /** Aggregated statistics (Map of card name to ScoreboardEntry) */
  aggregatedStats: Map<string, ScoreboardEntry>;
  /** Last update timestamp */
  lastUpdateTimestamp: number;
}
```

**Fields**:
- `sessionStartTimestamp`: Unix timestamp when session started (application initialization)
- `dropEvents`: Chronological array of all CardDropEvent objects
- `aggregatedStats`: Map of card name to ScoreboardEntry for efficient lookups
- `lastUpdateTimestamp`: Unix timestamp of last drop event or aggregation update

**Validation Rules**:
- `sessionStartTimestamp` must be valid Unix timestamp
- `dropEvents` must be array of valid CardDropEvent objects
- `aggregatedStats` keys must match card names from dropEvents
- `aggregatedStats` values must have correct dropCount matching dropEvents

**State Transitions**:
- Created on application initialization with empty arrays/maps
- Updated when cards are dropped (add CardDropEvent, update aggregatedStats)
- Aggregated stats recalculated on demand or after each drop
- Reset when new session starts (all data cleared, new sessionStartTimestamp)

**Aggregation Logic**:
- For each unique cardName in dropEvents:
  - Count occurrences → dropCount
  - Get cardValue from first drop event (assumes static)
  - Calculate totalAccumulatedValue = dropCount × cardValue
  - Get tierId from most recent drop event (may change if card moved)
  - Get firstDropTimestamp from earliest event
  - Get lastDropTimestamp from latest event

---

## Relationships

### ScoreboardEntry ↔ CardDropEvent

- **Relationship**: One-to-Many (aggregation)
- **Description**: Multiple CardDropEvent objects aggregate into a single ScoreboardEntry
- **Implementation**: SessionDropHistory.aggregatedStats groups dropEvents by cardName

### ScoreboardEntry ↔ DivinationCard

- **Relationship**: One-to-One (reference)
- **Description**: Each ScoreboardEntry references a DivinationCard by name
- **Implementation**: cardName field matches DivinationCard.name, cardValue comes from DivinationCard.value

### ScoreboardEntry ↔ Tier

- **Relationship**: Many-to-One (optional)
- **Description**: Multiple ScoreboardEntry objects can reference the same Tier
- **Implementation**: tierId field matches Tier.id, nullable if card not assigned

### ScoreboardState ↔ SessionDropHistory

- **Relationship**: One-to-One (composition)
- **Description**: ScoreboardState contains SessionDropHistory data
- **Implementation**: ScoreboardState.entries is derived from SessionDropHistory.aggregatedStats

---

## Data Flow

### Card Drop Flow

1. User opens deck → `gameStateService.openDeck()` returns `CardDrawResult`
2. `scoreboardService.trackDrop()` receives `CardDrawResult`
3. Create `CardDropEvent` with metadata (tier visibility, timestamp)
4. Add to `SessionDropHistory.dropEvents`
5. Update `SessionDropHistory.aggregatedStats` (increment dropCount, recalculate totals)
6. Update `ScoreboardState.entries` from aggregatedStats
7. Trigger reactive update via `scoreboardStore`

### Scoreboard Display Flow

1. Component subscribes to `scoreboardStore`
2. Get current `ScoreboardState` from store
3. Filter entries based on `includeHiddenCards` and tier visibility
4. Sort filtered entries by `sortColumn` and `sortOrder`
5. Render sorted entries in table/list format

### Sort/Filter Flow

1. User clicks column header or toggles "include hidden cards"
2. Update `ScoreboardState.sortColumn` / `sortOrder` / `includeHiddenCards`
3. Re-filter and re-sort entries
4. Update `scoreboardStore` with new state
5. Component re-renders with new sort/filter

---

## Serialization

**Note**: Scoreboard data is session-only and NOT persisted. However, for completeness:

- All interfaces are JSON-serializable
- Maps are converted to objects/arrays for JSON (e.g., `Array.from(entries.entries())`)
- Timestamps stored as numbers (Unix time)
- No persistence layer needed (in-memory only)

---

## Performance Considerations

- **Map-based lookups**: O(1) access for card name lookups in aggregatedStats
- **Memoization**: totalAccumulatedValue calculated once and cached in ScoreboardEntry
- **Efficient sorting**: Array.sort() with custom comparators, O(n log n) for 200 items
- **Debouncing**: Rapid card drops debounced to prevent excessive updates
- **Lazy aggregation**: aggregatedStats updated incrementally, not recalculated from scratch each time


