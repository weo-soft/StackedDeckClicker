<script lang="ts">
  import { onMount } from 'svelte';
  import { tierStore } from '../stores/tierStore.js';
  import { tierService } from '../services/tierService.js';
  import type { Tier, ColorScheme, SoundConfiguration } from '../models/Tier.js';
  import { validateColorScheme } from '../utils/colorValidation.js';
  import type { ValidationResult } from '../models/Tier.js';

  export let tierId: string | null = null;
  export let onTierUpdated: ((tierId: string) => void) | undefined = undefined;

  let allTiers: Tier[] = [];
  let selectedTier: Tier | null = null;
  let editingColorScheme: ColorScheme | null = null;
  let editingSound: SoundConfiguration | null = null;
  let editingEnabled: boolean = true;
  let errorMessage: string | null = null;
  let successMessage: string | null = null;
  let colorValidation: ValidationResult | null = null;
  let isSaving = false;
  let showCreateTier = false;
  let newTierName = '';
  let createTierError: string | null = null;
  let isCreating = false;

  // Load tiers on mount
  onMount(() => {
    loadTiers();
  });

  function loadTiers() {
    allTiers = tierStore.getAllTiers();
    if (tierId) {
      selectedTier = allTiers.find(t => t.id === tierId) || null;
      if (selectedTier) {
        editingColorScheme = { ...selectedTier.config.colorScheme };
        editingSound = { ...selectedTier.config.sound };
        editingEnabled = selectedTier.config.enabled;
        validateCurrentColors();
      }
    } else if (allTiers.length > 0) {
      // Select first tier by default
      selectTier(allTiers[0].id);
    }
  }

  function selectTier(id: string) {
    selectedTier = allTiers.find(t => t.id === id) || null;
    if (selectedTier) {
      editingColorScheme = { ...selectedTier.config.colorScheme };
      editingSound = { ...selectedTier.config.sound };
      editingEnabled = selectedTier.config.enabled;
      validateCurrentColors();
      errorMessage = null;
      successMessage = null;
    }
  }

  function validateCurrentColors() {
    if (editingColorScheme) {
      colorValidation = validateColorScheme(editingColorScheme);
    }
  }

  // Reactive validation when colors change
  $: if (editingColorScheme) {
    validateCurrentColors();
  }

  function handleColorChange(field: 'backgroundColor' | 'textColor' | 'borderColor', value: string) {
    if (!editingColorScheme) return;
    
    // Ensure value starts with #
    const hexValue = value.startsWith('#') ? value : `#${value}`;
    
    editingColorScheme = {
      ...editingColorScheme,
      [field]: hexValue
    };
  }

  function handleColorInput(event: Event, field: 'backgroundColor' | 'textColor' | 'borderColor') {
    const target = event.currentTarget as HTMLInputElement;
    if (target) {
      handleColorChange(field, target.value);
    }
  }

  function handleTextInput(event: Event, field: 'backgroundColor' | 'textColor' | 'borderColor') {
    const target = event.currentTarget as HTMLInputElement;
    if (target) {
      handleColorChange(field, target.value);
    }
  }

  function handleBorderWidthInput(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    if (target && editingColorScheme) {
      const value = parseInt(target.value) || 2;
      editingColorScheme = { ...editingColorScheme, borderWidth: value };
    }
  }

  function handleSoundPathInput(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    if (target) {
      handleSoundPathChange(target.value);
    }
  }

  function handleVolumeInput(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    if (target) {
      handleVolumeChange(parseFloat(target.value));
    }
  }

  function handleSoundEnabledInput(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    if (target) {
      handleSoundEnabledChange(target.checked);
    }
  }

  function handleTierEnabledInput(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    if (target) {
      editingEnabled = target.checked;
    }
  }

  function handleSoundFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      // Create a local file URL (for preview/testing)
      // In production, you might want to upload to a server or use a file path
      const fileUrl = URL.createObjectURL(file);
      if (editingSound) {
        editingSound = {
          ...editingSound,
          filePath: fileUrl
        };
      }
    }
  }

  function handleSoundPathChange(value: string) {
    if (editingSound) {
      editingSound = {
        ...editingSound,
        filePath: value || null
      };
    }
  }

  function handleVolumeChange(value: number) {
    if (editingSound) {
      editingSound = {
        ...editingSound,
        volume: Math.max(0, Math.min(1, value))
      };
    }
  }

  function handleSoundEnabledChange(enabled: boolean) {
    if (editingSound) {
      editingSound = {
        ...editingSound,
        enabled
      };
    }
  }

  async function handleSave() {
    if (!selectedTier || !editingColorScheme || !editingSound) return;

    errorMessage = null;
    successMessage = null;

    // Validate color scheme
    const validation = validateColorScheme(editingColorScheme);
    if (!validation.isValid) {
      errorMessage = validation.error || 'Invalid color scheme';
      return;
    }

    isSaving = true;

    try {
      await tierService.updateTierConfiguration(selectedTier.id, {
        colorScheme: editingColorScheme,
        sound: editingSound,
        enabled: editingEnabled
      });

      // Refresh store
      tierStore.refresh();
      loadTiers();

      successMessage = 'Tier configuration saved successfully!';
      setTimeout(() => {
        successMessage = null;
      }, 2000);

      if (onTierUpdated) {
        onTierUpdated(selectedTier.id);
      }
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to save tier configuration';
      console.error('Save tier configuration error:', error);
    } finally {
      isSaving = false;
    }
  }

  function handleReset() {
    if (!selectedTier) return;
    
    editingColorScheme = { ...selectedTier.config.colorScheme };
    editingSound = { ...selectedTier.config.sound };
    editingEnabled = selectedTier.config.enabled;
    validateCurrentColors();
    errorMessage = null;
  }

  function getTierDisplayName(tier: Tier): string {
    return tier.type === 'default' ? `Tier ${tier.name}` : tier.name;
  }

  async function handleCreateTier() {
    createTierError = null;
    
    if (!newTierName.trim()) {
      createTierError = 'Tier name cannot be empty';
      return;
    }

    isCreating = true;

    try {
      const newTier = await tierService.createCustomTier(newTierName.trim());
      
      // Refresh store
      tierStore.refresh();
      loadTiers();
      
      // Select the new tier
      selectTier(newTier.id);
      
      // Reset form
      newTierName = '';
      showCreateTier = false;
      
      successMessage = `Custom tier "${newTier.name}" created successfully!`;
      setTimeout(() => {
        successMessage = null;
      }, 2000);
    } catch (error) {
      createTierError = error instanceof Error ? error.message : 'Failed to create custom tier';
      console.error('Create tier error:', error);
    } finally {
      isCreating = false;
    }
  }

  async function handleDeleteTier() {
    if (!selectedTier || selectedTier.type === 'default') {
      errorMessage = 'Cannot delete default tiers';
      return;
    }

    if (!confirm(`Are you sure you want to delete tier "${selectedTier.name}"? This cannot be undone.`)) {
      return;
    }

    errorMessage = null;
    successMessage = null;

    try {
      await tierService.deleteCustomTier(selectedTier.id);
      
      // Refresh store
      tierStore.refresh();
      loadTiers();
      
      // Select first tier
      if (allTiers.length > 0) {
        selectTier(allTiers[0].id);
      } else {
        selectedTier = null;
      }
      
      successMessage = 'Custom tier deleted successfully';
      setTimeout(() => {
        successMessage = null;
      }, 2000);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to delete custom tier';
      console.error('Delete tier error:', error);
    }
  }
