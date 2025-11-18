<script lang="ts">
  import { onMount } from 'svelte';
  import { gameState } from '$lib/stores/gameState.js';
  import { gameStateService } from '$lib/services/gameStateService.js';
  import OfflineProgress from '$lib/components/OfflineProgress.svelte';
  import GameAreaLayout from '$lib/components/GameAreaLayout.svelte';
  import AmbientSceneZone from '$lib/components/AmbientSceneZone.svelte';
  import { audioService } from '$lib/audio/audioManager.js';
  import { InsufficientResourcesError, ERROR_MESSAGES } from '$lib/utils/errors.js';
  import { createDefaultGameState } from '$lib/utils/defaultGameState.js';
  import type { CardDrawResult } from '$lib/models/CardDrawResult.js';
  import type { OfflineProgressionResult } from '$lib/models/OfflineProgressionResult.js';

  let errorMessage: string | null = null;
  let lastCardDraw: CardDrawResult | null = null;
  let isLoading = true;
  let offlineProgression: OfflineProgressionResult | null = null;
  let debugMode = false;
  let gameAreaLayout: GameAreaLayout | null = null;
  let ambientSceneZone: AmbientSceneZone | null = null;

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
              results.forEach((result, index) => {
                setTimeout(() => {
                  ambientSceneZone?.addCard(result.card);
                  audioService.playCardDropSound(result.card.qualityTier);
                }, index * 50); // 50ms delay between each card
              });
            }
          }
          return;
        }
      }
      
      const result = await gameStateService.openDeck();
      lastCardDraw = result;
      
      // Add card to ambient scene zone
      if (ambientSceneZone) {
        ambientSceneZone.addCard(result.card);
      }
      
      // Play card drop sound
      audioService.playCardDropSound(result.card.qualityTier);
      
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
  {:else}
    <p>Game state not available</p>
  {/if}
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

  /* Responsive design for mobile */
  @media (max-width: 767px) {
    h1 {
      font-size: 1.5rem;
    }
  }
</style>
