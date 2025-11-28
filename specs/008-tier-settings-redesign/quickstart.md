# Quickstart Guide: Tier Settings Redesign

**Feature**: 008-tier-settings-redesign  
**Date**: 2025-01-27

## Overview

This guide provides step-by-step instructions for implementing the Tier Settings UI redesign. The feature refactors the existing `TierSettings.svelte` component to display tiers as a list with collapsible sections instead of a dropdown-based interface.

## Prerequisites

- Understanding of Svelte component structure and reactivity
- Familiarity with existing TierSettings component (`src/lib/components/TierSettings.svelte`)
- Knowledge of tier service APIs (`tierService`, `tierStore`)
- Understanding of existing tier data models (Tier, TierConfiguration, ColorScheme)
- Access to existing color validation utilities (`validateColorScheme`)

## Implementation Steps

### Step 1: Refactor Component Structure

Update `src/lib/components/TierSettings.svelte` to use list-based layout:

**Key Changes**:
1. Replace dropdown selection with tier list
2. Add expanded state management (Set<string> for expanded tier IDs)
3. Add label preview rendering for each tier entry
4. Convert configuration section to collapsible

**State Management**:

```typescript
let allTiers: Tier[] = [];
let expandedTiers = new Set<string>(); // Track expanded tier IDs
let editingTierId: string | null = null; // Currently editing tier
let editingColorScheme: ColorScheme | null = null;
let editingSound: SoundConfiguration | null = null;
let editingEnabled: boolean = true;
```

### Step 2: Implement Tier List Rendering

Create tier list entry rendering:

```svelte
{#each allTiers as tier}
  {@const isExpanded = expandedTiers.has(tier.id)}
  {@const cards = tierService.getCardsInTier(tier.id)}
  {@const previewText = getTierPreviewText(tier)}
  
  <div class="tier-entry">
    <button
      class="tier-entry-header"
      on:click={() => toggleTierExpansion(tier.id)}
      aria-expanded={isExpanded}
      aria-controls="tier-collapsible-{tier.id}"
    >
      <span class="tier-name">{getTierDisplayName(tier)}</span>
      <LabelPreview
        colorScheme={tier.config.colorScheme}
        previewText={previewText}
        isDisabled={!tier.config.enabled}
      />
      <span class="expand-icon">{isExpanded ? '▼' : '▶'}</span>
    </button>
    
    {#if isExpanded}
      <div
        id="tier-collapsible-{tier.id}"
        class="tier-collapsible"
        role="region"
      >
        <!-- Configuration editor and card list -->
      </div>
    {/if}
  </div>
{/each}
```

### Step 3: Implement Label Preview Component

Create label preview that matches actual card label appearance:

```svelte
<!-- LabelPreview.svelte (internal component) -->
<script lang="ts">
  import type { ColorScheme } from '../models/Tier.js';
  
  export let colorScheme: ColorScheme;
  export let previewText: string;
  export let isDisabled: boolean;
</script>

<div
  class="label-preview"
  class:disabled={isDisabled}
  style="
    background-color: {colorScheme.backgroundColor};
    color: {colorScheme.textColor};
    border: {colorScheme.borderWidth || 2}px solid {colorScheme.borderColor};
  "
>
  {previewText}
</div>

<style>
  .label-preview {
    display: inline-block;
    padding: 5px 10px;
    font-size: 15px;
    font-weight: bold;
    font-family: Arial, sans-serif;
    border-radius: 0;
    min-width: 120px;
    text-align: center;
  }
  
  .label-preview.disabled {
    opacity: 0.5;
    text-decoration: line-through;
  }
</style>
```

### Step 4: Implement Expand/Collapse Logic

Add toggle functionality:

```typescript
function toggleTierExpansion(tierId: string) {
  if (expandedTiers.has(tierId)) {
    expandedTiers.delete(tierId);
    // Clear editing state if this tier was being edited
    if (editingTierId === tierId) {
      editingTierId = null;
      editingColorScheme = null;
      editingSound = null;
    }
  } else {
    expandedTiers.add(tierId);
    // Load tier for editing
    loadTierForEditing(tierId);
  }
  // Trigger reactivity
  expandedTiers = expandedTiers;
}

function loadTierForEditing(tierId: string) {
  const tier = allTiers.find(t => t.id === tierId);
  if (tier) {
    editingTierId = tierId;
    editingColorScheme = { ...tier.config.colorScheme };
    editingSound = { ...tier.config.sound };
    editingEnabled = tier.config.enabled;
    validateCurrentColors();
  }
}
```

### Step 5: Implement Preview Text Selection

