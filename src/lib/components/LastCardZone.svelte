<script lang="ts">
  import type { CardDrawResult } from '../models/CardDrawResult.js';

  export let width: number;
  export let height: number;
  export let lastCardDraw: CardDrawResult | null = null;
  export let style: string = '';

  $: hasCard = lastCardDraw !== null;
</script>

<div
  class="last-card-zone"
  style={style || `width: ${width}px; height: ${height}px;`}
  role="region"
  aria-label="Last card drawn display"
>
  {#if hasCard}
    <div class="card-display">
      <div class="card-header">
        <h3 class="card-title">Last Card Drawn:</h3>
        <p class="card-name">{lastCardDraw.card.name}</p>
      </div>
      <div class="card-footer">
        <p class="card-tier">Tier: {lastCardDraw.card.qualityTier}</p>
        <p class="card-value">Value: {lastCardDraw.card.value.toFixed(2)}</p>
        <p class="score-gained">+{lastCardDraw.scoreGained.toFixed(2)} chaos orbs</p>
      </div>
    </div>
  {:else}
    <div class="card-display empty">
      <p class="no-card">No card drawn yet</p>
    </div>
  {/if}
</div>

<style>
  .last-card-zone {
    position: relative;
    overflow: hidden;
    background-color: rgba(26, 26, 46, 0.85);
    border: 2px solid #9c27b0;
    border-radius: 6px;
    padding: 0.5rem;
    box-sizing: border-box;
    backdrop-filter: blur(4px);
    min-height: 0;
  }

  .card-display {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
  }

  .card-display.empty {
    justify-content: center;
    align-items: center;
  }

  .card-header {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    min-height: 0;
  }


  .card-title {
    margin: 0 0 0.25rem 0;
    font-size: 0.75rem;
    font-weight: bold;
    color: rgba(255, 255, 255, 0.9);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .card-name {
    margin: 0.25rem 0 0 0;
    font-size: 0.9rem;
    font-weight: bold;
    color: #4caf50;
    word-wrap: break-word;
    overflow: visible;
    line-height: 1.3;
    flex: 1;
  }

  .card-footer {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .card-tier {
    margin: 0;
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.7);
    text-transform: capitalize;
  }

  .card-value {
    margin: 0;
    font-size: 0.75rem;
    color: #ffd700;
  }

  .score-gained {
    margin: 0;
    font-size: 0.75rem;
    color: #4caf50;
    font-weight: bold;
  }

  .no-card {
    margin: 0;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
    font-style: italic;
  }
</style>

