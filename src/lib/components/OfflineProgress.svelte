<script lang="ts">
  import type { OfflineProgressionResult } from '../models/OfflineProgressionResult.js';
  import { formatNumber } from '../utils/numberFormat.js';

  export let result: OfflineProgressionResult;

  function formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      if (minutes > 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
      }
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      if (hours > 0) {
        return `${days} day${days !== 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`;
      }
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
  }
</script>

<div class="offline-progress">
  <h2>Welcome Back!</h2>
  <p class="time-elapsed">
    You were away for <strong>{formatTime(result.elapsedSeconds)}</strong>
    {#if result.capped}
      <span class="capped">(capped at 7 days)</span>
    {/if}
  </p>

  <div class="progress-stats">
    <div class="stat">
      <span class="stat-label">Decks Opened:</span>
      <span class="stat-value">{result.decksOpened}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Chaos Orbs Gained:</span>
      <span class="stat-value score">+{formatNumber(result.scoreGained)}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Cards Found:</span>
      <span class="stat-value">{result.cardsDrawn.length}</span>
    </div>
  </div>

  {#if result.cardsDrawn.length > 0}
    <div class="cards-preview">
      <h3>Cards Found:</h3>
      <div class="cards-list">
        {#each result.cardsDrawn.slice(0, 10) as cardResult}
          <div class="card-item">
            <span class="card-name">{cardResult.card.name}</span>
            <span class="card-value">+{cardResult.card.value}</span>
          </div>
        {/each}
        {#if result.cardsDrawn.length > 10}
          <div class="card-item more">
            ...and {result.cardsDrawn.length - 10} more
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .offline-progress {
    margin: 2rem 0;
    padding: 1.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    color: white;
  }

  .offline-progress h2 {
    margin-top: 0;
    margin-bottom: 1rem;
  }

  .time-elapsed {
    font-size: 1.1rem;
    margin-bottom: 1.5rem;
  }

  .time-elapsed strong {
    color: #ffd700;
  }

  .capped {
    font-size: 0.9rem;
    opacity: 0.9;
    font-style: italic;
  }

  .progress-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }

  .stat-label {
    font-size: 0.9rem;
    opacity: 0.9;
    margin-bottom: 0.5rem;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: bold;
  }

  .stat-value.score {
    color: #4caf50;
  }

  .cards-preview {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }

  .cards-preview h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.1rem;
  }

  .cards-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 200px;
    overflow-y: auto;
  }

  .card-item {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .card-item.more {
    justify-content: center;
    font-style: italic;
    opacity: 0.8;
  }

  .card-name {
    flex: 1;
  }

  .card-value {
    color: #4caf50;
    font-weight: bold;
  }
</style>

