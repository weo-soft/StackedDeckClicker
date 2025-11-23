<script lang="ts">
  import { onMount } from 'svelte';
  import { gameState } from '$lib/stores/gameState.js';
  import { gameStateService } from '$lib/services/gameStateService.js';
  import OfflineProgress from '$lib/components/OfflineProgress.svelte';
  import GameAreaLayout from '$lib/components/GameAreaLayout.svelte';
  import AmbientSceneZone from '$lib/components/AmbientSceneZone.svelte';
  import TierSettings from '$lib/components/TierSettings.svelte';
  import TierManagement from '$lib/components/TierManagement.svelte';
  import DataVersionOverlay from '$lib/components/DataVersionOverlay.svelte';
  import { audioService } from '$lib/audio/audioManager.js';
  import { InsufficientResourcesError, ERROR_MESSAGES } from '$lib/utils/errors.js';
  import { createDefaultGameState } from '$lib/utils/defaultGameState.js';
  import { storageService } from '$lib/services/storageService.js';
  import type { CardDrawResult } from '$lib/models/CardDrawResult.js';
  import type { OfflineProgressionResult } from '$lib/models/OfflineProgressionResult.js';

  let errorMessage: string | null = null;
  let lastCardDraw: CardDrawResult | null = null;
  let isLoading = true;
  let offlineProgression: OfflineProgressionResult | null = null;
  let debugMode = false;
  let gameAreaLayout: GameAreaLayout | null = null;
  let ambientSceneZone: AmbientSceneZone | null = null;
  let showTierSettings = false;
  let showTierManagement = false;
  let showDataVersion = false;
  let activeModal: 'settings' | 'management' | 'dataVersion' | null = null;
  let showResetConfirmation = false;

  // Use reactive statement for store
  $: currentState = $gameState;
  $: canOpenDeck = currentState && currentState.decks > 0;
  
  // Get ambient scene zone reference when GameAreaLayout is ready
  $: if (gameAreaLayout) {
    ambientSceneZone = gameAreaLayout.getAmbientSceneZone();
  }

  onMount(async () => {
    console.log('onMount called - starting initialization');
    
    // Preload audio
    try {
      await audioService.preloadAudio();
    } catch (error) {
      console.warn('Audio preload failed:', error);
    }
    
    // Initialize immediately and handle errors
    gameStateService.initialize()
      .then(() => {
        console.log('Initialization completed successfully');
        // Check for offline progression
        offlineProgression = gameStateService.getLastOfflineProgression();
        isLoading = false;
      })
      .catch((error) => {
        console.error('Initialization failed:', error);
        errorMessage = `Failed to load game: ${error instanceof Error ? error.message : 'Unknown error'}`;
        
        // Set default state on error
        if (!$gameState) {
          const defaultState = createDefaultGameState();
          gameState.set(defaultState);
        }
        isLoading = false;
      });

    // Fallback timeout - ensure we show something after 2 seconds
    setTimeout(() => {
      if (isLoading) {
        console.warn('Initialization timeout - forcing default state');
        if (!$gameState) {
          const defaultState = createDefaultGameState();
          gameState.set(defaultState);
        }
        isLoading = false;
      }
    }, 2000);
  });

  async function handleOpenDeck() {
    if (!currentState || currentState.decks <= 0) {
      errorMessage = ERROR_MESSAGES.NO_DECKS;
      return;
    }

    try {
      errorMessage = null;
      
      // Keyboard accessibility: focus management
      const button = document.activeElement as HTMLElement;
      
      // Check for multidraw upgrade
      const multidrawUpgrade = currentState.upgrades.upgrades.get('multidraw');
      if (multidrawUpgrade && multidrawUpgrade.level > 0) {
        const { upgradeService } = await import('$lib/services/upgradeService.js');
        const drawCount = upgradeService.calculateUpgradeEffect(multidrawUpgrade);
        if (drawCount > 1 && currentState.decks >= drawCount) {
          const results = await gameStateService.openMultipleDecks(drawCount);
          // Show the last card drawn
          if (results.length > 0) {
            lastCardDraw = results[results.length - 1];
            
            // Add all cards to ambient scene zone with slight delay for visual effect
            if (ambientSceneZone) {
              const { tierStore } = await import('$lib/stores/tierStore.js');
              results.forEach((result, index) => {
                setTimeout(() => {
                  const shouldDisplay = tierStore.shouldDisplayCard(result.card.name);
                  if (shouldDisplay) {
                    ambientSceneZone?.addCard(result.card);
                    // Play tier sound or fallback to qualityTier sound
                    const tier = tierStore.getTierForCard(result.card.name);
                    if (tier) {
                      audioService.playTierSound(tier.id, result.card.qualityTier);
                    } else {
                      audioService.playCardDropSound(result.card.qualityTier);
                    }
                  }
                }, index * 50); // 50ms delay between each card
              });
            }
          }
          return;
        }
      }
      
      const result = await gameStateService.openDeck();
      
      // Check if card should be displayed based on tier
      const { tierStore } = await import('$lib/stores/tierStore.js');
      const shouldDisplay = tierStore.shouldDisplayCard(result.card.name);
      
      if (shouldDisplay) {
        lastCardDraw = result;
        
        // Add card to ambient scene zone
        if (ambientSceneZone) {
          ambientSceneZone.addCard(result.card);
        }
        
        // Play tier sound or fallback to qualityTier sound
        const tier = tierStore.getTierForCard(result.card.name);
        if (tier) {
          audioService.playTierSound(tier.id, result.card.qualityTier);
        } else {
          // Fallback to qualityTier sound if tier not found
          audioService.playCardDropSound(result.card.qualityTier);
        }
      } else {
        // Card is processed but not displayed (tier is disabled)
        // Still update game state, but don't show card
        console.log(`Card ${result.card.name} dropped but tier is disabled`);
      }
      
      // Restore focus for keyboard navigation
      if (button) {
        button.focus();
      }
    } catch (error) {
      if (error instanceof InsufficientResourcesError) {
        errorMessage = error.message;
      } else {
        errorMessage = 'An error occurred while opening the deck.';
        console.error('Deck opening error:', error);
      }
    }
  }

  async function handleAddDecks() {
    try {
      errorMessage = null;
      await gameStateService.addDecks(10);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to add decks';
      console.error('Add decks error:', error);
    }
  }

  async function handleAddChaos() {
    try {
      errorMessage = null;
      await gameStateService.addChaos(10);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to add chaos';
      console.error('Add chaos error:', error);
    }
  }

  function handleResetClick() {
    showResetConfirmation = true;
  }

  async function handleResetConfirm() {
    try {
      errorMessage = null;
      
      // Clear all storage (game state and tier configurations)
      // Note: storageService.clearAll() clears the entire localforage database,
      // which includes both game state and tier configurations
      await storageService.clearAll();
      
      // Close confirmation dialog before reload
      showResetConfirmation = false;
      
      // Reload the page to fully reinitialize everything
      // This ensures all services and stores are properly reset
      window.location.reload();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to reset game state';
      console.error('Reset error:', error);
      showResetConfirmation = false;
    }
  }

  function handleResetCancel() {
    showResetConfirmation = false;
  }
