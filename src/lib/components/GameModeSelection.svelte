<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { gameModeService } from '../services/gameModeService.js';
  import type { GameMode, GameModeId } from '../models/GameMode.js';

  export let isVisible: boolean = false;
  export let isModeChange: boolean = false;

  const dispatch = createEventDispatcher<{
    'mode:selected': { modeId: GameModeId };
    'mode:cancelled': void;
  }>();

  let selectedMode: GameModeId | null = null;
  let showConfirmation = false;
  let pendingModeChange: GameModeId | null = null;
  let modes: GameMode[] = [];
  let firstFocusableElement: HTMLElement | null = null;
  let lastFocusableElement: HTMLElement | null = null;

  // Load available modes
  onMount(() => {
    modes = gameModeService.getAvailableModes();
  });

  // Focus management
  $: if (isVisible && !showConfirmation) {
    // Focus first mode button when visible
    setTimeout(() => {
      const firstButton = document.querySelector('.mode-card button') as HTMLElement;
      if (firstButton) {
        firstButton.focus();
        firstFocusableElement = firstButton;
      }
    }, 100);
  }

  function handleModeSelect(modeId: GameModeId) {
    selectedMode = modeId;
    
    // If changing mode mid-session, show confirmation
    if (isModeChange) {
      pendingModeChange = modeId;
      showConfirmation = true;
    } else {
      // First-time selection - proceed directly
      confirmSelection();
    }
  }

  async function confirmSelection() {
    if (selectedMode) {
      // If changing mode mid-session, clear game state
      if (isModeChange) {
        try {
          const { storageService } = await import('../services/storageService.js');
          await storageService.clearAll();
        } catch (error) {
          console.warn('Failed to clear game state on mode change:', error);
          // Continue anyway - mode change will still work
        }
      }

      gameModeService.setMode(selectedMode);
      dispatch('mode:selected', { modeId: selectedMode });
      
      // Reset state
      selectedMode = null;
      showConfirmation = false;
      pendingModeChange = null;

      // If mode change, reload page to apply new configuration
      if (isModeChange && typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  }

  function cancelSelection() {
    selectedMode = null;
    showConfirmation = false;
    pendingModeChange = null;
    dispatch('mode:cancelled');
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (!isVisible) return;

    // Escape key closes modal
    if (event.key === 'Escape') {
      if (showConfirmation) {
        cancelSelection();
      } else {
        cancelSelection();
      }
      event.preventDefault();
      return;
    }

    // Arrow key navigation between mode cards
    if ((event.key === 'ArrowRight' || event.key === 'ArrowLeft' || event.key === 'ArrowDown' || event.key === 'ArrowUp') && !showConfirmation) {
      const buttons = Array.from(document.querySelectorAll('.mode-card button')) as HTMLElement[];
      const currentIndex = buttons.findIndex(btn => btn === document.activeElement);
      
      if (currentIndex !== -1) {
        event.preventDefault();
        let nextIndex = currentIndex;
        
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          nextIndex = (currentIndex + 1) % buttons.length;
        } else {
          nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
        }
        
        buttons[nextIndex]?.focus();
      }
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    // Close if clicking backdrop (not modal content)
    if (event.target === event.currentTarget) {
      cancelSelection();
    }
  }
</script>

{#if isVisible}
  <div
    class="modal-overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="game-mode-title"
    on:click={handleBackdropClick}
    on:keydown={handleKeyDown}
    tabindex="-1"
  >
    <div class="modal-content" role="document" on:click|stopPropagation on:keydown|stopPropagation>
      <div class="modal-header">
        <h2 id="game-mode-title">Select Game Mode</h2>
      </div>
      
      <div class="modal-body">
        {#if showConfirmation}
          <!-- Confirmation Dialog -->
          <div class="confirmation-dialog">
            <p class="confirmation-message">
              Changing game mode will reset all your progress (score, decks, upgrades, collection). 
              Are you sure you want to continue?
            </p>
            <div class="confirmation-actions">
              <button
                class="btn btn-secondary"
                on:click={cancelSelection}
                aria-label="Cancel mode change"
              >
                Cancel
              </button>
              <button
                class="btn btn-primary"
                on:click={confirmSelection}
                aria-label="Confirm mode change"
              >
                Change Mode
              </button>
            </div>
          </div>
        {:else}
          <!-- Mode Selection -->
          <p class="mode-selection-intro">
            Choose your preferred gameplay experience. Each mode offers different starting conditions and features.
          </p>
          
          <div class="modes-grid">
            {#each modes as mode (mode.id)}
              {@const isSelected = selectedMode === mode.id}
              <div class="mode-card" class:selected={isSelected}>
                <button
                  class="mode-button"
                  on:click={() => handleModeSelect(mode.id)}
                  aria-pressed={isSelected}
                  aria-label="Select {mode.name} mode"
                  tabindex={isSelected ? 0 : -1}
                >
                  <h3 class="mode-name">{mode.name}</h3>
                  <p class="mode-description">{mode.description}</p>
                  {#if isSelected}
                    <span class="selected-indicator" aria-hidden="true">✓ Selected</span>
                  {/if}
                </button>
              </div>
            {/each}
          </div>

          {#if selectedMode}
            <div class="selection-actions">
              <button
                class="btn btn-primary"
                on:click={confirmSelection}
                aria-label="Confirm selection"
              >
                Confirm Selection
              </button>
              <button
                class="btn btn-secondary"
                on:click={cancelSelection}
                aria-label="Cancel selection"
              >
                Cancel
              </button>
            </div>
          {/if}
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2001;
    padding: 1rem;
  }

  .modal-content {
    background-color: #1a1a1a;
    border-radius: 8px;
    max-width: 900px;
    max-height: 90vh;
    width: 100%;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #333;
  }

  .modal-header h2 {
    margin: 0;
    color: #fff;
    font-size: 1.5rem;
  }

  .modal-body {
    overflow-y: auto;
    padding: 1.5rem;
  }

  .mode-selection-intro {
    color: #ccc;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .modes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .mode-card {
    border: 2px solid #333;
    border-radius: 8px;
    transition: border-color 0.2s, transform 0.2s;
  }

  .mode-card:hover {
    border-color: #555;
    transform: translateY(-2px);
  }

  .mode-card.selected {
    border-color: #4a9eff;
    box-shadow: 0 0 10px rgba(74, 158, 255, 0.3);
  }

  .mode-button {
    width: 100%;
    padding: 1.5rem;
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
    color: #fff;
    transition: background-color 0.2s;
  }

  .mode-button:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .mode-button:focus {
    outline: 2px solid #4a9eff;
    outline-offset: -2px;
  }

  .mode-name {
    margin: 0 0 0.5rem 0;
    font-size: 1.2rem;
    color: #fff;
  }

  .mode-description {
    margin: 0;
    font-size: 0.9rem;
    color: #ccc;
    line-height: 1.4;
  }

  .selected-indicator {
    display: block;
    margin-top: 0.5rem;
    color: #4a9eff;
    font-weight: bold;
  }

  .selection-actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .confirmation-dialog {
    text-align: center;
    padding: 1rem;
  }

  .confirmation-message {
    color: #fff;
    margin-bottom: 1.5rem;
    font-size: 1.1rem;
  }

  .confirmation-actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.1s;
  }

  .btn:hover {
    transform: translateY(-1px);
  }

  .btn:focus {
    outline: 2px solid #4a9eff;
    outline-offset: 2px;
  }

  .btn-primary {
    background-color: #4a9eff;
    color: #fff;
  }

  .btn-primary:hover {
    background-color: #3a8eef;
  }

  .btn-secondary {
    background-color: #333;
    color: #fff;
  }

  .btn-secondary:hover {
    background-color: #444;
  }

  @media (max-width: 768px) {
    .modes-grid {
      grid-template-columns: 1fr;
    }
  }
</style>

