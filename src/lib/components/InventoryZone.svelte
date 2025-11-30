<script lang="ts">
  import type { GameState } from '../models/GameState.js';
  import { resolvePath } from '../utils/paths.js';

  export let width: number;
  export let height: number;
  export let gameState: GameState;
  export let onDeckOpen: (() => void) | undefined = undefined;
  export let onAddDecks: (() => void) | undefined = undefined;
  export let onAddChaos: (() => void) | undefined = undefined;
  export let style: string = '';

  // Deck icon image URL
  const deckIconUrl = resolvePath('/images/Deck.webp');

  let isProcessing = false;
  let lastDeckOpenTime = 0;
  const MIN_CLICK_INTERVAL = 100; // Minimum 100ms between deck opens

  // Grid dimensions: 8 columns x 6 rows = 48 cells
  // If 6 rows doesn't fit, we'll adjust to 5 rows (40 cells)
  const GRID_COLS = 8;
  const GRID_ROWS = 6;
  const TOTAL_CELLS = GRID_COLS * GRID_ROWS;

  // Positions in grid (0-indexed)
  const OPEN_DECK_START = 0; // Top-left, single cell
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
    // Open Deck button is a single cell at position 0 (top-left)
    return cellIndex === OPEN_DECK_START;
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
              style="background-color: #2a2a2a !important; border: 1px solid #444 !important;"
              on:click={handleDeckOpen}
              on:keydown={(e) => handleKeyDown(e, 'open')}
              role="button"
              tabindex={isDisabled ? -1 : 0}
              aria-label="Open stacked deck"
              aria-disabled={isDisabled}
            >
              <div class="open-deck-content">
                <img src={deckIconUrl} alt="Deck" class="deck-icon" />
                <span class="deck-count-badge">{gameState?.decks || 0}</span>
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

  .inventory-grid .grid-cell.open-deck-button {
    background-color: #2a2a2a !important;
    background: #2a2a2a !important;
    border: 1px solid #444 !important;
    box-shadow: none !important;
    outline: none !important;
  }

  .inventory-grid .grid-cell.open-deck-button:hover {
    background-color: #2a2a2a !important;
    background: #2a2a2a !important;
    border: 1px solid #444 !important;
  }

  .inventory-grid .grid-cell.open-deck-button:active {
    background-color: #2a2a2a !important;
    background: #2a2a2a !important;
    border: 1px solid #444 !important;
  }

  .inventory-grid .grid-cell.open-deck-button:focus {
    background-color: #2a2a2a !important;
    background: #2a2a2a !important;
    border: 1px solid #444 !important;
    outline: none !important;
  }

  .open-deck-button {
    cursor: pointer;
    background-color: #2a2a2a !important;
    background: #2a2a2a !important;
    border: 1px solid #444 !important;
    box-shadow: none !important;
  }

  .open-deck-button:hover:not(.disabled) {
    transform: scale(1.05);
    z-index: 10;
  }

  .open-deck-button:active:not(.disabled) {
    transform: scale(0.95);
  }

  .open-deck-button:focus {
    outline: none;
    z-index: 10;
  }

  .open-deck-button.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .open-deck-button.disabled:hover {
    transform: none;
  }

  .open-deck-content {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    position: relative;
    background: transparent;
  }

  .deck-icon {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .deck-count-badge {
    position: absolute;
    top: 0.25rem;
    left: 0.25rem;
    background-color: transparent;
    color: #fff;
    font-size: 0.75rem;
    font-weight: bold;
    padding: 0;
    border: none;
    z-index: 1;
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
