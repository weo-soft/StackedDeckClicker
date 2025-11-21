<script lang="ts">
  import { onMount } from 'svelte';
  import { tierStore } from '../stores/tierStore.js';
  import { tierService } from '../services/tierService.js';
  import type { Tier } from '../models/Tier.js';

  export let onAssignmentChanged: ((cardName: string, tierId: string) => void) | undefined = undefined;

  let allTiers: Tier[] = [];
  let selectedTierId: string | null = null;
  let searchQuery = '';
  let selectedCards: Set<string> = new Set();
  let errorMessage: string | null = null;
  let successMessage: string | null = null;
  let isMoving = false;

  // Load tiers on mount
  onMount(() => {
    loadTiers();
  });

  function loadTiers() {
    allTiers = tierStore.getAllTiers();
    if (allTiers.length > 0 && !selectedTierId) {
      selectedTierId = allTiers[0].id;
    }
  }

  function getCardsInTier(tierId: string): string[] {
    return tierService.getCardsInTier(tierId);
  }

  function getFilteredCards(tierId: string): string[] {
    const cards = getCardsInTier(tierId);
    if (!searchQuery.trim()) {
      return cards;
    }
    const query = searchQuery.toLowerCase();
    return cards.filter(card => card.toLowerCase().includes(query));
  }

  function toggleCardSelection(cardName: string) {
    if (selectedCards.has(cardName)) {
      selectedCards.delete(cardName);
    } else {
      selectedCards.add(cardName);
    }
    selectedCards = selectedCards; // Trigger reactivity
  }

  function selectAllCards() {
    const tierId = selectedTierId;
    if (!tierId) return;
    const cards = getFilteredCards(tierId);
    selectedCards = new Set(cards);
  }

  function clearSelection() {
    selectedCards = new Set();
  }

  async function moveSelectedCards(targetTierId: string) {
    if (selectedCards.size === 0) {
      errorMessage = 'Please select at least one card to move';
      return;
    }

    if (!selectedTierId) {
      errorMessage = 'Please select a source tier';
      return;
    }

    if (selectedTierId === targetTierId) {
      errorMessage = 'Cannot move cards to the same tier';
      return;
    }

    isMoving = true;
    errorMessage = null;
    successMessage = null;

    try {
      const cardNames = Array.from(selectedCards);
      await tierService.moveCardsToTier(cardNames, targetTierId);

      // Notify callbacks
      for (const cardName of cardNames) {
        if (onAssignmentChanged) {
          onAssignmentChanged(cardName, targetTierId);
        }
      }

      // Refresh store
      tierStore.refresh();
      loadTiers();

      // Clear selection
      selectedCards = new Set();

      successMessage = `Moved ${cardNames.length} card(s) to ${allTiers.find(t => t.id === targetTierId)?.name || targetTierId}`;
      setTimeout(() => {
        successMessage = null;
      }, 2000);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to move cards';
      console.error('Move cards error:', error);
    } finally {
      isMoving = false;
    }
  }

  async function moveCardToTier(cardName: string, targetTierId: string) {
    if (!selectedTierId) return;

    isMoving = true;
    errorMessage = null;
    successMessage = null;

    try {
      await tierService.moveCardToTier(cardName, targetTierId);

      if (onAssignmentChanged) {
        onAssignmentChanged(cardName, targetTierId);
      }

      // Refresh store
      tierStore.refresh();
      loadTiers();

      successMessage = `Moved ${cardName} to ${allTiers.find(t => t.id === targetTierId)?.name || targetTierId}`;
      setTimeout(() => {
        successMessage = null;
      }, 2000);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to move card';
      console.error('Move card error:', error);
    } finally {
      isMoving = false;
    }
  }

  function getTierDisplayName(tier: Tier): string {
    return tier.type === 'default' ? `Tier ${tier.name}` : tier.name;
  }

  function handleKeyDown(event: KeyboardEvent, cardName: string) {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      toggleCardSelection(cardName);
    }
  }
</script>