</script>

<main>
  <h1>Stacked Deck Clicker</h1>
  
  {#if isLoading}
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading game...</p>
      <p class="loading-hint">If this message persists, check the browser console for errors.</p>
    </div>
  {:else if currentState}
    {#if offlineProgression}
      <OfflineProgress result={offlineProgression} />
    {/if}

    <GameAreaLayout
      bind:this={gameAreaLayout}
      gameState={currentState}
      {lastCardDraw}
      onDeckOpen={handleOpenDeck}
      onAddDecks={handleAddDecks}
      onAddChaos={handleAddChaos}
      onUpgradePurchase={async (upgradeType) => {
        try {
          await gameStateService.purchaseUpgrade(upgradeType);
        } catch (error) {
          if (error instanceof InsufficientResourcesError) {
            errorMessage = error.message;
          } else {
            errorMessage = 'Failed to purchase upgrade.';
            console.error('Upgrade purchase error:', error);
          }
        }
      }}
    />


    {#if errorMessage}
      <div class="error" role="alert">
        {errorMessage}
      </div>
    {/if}

    <!-- Tier Management Buttons -->
    <div class="tier-buttons">
      <button
        class="tier-button"
        on:click={() => {
          activeModal = 'settings';
          showTierSettings = true;
        }}
        aria-label="Open tier settings"
      >
        Tier Settings
      </button>
      <button
        class="tier-button"
        on:click={() => {
          activeModal = 'management';
          showTierManagement = true;
        }}
        aria-label="Open tier management"
      >
        Tier Management
      </button>
      <button
        class="tier-button"
        on:click={() => {
          activeModal = 'dataVersion';
          showDataVersion = true;
        }}
        aria-label="View data version"
      >
        Data Version
      </button>
      <button
        class="tier-button reset-button"
        on:click={handleResetClick}
        aria-label="Reset game state"
      >
        Reset Game
      </button>
    </div>
  {:else}
    <p>Game state not available</p>
  {/if}

  <!-- Tier Settings Modal -->
  {#if showTierSettings}
    <div
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tier-settings-title"
      on:click|self={() => {
        showTierSettings = false;
        activeModal = null;
      }}
      on:keydown={(e) => {
        if (e.key === 'Escape') {
          showTierSettings = false;
          activeModal = null;
        }
      }}
      on:keydown={(e) => {
        if (e.key === 'Escape') {
          showTierSettings = false;
          activeModal = null;
        }
      }}
      tabindex="-1"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="tier-settings-title">Tier Settings</h2>
          <button
            class="modal-close"
            on:click={() => {
              showTierSettings = false;
              activeModal = null;
            }}
            aria-label="Close tier settings"
          >
            ×
          </button>
        </div>
        <div class="modal-body">
          <TierSettings
            tierId={null}
            onTierUpdated={(tierId) => {
              console.log('Tier updated:', tierId);
            }}
          />
        </div>
      </div>
    </div>
  {/if}

  <!-- Tier Management Modal -->
  {#if showTierManagement}
    <div
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tier-management-title"
      on:click|self={() => {
        showTierManagement = false;
        activeModal = null;
      }}
      on:keydown={(e) => {
        if (e.key === 'Escape') {
          showTierManagement = false;
          activeModal = null;
        }
      }}
      on:keydown={(e) => {
        if (e.key === 'Escape') {
          showTierManagement = false;
          activeModal = null;
        }
      }}
      tabindex="-1"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="tier-management-title">Tier Management</h2>
          <button
            class="modal-close"
            on:click={() => {
              showTierManagement = false;
              activeModal = null;
            }}
            aria-label="Close tier management"
          >
            ×
          </button>
        </div>
        <div class="modal-body">
          <TierManagement
            onAssignmentChanged={(cardName, tierId) => {
              console.log('Card assignment changed:', cardName, tierId);
            }}
          />
        </div>
      </div>
    </div>
  {/if}

  <!-- Reset Confirmation Modal -->
  {#if showResetConfirmation}
    <div
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-confirmation-title"
      on:click|self={handleResetCancel}
      on:keydown={(e) => {
        if (e.key === 'Escape') {
          handleResetCancel();
        }
      }}
      tabindex="-1"
    >
      <div class="modal-content reset-modal">
        <div class="modal-header">
          <h2 id="reset-confirmation-title">Reset Game State</h2>
          <button
            class="modal-close"
            on:click={handleResetCancel}
            aria-label="Close reset confirmation"
          >
            ×
          </button>
        </div>
        <div class="modal-body">
          <p class="reset-warning">
            Are you sure you want to reset the game state? This will:
          </p>
          <ul class="reset-list">
            <li>Clear all saved game progress (score, decks, upgrades)</li>
            <li>Clear all tier configurations and card assignments</li>
            <li>Reset all customizations</li>
            <li>Reset card collection</li>
          </ul>
          <p class="reset-warning"><strong>This action cannot be undone!</strong></p>
          <div class="reset-buttons">
            <button
              class="reset-confirm-button"
              on:click={handleResetConfirm}
              aria-label="Confirm reset"
            >
              Yes, Reset Game
            </button>
            <button
              class="reset-cancel-button"
              on:click={handleResetCancel}
              aria-label="Cancel reset"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Data Version Overlay -->
  <DataVersionOverlay bind:isOpen={showDataVersion} />
</main>

<style>
  main {
    padding: 0;
    max-width: 100%;
    width: 100%;
    margin: 0 auto;
    text-align: center;
    overflow-x: hidden;
    overflow-y: visible;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
  }

  @media (min-width: 768px) {
    main {
      padding: 0;
    }
  }

  h1 {
    margin-bottom: 2rem;
  }


  button {
    padding: 1rem 2rem;
    font-size: 1.2rem;
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
  }

  button:hover:not(:disabled) {
    background-color: #45a049;
  }

  button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }

  .error {
    margin: 1rem 0;
    padding: 1rem;
    background-color: #f44336;
    color: white;
    border-radius: 4px;
  }

  .debug-section {
    margin: 2rem 0;
    padding: 1rem;
    background-color: #1a1a1a;
    border-radius: 4px;
    border: 1px dashed #666;
  }

  .debug-toggle {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    background-color: #555;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .debug-toggle:hover {
    background-color: #666;
  }

  .debug-panel {
    margin-top: 1rem;
    padding: 1rem;
    background-color: #2a2a2a;
    border-radius: 4px;
  }

  .debug-panel h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1rem;
    color: #ffa500;
  }

  .debug-control {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .debug-control label {
    font-size: 0.9rem;
  }

  .debug-control input {
    padding: 0.5rem;
    font-size: 0.9rem;
    width: 100px;
    border: 1px solid #555;
    border-radius: 4px;
    background-color: #333;
    color: white;
  }

  .tier-buttons {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    z-index: 1000;
  }

  .tier-button {
    padding: 0.75rem 1.5rem;
    background-color: #4a9eff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.2s;
  }

  .tier-button:hover {
    background-color: #3a8eef;
  }

  .reset-button {
    background-color: #f44336;
  }

  .reset-button:hover {
    background-color: #d32f2f;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
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
  }

  .modal-close {
    background: none;
    border: none;
    color: #fff;
    font-size: 2rem;
    cursor: pointer;
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .modal-close:hover {
    background-color: #333;
  }

  .modal-body {
    overflow-y: auto;
    padding: 0;
  }

  .debug-button {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .debug-button:hover {
    background-color: #45a049;
  }



  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    min-height: 300px;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #333;
    border-top: 4px solid #4caf50;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .loading-hint {
    font-size: 0.8rem;
    color: #888;
    margin-top: 0.5rem;
  }

  .reset-modal {
    max-width: 500px;
  }

  .reset-warning {
    color: #fff;
    margin: 1rem 0;
    line-height: 1.6;
  }

  .reset-list {
    color: #fff;
    margin: 1rem 0;
    padding-left: 2rem;
    line-height: 1.8;
  }

  .reset-list li {
    margin: 0.5rem 0;
  }

  .reset-buttons {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid #333;
  }

  .reset-confirm-button {
    padding: 0.75rem 1.5rem;
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.2s;
  }

  .reset-confirm-button:hover {
    background-color: #d32f2f;
  }

  .reset-cancel-button {
    padding: 0.75rem 1.5rem;
    background-color: #666;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.2s;
  }

  .reset-cancel-button:hover {
    background-color: #777;
  }

  /* Responsive design for mobile */
  @media (max-width: 767px) {
    h1 {
      font-size: 1.5rem;
    }
  }
</style>
