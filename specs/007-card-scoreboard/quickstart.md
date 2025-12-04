# Quickstart Guide: Card Drop Scoreboard

**Feature**: 007-card-scoreboard  
**Date**: 2025-01-27

## Overview

This guide provides a quick reference for implementing the card drop scoreboard feature. It covers the essential steps, key files, and integration points needed to add scoreboard functionality to the game.

## Architecture Summary

The scoreboard feature consists of:

1. **ScoreboardService**: Business logic for tracking drops and managing scoreboard state
2. **ScoreboardStore**: Reactive Svelte store for UI integration
3. **Scoreboard Component**: Svelte component for displaying the scoreboard
4. **Data Models**: TypeScript interfaces for scoreboard data structures

## Implementation Steps

### Step 1: Create Data Models

Create the following model files in `src/lib/models/`:

**ScoreboardEntry.ts**:
```typescript
export interface ScoreboardEntry {
  cardName: string;
  dropCount: number;
  cardValue: number;
  totalAccumulatedValue: number;
  tierId: string | null;
  firstDropTimestamp: number;
  lastDropTimestamp: number;
}
```

**ScoreboardState.ts**:
```typescript
export type SortColumn = 'name' | 'dropCount' | 'cardValue' | 'totalValue';
export type SortOrder = 'asc' | 'desc';

export interface ScoreboardState {
  entries: Map<string, ScoreboardEntry>;
  sortColumn: SortColumn;
  sortOrder: SortOrder;
  includeHiddenCards: boolean;
  lastUpdateTimestamp: number;
  sessionStartTimestamp: number;
}
```

**CardDropEvent.ts**:
```typescript
export interface CardDropEvent {
  cardName: string;
  timestamp: number;
  cardValue: number;
  tierId: string | null;
  wasVisible: boolean;
}
```

**SessionDropHistory.ts**:
```typescript
import type { CardDropEvent } from './CardDropEvent.js';
import type { ScoreboardEntry } from './ScoreboardEntry.js';

export interface SessionDropHistory {
  sessionStartTimestamp: number;
  dropEvents: CardDropEvent[];
  aggregatedStats: Map<string, ScoreboardEntry>;
  lastUpdateTimestamp: number;
}
```

### Step 2: Create ScoreboardService

Create `src/lib/services/scoreboardService.ts`:

```typescript
import type { CardDrawResult } from '../models/CardDrawResult.js';
import type { ScoreboardEntry, ScoreboardState, SortColumn, SortOrder } from '../models/ScoreboardState.js';
import type { CardDropEvent } from '../models/CardDropEvent.js';
import type { SessionDropHistory } from '../models/SessionDropHistory.js';
import { tierStore } from '../stores/tierStore.js';

export class ScoreboardService {
  private history: SessionDropHistory;
  private state: ScoreboardState;

  constructor() {
    this.history = this.createEmptyHistory();
    this.state = this.createDefaultState();
  }

  initialize(): void {
    this.history = this.createEmptyHistory();
    this.state = this.createDefaultState();
  }

  trackDrop(cardDrawResult: CardDrawResult): void {
    const card = cardDrawResult.card;
    const tier = tierStore.getTierForCard(card.name);
    const wasVisible = tierStore.shouldDisplayCard(card.name);

    const event: CardDropEvent = {
      cardName: card.name,
      timestamp: cardDrawResult.timestamp,
      cardValue: card.value,
      tierId: tier?.id ?? null,
      wasVisible
    };

    this.history.dropEvents.push(event);
    this.updateAggregatedStats();
    this.state.lastUpdateTimestamp = Date.now();
  }

  getEntries(): ScoreboardEntry[] {
    const entries = Array.from(this.history.aggregatedStats.values());
    return this.filterAndSort(entries);
  }

  getState(): ScoreboardState {
    return { ...this.state };
  }

  setSortColumn(column: SortColumn): void {
    this.state.sortColumn = column;
  }

  setSortOrder(order: SortOrder): void {
    this.state.sortOrder = order;
  }

  toggleSort(column: SortColumn): void {
    if (this.state.sortColumn === column) {
      this.state.sortOrder = this.state.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.state.sortColumn = column;
      this.state.sortOrder = 'desc';
    }
  }

  setIncludeHiddenCards(include: boolean): void {
    this.state.includeHiddenCards = include;
  }

  reset(): void {
    this.history = this.createEmptyHistory();
    this.state = this.createDefaultState();
  }

  private createEmptyHistory(): SessionDropHistory {
    return {
      sessionStartTimestamp: Date.now(),
      dropEvents: [],
      aggregatedStats: new Map(),
      lastUpdateTimestamp: Date.now()
    };
  }

  private createDefaultState(): ScoreboardState {
    return {
      entries: new Map(),
      sortColumn: 'cardValue',
      sortOrder: 'desc',
      includeHiddenCards: false,
      lastUpdateTimestamp: Date.now(),
      sessionStartTimestamp: Date.now()
    };
  }

  private updateAggregatedStats(): void {
    const stats = new Map<string, ScoreboardEntry>();

    for (const event of this.history.dropEvents) {
      const existing = stats.get(event.cardName);
      if (existing) {
        existing.dropCount++;
        existing.totalAccumulatedValue = existing.dropCount * existing.cardValue;
        existing.lastDropTimestamp = event.timestamp;
        if (event.tierId) existing.tierId = event.tierId;
      } else {
        stats.set(event.cardName, {
          cardName: event.cardName,
          dropCount: 1,
          cardValue: event.cardValue,
          totalAccumulatedValue: event.cardValue,
          tierId: event.tierId,
          firstDropTimestamp: event.timestamp,
          lastDropTimestamp: event.timestamp
        });
      }
    }

    this.history.aggregatedStats = stats;
    this.state.entries = stats;
  }

  private filterAndSort(entries: ScoreboardEntry[]): ScoreboardEntry[] {
    // Filter by tier visibility
    let filtered = entries;
    if (!this.state.includeHiddenCards) {
      filtered = entries.filter(entry => {
        if (!entry.tierId) return true; // No tier = visible
        return tierStore.shouldDisplayCard(entry.cardName);
      });
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (this.state.sortColumn) {
        case 'name':
          comparison = a.cardName.localeCompare(b.cardName);
          break;
        case 'dropCount':
          comparison = a.dropCount - b.dropCount;
          break;
        case 'cardValue':
          comparison = a.cardValue - b.cardValue;
          break;
        case 'totalValue':
          comparison = a.totalAccumulatedValue - b.totalAccumulatedValue;
          break;
      }

      if (comparison === 0) {
        // Secondary sort by name
        comparison = a.cardName.localeCompare(b.cardName);
      }

      return this.state.sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }
}

export const scoreboardService = new ScoreboardService();
```

