<script lang="ts">
  import { upgradeService } from '../services/upgradeService.js';
  import { gameStateService } from '../services/gameStateService.js';
  import { gameModeService } from '../services/gameModeService.js';
  import type { UpgradeInfo } from '../services/upgradeService.js';
  import type { GameState } from '../models/GameState.js';
  import { InsufficientResourcesError, ERROR_MESSAGES } from '../utils/errors.js';
  import { formatNumber } from '../utils/numberFormat.js';
  import type { UpgradeType } from '../models/types.js';

  export let gameState: GameState;
  export let onUpgradePurchase: ((upgradeType: string) => void | Promise<void>) | undefined = undefined;
  export let hideTitle: boolean = false;

  let errorMessage: string | null = null;
  let successMessage: string | null = null;
  let hoveredCell: number | null = null;
  let tooltipX: number = 0;
  let tooltipY: number = 0;

  // Reactive statements that track gameState changes
  // Create a reactive key from upgrade levels to ensure reactivity when levels change
  $: upgradesKey = gameState 
    ? Array.from(gameState.upgrades.upgrades.entries())
        .map(([type, upgrade]) => `${type}:${upgrade.level}`)
        .join(',')
    : '';
  $: allAvailableUpgrades = gameState ? upgradeService.getAvailableUpgrades(gameState.upgrades) : [];
  
  // Filter upgrades based on current game mode
  $: allowedUpgradeTypes = gameModeService.getAllowedUpgrades();
  $: availableUpgrades = allowedUpgradeTypes.length > 0
    ? allAvailableUpgrades.filter(upgrade => allowedUpgradeTypes.includes(upgrade.type))
    : allAvailableUpgrades; // If no restrictions, show all
  
  $: currentScore = gameState?.score ?? 0;
  
  // Create upgrade map by type for quick lookup
  // Explicitly track gameState and upgradesKey to ensure reactivity
  $: upgradeMap = gameState && upgradesKey
    ? new Map(availableUpgrades.map(upgrade => [upgrade.type, upgrade]))
    : new Map<UpgradeType, UpgradeInfo>();
  
  // Pre-compute cell data to avoid issues with {@const} in each blocks
  $: cellData = Array.from({ length: TOTAL_CELLS }, (_, cellIndex) => {
    const upgrade = getUpgradeForCell(cellIndex);
    const hasUpgrade = upgrade !== null;
    const upgradeCost = getUpgradeCost(upgrade);
    const upgradeLevel = hasUpgrade && upgrade ? upgrade.level : 0;
    const affordable = hasUpgrade && currentScore >= upgradeCost;
    const unaffordable = hasUpgrade && currentScore < upgradeCost;
    
    return {
      cellIndex,
      upgrade,
      hasUpgrade,
      upgradeCost,
      upgradeLevel,
      affordable,
      unaffordable
    };
  });
  

  // Grid dimensions: 8 columns x 5 rows = 40 cells
  const GRID_COLS = 8;
  const GRID_ROWS = 5;
  const TOTAL_CELLS = GRID_COLS * GRID_ROWS;

  // ASCII icons for each upgrade type (temporary, will be replaced with images)
  const UPGRADE_ICONS: Record<UpgradeType, string> = {
    autoOpening: '⚡',
    improvedRarity: '✨',
    luckyDrop: '🍀',
    multidraw: '🎯',
    deckProduction: '📦',
    sceneCustomization: '🎨'
  };

  // Map upgrade types to grid positions (first 6 cells, can be expanded)
  const UPGRADE_POSITIONS: Record<UpgradeType, number> = {
    autoOpening: 0,
    improvedRarity: 1,
    luckyDrop: 2,
    multidraw: 3,
    deckProduction: 4,
    sceneCustomization: 5
  };

  // Get upgrade for a cell index, or null if empty
  function getUpgradeForCell(cellIndex: number): UpgradeInfo | null {
    if (!upgradeMap || upgradeMap.size === 0) {
      return null;
    }
    for (const [type, position] of Object.entries(UPGRADE_POSITIONS)) {
      if (position === cellIndex) {
        const upgrade = upgradeMap.get(type as UpgradeType);
        return upgrade || null;
      }
    }
    return null;
  }

  // Get icon for a cell
  function getCellIcon(cellIndex: number): string {
    const upgrade = getUpgradeForCell(cellIndex);
    if (upgrade !== null) {
      return UPGRADE_ICONS[upgrade.type];
    }
    return '·'; // Empty cell
  }

  // Check if cell has an upgrade
  function hasUpgradeInCell(cellIndex: number): boolean {
    return getUpgradeForCell(cellIndex) !== null;
  }

  // Safely get upgrade level
  function getUpgradeLevel(upgrade: UpgradeInfo | null): number {
    return upgrade?.level ?? 0;
  }

  // Safely get upgrade cost
  function getUpgradeCost(upgrade: UpgradeInfo | null): number {
    return upgrade?.cost ?? Infinity;
  }


  async function handlePurchaseUpgrade(upgradeType: string) {
    try {
      errorMessage = null;
      successMessage = null;
      hoveredCell = null; // Close tooltip when purchasing
      
      // Use callback if provided, otherwise use service directly
      if (onUpgradePurchase) {
        await onUpgradePurchase(upgradeType);
      } else {
        await gameStateService.purchaseUpgrade(upgradeType as any);
      }
      
      successMessage = 'Upgrade purchased successfully!';
      setTimeout(() => {
        successMessage = null;
      }, 2000);
    } catch (error) {
      if (error instanceof InsufficientResourcesError) {
        errorMessage = error.message;
      } else {
        errorMessage = 'Failed to purchase upgrade.';
        console.error('Upgrade purchase error:', error);
      }
    }
  }

  function handleCellClick(cellIndex: number) {
    const upgrade = getUpgradeForCell(cellIndex);
    if (upgrade !== null && currentScore >= upgrade.cost) {
      handlePurchaseUpgrade(upgrade.type);
    }
  }

  function handleCellHover(event: MouseEvent, cellIndex: number) {
    const upgrade = getUpgradeForCell(cellIndex);
    if (upgrade !== null) {
      hoveredCell = cellIndex;
      tooltipX = event.clientX;
      tooltipY = event.clientY;
    }
  }

  function handleCellLeave() {
    hoveredCell = null;
  }

  function getUpgradeTypeName(type: UpgradeType): string {
    return type.replace(/([A-Z])/g, ' $1').trim();
  }

