<script lang="ts">
  /**
   * TierSettings Component
   * 
   * Displays all tiers as list entries with visual label previews.
   * Each tier entry can be expanded to show configuration options and card list.
   * Features:
   * - List-based tier overview with label previews
   * - Expandable/collapsible tier configuration sections
   * - Multiple tiers can be expanded simultaneously
   * - Card list display within expanded tiers
   * - Full tier configuration editing (colors, sound, display settings)
   * - Keyboard accessible (Tab navigation, Enter/Space to expand)
   * - WCAG 2.1 Level AA compliant
   * 
   * @component
   */
  import { onMount } from 'svelte';
  import { tierStore } from '../stores/tierStore.js';
  import { tierService } from '../services/tierService.js';
  import type { Tier, ColorScheme, SoundConfiguration, LightBeamConfiguration } from '../models/Tier.js';
  import { validateColorScheme, validateLightBeamConfig } from '../utils/colorValidation.js';
  import type { ValidationResult } from '../models/Tier.js';

  /**
   * Optional tier ID to expand on mount (for deep linking/backward compatibility)
   */
  export let tierId: string | null = null;
  
  /**
   * Optional callback fired when tier configuration is updated
   * @param tierId - ID of the tier that was updated
   */
  export let onTierUpdated: ((tierId: string) => void) | undefined = undefined;

  let allTiers: Tier[] = [];
  let expandedTiers = new Set<string>(); // Track expanded tier IDs
  let editingTierId: string | null = null; // Currently editing tier
  let editingColorScheme: ColorScheme | null = null;
  let editingSound: SoundConfiguration | null = null;
  let editingEnabled: boolean = true;
  let editingLightBeam: LightBeamConfiguration | null = null;
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
    
    // If tierId prop provided, expand that tier (backward compatibility)
    if (tierId && allTiers.length > 0) {
      const tier = allTiers.find(t => t.id === tierId);
      if (tier) {
        expandedTiers.add(tierId);
        loadTierForEditing(tierId);
        expandedTiers = expandedTiers; // Trigger reactivity
      }
    }
  });

  /**
   * Load all tiers from the tier store
   */
  function loadTiers() {
    allTiers = tierStore.getAllTiers();
  }

  /**
   * Get display name for a tier (formats default tiers as "Tier S", custom tiers use their name)
   * @param tier - Tier object
   * @returns Formatted tier display name
   */
  function getTierDisplayName(tier: Tier): string {
    return tier.type === 'default' ? `Tier ${tier.name}` : tier.name;
  }

  /**
   * Get representative card name for label preview
   * Uses tier-specific representative cards for default tiers, or first card in tier for custom tiers
   * @param tier - Tier object
   * @returns Card name to display in preview
   */
  function getTierPreviewText(tier: Tier): string {
    // Use tier-specific representative cards
    const representativeCards: Record<string, string> = {
      'S': 'THE DOCTOR',
      'A': 'THE NURSE',
      'B': 'THE PATIENT',
      'C': 'THE WRATH',
      'D': 'THE RISK',
      'E': 'THE SCHOLAR',
      'F': 'Preview Text'
    };
    
    if (tier.type === 'default' && representativeCards[tier.id]) {
      return representativeCards[tier.id];
    }
    
    // For custom tiers or fallback, use first card in tier or placeholder
    const cards = tierService.getCardsInTier(tier.id);
    return cards.length > 0 ? cards[0] : 'Preview Text';
  }

  /**
   * Toggle expansion state of a tier collapsible
   * @param tierId - ID of tier to toggle
   */
  /**
   * Toggle expansion state for a tier
   * Expands if collapsed, collapses if expanded
   * @param tierId - ID of the tier to toggle
   */
  function toggleTierExpansion(tierId: string) {
    if (expandedTiers.has(tierId)) {
      expandedTiers.delete(tierId);
      // Clear editing state if this tier was being edited
      if (editingTierId === tierId) {
        editingTierId = null;
        editingColorScheme = null;
        editingSound = null;
        editingLightBeam = null;
      }
    } else {
      expandedTiers.add(tierId);
      // Load tier for editing
      loadTierForEditing(tierId);
    }
    // Trigger reactivity
    expandedTiers = expandedTiers;
  }

  /**
   * Load tier configuration into editing state
   * @param tierId - ID of tier to load for editing
   */
  /**
   * Load tier configuration into editing state
   * @param tierId - ID of the tier to load for editing
   */
  function loadTierForEditing(tierId: string) {
    const tier = allTiers.find(t => t.id === tierId);
    if (tier) {
      editingTierId = tierId;
      editingColorScheme = { ...tier.config.colorScheme };
      editingSound = { ...tier.config.sound };
      editingEnabled = tier.config.enabled;
      editingLightBeam = tier.config.lightBeam || { enabled: false, color: null };
      validateCurrentColors();
      errorMessage = null;
      successMessage = null;
    }
  }

  /**
   * Validate current color scheme and update validation result
   */
  function validateCurrentColors() {
    if (editingColorScheme) {
      colorValidation = validateColorScheme(editingColorScheme);
    }
  }

  // Reactive validation when colors change
  $: if (editingColorScheme) {
    validateCurrentColors();
  }

  /**
   * Handle color value change for a specific field
   * @param field - Color field to update (backgroundColor, textColor, borderColor)
   * @param value - New color value (with or without # prefix)
   */
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

  /**
   * Handle beam color change from color picker.
   */
  function handleBeamColorInput(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    if (target && editingLightBeam) {
      editingLightBeam = { ...editingLightBeam, color: target.value };
    }
  }

  /**
   * Handle beam color change from text input.
   * Validates hex color format before updating.
   */
  function handleBeamColorTextInput(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    if (target && editingLightBeam) {
      let hexValue = target.value.trim();
      
      // Add # prefix if missing
      if (hexValue && !hexValue.startsWith('#')) {
        hexValue = `#${hexValue}`;
      }
      
      // Validate hex color format (#RRGGBB or #RGB)
      const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (hexValue === '' || hexValue === '#') {
        // Allow empty or just # for user to type
        editingLightBeam = { ...editingLightBeam, color: hexValue || null };
      } else if (hexPattern.test(hexValue)) {
        // Valid hex color
        editingLightBeam = { ...editingLightBeam, color: hexValue };
      } else {
        // Invalid hex color - keep previous value but show error
        errorMessage = 'Invalid hex color format. Use #RRGGBB (e.g., #FF0000)';
        // Don't update the color, keep the previous valid value
      }
    }
  }

  /**
   * Handle beam enabled toggle.
   */
  function handleBeamEnabledChange(enabled: boolean) {
    if (!editingLightBeam) {
      editingLightBeam = { enabled: false, color: null };
    }
    editingLightBeam = { ...editingLightBeam, enabled };
  }

  function handleSoundFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
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

  /**
   * Save the current tier configuration
   * Validates color scheme, updates tier service, and refreshes the store
   */
  async function handleSave() {
    if (!editingTierId || !editingColorScheme || !editingSound) return;

    errorMessage = null;
    successMessage = null;

    // Validate color scheme
    const validation = validateColorScheme(editingColorScheme);
    if (!validation.isValid) {
      errorMessage = validation.error || 'Invalid color scheme';
      return;
    }

    // Validate light beam configuration if present
    if (editingLightBeam) {
      const beamValidation = validateLightBeamConfig(editingLightBeam);
      if (!beamValidation.isValid) {
        errorMessage = beamValidation.error || 'Invalid beam configuration';
        return;
      }
    }

    isSaving = true;

    try {
      await tierService.updateTierConfiguration(editingTierId, {
        colorScheme: editingColorScheme,
        sound: editingSound,
        enabled: editingEnabled,
        lightBeam: editingLightBeam
      });

      // Refresh store and reload tiers
      tierStore.refresh();
      loadTiers();

      // Preview will update automatically via reactivity when allTiers updates
      successMessage = 'Tier configuration saved successfully!';
      setTimeout(() => {
        successMessage = null;
      }, 2000);

      if (onTierUpdated) {
        onTierUpdated(editingTierId);
      }
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to save tier configuration';
      console.error('Save tier configuration error:', error);
    } finally {
      isSaving = false;
    }
  }

  /**
   * Reset editing state to match current tier configuration
   * Discards any unsaved changes
   */
  function handleReset() {
    if (!editingTierId) return;
    
    const tier = allTiers.find(t => t.id === editingTierId);
    if (tier) {
      editingColorScheme = { ...tier.config.colorScheme };
      editingSound = { ...tier.config.sound };
      editingEnabled = tier.config.enabled;
      editingLightBeam = tier.config.lightBeam || { enabled: false, color: null };
      validateCurrentColors();
      errorMessage = null;
    }
  }

  /**
   * Create a new custom tier with the specified name
   * Expands the new tier automatically after creation
   */
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
      
      // Expand the new tier
      expandedTiers.add(newTier.id);
      loadTierForEditing(newTier.id);
      expandedTiers = expandedTiers;
      
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

  /**
   * Delete a custom tier
   * Cannot delete default tiers
   * @param tierIdToDelete - ID of the tier to delete
   */
  async function handleDeleteTier(tierIdToDelete: string) {
    const tier = allTiers.find(t => t.id === tierIdToDelete);
    if (!tier || tier.type === 'default') {
      errorMessage = 'Cannot delete default tiers';
      return;
    }

    if (!confirm(`Are you sure you want to delete tier "${tier.name}"? This cannot be undone.`)) {
      return;
    }

    errorMessage = null;
    successMessage = null;

    try {
      await tierService.deleteCustomTier(tierIdToDelete);
      
      // Remove from expanded set if it was expanded
      expandedTiers.delete(tierIdToDelete);
      if (editingTierId === tierIdToDelete) {
        editingTierId = null;
        editingColorScheme = null;
        editingSound = null;
      }
      expandedTiers = expandedTiers;
      
      // Refresh store
      tierStore.refresh();
      loadTiers();
      
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
  <div class="tier-settings-header">
    <h2>Tier Settings</h2>
    <button
      class="create-tier-button"
      on:click={() => showCreateTier = !showCreateTier}
      aria-label="Create new custom tier"
    >
      + Create Custom Tier
    </button>
  </div>

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

  {#if allTiers.length === 0}
    <p class="no-tiers">No tiers available. Tier system may not be initialized yet.</p>
  {:else}
    <div class="tier-list">
      {#each allTiers as tier (tier.id)}
        {@const isExpanded = expandedTiers.has(tier.id)}
        {@const cards = tierService.getCardsInTier(tier.id)}
        {@const previewText = getTierPreviewText(tier)}
        {@const currentColorScheme = editingTierId === tier.id && editingColorScheme ? editingColorScheme : tier.config.colorScheme}
        
        <div class="tier-entry" class:disabled={!tier.config.enabled}>
          <button
            class="tier-entry-header"
            on:click={() => toggleTierExpansion(tier.id)}
            on:keydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleTierExpansion(tier.id);
              }
            }}
            aria-expanded={isExpanded}
            aria-controls="tier-collapsible-{tier.id}"
            tabindex="0"
          >
            <span class="tier-name" id="tier-header-{tier.id}">{getTierDisplayName(tier)}</span>
            <div
              class="label-preview"
              class:disabled={!tier.config.enabled}
              style="
                background-color: {currentColorScheme.backgroundColor};
                color: {currentColorScheme.textColor};
                border: {currentColorScheme.borderWidth || 2}px solid {currentColorScheme.borderColor};
              "
              aria-label="Label preview for {getTierDisplayName(tier)} tier"
            >
              {previewText}
            </div>
            <span class="expand-icon" aria-hidden="true">{isExpanded ? '▼' : '▶'}</span>
            <span class="sr-only">{isExpanded ? 'Collapse' : 'Expand'} tier configuration</span>
          </button>
          
          {#if isExpanded}
            <div
              id="tier-collapsible-{tier.id}"
              class="tier-collapsible"
              role="region"
              aria-labelledby="tier-header-{tier.id}"
              aria-live="polite"
            >
              {#if editingTierId === tier.id && editingColorScheme && editingSound}
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
                      <label for="bg-color-{tier.id}">Background Color:</label>
                      <input
                        id="bg-color-{tier.id}"
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
                      <label for="text-color-{tier.id}">Text Color:</label>
                      <input
                        id="text-color-{tier.id}"
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
                      <label for="border-color-{tier.id}">Border Color:</label>
                      <input
                        id="border-color-{tier.id}"
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
                      <label for="border-width-{tier.id}">Border Width (px):</label>
                      <input
                        id="border-width-{tier.id}"
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
                    <label for="sound-file-{tier.id}">Sound File Path (optional):</label>
                    <input
                      id="sound-file-{tier.id}"
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
                    <label for="sound-volume-{tier.id}">Volume:</label>
                    <input
                      id="sound-volume-{tier.id}"
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

                <!-- Light Beam Effect Configuration -->
                {#if editingLightBeam}
                  <div class="light-beam-config">
                    <h3>Light Beam Effect</h3>
                    
                    <!-- Enable/Disable Toggle -->
                    <div class="beam-toggle">
                      <label>
                        <input
                          type="checkbox"
                          checked={editingLightBeam.enabled}
                          on:change={(e) => handleBeamEnabledChange(e.currentTarget.checked)}
                          aria-label="Enable light beam effect"
                        />
                        Enable light beam effect
                      </label>
                    </div>
                    
                    <!-- Beam Color Picker (only if enabled) -->
                    {#if editingLightBeam.enabled}
                      <div class="beam-color-editor">
                        <label for="beam-color-{tier.id}">Beam Color:</label>
                        <div class="color-input-group">
                          <input
                            id="beam-color-{tier.id}"
                            type="color"
                            value={editingLightBeam.color || '#FF0000'}
                            on:input={handleBeamColorInput}
                            aria-label="Beam color picker"
                          />
                          <input
                            type="text"
                            value={editingLightBeam.color || '#FF0000'}
                            on:input={handleBeamColorTextInput}
                            placeholder="#RRGGBB"
                            aria-label="Beam color hex value"
                          />
                        </div>
                        
                        <!-- Beam Color Preview -->
                        <div class="beam-preview" style="background: linear-gradient(to top, {editingLightBeam.color || '#FF0000'}, transparent);">
                          <p>Beam Preview</p>
                        </div>
                      </div>
                    {/if}
                  </div>
                {/if}

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

                <!-- Card List -->
                <div class="card-list-section">
                  <h4>Cards in this Tier ({cards.length})</h4>
                  {#if cards.length === 0}
                    <p class="no-cards">No cards assigned to this tier</p>
                  {:else}
                    <div class="card-list">
                      {#each cards as cardName}
                        <div class="card-item">{cardName}</div>
                      {/each}
                    </div>
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
                  {#if tier.type === 'custom'}
                    <button
                      class="delete-button"
                      on:click={() => handleDeleteTier(tier.id)}
                      disabled={isSaving}
                      aria-label="Delete custom tier"
                    >
                      Delete Tier
                    </button>
                  {/if}
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .tier-settings {
    padding: 1rem;
    max-width: 800px;
    margin: 0 auto;
  }

  .tier-settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .tier-settings h2 {
    margin-top: 0;
    margin-bottom: 0;
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

  .create-tier-button:focus {
    outline: 2px solid #4a9eff;
    outline-offset: 2px;
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

  .tier-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .tier-entry {
    border: 1px solid #555;
    border-radius: 4px;
    background-color: #2a2a2a;
    overflow: hidden;
  }

  .tier-entry.disabled {
    opacity: 0.6;
  }

  .tier-entry-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 1rem;
    background: transparent;
    border: none;
    color: #fff;
    cursor: pointer;
    text-align: left;
    gap: 1rem;
  }

  .tier-entry-header:hover {
    background-color: #333;
  }

  .tier-entry-header:active {
    background-color: #2a2a2a;
  }

  .tier-entry-header:focus {
    outline: 2px solid #4a9eff;
    outline-offset: -2px;
  }

  .tier-entry-header:focus-visible {
    outline: 2px solid #4a9eff;
    outline-offset: -2px;
  }

  .tier-name {
    min-width: 120px;
    font-weight: 500;
  }

  .label-preview {
    display: inline-block;
    padding: 5px 10px;
    font-size: 15px;
    font-weight: bold;
    font-family: Arial, sans-serif;
    border-radius: 0;
    min-width: 120px;
    text-align: center;
    flex: 1;
    max-width: 300px;
  }

  .label-preview.disabled {
    opacity: 0.5;
    text-decoration: line-through;
  }

  .expand-icon {
    min-width: 20px;
    text-align: center;
    font-size: 0.875rem;
  }

  .tier-collapsible {
    padding: 1rem;
    border-top: 1px solid #555;
    animation: slideDown 0.2s ease-out;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      max-height: 0;
    }
    to {
      opacity: 1;
      max-height: 2000px;
    }
  }

  .color-scheme-editor h3,
  .sound-config h3,
  .light-beam-config h3,
  .tier-enabled h3,
  .card-list-section h4 {
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
    background-color: #1a1a1a;
    color: #fff;
    border: 1px solid #555;
    border-radius: 4px;
  }

  .color-input-group input[type="number"] {
    width: 80px;
    padding: 0.5rem;
    background-color: #1a1a1a;
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
    margin-top: 2rem;
  }

  .light-beam-config {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 2rem;
  }

  .beam-toggle {
    margin-bottom: 1rem;
  }

  .beam-toggle label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #fff;
    cursor: pointer;
  }

  .beam-color-editor {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .beam-color-editor label {
    color: #fff;
    min-width: 120px;
  }

  .beam-preview {
    padding: 1rem;
    margin-top: 1rem;
    border-radius: 4px;
    text-align: center;
    min-height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #555;
  }

  .beam-preview p {
    color: #fff;
    font-weight: bold;
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
    background-color: #1a1a1a;
    color: #fff;
    border: 1px solid #555;
    border-radius: 4px;
  }

  .sound-input-group input[type="file"] {
    padding: 0.5rem;
    background-color: #1a1a1a;
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
    background-color: #1a1a1a;
    margin-top: 2rem;
  }

  .tier-enabled.disabled {
    border-color: #ff6b6b;
    background-color: #2a1a1a;
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

  .card-list-section {
    margin-top: 2rem;
  }

  .card-list-section h4 {
    margin-bottom: 0.5rem;
  }

  .no-cards {
    color: #aaa;
    font-style: italic;
    padding: 1rem;
    text-align: center;
  }

  .card-list {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid #555;
    border-radius: 4px;
    background-color: #1a1a1a;
  }

  .card-item {
    padding: 0.5rem 1rem;
    border-bottom: 1px solid #444;
    color: #fff;
  }

  .card-item:last-child {
    border-bottom: none;
  }

  .actions {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
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

  /* Screen reader only text */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>
