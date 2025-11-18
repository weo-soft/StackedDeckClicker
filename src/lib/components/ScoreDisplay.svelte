<script lang="ts">
  import { formatNumber } from '../utils/numberFormat.js';

  export let score: number = 0;

  $: formattedScore = formatNumber(score);
</script>

<div class="score-display" role="status" aria-live="polite" aria-atomic="true">
  <h2>Chaos Orbs</h2>
  <p class="score-value">{formattedScore}</p>
</div>

<style>
  .score-display {
    text-align: center;
    padding: 1rem;
  }

  .score-display h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.2rem;
  }

  .score-value {
    font-size: 2rem;
    font-weight: bold;
    margin: 0;
    color: #4caf50;
  }
</style>

