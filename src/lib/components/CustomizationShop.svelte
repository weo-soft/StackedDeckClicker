<script lang="ts">
  import { gameStateService } from '../services/gameStateService.js';
  import { AVAILABLE_CUSTOMIZATIONS, getCustomizationsByCategory } from '../models/Customization.js';
  import type { GameState } from '../models/GameState.js';
  import { InsufficientResourcesError, ERROR_MESSAGES } from '../utils/errors.js';
  import { formatNumber } from '../utils/numberFormat.js';

  export let gameState: GameState;

  let errorMessage: string | null = null;
  let successMessage: string | null = null;

  $: currentScore = gameState.score;
  $: activeCustomizations = gameState.customizations;

  $: backgroundCustomizations = getCustomizationsByCategory('background');
  $: decorationCustomizations = getCustomizationsByCategory('decoration');
  $: effectCustomizations = getCustomizationsByCategory('effect');

  function isOwned(customizationId: string): boolean {
    return activeCustomizations.get(customizationId) === true;
  }

  function canAfford(cost: number): boolean {
    return currentScore >= cost;
  }

  async function handlePurchase(customizationId: string, cost: number) {
    try {
      errorMessage = null;
      successMessage = null;

      if (isOwned(customizationId)) {
        errorMessage = 'You already own this customization.';
        return;
      }

      await gameStateService.purchaseCustomization(customizationId, cost);

      successMessage = 'Customization purchased successfully!';
      setTimeout(() => {
        successMessage = null;
      }, 2000);
    } catch (error) {
      if (error instanceof InsufficientResourcesError) {
        errorMessage = error.message;
      } else {
        errorMessage = 'Failed to purchase customization.';
        console.error('Customization purchase error:', error);
      }
    }
  }

  function renderCategory(customizations: typeof AVAILABLE_CUSTOMIZATIONS, categoryName: string) {
    return customizations.filter(c => !isOwned(c.id));
  }
</script>

<div class="customization-shop">
  <h2>Scene Customization</h2>
  
  {#if errorMessage}
    <div class="error" role="alert">
      {errorMessage}
    </div>
  {/if}
  
  {#if successMessage}
    <div class="success" role="status">
      {successMessage}
    </div>
  {/if}

  {#if backgroundCustomizations.filter(c => !isOwned(c.id)).length > 0}
    <div class="category-section">
      <h3>Backgrounds</h3>
      <div class="customizations-grid">
        {#each backgroundCustomizations.filter(c => !isOwned(c.id)) as customization}
          <div class="customization-card">
            <h4>{customization.name}</h4>
            <p class="description">{customization.description}</p>
            <p class="visual-preview">{customization.visualDescription}</p>
            <p class="cost">Cost: {formatNumber(customization.cost)}</p>
            <button
              on:click={() => handlePurchase(customization.id, customization.cost)}
              disabled={!canAfford(customization.cost) || isOwned(customization.id)}
              aria-label="Purchase {customization.name}"
            >
              {isOwned(customization.id) ? 'Owned' : canAfford(customization.cost) ? 'Purchase' : 'Insufficient Chaos Orbs'}
            </button>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if decorationCustomizations.filter(c => !isOwned(c.id)).length > 0}
    <div class="category-section">
      <h3>Decorations</h3>
      <div class="customizations-grid">
        {#each decorationCustomizations.filter(c => !isOwned(c.id)) as customization}
          <div class="customization-card">
            <h4>{customization.name}</h4>
            <p class="description">{customization.description}</p>
            <p class="visual-preview">{customization.visualDescription}</p>
            <p class="cost">Cost: {formatNumber(customization.cost)}</p>
            <button
              on:click={() => handlePurchase(customization.id, customization.cost)}
              disabled={!canAfford(customization.cost) || isOwned(customization.id)}
              aria-label="Purchase {customization.name}"
            >
              {isOwned(customization.id) ? 'Owned' : canAfford(customization.cost) ? 'Purchase' : 'Insufficient Chaos Orbs'}
            </button>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if effectCustomizations.filter(c => !isOwned(c.id)).length > 0}
    <div class="category-section">
      <h3>Effects</h3>
      <div class="customizations-grid">
        {#each effectCustomizations.filter(c => !isOwned(c.id)) as customization}
          <div class="customization-card">
            <h4>{customization.name}</h4>
            <p class="description">{customization.description}</p>
            <p class="visual-preview">{customization.visualDescription}</p>
            <p class="cost">Cost: {formatNumber(customization.cost)}</p>
            <button
              on:click={() => handlePurchase(customization.id, customization.cost)}
              disabled={!canAfford(customization.cost) || isOwned(customization.id)}
              aria-label="Purchase {customization.name}"
            >
              {isOwned(customization.id) ? 'Owned' : canAfford(customization.cost) ? 'Purchase' : 'Insufficient Chaos Orbs'}
            </button>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if AVAILABLE_CUSTOMIZATIONS.every(c => isOwned(c.id))}
    <p class="all-owned">All customizations have been purchased! 🎉</p>
  {/if}
</div>

<style>
  .customization-shop {
    margin: 2rem 0;
    padding: 1.5rem;
    background-color: #2a2a2a;
    border-radius: 8px;
  }

  .customization-shop h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
  }

  .category-section {
    margin-bottom: 2rem;
  }

  .category-section h3 {
    margin-bottom: 1rem;
    color: #4caf50;
  }

  .customizations-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  .customization-card {
    padding: 1rem;
    background-color: #333;
    border-radius: 4px;
    border: 1px solid #444;
  }

  .customization-card h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
  }

  .customization-card .description {
    font-size: 0.9rem;
    color: #aaa;
    margin: 0.5rem 0;
  }

  .customization-card .visual-preview {
    font-size: 0.85rem;
    color: #888;
    font-style: italic;
    margin: 0.5rem 0;
  }

  .customization-card .cost {
    margin: 0.5rem 0;
    font-size: 1.1rem;
    color: #ffd700;
  }

  .customization-card button {
    width: 100%;
    padding: 0.75rem;
    margin-top: 0.5rem;
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }

  .customization-card button:hover:not(:disabled) {
    background-color: #45a049;
  }

  .customization-card button:disabled {
    background-color: #555;
    color: #888;
    cursor: not-allowed;
  }

  .error {
    margin: 1rem 0;
    padding: 1rem;
    background-color: #f44336;
    color: white;
    border-radius: 4px;
  }

  .success {
    margin: 1rem 0;
    padding: 1rem;
    background-color: #4caf50;
    color: white;
    border-radius: 4px;
  }

  .all-owned {
    text-align: center;
    padding: 2rem;
    color: #4caf50;
    font-size: 1.2rem;
  }
</style>

