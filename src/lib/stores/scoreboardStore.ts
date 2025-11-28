import { writable } from 'svelte/store';
import { scoreboardService } from '../services/scoreboardService.js';
import type { ScoreboardEntry, ScoreboardState, SortColumn } from '../models/ScoreboardState.js';

interface ScoreboardStoreState {
  entries: ScoreboardEntry[];
  state: ScoreboardState;
}

/**
 * Reactive Svelte store for scoreboard state management.
 */
function createScoreboardStore() {
  const { subscribe, set, update } = writable<ScoreboardStoreState>({
    entries: [],
    state: scoreboardService.getState()
  });

  return {
    subscribe,

    /**
     * Get current scoreboard entries (reactive).
     * Returns filtered and sorted entries.
     */
    getEntries(): ScoreboardEntry[] {
      return scoreboardService.getEntries();
    },

    /**
     * Get current scoreboard state (reactive).
     */
    getState(): ScoreboardState {
      return scoreboardService.getState();
    },

    /**
     * Set sort column (reactive).
     * Updates store and triggers reactive updates.
     * @param column - Column to sort by
     */
    setSortColumn(column: SortColumn): void {
      scoreboardService.setSortColumn(column);
      this.refresh();
    },

    /**
     * Toggle sort order for a column (reactive).
     * @param column - Column to sort by
     */
    toggleSort(column: SortColumn): void {
      scoreboardService.toggleSort(column);
      this.refresh();
    },

    /**
     * Set include hidden cards flag (reactive).
     * @param include - Whether to include hidden cards
     */
    setIncludeHiddenCards(include: boolean): void {
      scoreboardService.setIncludeHiddenCards(include);
      this.refresh();
    },

    /**
     * Refresh store from service state.
     * Call after service operations to update reactive state.
     */
    refresh(): void {
      update(() => ({
        entries: scoreboardService.getEntries(),
        state: scoreboardService.getState()
      }));
    },

    /**
     * Reset scoreboard (reactive).
     * Clears all data and resets to defaults.
     */
    reset(): void {
      scoreboardService.reset();
      this.refresh();
    }
  };
}

export const scoreboardStore = createScoreboardStore();