</script>

<div class="tier-settings" role="region" aria-label="Tier settings">
  <h2>Tier Settings</h2>

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
    <!-- Tier Selection -->
    <div class="tier-selection">
      <div class="tier-selection-row">
        <label for="tier-select">Select Tier:</label>
        <button
          class="create-tier-button"
          on:click={() => showCreateTier = !showCreateTier}
          aria-label="Create new custom tier"
        >
          + Create Custom Tier
        </button>
      </div>
      <select
        id="tier-select"
        bind:value={selectedTier}
        on:change={(e) => {
          const target = e.currentTarget;
          if (target && target.value) {
            selectTier(target.value);
          }
        }}
        aria-label="Select tier to configure"
      >
        {#each allTiers as tier}
          <option value={tier.id}>
            {getTierDisplayName(tier)}{tier.config.enabled ? '' : ' (Disabled)'}
          </option>
        {/each}
      </select>
    </div>

    <!-- Create Custom Tier Form -->
    {#if showCreateTier}
      <div class="create-tier-form">
        <h3>Create Custom Tier</h3>
        <div class="form-group">
          <label for="new-tier-name">Tier Name:</label>
          <input
            id="new-tier-name"
            type="text"
            bind:value={newTierName}
            placeholder="Enter tier name (1-50 characters)"
            maxlength="50"
            aria-label="Custom tier name"
            on:keydown={(e) => {
              if (e.key === 'Enter') {
                handleCreateTier();
              } else if (e.key === 'Escape') {
                showCreateTier = false;
                newTierName = '';
              }
            }}
          />
          <p class="hint">Tier name must be unique and cannot be S, A, B, C, D, E, or F</p>
        </div>
        {#if createTierError}
          <div class="error" role="alert">
            {createTierError}
          </div>
        {/if}
        <div class="form-actions">
          <button
            on:click={handleCreateTier}
            disabled={isCreating || !newTierName.trim()}
            aria-label="Create custom tier"
          >
            {isCreating ? 'Creating...' : 'Create Tier'}
          </button>
          <button
            on:click={() => {
              showCreateTier = false;
              newTierName = '';
              createTierError = null;
            }}
            disabled={isCreating}
            aria-label="Cancel creating tier"
          >
            Cancel
          </button>
        </div>
      </div>
    {/if}

    {#if selectedTier && editingColorScheme && editingSound}
      <div class="tier-config">
        <!-- Color Scheme Editor -->
        <div class="color-scheme-editor">
          <h3>Color Scheme</h3>
          
          <!-- Visual Preview -->
          <div class="color-preview" style="background-color: {editingColorScheme.backgroundColor}; color: {editingColorScheme.textColor}; border: {editingColorScheme.borderWidth || 2}px solid {editingColorScheme.borderColor};">
            <p>Preview Text</p>
          </div>

          <!-- Color Inputs -->
          <div class="color-inputs">
            <div class="color-input-group">
              <label for="bg-color">Background Color:</label>
              <input
                id="bg-color"
                type="color"
                value={editingColorScheme.backgroundColor}
                on:input={(e) => handleColorInput(e, 'backgroundColor')}
                aria-label="Background color picker"
              />
              <input
                type="text"
                value={editingColorScheme.backgroundColor}
                on:input={(e) => handleTextInput(e, 'backgroundColor')}
                placeholder="#RRGGBB"
                aria-label="Background color hex value"
              />
            </div>

            <div class="color-input-group">
              <label for="text-color">Text Color:</label>
              <input
                id="text-color"
                type="color"
                value={editingColorScheme.textColor}
                on:input={(e) => handleColorInput(e, 'textColor')}
                aria-label="Text color picker"
              />
              <input
                type="text"
                value={editingColorScheme.textColor}
                on:input={(e) => handleTextInput(e, 'textColor')}
                placeholder="#RRGGBB"
                aria-label="Text color hex value"
              />
            </div>

            <div class="color-input-group">
              <label for="border-color">Border Color:</label>
              <input
                id="border-color"
                type="color"
                value={editingColorScheme.borderColor}
                on:input={(e) => handleColorInput(e, 'borderColor')}
                aria-label="Border color picker"
              />
              <input
                type="text"
                value={editingColorScheme.borderColor}
                on:input={(e) => handleTextInput(e, 'borderColor')}
                placeholder="#RRGGBB"
                aria-label="Border color hex value"
              />
            </div>

            <div class="color-input-group">
              <label for="border-width">Border Width (px):</label>
              <input
                id="border-width"
                type="number"
                min="0"
                max="10"
                value={editingColorScheme.borderWidth || 2}
                on:input={handleBorderWidthInput}
                aria-label="Border width in pixels"
              />
            </div>
          </div>

          <!-- Color Validation Feedback -->
          {#if colorValidation}
            {#if colorValidation.isValid}
              <div class="validation-success" role="status">
                ✓ Color scheme is valid (Contrast ratio: {colorValidation.contrastRatio?.toFixed(2)})
              </div>
            {:else}
              <div class="validation-error" role="alert">
                ⚠ {colorValidation.error}
              </div>
            {/if}
          {/if}
        </div>

        <!-- Sound Configuration -->
        <div class="sound-config">
          <h3>Drop Sound</h3>
          
          <div class="sound-input-group">
            <label for="sound-file">Sound File Path (optional):</label>
            <input
              id="sound-file"
              type="text"
              value={editingSound.filePath || ''}
              on:input={handleSoundPathInput}
              placeholder="/sounds/tiers/tier-s.mp3"
              aria-label="Sound file path"
            />
            <input
              type="file"
              accept="audio/*"
              on:change={handleSoundFileChange}
              aria-label="Upload sound file"
            />
            <p class="hint">Leave empty to use default quality tier sound</p>
          </div>

          <div class="sound-input-group">
            <label for="sound-volume">Volume:</label>
            <input
              id="sound-volume"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={editingSound.volume ?? 1.0}
              on:input={handleVolumeInput}
              aria-label="Sound volume"
            />
            <span class="volume-value">{(editingSound.volume ?? 1.0) * 100}%</span>
          </div>

          <div class="sound-input-group">
            <label>
              <input
                type="checkbox"
                checked={editingSound.enabled ?? true}
                on:change={handleSoundEnabledInput}
                aria-label="Enable sound"
              />
              Enable sound
            </label>
          </div>
        </div>

        <!-- Enable/Disable Tier -->
        <div class="tier-enabled" class:disabled={!editingEnabled}>
          <h3>Display Settings</h3>
          <label>
            <input
              type="checkbox"
              checked={editingEnabled}
              on:change={handleTierEnabledInput}
              aria-label="Enable tier display"
            />
            Show cards from this tier when dropped
          </label>
          {#if !editingEnabled}
            <p class="hint warning">⚠ Cards from this tier will be processed but not displayed</p>
          {:else}
            <p class="hint">Cards from this tier will be displayed when dropped</p>
          {/if}
        </div>

        <!-- Action Buttons -->
        <div class="actions">
          <button
            on:click={handleSave}
            disabled={isSaving || (colorValidation && !colorValidation.isValid)}
            aria-label="Save tier configuration"
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
          <button
            on:click={handleReset}
            disabled={isSaving}
            aria-label="Reset changes"
          >
            Reset
          </button>
          {#if selectedTier && selectedTier.type === 'custom'}
            <button
              class="delete-button"
              on:click={handleDeleteTier}
              disabled={isSaving}
              aria-label="Delete custom tier"
            >
              Delete Tier
            </button>
          {/if}
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .tier-settings {
    padding: 1rem;
    max-width: 800px;
    margin: 0 auto;
  }

  .tier-settings h2 {
    margin-top: 0;
    color: #fff;
  }

  .tier-selection {
    margin-bottom: 2rem;
  }

  .tier-selection-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .tier-selection label {
    color: #fff;
  }

  .create-tier-button {
    padding: 0.5rem 1rem;
    background-color: #4a9eff;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background-color 0.2s;
  }

  .create-tier-button:hover {
    background-color: #3a8eef;
  }

  .create-tier-form {
    padding: 1rem;
    background-color: #2a2a2a;
    border-radius: 4px;
    border: 1px solid #555;
    margin-bottom: 2rem;
  }

  .create-tier-form h3 {
    margin-top: 0;
    color: #fff;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: #fff;
  }

  .form-group input {
    width: 100%;
    padding: 0.5rem;
    background-color: #1a1a1a;
    color: #fff;
    border: 1px solid #555;
    border-radius: 4px;
    font-size: 1rem;
  }

  .form-actions {
    display: flex;
    gap: 0.5rem;
  }

  .form-actions button {
    padding: 0.5rem 1rem;
    background-color: #4a9eff;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }

  .form-actions button:hover:not(:disabled) {
    background-color: #3a8eef;
  }

  .form-actions button:disabled {
    background-color: #555;
    cursor: not-allowed;
    opacity: 0.6;
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

  .tier-config {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .color-scheme-editor h3,
  .sound-config h3,
  .tier-enabled h3 {
    margin-top: 0;
    color: #fff;
  }

  .color-preview {
    padding: 1rem;
    margin-bottom: 1rem;
    border-radius: 4px;
    text-align: center;
    min-height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .color-inputs {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .color-input-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .color-input-group label {
    min-width: 120px;
    color: #fff;
  }

  .color-input-group input[type="color"] {
    width: 60px;
    height: 40px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .color-input-group input[type="text"] {
    flex: 1;
    padding: 0.5rem;
    background-color: #2a2a2a;
    color: #fff;
    border: 1px solid #555;
    border-radius: 4px;
  }

  .color-input-group input[type="number"] {
    width: 80px;
    padding: 0.5rem;
    background-color: #2a2a2a;
    color: #fff;
    border: 1px solid #555;
    border-radius: 4px;
  }

  .validation-success {
    padding: 0.5rem;
    background-color: #2d5a2d;
    color: #90ee90;
    border-radius: 4px;
    margin-top: 0.5rem;
  }

  .validation-error {
    padding: 0.5rem;
    background-color: #5a2d2d;
    color: #ff6b6b;
    border-radius: 4px;
    margin-top: 0.5rem;
  }

  .sound-config {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .sound-input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .sound-input-group label {
    color: #fff;
  }

  .sound-input-group input[type="text"] {
    padding: 0.5rem;
    background-color: #2a2a2a;
    color: #fff;
    border: 1px solid #555;
    border-radius: 4px;
  }

  .sound-input-group input[type="file"] {
    padding: 0.5rem;
    background-color: #2a2a2a;
    color: #fff;
    border: 1px solid #555;
    border-radius: 4px;
  }

  .sound-input-group input[type="range"] {
    flex: 1;
  }

  .sound-input-group label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #fff;
  }

  .volume-value {
    color: #fff;
    min-width: 50px;
    text-align: right;
  }

  .hint {
    font-size: 0.875rem;
    color: #aaa;
    margin: 0;
  }

  .tier-enabled {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    border-radius: 4px;
    border: 2px solid #555;
    background-color: #2a2a2a;
  }

  .tier-enabled.disabled {
    border-color: #ff6b6b;
    background-color: #3a2a2a;
  }

  .tier-enabled label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #fff;
  }

  .hint.warning {
    color: #ff6b6b;
    font-weight: 500;
  }

  .actions {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }

  .actions button {
    padding: 0.75rem 1.5rem;
    background-color: #4a9eff;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.2s;
  }

  .actions button:hover:not(:disabled) {
    background-color: #3a8eef;
  }

  .actions button:disabled {
    background-color: #555;
    cursor: not-allowed;
    opacity: 0.6;
  }

  .actions .delete-button {
    background-color: #ff4444;
  }

  .actions .delete-button:hover:not(:disabled) {
    background-color: #cc3333;
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

