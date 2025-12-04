<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { GameState } from '../models/GameState.js';
  import { resolvePath } from '../utils/paths.js';
  import { gameStateService } from '../services/gameStateService.js';
  import { gameModeService } from '../services/gameModeService.js';
  import { InsufficientResourcesError, ERROR_MESSAGES } from '../utils/errors.js';
  import { formatNumber } from '../utils/numberFormat.js';

  export let width: number;
  export let height: number;
  export let gameState: GameState;
  export let onDeckOpen: (() => void) | undefined = undefined;
  export let style: string = '';

  // Deck icon image URL
  const deckIconUrl = resolvePath('/images/Deck.webp');

  let isProcessing = false;
  let lastDeckOpenTime = 0;
  const MIN_CLICK_INTERVAL = 100; // Minimum 100ms between deck opens
  
  // Hold-to-repeat state
  let holdTimeout: ReturnType<typeof setTimeout> | null = null;
  let repeatInterval: ReturnType<typeof setInterval> | null = null;
  let mouseDownTime = 0; // Track when mousedown happened to prevent double-triggering
  let HOLD_DEBOUNCE_DELAY = 1000; // 1 second debounce before starting repeat (configurable)
  let REPEAT_INTERVAL = 500; // 0.5 seconds between deck opens (configurable)
  const CLICK_IGNORE_WINDOW = 200; // Ignore click events within 200ms of mousedown

  // Grid dimensions: 8 columns x 6 rows = 48 cells
  // If 6 rows doesn't fit, we'll adjust to 5 rows (40 cells)
  const GRID_COLS = 8;
  const GRID_ROWS = 6;
  const TOTAL_CELLS = GRID_COLS * GRID_ROWS;

  // Positions in grid (0-indexed)
  const OPEN_DECK_START = 0; // Top-left, single cell
  const PURCHASE_DECKS_POS = 1; // Next to open deck button

  // Check if infinite decks is enabled
  let infiniteDecksEnabled = false;
  
  // Deck purchase state (for Ruthless mode)
  let purchaseError: string | null = null;
  let isPurchasing = false;
  const DECK_PURCHASE_COST = 10; // 10 chaos per deck
  const DECK_PURCHASE_COUNT = 1; // Buy 1 deck at a time
  
  // Check if current mode is Ruthless
  $: isRuthlessMode = gameModeService.getCurrentMode()?.id === 'ruthless';
  $: canPurchaseDecks = isRuthlessMode && gameState && gameState.score >= DECK_PURCHASE_COST;
  
  // Update infinite decks state
  function updateInfiniteDecksState() {
    if (typeof window !== 'undefined') {
      infiniteDecksEnabled = localStorage.getItem('infiniteDecksEnabled') === 'true';
    }
  }
  
  // Load hold-to-repeat settings from localStorage
  function loadHoldToRepeatSettings() {
    if (typeof window !== 'undefined') {
      const savedFrequency = localStorage.getItem('debugDropFrequency');
      const savedDelay = localStorage.getItem('debugStartingDelay');
      
      if (savedFrequency !== null) {
        REPEAT_INTERVAL = parseInt(savedFrequency, 10);
      }
      if (savedDelay !== null) {
        HOLD_DEBOUNCE_DELAY = parseInt(savedDelay, 10);
      }
    }
  }

  // Check on mount and listen for changes
  onMount(() => {
    updateInfiniteDecksState();
    loadHoldToRepeatSettings();
    
    // Listen for custom event from debug menu
    const handleInfiniteDecksChanged = (event: CustomEvent) => {
      infiniteDecksEnabled = event.detail.enabled;
    };
    
    // Listen for hold-to-repeat settings changes
    const handleHoldToRepeatSettingsChanged = (event: CustomEvent) => {
      if (event.detail.dropFrequency !== undefined) {
        REPEAT_INTERVAL = event.detail.dropFrequency;
      }
      if (event.detail.startingDelay !== undefined) {
        HOLD_DEBOUNCE_DELAY = event.detail.startingDelay;
      }
      // If auto-repeat is currently active, restart it with new settings
      if (repeatInterval) {
        stopAutoRepeat();
        // Restart with new settings if still holding (this would require tracking hold state)
        // For simplicity, we'll just update the values and let the next hold restart
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('infiniteDecksChanged', handleInfiniteDecksChanged as EventListener);
      window.addEventListener('holdToRepeatSettingsChanged', handleHoldToRepeatSettingsChanged as EventListener);
      
      // Also poll as fallback (in case event doesn't fire)
      const storageCheckInterval = window.setInterval(() => {
        updateInfiniteDecksState();
        loadHoldToRepeatSettings();
      }, 200);
      
      return () => {
        window.removeEventListener('infiniteDecksChanged', handleInfiniteDecksChanged as EventListener);
        window.removeEventListener('holdToRepeatSettingsChanged', handleHoldToRepeatSettingsChanged as EventListener);
        window.clearInterval(storageCheckInterval);
        // Clean up any pending timers
        stopAutoRepeat();
      };
    }
  });
  
  // Clean up timers on destroy
  onDestroy(() => {
    stopAutoRepeat();
  });

  function handleDeckOpen(event: MouseEvent | KeyboardEvent) {
    // If this is a click event that happened shortly after mousedown, ignore it (already handled by mousedown)
    const now = Date.now();
    if (event.type === 'click' && mouseDownTime > 0 && (now - mouseDownTime) < CLICK_IGNORE_WINDOW) {
      mouseDownTime = 0; // Reset after ignoring
      return;
    }
    
    // Check if this is an auto-repeat call (from interval)
    const isAutoRepeat = repeatInterval !== null;
    
    // For auto-repeat calls, use REPEAT_INTERVAL as the minimum interval
    // For manual clicks, use MIN_CLICK_INTERVAL
    const minInterval = isAutoRepeat ? Math.max(10, REPEAT_INTERVAL - 10) : MIN_CLICK_INTERVAL;
    
    // Prevent rapid clicking/race conditions
    // For auto-repeat, only check if we're processing (allow faster than MIN_CLICK_INTERVAL)
    if (isAutoRepeat) {
      if (isProcessing) {
        return;
      }
    } else {
      if (isProcessing || (now - lastDeckOpenTime) < minInterval) {
        return;
      }
    }
    
    // Check deck count only if infinite decks is disabled
    if (!infiniteDecksEnabled && (!gameState || gameState.decks <= 0)) {
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
        // For auto-repeat, use a very short processing time since interval controls timing
        // For manual clicks, use MIN_CLICK_INTERVAL
        const processingTime = isAutoRepeat ? Math.min(50, Math.max(10, REPEAT_INTERVAL * 0.8)) : MIN_CLICK_INTERVAL;
        setTimeout(() => {
          isProcessing = false;
        }, processingTime);
      }
    } else {
      isProcessing = false;
    }
  }
  
  function stopAutoRepeat() {
    if (holdTimeout) {
      clearTimeout(holdTimeout);
      holdTimeout = null;
    }
    if (repeatInterval) {
      clearInterval(repeatInterval);
      repeatInterval = null;
    }
    // Reset mouseDownTime after a delay to allow click event to check it
    setTimeout(() => {
      mouseDownTime = 0;
    }, CLICK_IGNORE_WINDOW);
  }
  
  function handleMouseDown(event: MouseEvent) {
    // Only handle left mouse button
    if (event.button !== 0) {
      return;
    }
    
    // Check if button is disabled
    const isDisabled = !infiniteDecksEnabled && (!gameState || gameState.decks <= 0) || isProcessing;
    if (isDisabled) {
      return;
    }
    
    // Stop any existing auto-repeat
    stopAutoRepeat();
    
    // Record when mousedown happened
    mouseDownTime = Date.now();
    
    // Trigger initial click immediately
    handleDeckOpen(event);
    
    // Set up debounced auto-repeat
    holdTimeout = setTimeout(() => {
      holdTimeout = null;
      
      // Check if still enabled before starting repeat
      const stillEnabled = infiniteDecksEnabled || (gameState && gameState.decks > 0);
      if (!stillEnabled) {
        mouseDownTime = 0;
        return;
      }
      
      // Start repeating every 0.5 seconds
      repeatInterval = setInterval(() => {
        // Check if still enabled before each repeat
        const stillEnabled = infiniteDecksEnabled || (gameState && gameState.decks > 0);
        if (!stillEnabled || isProcessing) {
          stopAutoRepeat();
          return;
        }
        
        // Create a synthetic event for the repeat call
        const syntheticEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
        handleDeckOpen(syntheticEvent);
      }, REPEAT_INTERVAL);
    }, HOLD_DEBOUNCE_DELAY);
  }
  
  function handleMouseUp(event: MouseEvent) {
    // Only handle left mouse button
    if (event.button !== 0) {
      return;
    }
    
    stopAutoRepeat();
  }
  
  function handleMouseLeave() {
    stopAutoRepeat();
  }

  async function handlePurchaseDecks() {
    if (isPurchasing || !canPurchaseDecks) {
      return;
    }

    isPurchasing = true;
    purchaseError = null;

    try {
      await gameStateService.purchaseDecks(DECK_PURCHASE_COST, DECK_PURCHASE_COUNT);
    } catch (error) {
      if (error instanceof InsufficientResourcesError) {
        purchaseError = error.message;
      } else {
        purchaseError = 'Failed to purchase decks.';
        console.error('Deck purchase error:', error);
      }
    } finally {
      isPurchasing = false;
    }
  }

  function handleKeyDown(event: KeyboardEvent, action: 'open' | 'purchase') {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (action === 'open') {
        handleDeckOpen(event);
      } else if (action === 'purchase') {
        handlePurchaseDecks();
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

  function isPurchaseDecksCell(cellIndex: number): boolean {
    // Purchase Decks button is at position 1 (next to open deck), only in Ruthless mode
    return isRuthlessMode && cellIndex === PURCHASE_DECKS_POS;
  }

  function shouldRenderCell(cellIndex: number): boolean {
    // Only render if it's the start of a multi-cell element or a single-cell element
    if (isOpenDeckCell(cellIndex)) {
      return cellIndex === OPEN_DECK_START; // Only render at start position
    }
    if (isPurchaseDecksCell(cellIndex)) {
      return cellIndex === PURCHASE_DECKS_POS; // Only render at purchase position
    }
    // For empty cells, check if they're not part of any button
    return !isOpenDeckCell(cellIndex) && !isPurchaseDecksCell(cellIndex);
  }
</script>

<div
  class="inventory-zone"
  style={style || `width: ${width}px; height: ${height}px;`}
  role="region"
  aria-label="Inventory zone for deck opening"
>
  <div class="zone-content">
    {#if purchaseError}
      <div class="purchase-error" role="alert">
        {purchaseError}
      </div>
    {/if}
    <div class="inventory-grid">
      {#each Array(TOTAL_CELLS) as _, cellIndex}
        {@const isOpenDeck = isOpenDeckCell(cellIndex)}
        {@const isPurchaseDecks = isPurchaseDecksCell(cellIndex)}
        {@const isDisabled = (isOpenDeck && (!infiniteDecksEnabled && (!gameState || gameState.decks <= 0) || isProcessing))}
        {@const purchaseDisabled = (isPurchaseDecks && (!canPurchaseDecks || isPurchasing))}
        {@const shouldRender = shouldRenderCell(cellIndex)}
        
        {#if shouldRender}
          {#if isOpenDeck && cellIndex === OPEN_DECK_START}
            <!-- Open Deck Button (2x2, starting at cell 0) -->
            <div
              class="grid-cell open-deck-button"
              class:disabled={isDisabled}
              style="background-color: #2a2a2a !important; border: 1px solid #444 !important;"
              on:click={handleDeckOpen}
              on:mousedown={handleMouseDown}
              on:mouseup={handleMouseUp}
              on:mouseleave={handleMouseLeave}
              on:keydown={(e) => handleKeyDown(e, 'open')}
              role="button"
              tabindex={isDisabled ? -1 : 0}
              aria-label="Open stacked deck"
              aria-disabled={isDisabled}
            >
              <div class="open-deck-content">
                <img src={deckIconUrl} alt="Deck" class="deck-icon" />
                <span class="deck-count-badge">{infiniteDecksEnabled ? '∞' : (gameState?.decks || 0)}</span>
              </div>
            </div>
          {:else if isPurchaseDecks && cellIndex === PURCHASE_DECKS_POS}
            <!-- Purchase Decks Button (Ruthless mode only) -->
            <div
              class="grid-cell purchase-decks-button"
              class:disabled={purchaseDisabled}
              style="background-color: #3a2a1a !important; border: 1px solid #666 !important;"
              on:click={handlePurchaseDecks}
              on:keydown={(e) => handleKeyDown(e, 'purchase')}
              role="button"
              tabindex={purchaseDisabled ? -1 : 0}
              aria-label="Purchase deck for {DECK_PURCHASE_COST} chaos"
              aria-disabled={purchaseDisabled}
            >
              <div class="purchase-decks-content">
                <span class="purchase-icon">💰</span>
                <span class="purchase-label">Buy Deck</span>
                <span class="purchase-cost">{DECK_PURCHASE_COST} Chaos</span>
              </div>
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

  .purchase-error {
    background-color: rgba(220, 53, 69, 0.2);
    color: #ff6b6b;
    padding: 0.5rem;
    border-radius: 4px;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    text-align: center;
  }

  .purchase-decks-button {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.1s;
    user-select: none;
  }

  .purchase-decks-button:hover:not(.disabled) {
    background-color: #4a3a2a !important;
    transform: scale(1.02);
  }

  .purchase-decks-button:focus:not(.disabled) {
    outline: 2px solid #4a9eff;
    outline-offset: -2px;
  }

  .purchase-decks-button.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .purchase-decks-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    width: 100%;
    height: 100%;
    padding: 0.5rem;
  }

  .purchase-icon {
    font-size: 1.5rem;
  }

  .purchase-label {
    font-size: 0.75rem;
    font-weight: bold;
    color: #fff;
  }

  .purchase-cost {
    font-size: 0.7rem;
    color: #ffd700;
    font-weight: bold;
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
