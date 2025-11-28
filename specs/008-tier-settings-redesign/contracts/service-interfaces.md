# Service Interfaces: Tier Settings Redesign

**Feature**: 008-tier-settings-redesign  
**Date**: 2025-01-27

## Overview

This document defines the component interfaces and contracts for the Tier Settings redesign. The feature refactors the UI presentation layer but maintains compatibility with existing service interfaces.

## Existing Service Interfaces (No Changes)

All service interfaces from the tier system remain unchanged:

- **TierService**: Existing service for tier management (no API changes)
- **tierStore**: Existing Svelte store for tier state (no API changes)

See `specs/004-card-tier-filter/contracts/service-interfaces.md` for complete service interface documentation.

## Component Interfaces

### TierSettings Component

Main component for tier configuration UI.

```typescript
/**
 * TierSettings Component
 * 
 * Displays all tiers as list entries with label previews.
 * Each entry can be expanded to show configuration options and card list.
 * 
 * @component
 */
interface TierSettingsComponent {
  /**
   * Optional tier ID to expand on mount (for deep linking/backward compatibility)
   */
  tierId?: string | null;
  
  /**
   * Optional callback fired when tier configuration is updated
   * @param tierId - ID of the tier that was updated
   */
  onTierUpdated?: ((tierId: string) => void) | undefined;
}
```

**Props**:
- `tierId` (optional): Tier ID to auto-expand on mount
- `onTierUpdated` (optional): Callback when tier is saved

**Behavior**:
- Loads all tiers from `tierStore.getAllTiers()` on mount
- Displays tiers as list entries with label previews
- Manages expanded/collapsed state for tier collapsibles
- Handles tier configuration editing and saving
- Displays card lists for expanded tiers

**Dependencies**:
- `tierStore`: Svelte store for tier data
- `tierService`: Service for tier operations
- `validateColorScheme`: Utility for color validation

---

### TierListEntry Component (Internal)

Internal component for rendering a single tier list entry.

```typescript
/**
 * TierListEntry Component (Internal)
 * 
 * Renders a single tier entry in the tier list with label preview.
 * 
 * @component
 * @internal
 */
interface TierListEntryComponent {
  /** Tier data to display */
  tier: Tier;
  
  /** Whether this tier's collapsible is expanded */
  isExpanded: boolean;
  
  /** Callback when entry is clicked to toggle expansion */
  onToggle: (tierId: string) => void;
  
  /** Cards assigned to this tier (for display in collapsible) */
  cards: string[];
}
```

**Props**:
- `tier`: Tier object to display
- `isExpanded`: Whether collapsible is expanded
- `onToggle`: Toggle expansion callback
- `cards`: Array of card names in this tier

**Behavior**:
- Renders tier name and label preview
- Handles click to toggle expansion
- Displays collapsible content when expanded
- Shows configuration editor and card list when expanded

---

### LabelPreview Component (Internal)

Internal component for rendering label preview.

```typescript
/**
 * LabelPreview Component (Internal)
 * 
 * Renders a preview of how a tier's label will appear.
 * 
 * @component
 * @internal
 */
interface LabelPreviewComponent {
  /** Color scheme to apply to preview */
  colorScheme: ColorScheme;
  
  /** Text to display in preview */
  previewText: string;
  
  /** Whether tier is disabled (affects styling) */
  isDisabled: boolean;
}
```

**Props**:
- `colorScheme`: Tier color scheme
- `previewText`: Text to display (representative card name or placeholder)
- `isDisabled`: Whether tier is disabled

**Behavior**:
- Renders CSS-styled preview matching actual card label appearance
- Applies tier colors (background, text, border)
- Shows disabled state styling if applicable

---

## Service Usage Contracts

### TierService Usage

The component uses existing TierService methods:

```typescript
// Get all tiers
const tiers = tierStore.getAllTiers();

// Get cards in a tier
const cards = tierService.getCardsInTier(tierId);

// Update tier configuration
await tierService.updateTierConfiguration(tierId, {
  colorScheme: editingColorScheme,
  sound: editingSound,
  enabled: editingEnabled
});

// Create custom tier
const newTier = await tierService.createCustomTier(tierName);

// Delete custom tier
await tierService.deleteCustomTier(tierId);
```

**Contract**: All TierService methods maintain existing signatures and behavior. No changes to service API.

---

### TierStore Usage

The component uses existing tierStore:

```typescript
// Get all tiers (reactive)
$: allTiers = tierStore.getAllTiers();

// Refresh store after updates
tierStore.refresh();
```

**Contract**: tierStore maintains existing API. Component subscribes reactively to tier changes.

---

## Component Contracts

### Accessibility Contract

All interactive elements must:

- Be keyboard navigable (Tab to navigate, Enter/Space to activate)
- Have proper ARIA attributes (`aria-expanded`, `aria-controls`, `aria-label`)
- Support screen reader announcements
- Have visible focus indicators
- Meet WCAG 2.1 Level AA standards

### Performance Contract

Component must:

- Render tier list within 500ms of mount
- Respond to expand/collapse clicks within 100ms
- Generate label previews within 50ms per tier
- Render card lists (up to 500 cards) within 1 second
- Maintain 60fps during scrolling

### State Management Contract

- Expanded/collapsed state is session-only (not persisted)
- State resets on page refresh/navigation
- Component state updates reactively when tierStore changes
- Configuration edits are local until saved

---

## Testing Contracts

### Unit Test Contracts

- Test tier list rendering with various tier counts (1-20 tiers)
- Test label preview generation with different color schemes
- Test expand/collapse toggle functionality
- Test configuration editing and validation
- Test card list display for tiers with 0, 1, 100, 500 cards

### Integration Test Contracts

- Test full workflow: load tiers → expand tier → edit config → save
- Test multiple tiers expanded simultaneously
- Test tier creation through UI
- Test tier deletion through UI
- Test error handling (invalid colors, save failures)

### E2E Test Contracts

- Test keyboard navigation through tier list
- Test screen reader announcements
- Test visual appearance matches spec requirements
- Test performance benchmarks are met

---

## Backward Compatibility

The component maintains backward compatibility:

- `tierId` prop allows existing usage patterns (auto-expand specific tier)
- `onTierUpdated` callback maintains existing integration points
- All tier service APIs remain unchanged
- All tier data models remain unchanged
- Existing tier configurations continue to work

No breaking changes to component API or service interfaces.

