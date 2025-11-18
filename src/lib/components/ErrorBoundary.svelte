<script lang="ts">
  import { onMount } from 'svelte';

  export let fallback: string = 'Something went wrong. Please refresh the page.';
  
  let error: Error | null = null;
  let errorInfo: string = '';

  onMount(() => {
    // Catch unhandled errors
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  });

  function handleError(event: ErrorEvent): void {
    error = event.error || new Error(event.message);
    errorInfo = `Error: ${event.message}\nFile: ${event.filename}:${event.lineno}:${event.colno}`;
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  function handleRejection(event: PromiseRejectionEvent): void {
    error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    errorInfo = `Unhandled Promise Rejection: ${error.message}`;
    console.error('Promise rejection caught by ErrorBoundary:', error, errorInfo);
  }

  function handleReload(): void {
    window.location.reload();
  }
</script>

{#if error}
  <div class="error-boundary" role="alert">
    <h2>Error</h2>
    <p>{fallback}</p>
    {#if import.meta.env.DEV}
      <details class="error-details">
        <summary>Error Details (Development Only)</summary>
        <pre>{errorInfo || error.message}</pre>
        <pre>{error.stack}</pre>
      </details>
    {/if}
    <button on:click={handleReload} class="reload-button">
      Reload Page
    </button>
  </div>
{:else}
  <slot />
{/if}

<style>
  .error-boundary {
    padding: 2rem;
    margin: 2rem auto;
    max-width: 600px;
    background-color: #f44336;
    color: white;
    border-radius: 8px;
    text-align: center;
  }

  .error-boundary h2 {
    margin-top: 0;
  }

  .error-details {
    margin: 1rem 0;
    text-align: left;
    background-color: rgba(0, 0, 0, 0.3);
    padding: 1rem;
    border-radius: 4px;
  }

  .error-details pre {
    white-space: pre-wrap;
    word-wrap: break-word;
    font-size: 0.85rem;
  }

  .reload-button {
    margin-top: 1rem;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    background-color: white;
    color: #f44336;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
  }

  .reload-button:hover {
    background-color: #f5f5f5;
  }
</style>