</script>

<div class="upgrade-shop">
  {#if !hideTitle}
    <h2>Upgrade Shop</h2>
  {/if}
  
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

  <div class="upgrades-grid">
    {#each cellData as cell (cell.cellIndex)}
      <div
        class="grid-cell"
        class:has-upgrade={cell.hasUpgrade}
        class:affordable={cell.affordable}
        class:unaffordable={cell.unaffordable}
        class:empty={!cell.hasUpgrade}
        on:click={() => handleCellClick(cell.cellIndex)}
        on:mouseenter={(e) => handleCellHover(e, cell.cellIndex)}
        on:mouseleave={handleCellLeave}
        on:keydown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && cell.hasUpgrade && cell.affordable) {
            e.preventDefault();
            handleCellClick(cell.cellIndex);
          }
        }}
        role={cell.hasUpgrade ? "button" : "presentation"}
        tabindex={cell.hasUpgrade && cell.affordable ? 0 : -1}
        aria-label={cell.hasUpgrade && cell.upgrade ? (cell.affordable ? `Purchase ${getUpgradeTypeName(cell.upgrade.type)} upgrade` : `${getUpgradeTypeName(cell.upgrade.type)} upgrade - Insufficient Chaos Orbs`) : "Empty cell"}
        aria-disabled={cell.hasUpgrade && !cell.affordable}
      >
        <span class="cell-icon">{getCellIcon(cell.cellIndex)}</span>
        {#if cell.upgradeLevel > 0}
          <span class="cell-level">{cell.upgradeLevel}</span>
        {/if}
      </div>
    {/each}
  </div>


  {#if hoveredCell !== null}
    {@const upgrade = getUpgradeForCell(hoveredCell)}
    {#if upgrade !== null}
      <div
        class="tooltip"
        style="left: {tooltipX}px; top: {tooltipY}px;"
        role="tooltip"
      >
        <div class="tooltip-header">
          <h3>{getUpgradeTypeName(upgrade.type)}</h3>
          {#if upgrade.level > 0}
            <span class="tooltip-level">Level {upgrade.level}</span>
          {/if}
        </div>
        <div class="tooltip-content">
          <p class="tooltip-effect">{upgrade.effectDescription}</p>
          <p class="tooltip-cost">Cost: {formatNumber(upgrade.cost)}</p>
          {#if currentScore < upgrade.cost}
            <p class="tooltip-insufficient">Insufficient Chaos Orbs</p>
          {/if}
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .upgrade-shop {
    margin: 0;
    padding: 0.25rem;
    background-color: transparent;
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .upgrade-shop h2 {
    margin: 0 0 0.25rem 0;
    font-size: 0.9rem;
    padding: 0.125rem 0;
  }

  .upgrades-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    grid-template-rows: repeat(5, 1fr);
    gap: 0.15rem;
    flex: 1 1 auto;
    min-height: 0;
    overflow: hidden;
  }

  .grid-cell {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #2a2a2a;
    border: 1px solid #444;
    border-radius: 2px;
    position: relative;
    cursor: default;
    transition: all 0.2s;
    min-width: 0;
    min-height: 0;
  }

  .grid-cell.empty {
    background-color: #1a1a1a;
    border-color: #333;
  }

  .grid-cell.has-upgrade {
    cursor: pointer;
    background-color: #2a2a3a;
    border-color: #555;
  }

  .grid-cell.has-upgrade:hover {
    background-color: #3a3a4a;
    border-color: #666;
    transform: scale(1.05);
    z-index: 10;
  }

  /* Affordable upgrades - highlighted with green glow */
  .grid-cell.affordable {
    border-color: #4caf50;
    border-width: 2px;
    background-color: #2a3a2a;
    box-shadow: 0 0 4px rgba(76, 175, 80, 0.3);
  }

  .grid-cell.affordable:hover {
    border-color: #5cbf60;
    background-color: #3a4a3a;
    box-shadow: 0 0 12px rgba(76, 175, 80, 0.6);
    transform: scale(1.08);
  }

  .grid-cell.affordable .cell-icon {
    filter: brightness(1.2);
    text-shadow: 0 0 4px rgba(76, 175, 80, 0.5);
  }

  /* Unaffordable upgrades - dimmed and grayed out */
  .grid-cell.unaffordable {
    border-color: #666;
    background-color: #1a1a1a;
    opacity: 0.5;
    cursor: not-allowed;
  }

  .grid-cell.unaffordable:hover {
    background-color: #1a1a1a;
    border-color: #777;
    transform: none;
    box-shadow: none;
  }

  .grid-cell.unaffordable .cell-icon {
    filter: grayscale(0.8) brightness(0.6);
  }

  .cell-icon {
    font-size: 1.2rem;
    line-height: 1;
  }

  .cell-level {
    position: absolute;
    bottom: 2px;
    right: 4px;
    font-size: 0.7rem;
    color: #4caf50;
    font-weight: bold;
    background-color: rgba(0, 0, 0, 0.7);
    padding: 1px 3px;
    border-radius: 2px;
  }

  .tooltip {
    position: fixed;
    background-color: #1a1a2e;
    border: 2px solid #4a90e2;
    border-radius: 6px;
    padding: 0.75rem;
    min-width: 200px;
    max-width: 300px;
    z-index: 1000;
    pointer-events: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    transform: translate(-50%, -100%);
    margin-top: -8px;
  }

  .tooltip-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(74, 144, 226, 0.3);
  }

  .tooltip-header h3 {
    margin: 0;
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.9);
    text-transform: capitalize;
  }

  .tooltip-level {
    font-size: 0.85rem;
    color: #4caf50;
    font-weight: bold;
  }

  .tooltip-content {
    font-size: 0.85rem;
  }

  .tooltip-effect {
    margin: 0.25rem 0;
    color: #4caf50;
    font-weight: bold;
  }

  .tooltip-cost {
    margin: 0.25rem 0;
    color: #ffd700;
  }

  .tooltip-insufficient {
    margin: 0.25rem 0 0 0;
    color: #888;
    font-size: 0.8rem;
  }

  .error {
    margin: 0.5rem 0;
    padding: 0.5rem;
    background-color: #f44336;
    color: white;
    border-radius: 4px;
    font-size: 0.85rem;
  }

  .success {
    margin: 0.5rem 0;
    padding: 0.5rem;
    background-color: #4caf50;
    color: white;
    border-radius: 4px;
    font-size: 0.85rem;
  }

</style>
