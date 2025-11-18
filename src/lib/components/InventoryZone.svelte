<script lang="ts">
  import type { GameState } from '../models/GameState.js';

  export let width: number;
  export let height: number;
  export let gameState: GameState;
  export let onDeckOpen: (() => void) | undefined = undefined;
  export let onAddDecks: (() => void) | undefined = undefined;
  export let onAddChaos: (() => void) | undefined = undefined;
  export let style: string = '';

  let isProcessing = false;
  let lastDeckOpenTime = 0;
  const MIN_CLICK_INTERVAL = 100; // Minimum 100ms between deck opens

  // Grid dimensions: 8 columns x 6 rows = 48 cells
  // If 6 rows doesn't fit, we'll adjust to 5 rows (40 cells)
  const GRID_COLS = 8;
  const GRID_ROWS = 6;
  const TOTAL_CELLS = GRID_COLS * GRID_ROWS;

  // Positions in grid (0-indexed)
  const OPEN_DECK_START = 0; // Top-left, spans 2x2
  const ADD_DECKS_POS = 7; // Top-right, single cell (row 0, col 7)
  const ADD_CHAOS_POS = 15; // Below Add Decks, single cell (row 1, col 7)

  function handleDeckOpen(event: MouseEvent | KeyboardEvent) {
    // Prevent rapid clicking/race conditions
    const now = Date.now();
    if (isProcessing || (now - lastDeckOpenTime) < MIN_CLICK_INTERVAL) {
      return;
    }
    
    if (!gameState || gameState.decks <= 0) {
      return;
    }
    
    isProcessing = true;
    lastDeckOpenTime = now;
    
    if (onDeckOpen) {
      try {
        onDeckOpen();
      } catch (error) {
        console.error('Error opening deck:', error);
      } finally {
        setTimeout(() => {
          isProcessing = false;
        }, MIN_CLICK_INTERVAL);
      }
    } else {
      isProcessing = false;
    }
  }

  function handleAddDecks() {
    if (onAddDecks) {
      onAddDecks();
    }
  }

  function handleAddChaos() {
    if (onAddChaos) {
      onAddChaos();
    }
  }

  function handleKeyDown(event: KeyboardEvent, action: 'open' | 'addDecks' | 'addChaos') {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (action === 'open') {
        handleDeckOpen(event);
      } else if (action === 'addDecks') {
        handleAddDecks();
      } else if (action === 'addChaos') {
        handleAddChaos();
      }
    }
  }

  function getCellRow(cellIndex: number): number {
    return Math.floor(cellIndex / GRID_COLS);
  }

  function getCellCol(cellIndex: number): number {
    return cellIndex % GRID_COLS;
  }

  function isOpenDeckCell(cellIndex: number): boolean {
    // Open Deck button spans cells 0, 1, 8, 9 (2x2 in top-left)
    const row = getCellRow(cellIndex);
    const col = getCellCol(cellIndex);
    return row < 2 && col < 2;
  }

  function isAddDecksCell(cellIndex: number): boolean {
    return cellIndex === ADD_DECKS_POS;
  }

  function isAddChaosCell(cellIndex: number): boolean {
    return cellIndex === ADD_CHAOS_POS;
  }

  function shouldRenderCell(cellIndex: number): boolean {
    // Only render if it's the start of a multi-cell element or a single-cell element
    if (isOpenDeckCell(cellIndex)) {
      return cellIndex === OPEN_DECK_START; // Only render at start position
    }
    if (isAddDecksCell(cellIndex)) {
      return true; // Always render
    }
    if (isAddChaosCell(cellIndex)) {
      return true; // Always render
    }
    // For empty cells, check if they're not part of the Open Deck button
    return !isOpenDeckCell(cellIndex);
  }
</script>

<div
  class="inventory-zone"
  style={style || `width: ${width}px; height: ${height}px;`}
  role="region"
  aria-label="Inventory zone for deck opening"