### Step 3: Create ScoreboardStore

Create `src/lib/stores/scoreboardStore.ts`:

```typescript
import { writable, derived } from 'svelte/store';
import { scoreboardService } from '../services/scoreboardService.js';
import type { ScoreboardEntry, ScoreboardState, SortColumn } from '../models/ScoreboardState.js';

interface ScoreboardStoreState {
  entries: ScoreboardEntry[];
  state: ScoreboardState;
}

function createScoreboardStore() {
  const { subscribe, set, update } = writable<ScoreboardStoreState>({
    entries: [],
    state: scoreboardService.getState()
  });

  return {
    subscribe,

    getEntries(): ScoreboardEntry[] {
      return scoreboardService.getEntries();
    },

    getState(): ScoreboardState {
      return scoreboardService.getState();
    },

    setSortColumn(column: SortColumn): void {
      scoreboardService.setSortColumn(column);
      this.refresh();
    },

    toggleSort(column: SortColumn): void {
      scoreboardService.toggleSort(column);
      this.refresh();
    },

    setIncludeHiddenCards(include: boolean): void {
      scoreboardService.setIncludeHiddenCards(include);
      this.refresh();
    },

    refresh(): void {
      update(() => ({
        entries: scoreboardService.getEntries(),
        state: scoreboardService.getState()
      }));
    },

    reset(): void {
      scoreboardService.reset();
      this.refresh();
    }
  };
}

export const scoreboardStore = createScoreboardStore();
```

### Step 4: Create Scoreboard Component

Create `src/lib/components/Scoreboard.svelte`:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { scoreboardStore } from '../stores/scoreboardStore.js';
  import type { ScoreboardEntry, SortColumn } from '../models/ScoreboardState.js';

  let entries: ScoreboardEntry[] = [];
  let includeHiddenCards = false;
  let sortColumn: SortColumn = 'cardValue';
  let sortOrder: 'asc' | 'desc' = 'desc';

  onMount(() => {
    refresh();
  });

  function refresh() {
    entries = scoreboardStore.getEntries();
    const state = scoreboardStore.getState();
    includeHiddenCards = state.includeHiddenCards;
    sortColumn = state.sortColumn;
    sortOrder = state.sortOrder;
  }

  function handleSortClick(column: SortColumn) {
    scoreboardStore.toggleSort(column);
    refresh();
  }

  function handleIncludeHiddenToggle() {
    scoreboardStore.setIncludeHiddenCards(!includeHiddenCards);
    refresh();
  }

  function getSortIcon(col: SortColumn): string {
    if (col !== sortColumn) return '↕';
    return sortOrder === 'asc' ? '↑' : '↓';
  }
</script>

