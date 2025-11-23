<script lang="ts">
  import { onMount } from 'svelte';
  import { dataVersionStore, getVersionInfo, hasAnyUpdates } from '../stores/dataVersionStore.js';
  import { dataUpdateService } from '../services/dataUpdateService.js';
  import { setUpdateStatus } from '../stores/dataVersionStore.js';
  import type { UpdateStatus } from '../models/DataVersion.js';

  export let isOpen = false;

  let checkingUpdates = false;
  let refreshing = false;
  let errorMessage: string | null = null;
  let successMessage: string | null = null;

  // Get data file configs
  const dataFiles = dataUpdateService.getDataFileConfigs();

  // Reactive store subscription
  $: updateStatuses = $dataVersionStore;
  $: hasUpdates = hasAnyUpdates();

  // Track if we've checked on this open
  let hasCheckedOnOpen = false;

  // Check for updates when overlay opens (only once per open)
  $: if (isOpen && !checkingUpdates && !refreshing && !hasCheckedOnOpen) {
    hasCheckedOnOpen = true;
    checkForUpdates().catch((error) => {
      console.error('Error in checkForUpdates:', error);
      checkingUpdates = false;
    });
  }

  // Reset check flag when overlay closes
  $: if (!isOpen) {
    hasCheckedOnOpen = false;
  }

  // Check for updates for all files
  async function checkForUpdates() {
    if (checkingUpdates) return; // Prevent duplicate calls
    checkingUpdates = true;
    errorMessage = null;
    successMessage = null;

    try {
      // Clear previous status to show we're checking
      const newStatuses: Record<string, UpdateStatus> = {};
      for (const file of dataFiles) {
        const cacheInfo = dataUpdateService.getCacheInfo(file.fileName);
        newStatuses[file.fileName] = {
          fileName: file.fileName,
          hasUpdate: false,
          serverHash: null,
          serverTimestamp: null,
          localTimestamp: cacheInfo.timestamp,
          metadataChecked: false,
          fileNotFound: false,
          isUpdating: true,
          lastError: null,
        };
      }
      dataVersionStore.set(newStatuses);

      // Check each file with timeout
      const checkPromises = dataFiles.map(async (file) => {
        try {
          // Add timeout to prevent hanging
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Update check timeout')), 10000); // 10 second timeout
          });

          const result = await Promise.race([
            dataUpdateService.checkForNewData(file.fileName, true),
            timeoutPromise,
          ]);

          const cacheInfo = dataUpdateService.getCacheInfo(file.fileName);

          setUpdateStatus(file.fileName, {
            fileName: file.fileName,
            hasUpdate: result.hasUpdate,
            serverHash: result.serverHash,
            serverTimestamp: result.serverTimestamp,
            localTimestamp: cacheInfo.timestamp,
            metadataChecked: result.metadataChecked,
            fileNotFound: result.fileNotFound,
            isUpdating: false,
            lastError: null,
          });
        } catch (error) {
          console.error(`Failed to check updates for ${file.fileName}:`, error);
          const cacheInfo = dataUpdateService.getCacheInfo(file.fileName);
          setUpdateStatus(file.fileName, {
            fileName: file.fileName,
            hasUpdate: false,
            serverHash: null,
            serverTimestamp: null,
            localTimestamp: cacheInfo.timestamp,
            metadataChecked: false,
            fileNotFound: false,
            isUpdating: false,
            lastError: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      });

      await Promise.all(checkPromises);
    } catch (error) {
      errorMessage = 'Failed to check for updates. Please try again.';
      console.error('Error checking for updates:', error);
      
      // Make sure all files are marked as not updating
      for (const file of dataFiles) {
        const currentStatus = $dataVersionStore[file.fileName];
        if (currentStatus?.isUpdating) {
          const cacheInfo = dataUpdateService.getCacheInfo(file.fileName);
          setUpdateStatus(file.fileName, {
            ...currentStatus,
            isUpdating: false,
            localTimestamp: cacheInfo.timestamp,
            lastError: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    } finally {
      checkingUpdates = false;
    }
  }

  // Force refresh all data
  async function forceRefreshAll() {
    refreshing = true;
    errorMessage = null;
    successMessage = null;

    try {
      // Set updating status for all files
      for (const file of dataFiles) {
        setUpdateStatus(file.fileName, {
          fileName: file.fileName,
          hasUpdate: false,
          serverHash: null,
          serverTimestamp: null,
          localTimestamp: null,
          metadataChecked: false,
          fileNotFound: false,
          isUpdating: true,
          lastError: null,
        });
      }

      // Refresh all data files
      await dataUpdateService.forceRefreshAll();

      // Check for updates again to refresh status
      await checkForUpdates();

      successMessage = 'Data refreshed successfully! The page will now use the latest data.';
    } catch (error) {
      errorMessage = 'Failed to refresh data. Please try again or refresh the page.';
      console.error('Failed to refresh data:', error);

      // Update status to show error
      for (const file of dataFiles) {
        const currentStatus = $dataVersionStore[file.fileName];
        if (currentStatus) {
          setUpdateStatus(file.fileName, {
            ...currentStatus,
            isUpdating: false,
            lastError: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    } finally {
      refreshing = false;
    }
  }

  function handleClose() {
    isOpen = false;
    errorMessage = null;
    successMessage = null;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleClose();
    }
  }
</script>

{#if isOpen}
  <div
    class="modal-overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="data-version-title"
    on:click|self={handleClose}
    on:keydown={handleKeydown}
    tabindex="-1"
  >
    <div class="modal-content" role="document" on:click|stopPropagation on:keydown|stopPropagation>
      <div class="modal-header">
        <h2 id="data-version-title">Data Version</h2>
        <button
          class="modal-close"
          on:click={handleClose}
          aria-label="Close data version overlay"
        >
          ×
        </button>
      </div>
      <div class="modal-body">
        <div class="data-version-section">
          <div class="section-header">
            <h3>Data Status</h3>
            <div class="button-group">
              <button
                class="btn btn-outline"
                disabled={checkingUpdates || refreshing}
                on:click={checkForUpdates}
                aria-label="Check for updates"
              >
                {#if checkingUpdates}
                  Checking...
                {:else}
                  Check for Updates
                {/if}
              </button>
              <button
                class="btn btn-primary"
                disabled={checkingUpdates || refreshing}
                on:click={forceRefreshAll}
                aria-label="Refresh data"
              >
                {#if refreshing}
                  Refreshing...
                {:else}
                  Refresh Data
                {/if}
              </button>
            </div>
          </div>

          {#if hasUpdates}
            <div class="alert alert-info" role="alert">
              New data is available! Click "Refresh Data" to update.
            </div>
          {/if}

          {#if errorMessage}
            <div class="alert alert-error" role="alert">
              {errorMessage}
            </div>
          {/if}

          {#if successMessage}
            <div class="alert alert-success" role="alert">
              {successMessage}
            </div>
          {/if}

          <table class="data-table">
            <thead>
              <tr>
                <th>File</th>
                <th>Timestamp / Status</th>
              </tr>
            </thead>
            <tbody>
              {#each dataFiles as file (file.fileName)}
                {@const versionInfo = getVersionInfo(file.fileName, file.displayName)}
                <tr>
                  <td>{file.displayName}</td>
                  <td>
                    <div class="status-cell">
                      <span class={versionInfo.timestampClass}>
                        {versionInfo.timestampText}
                      </span>
                      <span
                        class="status-chip status-chip-{versionInfo.statusColor}"
                        role="status"
                        aria-label="Status: {versionInfo.statusText}"
                      >
                        {versionInfo.statusText}
                      </span>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>

          <div class="data-version-footer">
            Data is automatically checked for updates every hour. You can manually check or refresh at any time.
          </div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" on:click={handleClose}>
          Close
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: 1rem;
  }

  .modal-content {
    background-color: #1a1a1a;
    border-radius: 8px;
    max-width: 800px;
    max-height: 90vh;
    width: 100%;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #333;
  }

  .modal-header h2 {
    margin: 0;
    color: #fff;
    font-size: 1.5rem;
  }

  .modal-close {
    background: none;
    border: none;
    color: #fff;
    font-size: 2rem;
    cursor: pointer;
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .modal-close:hover {
    background-color: #333;
  }

  .modal-close:focus {
    outline: 2px solid #4a9eff;
    outline-offset: 2px;
  }

  .modal-body {
    overflow-y: auto;
    padding: 1rem;
  }

  .data-version-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .section-header h3 {
    margin: 0;
    color: #fff;
    font-size: 1.2rem;
  }

  .button-group {
    display: flex;
    gap: 0.5rem;
  }

  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background-color 0.2s;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-outline {
    background-color: transparent;
    border: 1px solid #4a9eff;
    color: #4a9eff;
  }

  .btn-outline:hover:not(:disabled) {
    background-color: rgba(74, 158, 255, 0.1);
  }

  .btn-primary {
    background-color: #4a9eff;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background-color: #3a8eef;
  }

  .btn-secondary {
    background-color: #666;
    color: white;
  }

  .btn-secondary:hover {
    background-color: #777;
  }

  .alert {
    padding: 0.75rem 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
  }

  .alert-info {
    background-color: rgba(74, 158, 255, 0.2);
    border: 1px solid #4a9eff;
    color: #4a9eff;
  }

  .alert-error {
    background-color: rgba(244, 67, 54, 0.2);
    border: 1px solid #f44336;
    color: #f44336;
  }

  .alert-success {
    background-color: rgba(76, 175, 80, 0.2);
    border: 1px solid #4caf50;
    color: #4caf50;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
  }

  .data-table th,
  .data-table td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #333;
  }

  .data-table th {
    color: #fff;
    font-weight: 600;
  }

  .data-table td {
    color: #ccc;
  }

  .status-cell {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .status-chip {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
    width: fit-content;
  }

  .status-chip-success {
    background-color: rgba(76, 175, 80, 0.2);
    color: #4caf50;
    border: 1px solid #4caf50;
  }

  .status-chip-warning {
    background-color: rgba(255, 152, 0, 0.2);
    color: #ff9800;
    border: 1px solid #ff9800;
  }

  .status-chip-error {
    background-color: rgba(244, 67, 54, 0.2);
    color: #f44336;
    border: 1px solid #f44336;
  }

  .status-chip-grey {
    background-color: rgba(128, 128, 128, 0.2);
    color: #888;
    border: 1px solid #888;
  }

  .text-success {
    color: #4caf50;
  }

  .text-error {
    color: #f44336;
  }

  .text-grey {
    color: #888;
  }

  .data-version-footer {
    font-size: 0.85rem;
    color: #888;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #333;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    padding: 1rem;
    border-top: 1px solid #333;
  }

  @media (max-width: 768px) {
    .section-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .button-group {
      width: 100%;
    }

    .btn {
      flex: 1;
    }
  }
</style>