>
  <div class="zone-content">
    <div class="inventory-grid">
      {#each Array(TOTAL_CELLS) as _, cellIndex}
        {@const isOpenDeck = isOpenDeckCell(cellIndex)}
        {@const isAddDecks = isAddDecksCell(cellIndex)}
        {@const isAddChaos = isAddChaosCell(cellIndex)}
        {@const isDisabled = (isOpenDeck && (!gameState || gameState.decks <= 0 || isProcessing))}
        {@const shouldRender = shouldRenderCell(cellIndex)}
        
        {#if shouldRender}
          {#if isOpenDeck && cellIndex === OPEN_DECK_START}
            <!-- Open Deck Button (2x2, starting at cell 0) -->
            <div
              class="grid-cell open-deck-button"
              class:disabled={isDisabled}
              style="grid-column: span 2; grid-row: span 2;"
              on:click={handleDeckOpen}
              on:keydown={(e) => handleKeyDown(e, 'open')}
              role="button"
              tabindex={isDisabled ? -1 : 0}
              aria-label="Open stacked deck"
              aria-disabled={isDisabled}
            >
              <div class="open-deck-content">
                <h3>Open Deck</h3>
                <p class="deck-count">Decks: {gameState?.decks || 0}</p>
                {#if !gameState || gameState.decks <= 0}
                  <p class="no-decks" role="alert">No decks</p>
                {:else if isProcessing}
                  <p class="processing" role="status">Opening...</p>
                {/if}
              </div>
            </div>
          {:else if isAddDecks}
            <!-- Add 10 Decks Button (1x1, top-right) -->
            <div
              class="grid-cell add-decks-button"
              on:click={handleAddDecks}
              on:keydown={(e) => handleKeyDown(e, 'addDecks')}
              role="button"
              tabindex="0"
              aria-label="Add 10 Decks (Debug Only)"
            >
              <span class="add-decks-label">Add 10 Decks (Debug Only)</span>
            </div>
          {:else if isAddChaos}
            <!-- Add 10 Chaos Button (1x1, below Add Decks) -->
            <div
              class="grid-cell add-chaos-button"
              on:click={handleAddChaos}
              on:keydown={(e) => handleKeyDown(e, 'addChaos')}
              role="button"
              tabindex="0"
              aria-label="Add 10 Chaos (Debug Only)"
            >
              <span class="add-chaos-label">Add 10 Chaos (Debug Only)</span>
            </div>
          {:else}
            <!-- Empty cell -->
            <div class="grid-cell empty"></div>
          {/if}
        {/if}
      {/each}
    </div>
  </div>
</div>

<style>
  .inventory-zone {
    position: relative;
    overflow: hidden;
    background-color: #1a3a1a;
    border: 2px solid #4caf50;
    padding: 0.25rem;
    display: flex;
    flex-direction: column;
    transition: border-color 0.2s;
    box-sizing: border-box;
  }

  .inventory-zone:hover {
    border-color: #555;
  }

  .inventory-zone:focus-within {
    border-color: #4caf50;
    outline: 2px solid #4caf50;
    outline-offset: -2px;
  }

  .zone-content {
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .inventory-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    grid-template-rows: repeat(6, 1fr);
    gap: 0;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    border-collapse: collapse;
  }

  @media (max-height: 500px) {
    .inventory-grid {
      grid-template-rows: repeat(5, 1fr);
    }
  }

  .grid-cell {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #2a2a2a;
    border: 1px solid #444;
    position: relative;
    cursor: default;
    transition: all 0.2s;
    min-width: 0;
    min-height: 0;
    box-sizing: border-box;
  }

  .grid-cell.empty {
    background-color: #1a1a1a;
    border-color: #333;
  }

  .open-deck-button {
    cursor: pointer;
    background-color: #2a3a2a;
    border-color: #4caf50;
    border-width: 2px;
  }

  .open-deck-button:hover:not(.disabled) {
    background-color: #3a4a3a;
    border-color: #5cbf60;
    transform: scale(1.02);
    z-index: 10;
  }

  .open-deck-button:active:not(.disabled) {
    transform: scale(0.98);
  }

  .open-deck-button:focus {
    outline: 2px solid #4caf50;
    outline-offset: -2px;
    z-index: 10;
  }

  .open-deck-button.disabled {
    opacity: 0.6;
    cursor: not-allowed;
    border-color: #666;
  }

  .open-deck-button.disabled:hover {
    background-color: #2a3a2a;
    transform: none;
  }

  .open-deck-content {
    text-align: center;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
  }

  .open-deck-content h3 {
    margin: 0 0 0.25rem 0;
    font-size: 0.9rem;
    color: #4caf50;
    font-weight: bold;
  }

  .deck-count {
    margin: 0.125rem 0;
    font-size: 0.75rem;
    color: #fff;
  }

  .no-decks {
    margin: 0.125rem 0 0 0;
    font-size: 0.65rem;
    color: #888;
  }

  .processing {
    margin: 0.125rem 0 0 0;
    font-size: 0.65rem;
    color: #4caf50;
    font-weight: bold;
  }

  .add-decks-button {
    cursor: pointer;
    background-color: #3a2a2a;
    border-color: #ffa500;
    border-width: 2px;
  }

  .add-decks-button:hover {
    background-color: #4a3a3a;
    border-color: #ffb500;
    transform: scale(1.05);
    z-index: 10;
  }

  .add-decks-button:focus {
    outline: 2px solid #ffa500;
    outline-offset: -2px;
    z-index: 10;
  }

  .add-decks-label {
    font-size: 0.65rem;
    color: #ffa500;
    text-align: center;
    padding: 0.125rem;
    line-height: 1.2;
    word-wrap: break-word;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }

  .add-chaos-button {
    cursor: pointer;
    background-color: #2a3a2a;
    border-color: #4caf50;
    border-width: 2px;
  }

  .add-chaos-button:hover {
    background-color: #3a4a3a;
    border-color: #5cbf60;
    transform: scale(1.05);
    z-index: 10;
  }

  .add-chaos-button:focus {
    outline: 2px solid #4caf50;
    outline-offset: -2px;
    z-index: 10;
  }

  .add-chaos-label {
    font-size: 0.65rem;
    color: #4caf50;
    text-align: center;
    padding: 0.125rem;
    line-height: 1.2;
    word-wrap: break-word;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }
</style>
