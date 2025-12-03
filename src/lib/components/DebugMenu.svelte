<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { gameStateService } from '../services/gameStateService.js';
  import { upgradeService } from '../services/upgradeService.js';
  import type { GameState } from '../models/GameState.js';

  export let gameState: GameState | null = null;

  let isOpen = false;
  // Initialize as false for SSR safety, will be updated in onMount
  let isVisible = false;
  let triggerButton: HTMLButtonElement | null = null;
  let closeButton: HTMLButtonElement | null = null;
  let firstFocusableElement: HTMLElement | null = null;

  // Error messages per section
  let resourcesError: string | null = null;
  let upgradesError: string | null = null;

  // Resources section handlers
  async function handleAddChaos() {
    try {
      resourcesError = null;
      await gameStateService.addChaos(10);
    } catch (error) {
      resourcesError = error instanceof Error ? error.message : 'Failed to add chaos';
      console.error('Add chaos error:', error);
    }
  }

  async function handleAddDecks() {
    try {
      resourcesError = null;
      await gameStateService.addDecks(10);
    } catch (error) {
      resourcesError = error instanceof Error ? error.message : 'Failed to add decks';
      console.error('Add decks error:', error);
    }
  }

  // Infinite decks toggle state
  let infiniteDecksEnabled: boolean = false;

  function toggleInfiniteDecks() {
    infiniteDecksEnabled = !infiniteDecksEnabled;
    gameStateService.setInfiniteDecks(infiniteDecksEnabled);
    
    // Dispatch custom event to notify other components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('infiniteDecksChanged', { 
        detail: { enabled: infiniteDecksEnabled } 
      }));
    }
  }

  // Upgrades section state
  let raritySliderValue: number = 0;
  let isDraggingRaritySlider: boolean = false;
  let luckyDropSliderValue: number = 0;
  let isDraggingLuckyDropSlider: boolean = false;

  // Create upgrade map for quick lookup
  $: upgradeMap = gameState && gameState.upgrades
    ? new Map(upgradeService.getAvailableUpgrades(gameState.upgrades).map(upgrade => [upgrade.type, upgrade]))
    : new Map();

  // Get current rarity percentage (custom or calculated from level)
  $: rarityUpgrade = gameState && upgradeMap ? upgradeMap.get('improvedRarity') : null;
  $: currentRarityPercentage = gameState?.customRarityPercentage ?? (rarityUpgrade ? rarityUpgrade.level * 10 : 0);

  // Get current lucky drop level
  $: luckyDropUpgrade = gameState && upgradeMap ? upgradeMap.get('luckyDrop') : null;
  $: currentLuckyDropLevel = luckyDropUpgrade?.level ?? 0;

  // Update slider values when gameState changes (only if not dragging)
  $: if (!isDraggingLuckyDropSlider && currentLuckyDropLevel !== undefined) {
    luckyDropSliderValue = currentLuckyDropLevel;
  }

  $: if (!isDraggingRaritySlider && currentRarityPercentage !== undefined) {
    raritySliderValue = currentRarityPercentage;
  }


  async function handleRaritySliderChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const newValue = parseFloat(target.value);
    isDraggingRaritySlider = true;
    raritySliderValue = newValue;
    
    try {
      upgradesError = null;
      // Always allow setting rarity percentage in debug menu (independent of upgrade purchase)
      await gameStateService.setCustomRarityPercentage(newValue, true);
    } catch (error) {
      upgradesError = error instanceof Error ? error.message : 'Failed to update rarity percentage';
      console.error('Failed to update rarity percentage:', error);
    } finally {
      setTimeout(() => {
        isDraggingRaritySlider = false;
      }, 100);
    }
  }

  function handleRaritySliderInput(event: Event) {
    const target = event.target as HTMLInputElement;
    raritySliderValue = parseFloat(target.value);
  }

  async function handleLuckyDropSliderChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const newValue = parseInt(target.value, 10);
    isDraggingLuckyDropSlider = true;
    luckyDropSliderValue = newValue;
    
    try {
      upgradesError = null;
      await gameStateService.setLuckyDropLevel(newValue);
    } catch (error) {
      upgradesError = error instanceof Error ? error.message : 'Failed to update lucky drop level';
      console.error('Failed to update lucky drop level:', error);
    } finally {
      setTimeout(() => {
        isDraggingLuckyDropSlider = false;
      }, 100);
    }
  }

  function handleLuckyDropSliderInput(event: Event) {
    const target = event.target as HTMLInputElement;
    luckyDropSliderValue = parseInt(target.value, 10);
  }


  // Global keyboard handler for F12
  function handleGlobalKeyDown(event: KeyboardEvent) {
    // Only handle F12 when not in input field
    if (
      event.key === 'F12' &&
      event.target instanceof HTMLElement &&
      event.target.tagName !== 'INPUT' &&
      event.target.tagName !== 'TEXTAREA'
    ) {
      event.preventDefault();
      if (isVisible) {
        toggle();
      }
    }
  }

  function toggle() {
    // Defensive check: don't toggle if not visible or not in browser
    if (!isVisible || typeof document === 'undefined') return;
    isOpen = !isOpen;
    // Focus management
    if (isOpen) {
      setTimeout(() => {
        if (firstFocusableElement) {
          firstFocusableElement.focus();
        }
      }, 0);
    } else {
      setTimeout(() => {
        if (triggerButton) {
          triggerButton.focus();
        }
      }, 0);
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && isOpen) {
      toggle();
    }
  }

  // Focus trap: prevent tabbing outside panel when open
  function handleFocusTrap(event: KeyboardEvent) {
    if (!isOpen || event.key !== 'Tab' || typeof document === 'undefined') return;

    const focusableElements = Array.from(
      document.querySelectorAll<HTMLElement>(
        '.debug-panel button, .debug-panel input, .debug-panel [tabindex]:not([tabindex="-1"])'
      )
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift+Tab: if focused on first element, move to last
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: if focused on last element, move to first
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  onMount(() => {
    // Set visibility based on environment flag (client-side only)
    if (typeof window !== 'undefined') {
      // Check for VITE_DEBUG_MENU_ENABLED environment variable
      const debugMenuEnabled = import.meta.env.VITE_DEBUG_MENU_ENABLED === 'true';
      isVisible = debugMenuEnabled;
      
      // Debug log to verify visibility
      console.log('DebugMenu visibility:', { debugMenuEnabled, isVisible });
      
      // Initialize infinite decks from service
      infiniteDecksEnabled = gameStateService.isInfiniteDecksEnabled();
    }
    
    // Add event listener for F12 shortcut
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleGlobalKeyDown);
    }
  });

  onDestroy(() => {
    // Remove event listener
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    }
  });

  // Update first focusable element when panel opens
  $: if (isOpen && typeof document !== 'undefined') {
    setTimeout(() => {
      const focusable = document.querySelector<HTMLElement>(
        '.debug-panel button, .debug-panel input, .debug-panel [tabindex]:not([tabindex="-1"])'
      );
      firstFocusableElement = focusable;
    }, 0);
  }