<div class="scoreboard">
  <div class="scoreboard-header">
    <h2>Card Drop Scoreboard</h2>
    <label>
      <input
        type="checkbox"
        checked={includeHiddenCards}
        on:change={handleIncludeHiddenToggle}
      />
      Include hidden cards
    </label>
  </div>

  {#if entries.length === 0}
    <div class="empty-state">
      <p>No cards dropped in this session</p>
    </div>
  {:else}
    <table class="scoreboard-table">
      <thead>
        <tr>
          <th on:click={() => handleSortClick('name')}>
            Card Name {getSortIcon('name')}
          </th>
          <th on:click={() => handleSortClick('dropCount')}>
            Drops {getSortIcon('dropCount')}
          </th>
          <th on:click={() => handleSortClick('cardValue')}>
            Value {getSortIcon('cardValue')}
          </th>
          <th on:click={() => handleSortClick('totalValue')}>
            Total {getSortIcon('totalValue')}
          </th>
        </tr>
      </thead>
      <tbody>
        {#each entries as entry (entry.cardName)}
          <tr>
            <td>{entry.cardName}</td>
            <td>{entry.dropCount}</td>
            <td>{entry.cardValue}</td>
            <td>{entry.totalAccumulatedValue}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  .scoreboard {
    padding: 1rem;
  }

  .scoreboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .scoreboard-table {
    width: 100%;
    border-collapse: collapse;
  }

  .scoreboard-table th {
    cursor: pointer;
    padding: 0.5rem;
    text-align: left;
    border-bottom: 2px solid #ccc;
  }

  .scoreboard-table th:hover {
    background-color: #f0f0f0;
  }

  .scoreboard-table td {
    padding: 0.5rem;
    border-bottom: 1px solid #eee;
  }

  .empty-state {
    text-align: center;
    padding: 2rem;
    color: #666;
  }
</style>
```

### Step 5: Integrate with Card Drop Flow

Update the card drop handler in `src/routes/+page.svelte`:

```typescript
import { scoreboardService } from '$lib/services/scoreboardService.js';

async function handleOpenDeck() {
  try {
    const result = await gameStateService.openDeck();
    
    // Track drop in scoreboard
    scoreboardService.trackDrop(result);
    
    // Refresh scoreboard store if component is mounted
    scoreboardStore.refresh();
    
    // ... existing card display logic ...
  } catch (error) {
    // ... error handling ...
  }
}
```

### Step 6: Initialize Scoreboard on App Start

Update `src/routes/+layout.ts` or app initialization:

```typescript
import { scoreboardService } from '$lib/services/scoreboardService.js';

// Initialize scoreboard on app start
scoreboardService.initialize();
```

### Step 7: Add Scoreboard to UI

Add the Scoreboard component to your main page or create a dedicated route:

```svelte
<script lang="ts">
  import Scoreboard from '$lib/components/Scoreboard.svelte';
</script>

<Scoreboard />
```

## Testing

### Unit Tests

Create `tests/unit/services/scoreboardService.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { scoreboardService } from '$lib/services/scoreboardService';
import type { CardDrawResult } from '$lib/models/CardDrawResult';

describe('ScoreboardService', () => {
  beforeEach(() => {
    scoreboardService.reset();
  });

  it('should track card drops', () => {
    const result: CardDrawResult = {
      card: { name: 'Test Card', value: 100, weight: 1, qualityTier: 'common' },
      timestamp: Date.now(),
      scoreGained: 100
    };

    scoreboardService.trackDrop(result);
    const entries = scoreboardService.getEntries();

    expect(entries).toHaveLength(1);
    expect(entries[0].cardName).toBe('Test Card');
    expect(entries[0].dropCount).toBe(1);
    expect(entries[0].totalAccumulatedValue).toBe(100);
  });

  it('should aggregate multiple drops of same card', () => {
    const result: CardDrawResult = {
      card: { name: 'Test Card', value: 100, weight: 1, qualityTier: 'common' },
      timestamp: Date.now(),
      scoreGained: 100
    };

    scoreboardService.trackDrop(result);
    scoreboardService.trackDrop(result);
    scoreboardService.trackDrop(result);

    const entries = scoreboardService.getEntries();
    expect(entries[0].dropCount).toBe(3);
    expect(entries[0].totalAccumulatedValue).toBe(300);
  });

  it('should sort by card value descending by default', () => {
    // Add test cases for sorting
  });
});
```

## Key Integration Points

1. **Card Drop Tracking**: Call `scoreboardService.trackDrop(result)` after each card drop
2. **Tier Filter Integration**: Uses `tierStore.shouldDisplayCard()` for visibility filtering
3. **Reactive Updates**: ScoreboardStore provides reactive state for components
4. **Session Reset**: Call `scoreboardService.reset()` on app initialization

## Performance Considerations

- Map-based lookups for O(1) card access
- Memoized total value calculations
- Efficient array sorting (O(n log n) for 200 items)
- Debounce rapid card drops if needed

## Next Steps

1. Add styling to match game design system
2. Add keyboard navigation for accessibility
3. Add empty state messaging
4. Add loading states for large datasets
5. Add E2E tests for full user workflows