<div class="tier-management" role="region" aria-label="Tier management">
  <h2>Tier Management</h2>

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

  {#if allTiers.length === 0}
    <p class="no-tiers">No tiers available. Tier system may not be initialized yet.</p>
  {:else}
    <div class="management-layout">
      <!-- Left: Tier Selection and Cards -->
      <div class="tier-cards-section">
        <div class="tier-selection">
          <label for="tier-select">Select Tier:</label>
          <select
            id="tier-select"
            bind:value={selectedTierId}
            on:change={() => {
              selectedCards = new Set();
              searchQuery = '';
            }}
            aria-label="Select tier to view cards"
          >
            {#each allTiers as tier}
              <option value={tier.id}>{getTierDisplayName(tier)} ({getCardsInTier(tier.id).length} cards)</option>
            {/each}
          </select>
        </div>

        {#if selectedTierId}
          <div class="card-list-section">
            <div class="card-list-header">
              <h3>Cards in {allTiers.find(t => t.id === selectedTierId)?.name || selectedTierId}</h3>
              <div class="search-box">
                <input
                  type="text"
                  placeholder="Search cards..."
                  bind:value={searchQuery}
                  aria-label="Search cards"
                />
              </div>
              <div class="selection-actions">
                <button
                  on:click={selectAllCards}
                  disabled={isMoving}
                  aria-label="Select all cards"
                >
                  Select All
                </button>
                <button
                  on:click={clearSelection}
                  disabled={isMoving}
                  aria-label="Clear selection"
                >
                  Clear
                </button>
                <span class="selection-count">
                  {selectedCards.size} selected
                </span>
              </div>
            </div>

            <div class="card-list" role="group" aria-label="Cards in selected tier">
              {#each getFilteredCards(selectedTierId) as cardName}
                {@const isSelected = selectedCards.has(cardName)}
                <button
                  class="card-item"
                  class:selected={isSelected}
                  type="button"
                  on:click={() => toggleCardSelection(cardName)}
                  on:keydown={(e) => handleKeyDown(e, cardName)}
                  aria-label="{cardName} - {isSelected ? 'Selected' : 'Not selected'}. Press Space or Enter to toggle selection."
                  aria-pressed={isSelected}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    on:change={() => toggleCardSelection(cardName)}
                    aria-label="Select {cardName}"
                    tabindex="-1"
                  />
                  <span class="card-name">{cardName}</span>
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- Right: Move To Tier -->
      {#if selectedTierId && selectedCards.size > 0}
        <div class="move-section">
          <h3>Move Selected Cards</h3>
          <p class="move-hint">Move {selectedCards.size} selected card(s) to:</p>
          <div class="tier-buttons">
            {#each allTiers as tier}
              {@const isCurrentTier = tier.id === selectedTierId}
              <button
                class="tier-button"
                class:current={isCurrentTier}
                disabled={isCurrentTier || isMoving}
                on:click={() => moveSelectedCards(tier.id)}
                aria-label="Move selected cards to {getTierDisplayName(tier)}"
              >
                {getTierDisplayName(tier)}
                {#if isCurrentTier}
                  <span class="current-badge">(current)</span>
                {/if}
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .tier-management {
    padding: 1rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .tier-management h2 {
    margin-top: 0;
    color: #fff;
  }

  .management-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  @media (min-width: 1024px) {
    .management-layout {
      grid-template-columns: 2fr 1fr;
    }
  }

  .tier-selection {
    margin-bottom: 1rem;
  }

  .tier-selection label {
    display: block;
    margin-bottom: 0.5rem;
    color: #fff;
  }

  .tier-selection select {
    width: 100%;
    padding: 0.5rem;
    font-size: 1rem;
    background-color: #2a2a2a;
    color: #fff;
    border: 1px solid #555;
    border-radius: 4px;
  }

  .card-list-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .card-list-header {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .card-list-header h3 {
    margin: 0;
    color: #fff;
  }

  .search-box input {
    width: 100%;
    padding: 0.5rem;
    background-color: #2a2a2a;
    color: #fff;
    border: 1px solid #555;
    border-radius: 4px;
    font-size: 1rem;
  }

  .selection-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .selection-actions button {
    padding: 0.5rem 1rem;
    background-color: #4a9eff;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }

  .selection-actions button:hover:not(:disabled) {
    background-color: #3a8eef;
  }

  .selection-actions button:disabled {
    background-color: #555;
    cursor: not-allowed;
    opacity: 0.6;
  }

  .selection-count {
    color: #fff;
    font-size: 0.9rem;
  }

  .card-list {
    max-height: 500px;
    overflow-y: auto;
    border: 1px solid #555;
    border-radius: 4px;
    background-color: #1a1a1a;
  }

  .card-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    border-bottom: 1px solid #333;
    cursor: pointer;
    transition: background-color 0.2s;
    width: 100%;
    text-align: left;
    background: none;
    border-left: none;
    border-right: none;
    border-top: none;
    color: inherit;
    font: inherit;
  }

  .card-item:last-child {
    border-bottom: none;
  }

  .card-item:hover {
    background-color: #2a2a2a;
  }

  .card-item.selected {
    background-color: #2d4a5a;
  }

  .card-item:focus {
    outline: 2px solid #4a9eff;
    outline-offset: -2px;
  }

  .card-item input[type="checkbox"] {
    cursor: pointer;
  }

  .card-name {
    color: #fff;
    flex: 1;
  }

  .move-section {
    padding: 1rem;
    background-color: #2a2a2a;
    border-radius: 4px;
    border: 1px solid #555;
  }

  .move-section h3 {
    margin-top: 0;
    color: #fff;
  }

  .move-hint {
    color: #aaa;
    margin-bottom: 1rem;
  }

  .tier-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .tier-button {
    padding: 0.75rem 1rem;
    background-color: #4a9eff;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    text-align: left;
    transition: background-color 0.2s;
  }

  .tier-button:hover:not(:disabled) {
    background-color: #3a8eef;
  }

  .tier-button:disabled {
    background-color: #555;
    cursor: not-allowed;
    opacity: 0.6;
  }

  .tier-button.current {
    background-color: #666;
  }

  .current-badge {
    font-size: 0.8rem;
    opacity: 0.8;
  }

  .error {
    padding: 0.75rem;
    background-color: #5a2d2d;
    color: #ff6b6b;
    border-radius: 4px;
    margin-bottom: 1rem;
  }

  .success {
    padding: 0.75rem;
    background-color: #2d5a2d;
    color: #90ee90;
    border-radius: 4px;
    margin-bottom: 1rem;
  }

  .no-tiers {
    color: #aaa;
    text-align: center;
    padding: 2rem;
  }
</style>