</script>

{#if isVisible}
  <div class="debug-panel-container" class:open={isOpen}>
    <!-- Vertical Panel -->
    <div
      id="debug-panel"
      class="debug-panel"
      role="complementary"
      aria-labelledby="debug-menu-title"
      aria-describedby="debug-menu-description"
      tabindex="-1"
      on:keydown={handleKeyDown}
      on:keydown={handleFocusTrap}
    >
      <div class="panel-header">
        <button
          bind:this={triggerButton}
          class="panel-toggle"
          on:click={toggle}
          type="button"
          aria-label={isOpen ? "Collapse debug menu" : "Expand debug menu"}
          aria-expanded={isOpen}
          title={isOpen ? "Collapse debug menu" : "Expand debug menu"}
        >
          <span class="toggle-icon" aria-hidden="true">{isOpen ? '▼' : '▶'}</span>
          <h2 id="debug-menu-title">Debug Menu</h2>
        </button>
      </div>
      {#if isOpen}
        <div class="panel-body">
        <p id="debug-menu-description" class="description-text">Developer tools for testing and debugging</p>

        <!-- Resources Section -->
        <div class="debug-section">
          <h3 class="section-header">Resources</h3>
          {#if resourcesError}
            <div class="error-message" role="alert">
              {resourcesError}
            </div>
          {/if}
          <div class="debug-tools-grid">
            <button
              class="debug-tool-button"
              on:click={handleAddChaos}
              type="button"
              aria-label="Add 10 Chaos"
              disabled={false}
            >
              Add 10 Chaos
            </button>
            <button
              class="debug-tool-button"
              on:click={handleAddDecks}
              type="button"
              aria-label="Add 10 Decks"
              disabled={false}
            >
              Add 10 Decks
            </button>
            <button
              class="debug-tool-button debug-toggle"
              class:active={infiniteDecksEnabled}
              on:click={toggleInfiniteDecks}
              type="button"
              aria-label={infiniteDecksEnabled ? "Disable infinite decks" : "Enable infinite decks"}
              aria-pressed={infiniteDecksEnabled}
              title={infiniteDecksEnabled ? "Disable infinite decks" : "Enable infinite decks"}
            >
              {infiniteDecksEnabled ? '∞ Decks: ON' : '∞ Decks: OFF'}
            </button>
          </div>
        </div>

        <!-- Upgrades Section -->
        <div class="debug-section">
          <h3 class="section-header">Upgrades</h3>
          {#if upgradesError}
            <div class="error-message" role="alert">
              {upgradesError}
            </div>
          {/if}

          <!-- Rarity Slider -->
          <div class="slider-container">
            <div class="slider-header">
              <label for="rarity-slider" class="slider-label">
                <span class="slider-label-text">✨ Increased Rarity:</span>
                <span class="slider-value" aria-live="polite">{raritySliderValue >= 1000 ? raritySliderValue.toFixed(0) : raritySliderValue.toFixed(1)}%</span>
              </label>
            </div>
            <input
              id="rarity-slider"
              type="range"
              min="0"
              max="1000"
              step="1"
              value={raritySliderValue}
              on:input={handleRaritySliderInput}
              on:change={handleRaritySliderChange}
              class="slider"
              aria-label="Adjust increased rarity percentage"
              aria-valuemin="0"
              aria-valuemax="1000"
              aria-valuenow={raritySliderValue}
            />
            <div class="slider-hint">
              Adjust the rarity percentage to fine-tune drop rates. Higher values favor high-value cards.
            </div>
          </div>

          <!-- Lucky Drop Slider -->
          <div class="slider-container">
            <div class="slider-header">
              <label for="luckydrop-slider" class="slider-label">
                <span class="slider-label-text">🍀 Lucky Drop Level:</span>
                <span class="slider-value" aria-live="polite">Level {luckyDropSliderValue} ({luckyDropSliderValue + 1} rolls)</span>
              </label>
              <span class="debug-badge" title="Debug mode - adjust lucky drop level for testing" role="status" aria-label="Debug mode">DEBUG</span>
            </div>
            <input
              id="luckydrop-slider"
              type="range"
              min="0"
              max="10"
              step="1"
              value={luckyDropSliderValue}
              on:input={handleLuckyDropSliderInput}
              on:change={handleLuckyDropSliderChange}
              class="slider"
              aria-label="Adjust lucky drop level (debug only)"
              aria-valuemin="0"
              aria-valuemax="10"
              aria-valuenow={luckyDropSliderValue}
            />
            <div class="slider-hint">
              Debug: Adjust lucky drop level. Level N = (N+1) rolls, best card selected. Check console for roll details.
            </div>
          </div>
        </div>

        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .debug-panel-container {
    position: fixed;
    top: 1rem;
    left: 1rem;
    width: 350px;
    max-height: calc(100vh - 200px);
    z-index: 1000;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: thin;
    scrollbar-color: var(--scrollbar-thumb, #555) var(--scrollbar-track, #2a2a2a);
  }

  .debug-panel-container::-webkit-scrollbar {
    width: 8px;
  }

  .debug-panel-container::-webkit-scrollbar-track {
    background: var(--scrollbar-track, #2a2a2a);
    border-radius: 4px;
  }

  .debug-panel-container::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb, #555);
    border-radius: 4px;
  }

  .debug-panel-container::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-thumb-hover, #666);
  }

  @media (max-width: 1400px) {
    .debug-panel-container {
      width: 300px;
    }
  }

  @media (max-width: 1200px) {
    .debug-panel-container {
      width: 280px;
      font-size: 0.9rem;
    }
  }

  @media (max-width: 768px) {
    .debug-panel-container {
      position: relative;
      top: auto;
      left: auto;
      width: 100%;
      max-height: 400px;
      margin: 1rem 0;
    }
  }

  .debug-panel {
    width: 100%;
    background-color: #1a1a1a;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    border: 1px solid #444;
    color: #ffffff;
  }

  .panel-header {
    display: flex;
    align-items: center;
    padding: 0.75rem;
    margin-bottom: 0;
    flex-shrink: 0;
  }

  .panel-header h2 {
    margin: 0;
    color: #fff;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .panel-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: transparent;
    border: none;
    color: #fff;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    margin: -0.25rem -0.5rem;
    border-radius: 4px;
    transition: background-color 0.2s;
    width: 100%;
  }

  .panel-toggle:hover {
    background-color: #333;
  }

  .panel-toggle:focus {
    outline: 2px solid #4caf50;
    outline-offset: 2px;
  }

  .toggle-icon {
    font-size: 0.7rem;
    color: #aaa;
    transition: transform 0.2s;
  }

  .panel-body {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease, padding 0.3s ease;
    padding: 0 0.75rem 0 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .debug-panel-container.open .panel-body {
    max-height: calc(100vh - 300px);
    padding: 0 0.75rem 0.75rem 0.75rem;
    overflow-y: auto;
  }

  .description-text {
    margin: 0 0 0.75rem 0;
    font-size: 0.85rem;
    color: #888;
  }

  .debug-section {
    padding: 0.75rem;
    background-color: #2a2a2a;
    border-radius: 4px;
    border: 1px solid #333;
  }

  .section-header {
    margin: 0 0 0.75rem 0;
    color: #fff;
    font-size: 0.95rem;
    font-weight: 600;
    border-bottom: 1px solid #444;
    padding-bottom: 0.5rem;
  }

  .debug-tools-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .debug-tool-button {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
    background-color: #2a2a2a;
    color: #fff;
    border: 1px solid #444;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s, border-color 0.2s;
  }

  .debug-tool-button:hover {
    background-color: #333;
    border-color: #555;
  }

  .debug-tool-button:focus {
    outline: 2px solid #4caf50;
    outline-offset: 2px;
  }

  .debug-toggle.active {
    background-color: #4caf50;
    border-color: #4caf50;
  }


  .error-message {
    padding: 0.75rem;
    margin-bottom: 0.75rem;
    background-color: #d32f2f;
    color: #fff;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .slider-container {
    margin-bottom: 0.75rem;
  }

  .slider-container:last-child {
    margin-bottom: 0;
  }

  .slider-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .slider-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #fff;
    font-size: 0.95rem;
  }

  .slider-label-text {
    font-weight: 500;
  }

  .slider-value {
    color: #4caf50;
    font-weight: 600;
  }

  .debug-badge {
    padding: 0.25rem 0.5rem;
    background-color: #ff6b6b;
    color: #fff;
    border-radius: 3px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .slider {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: #333;
    outline: none;
    -webkit-appearance: none;
  }

  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #4caf50;
    cursor: pointer;
  }

  .slider::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #4caf50;
    cursor: pointer;
    border: none;
  }

  .slider-hint {
    margin-top: 0.5rem;
    font-size: 0.85rem;
    color: #888;
  }
</style>

