<script lang="ts">
  import UpgradeShop from './UpgradeShop.svelte';
  import type { GameState } from '../models/GameState.js';
  import type { UpgradeType } from '../models/types.js';
  import { formatNumber } from '../utils/numberFormat.js';

  export let width: number;
  export let height: number;
  export let gameState: GameState;
  export let onUpgradePurchase: ((upgradeType: UpgradeType) => void) | undefined = undefined;
  export let style: string = '';

  $: formattedScore = formatNumber(gameState?.score || 0);

  function handleUpgradePurchase(upgradeType: UpgradeType) {
    if (onUpgradePurchase) {
      onUpgradePurchase(upgradeType);
    }
  }
</script>

<div
  class="upgrade-store-zone"
  style={style || `width: ${width}px; height: ${height}px;`}
  role="region"
  aria-label="Upgrade store zone"
>
  <div class="zone-content">
    <div class="header-section">
      <h2 class="upgrade-shop-title">Upgrade Shop</h2>
      <div class="score-display">
        <span class="score-label">Chaos Orbs</span>
        <span class="score-value">{formattedScore}</span>
      </div>
    </div>
    <div class="upgrade-shop-section">
      <UpgradeShop {gameState} onUpgradePurchase={handleUpgradePurchase} hideTitle={true} />
    </div>
  </div>
</div>

<style>
  .upgrade-store-zone {
    position: relative;
    overflow: hidden;
    background-color: #1a1a3e;
    border: 2px solid #4a90e2;
    padding: 0.25rem;
    display: flex;
    flex-direction: column;
    transition: border-color 0.2s;
    box-sizing: border-box;
  }

  .upgrade-store-zone:hover {
    border-color: #555;
  }

  .upgrade-store-zone:focus-within {
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

  .header-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.4rem 0.5rem;
    border-bottom: 1px solid rgba(74, 144, 226, 0.3);
    flex-shrink: 0;
  }

  .upgrade-shop-title {
    margin: 0;
    font-size: 1rem;
    font-weight: bold;
    color: rgba(255, 255, 255, 0.9);
  }

  .score-display {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .score-label {
    font-size: 0.9rem;
    font-weight: normal;
    color: rgba(255, 255, 255, 0.8);
  }

  .score-value {
    font-size: 1.2rem;
    font-weight: bold;
    color: #4caf50;
  }

  .upgrade-shop-section {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;
  }
</style>

