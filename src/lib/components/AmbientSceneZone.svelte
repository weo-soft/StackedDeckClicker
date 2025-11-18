<script lang="ts">
  import GameCanvas from './GameCanvas.svelte';
  import type { GameState } from '../models/GameState.js';
  import type { DivinationCard } from '../models/Card.js';
  import type { ZoneLayout } from '../models/ZoneLayout.js';
  import { zoneLayoutService } from '../services/zoneLayoutService.js';
  import { ZoneType } from '../models/ZoneLayout.js';

  export let width: number;
  export let height: number;
  export let gameState: GameState | undefined = undefined;
  export let zoneLayout: ZoneLayout | null = null;
  export let onCardDrop: ((card: DivinationCard, position: { x: number; y: number }) => void) | undefined = undefined;
  export let style: string = '';

  let gameCanvas: GameCanvas | null = null;

  // Create zone boundary validator function
  // Converts canvas coordinates to container coordinates for zone validation
  $: zoneBoundaryValidator = zoneLayout
    ? (canvasX: number, canvasY: number) => {
        // Get white zone position to convert canvas coords to container coords
        const whiteZone = zoneLayout.zones.get(ZoneType.WHITE);
        if (!whiteZone) return false;
        
        // Convert canvas coordinates to container coordinates
        const containerX = whiteZone.x + canvasX;
        const containerY = whiteZone.y + canvasY;
        
        return zoneLayoutService.isValidCardDropPosition(zoneLayout, containerX, containerY);
      }
    : null;

  // Debug: Log when zone layout changes
  $: if (zoneLayout) {
    console.log('AmbientSceneZone: zoneLayout updated', {
      hasZoneLayout: !!zoneLayout,
      hasYellowZone: zoneLayout.zones.has(ZoneType.YELLOW),
      yellowZone: zoneLayout.zones.has(ZoneType.YELLOW) ? zoneLayout.zones.get(ZoneType.YELLOW) : null
    });
  } else {
    console.log('AmbientSceneZone: zoneLayout is null');
  }

  export function addCard(card: DivinationCard, position?: { x: number; y: number }): void {
    if (gameCanvas) {
      gameCanvas.addCard(card, position);
    }
    if (onCardDrop) {
      onCardDrop(card, position || { x: width / 2, y: height / 2 });
    }
  }

  export function clearCards(): void {
    if (gameCanvas) {
      gameCanvas.clearCards();
    }
  }
</script>

<div
  class="ambient-scene-zone"
  style={style || `width: ${width}px; height: ${height}px;`}
  role="region"
  aria-label="Ambient scene zone"
>
  <GameCanvas bind:this={gameCanvas} {width} {height} {zoneLayout} {zoneBoundaryValidator} />
</div>

<style>
  .ambient-scene-zone {
    position: relative;
    overflow: hidden;
    background-color: #1a1a2e;
    border: 1px solid transparent;
    transition: border-color 0.2s, filter 0.2s;
  }

  .ambient-scene-zone:hover {
    /* Subtle hover effect for ambient scene */
    filter: brightness(1.02);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .ambient-scene-zone:focus-within {
    border-color: rgba(76, 175, 80, 0.5);
    outline: 2px solid rgba(76, 175, 80, 0.3);
    outline-offset: -2px;
  }
</style>