Add function to get representative card name for preview:

```typescript
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
```

### Step 6: Move Configuration Editor to Collapsible

Move existing configuration editor code into collapsible section:

```svelte
{#if isExpanded}
  <div class="tier-collapsible">
    <!-- Color Scheme Editor -->
    <div class="color-scheme-editor">
      <!-- Existing color scheme editor code -->
    </div>
    
    <!-- Sound Configuration -->
    <div class="sound-config">
      <!-- Existing sound config code -->
    </div>
    
    <!-- Display Settings -->
    <div class="tier-enabled">
      <!-- Existing display settings code -->
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
      <!-- Existing save/reset/delete buttons -->
    </div>
  </div>
{/if}
```

### Step 7: Update Save Logic

Update save function to refresh preview after save:

```typescript
async function handleSave() {
  if (!editingTierId || !editingColorScheme || !editingSound) return;
  
  // ... existing validation and save logic ...
  
  try {
    await tierService.updateTierConfiguration(editingTierId, {
      colorScheme: editingColorScheme,
      sound: editingSound,
      enabled: editingEnabled
    });
    
    // Refresh store and reload tiers
    tierStore.refresh();
    loadTiers();
    
    // Preview will update automatically via reactivity
    successMessage = 'Tier configuration saved successfully!';
    
    if (onTierUpdated) {
      onTierUpdated(editingTierId);
    }
  } catch (error) {
    // ... error handling ...
  }
}
```

### Step 8: Add Keyboard Navigation

Ensure keyboard accessibility:

```svelte
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
  <!-- ... -->
</button>
```

### Step 9: Update Styling

Update CSS to match new list-based layout:

```css
.tier-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tier-entry {
  border: 1px solid #555;
  border-radius: 4px;
  background-color: #2a2a2a;
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
}

.tier-entry-header:hover {
  background-color: #333;
}

.tier-entry-header:focus {
  outline: 2px solid #4a9eff;
  outline-offset: -2px;
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

.card-list {
  max-height: 300px;
  overflow-y: auto;
  margin-top: 1rem;
}

.card-item {
  padding: 0.5rem;
  border-bottom: 1px solid #444;
}
```

### Step 10: Handle Initial State

Update `onMount` to handle `tierId` prop for backward compatibility:

```typescript
onMount(() => {
  loadTiers();
  
  // If tierId prop provided, expand that tier
  if (tierId) {
    const tier = allTiers.find(t => t.id === tierId);
    if (tier) {
      expandedTiers.add(tierId);
      loadTierForEditing(tierId);
    }
  }
});
```

### Step 11: Add Create Tier Button

Place "Create Custom Tier" button above tier list:

```svelte
<div class="tier-settings-header">
  <h2>Tier Settings</h2>
  <button
    class="create-tier-button"
    on:click={() => showCreateTier = !showCreateTier}
  >
    + Create Custom Tier
  </button>
</div>

{#if showCreateTier}
  <!-- Existing create tier form -->
{/if}

<div class="tier-list">
  <!-- Tier entries -->
</div>
```

## Testing Checklist

- [ ] All tiers display as list entries
- [ ] Label previews show correct colors for each tier
- [ ] Clicking tier entry expands/collapses collapsible
- [ ] Multiple tiers can be expanded simultaneously
- [ ] Configuration editor works when expanded
- [ ] Card list displays correctly for tiers with cards
- [ ] Empty tier shows "No cards assigned" message
- [ ] Save button updates tier configuration
- [ ] Label preview updates after save
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Screen reader announces tier states correctly
- [ ] Disabled tiers show visual indication
- [ ] Create tier button still works
- [ ] Performance: List renders within 500ms
- [ ] Performance: Expand/collapse responds within 100ms

## Common Issues

**Issue**: Label preview doesn't update after color change
- **Solution**: Ensure reactive statement updates preview when `editingColorScheme` changes

**Issue**: Collapsible doesn't animate smoothly
- **Solution**: Use CSS transitions with `max-height` or Svelte transitions

**Issue**: Multiple tiers expanding causes performance issues
- **Solution**: Use virtual scrolling for card lists if needed, or limit max expanded tiers

**Issue**: Keyboard navigation doesn't work
- **Solution**: Ensure all interactive elements have `tabindex` and proper event handlers

## Next Steps

After implementation:
1. Write unit tests for tier list rendering
2. Write unit tests for expand/collapse logic
3. Write integration tests for configuration editing
4. Write E2E tests for full user workflows
5. Verify accessibility with screen reader
6. Performance testing with 20 tiers and 500 cards per tier

