<script lang="ts">
  /**
   * Scoreboard Component
   * 
   * Displays a table of card drop statistics for the current session.
   * Features:
   * - Real-time updates when cards are dropped
   * - Sortable columns (name, drop count, card value, total value)
   * - Tier-based filtering with option to include hidden cards
   * - Visual feedback for new entries (highlight animation)
   * - Keyboard accessible
   * 
   * @component
   */
  import { onMount } from 'svelte';
  import { scoreboardStore } from '../stores/scoreboardStore.js';
  import { tierStore } from '../stores/tierStore.js';
  import type { ScoreboardEntry, SortColumn } from '../models/ScoreboardState.js';

  let entries: ScoreboardEntry[] = [];
  let includeHiddenCards = false;
  let sortColumn: SortColumn = 'cardValue';
  let sortOrder: 'asc' | 'desc' = 'desc';
  let isLoading = false;
  let highlightedCard: string | null = null;
  let previousEntryCount = 0;
  let isCollapsed = false;

  onMount(() => {
    refresh();
  });

  function refresh() {
    isLoading = true;
    const newEntries = scoreboardStore.getEntries();
    const state = scoreboardStore.getState();
    
    // Detect new entries for highlighting
    if (newEntries.length > previousEntryCount && previousEntryCount > 0) {
      // Find the newest entry (last in array if sorted by timestamp, or check lastDropTimestamp)
      const newestEntry = newEntries.find(e => 
        !entries.some(old => old.cardName === e.cardName && old.dropCount === e.dropCount)
      );
      if (newestEntry) {
        highlightedCard = newestEntry.cardName;
        // Remove highlight after animation
        setTimeout(() => {
          highlightedCard = null;
        }, 2000);
      }
    }
    
    entries = newEntries;
    includeHiddenCards = state.includeHiddenCards;
    sortColumn = state.sortColumn;
    sortOrder = state.sortOrder;
    previousEntryCount = newEntries.length;
    isLoading = false;
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

  function formatNumber(value: number): string {
    return value.toFixed(2);
  }

  // Subscribe to scoreboard store changes
  scoreboardStore.subscribe(() => {
    refresh();
  });

  // Subscribe to tier store changes to refresh when tier visibility changes
  tierStore.subscribe(() => {
    // Refresh scoreboard when tier visibility might have changed
    refresh();
  });
</script>

<div class="scoreboard">
  <div class="scoreboard-header">
    <div class="header-left">
      <button
        class="collapse-button"
        on:click={() => isCollapsed = !isCollapsed}
        aria-label={isCollapsed ? 'Expand scoreboard' : 'Collapse scoreboard'}
        aria-expanded={!isCollapsed}
      >
        <span class="collapse-icon">{isCollapsed ? '▶' : '▼'}</span>
        <h2>Scoreboard</h2>
      </button>
    </div>
    {#if !isCollapsed}
      <label class="include-hidden-toggle">
        <input
          type="checkbox"
          checked={includeHiddenCards}
          on:change={handleIncludeHiddenToggle}
          aria-label="Include cards from disabled tiers"
        />
        Include hidden
      </label>
    {/if}
  </div>

  {#if !isCollapsed}
    {#if entries.length === 0}
    <div class="empty-state">
      <p>No cards dropped in this session</p>
    </div>
  {:else}
    <table class="scoreboard-table" role="table" aria-label="Card drop scoreboard">
      <thead>
        <tr>
          <th
            on:click={() => handleSortClick('name')}
            on:keydown={(e) => e.key === 'Enter' && handleSortClick('name')}
            tabindex="0"
            role="button"
            aria-label="Sort by card name"
            aria-sort={sortColumn === 'name' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
            class="col-name"
          >
            <span class="header-content">Card Name {getSortIcon('name')}</span>
          </th>
          <th
            on:click={() => handleSortClick('dropCount')}
            on:keydown={(e) => e.key === 'Enter' && handleSortClick('dropCount')}
            tabindex="0"
            role="button"
            aria-label="Sort by drop count"
            aria-sort={sortColumn === 'dropCount' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
            class="col-drops"
          >
            <span class="header-content">Drops {getSortIcon('dropCount')}</span>
          </th>
          <th
            on:click={() => handleSortClick('cardValue')}
            on:keydown={(e) => e.key === 'Enter' && handleSortClick('cardValue')}
            tabindex="0"
            role="button"
            aria-label="Sort by card value"
            aria-sort={sortColumn === 'cardValue' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
            class="col-value"
          >
            <span class="header-content">Value {getSortIcon('cardValue')}</span>
          </th>
          <th
            on:click={() => handleSortClick('totalValue')}
            on:keydown={(e) => e.key === 'Enter' && handleSortClick('totalValue')}
            tabindex="0"
            role="button"
            aria-label="Sort by total accumulated value"
            aria-sort={sortColumn === 'totalValue' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
            class="col-total"
          >
            <span class="header-content">Total {getSortIcon('totalValue')}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {#each entries as entry (entry.cardName)}
          <tr class:highlighted={highlightedCard === entry.cardName}>
            <td title={entry.cardName}>{entry.cardName}</td>
            <td>{entry.dropCount}</td>
            <td>{formatNumber(entry.cardValue)}</td>
            <td>{formatNumber(entry.totalAccumulatedValue)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    {/if}
  {/if}
</div>

<style>
  .scoreboard {
    padding: 0.75rem;
    background: var(--bg-color, #1a1a1a);
    border-radius: 8px;
    color: var(--text-color, #ffffff);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    border: 1px solid var(--border-color, #444);
  }

  .scoreboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .header-left {
    display: flex;
    align-items: center;
  }

  .collapse-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: transparent;
    border: none;
    color: var(--text-color, #ffffff);
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    margin: -0.25rem -0.5rem;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .collapse-button:hover {
    background-color: var(--header-hover, #333);
  }

  .collapse-button:focus {
    outline: 2px solid var(--focus-color, #4a9eff);
    outline-offset: 2px;
  }

  .collapse-icon {
    font-size: 0.7rem;
    color: var(--text-muted, #aaa);
    transition: transform 0.2s;
  }

  .scoreboard-header h2 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .include-hidden-toggle {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    cursor: pointer;
    font-size: 0.85rem;
  }

  .include-hidden-toggle input[type="checkbox"] {
    cursor: pointer;
    width: 14px;
    height: 14px;
  }

  .scoreboard-table {
    width: 100%;
    border-collapse: collapse;
    background: var(--table-bg, #2a2a2a);
    border-radius: 4px;
    overflow: hidden;
    font-size: 0.85rem;
    table-layout: fixed;
  }

  .scoreboard-table th {
    cursor: pointer;
    padding: 0.5rem 0.4rem;
    text-align: left;
    border-bottom: 2px solid var(--border-color, #444);
    background: var(--header-bg, #333);
    font-weight: 600;
    font-size: 0.8rem;
    user-select: none;
    transition: background-color 0.2s;
    white-space: nowrap;
    vertical-align: middle;
  }

  .scoreboard-table th:hover,
  .scoreboard-table th:focus {
    background-color: var(--header-hover, #444);
    outline: 2px solid var(--focus-color, #4a9eff);
    outline-offset: -2px;
  }

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.25rem;
    width: 100%;
  }

  /* Column-specific alignments */
  .col-name {
    text-align: left;
    width: 40%;
  }

  .col-drops {
    text-align: right;
    width: 15%;
  }

  .col-value {
    text-align: right;
    width: 20%;
  }

  .col-total {
    text-align: right;
    width: 25%;
    padding-right: 1rem; /* Extra padding to account for scrollbar */
  }

  .scoreboard-table td {
    padding: 0.5rem 0.4rem;
    border-bottom: 1px solid var(--border-color, #333);
    font-size: 0.85rem;
    vertical-align: middle;
  }

  /* Align table cells to match headers */
  .scoreboard-table tbody td:nth-child(1) {
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .scoreboard-table tbody td:nth-child(2),
  .scoreboard-table tbody td:nth-child(3) {
    text-align: right;
  }

  .scoreboard-table tbody td:nth-child(4) {
    text-align: right;
    padding-right: 1rem; /* Extra padding to account for scrollbar */
  }

  .scoreboard-table tbody tr:hover {
    background-color: var(--row-hover, #333);
  }

  .scoreboard-table tbody tr:last-child td {
    border-bottom: none;
  }

  .empty-state {
    text-align: center;
    padding: 2rem 1rem;
    color: var(--text-muted, #888);
  }

  .empty-state p {
    margin: 0;
    font-size: 0.9rem;
  }

  .scoreboard-table tbody tr.highlighted {
    background-color: var(--highlight-bg, #4a5568);
    animation: highlight-fade 2s ease-out;
  }

  @keyframes highlight-fade {
    0% {
      background-color: var(--highlight-start, #5a9eff);
    }
    100% {
      background-color: var(--highlight-bg, #4a5568);
    }
  }

  .scoreboard-table tbody tr.highlighted td {
    font-weight: 600;
  }

  /* Loading state */
  .scoreboard.loading {
    opacity: 0.7;
    pointer-events: none;
  }

  .scoreboard.loading::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 20px;
    height: 20px;
    margin: -10px 0 0 -10px;
    border: 2px solid var(--text-color, #ffffff);
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>

