<script lang="ts">
  import type { GameState } from '../models/GameState.js';
  import type { Upgrade } from '../models/Upgrade.js';
  import { upgradeService } from '../services/upgradeService.js';
  import { formatNumber } from '../utils/numberFormat.js';

  export let width: number;
  export let height: number;
  export let gameState: GameState;
  export let activeBuffs: Array<{ name: string; description: string; duration?: number }> = [];
  export let style: string = '';

  // Extract active upgrades from game state reactively
  $: activeUpgrades = Array.from(gameState.upgrades.upgrades.values())
    .filter(upgrade => upgrade.level > 0)
    .map(upgrade => {
      const effect = upgradeService.calculateUpgradeEffect(upgrade);
      const effectDescription = upgradeService.getEffectDescription(upgrade.type, effect);
      return {
        ...upgrade,
        effectDescription
      };
    });

  // Calculate total cards collected if available
  $: totalCardsCollected = gameState.cardCollection
    ? Array.from(gameState.cardCollection.values()).reduce((sum, count) => sum + count, 0)
    : 0;
</script>

<div
  class="state-info-zone"
  style={style || `width: ${width}px; height: ${height}px;`}
  role="region"
  aria-label="State information zone"
>
  <div class="zone-content">
    <!-- Compact header with title and stats inline -->
    <div class="header-row">
      <h3 class="zone-title">Active Status</h3>
      <div class="stats-inline">
        <span class="stat-item-inline">
          <span class="stat-label-inline">Decks:</span>
          <span class="stat-value-inline">{gameState.decks}</span>
        </span>
        {#if totalCardsCollected > 0}
          <span class="stat-item-inline">
            <span class="stat-label-inline">Cards:</span>
            <span class="stat-value-inline">{formatNumber(totalCardsCollected)}</span>
          </span>
        {/if}
      </div>
    </div>

    <!-- Compact upgrades and buffs in a grid -->
    <div class="content-grid">
      {#if activeUpgrades.length > 0}
        <div class="section-compact" role="group" aria-labelledby="upgrades-heading">
          <h4 id="upgrades-heading" class="section-title">Upgrades ({activeUpgrades.length})</h4>
          <div class="compact-list">
            {#each activeUpgrades as upgrade (upgrade.type)}
              <div class="compact-item">
                <span class="item-name">{upgrade.type.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span class="item-level">Lv.{upgrade.level}</span>
              </div>
            {/each}
          </div>
        </div>
      {:else}
        <div class="section-compact empty-state">
          <p class="empty-message">No active upgrades</p>
        </div>
      {/if}

      {#if activeBuffs.length > 0}
        <div class="section-compact" role="group" aria-labelledby="buffs-heading">
          <h4 id="buffs-heading" class="section-title">Buffs ({activeBuffs.length})</h4>
          <div class="compact-list">
            {#each activeBuffs as buff (buff.name)}
              <div class="compact-item">
                <span class="item-name">{buff.name}</span>
                {#if buff.duration}
                  <span class="item-duration">{buff.duration}s</span>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .state-info-zone {
    position: relative;
    overflow: hidden;
    background-color: #3a2a1a;
    border: 2px solid #ff8c42;
    padding: 0.25rem;
    display: flex;
    flex-direction: column;
    transition: border-color 0.2s;
    box-sizing: border-box;
  }

  .state-info-zone:hover {
    border-color: #555;
  }

  .state-info-zone:focus-within {
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
    gap: 0.25rem;
  }

  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.125rem 0.25rem;
    border-bottom: 1px solid rgba(255, 140, 66, 0.3);
    flex-shrink: 0;
  }

  .zone-title {
    margin: 0;
    font-size: 0.85rem;
    color: #fff;
    font-weight: bold;
  }

  .stats-inline {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .stat-item-inline {
    display: flex;
    gap: 0.25rem;
    align-items: center;
    font-size: 0.75rem;
  }

  .stat-label-inline {
    color: #aaa;
  }

  .stat-value-inline {
    color: #fff;
    font-weight: 500;
  }

  .content-grid {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    min-height: 0;
    overflow: hidden;
    padding: 0.25rem 0;
  }

  .section-compact {
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }

  .section-title {
    margin: 0 0 0.125rem 0;
    font-size: 0.75rem;
    color: #aaa;
    font-weight: normal;
    flex-shrink: 0;
  }

  .compact-list {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;
  }

  .compact-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.125rem 0.25rem;
    font-size: 0.7rem;
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 2px;
    min-height: 0;
  }

  .item-name {
    color: #fff;
    text-transform: capitalize;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
  }

  .item-level {
    color: #4caf50;
    font-size: 0.65rem;
    font-weight: bold;
    margin-left: 0.25rem;
    flex-shrink: 0;
  }

  .item-duration {
    color: #888;
    font-size: 0.65rem;
    margin-left: 0.25rem;
    flex-shrink: 0;
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
  }

  .empty-message {
    color: #888;
    font-size: 0.7rem;
    font-style: italic;
    margin: 0;
  }

  /* Hide scrollbar but keep functionality */
  .compact-list::-webkit-scrollbar {
    width: 2px;
  }

  .compact-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .compact-list::-webkit-scrollbar-thumb {
    background: rgba(255, 140, 66, 0.3);
    border-radius: 1px;
  }
</style>
