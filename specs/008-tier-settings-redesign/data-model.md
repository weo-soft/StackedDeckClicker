# Data Model: Tier Settings Redesign

**Feature**: 008-tier-settings-redesign  
**Date**: 2025-01-27

## Overview

This feature is a UI redesign that does not introduce new data models or modify existing data structures. It refactors the presentation layer of the Tier Settings component while maintaining compatibility with existing tier system data models.

## Existing Data Models (No Changes)

All data models from the tier system remain unchanged:

- **Tier**: Existing tier entity (id, name, type, order, config, modifiedAt)
- **TierConfiguration**: Existing configuration (colorScheme, sound, enabled, modifiedAt)
- **ColorScheme**: Existing color scheme (backgroundColor, textColor, borderColor, borderWidth)
- **SoundConfiguration**: Existing sound configuration (filePath, volume, enabled)

See `specs/004-card-tier-filter/data-model.md` for complete data model documentation.

## UI State Models

The redesign introduces component-level UI state that is not persisted:

### ExpandedTiersState

Tracks which tier collapsibles are currently expanded in the UI.

```typescript
/**
 * Set of tier IDs that are currently expanded in the tier list.
 * Session-only state, not persisted.
 */
type ExpandedTiersState = Set<string>;
```

**Fields**:
- Contains tier IDs (strings) for tiers with expanded collapsibles
- Empty set means all tiers are collapsed

**State Transitions**:
- Initial state: Empty set (all collapsed) or can restore from session if desired
- User clicks tier entry → Add tier ID to set (expand)
- User clicks expanded tier entry → Remove tier ID from set (collapse)
- Page refresh/navigation → Reset to empty set (session ends)

**Validation Rules**:
- Only contains valid tier IDs that exist in tierStore
- No persistence required (session-only per spec FR-008)

### LabelPreviewData

Data structure for rendering label previews in tier list entries.

```typescript
interface LabelPreviewData {
  /** Tier color scheme to apply to preview */
  colorScheme: ColorScheme;
  /** Text to display in preview (representative card name or placeholder) */
  previewText: string;
  /** Whether tier is disabled (affects preview styling) */
  isDisabled: boolean;
}
```

**Fields**:
- `colorScheme`: Tier's configured color scheme (from Tier.config.colorScheme)
- `previewText`: Representative card name (e.g., "THE DOCTOR" for S tier) or "Preview Text"
- `isDisabled`: Whether tier is disabled (from Tier.config.enabled)

**Usage**:
- Computed from Tier data for each tier list entry
- Used to render CSS-styled preview matching actual card label appearance
- Updates reactively when tier configuration changes

**Validation Rules**:
- `colorScheme` must be valid ColorScheme (inherited from tier validation)
- `previewText` must be non-empty string
- `isDisabled` is boolean

## Component Props

### TierSettings Component Props

```typescript
interface TierSettingsProps {
  /** Optional tier ID to expand on mount (for deep linking) */
  tierId?: string | null;
  /** Optional callback when tier configuration is updated */
  onTierUpdated?: ((tierId: string) => void) | undefined;
}
```

**Fields**:
- `tierId`: Optional tier ID to auto-expand on component mount (backward compatibility)
- `onTierUpdated`: Optional callback fired when tier configuration is saved

**Usage**:
- Maintains backward compatibility with existing component usage
- Allows parent components to react to tier updates

## Data Flow

1. **Component Mount**:
   - Load all tiers from `tierStore.getAllTiers()`
   - Initialize `expandedTiers` Set (empty or restore from session)
   - If `tierId` prop provided, add to `expandedTiers`

2. **Tier List Rendering**:
   - For each tier, compute `LabelPreviewData` from tier data
   - Render tier list entry with preview
   - Check `expandedTiers` to determine if collapsible is expanded

3. **Expand/Collapse**:
   - User clicks tier entry → Toggle tier ID in `expandedTiers` Set
   - Svelte reactivity updates UI automatically

4. **Configuration Editing**:
   - When collapsible expanded, load tier configuration into editing state
   - User edits colors/sound/enabled → Update local editing state
   - Save button → Call `tierService.updateTierConfiguration()`
   - On success → Update tierStore, refresh component state, update preview

5. **Card List Display**:
   - When collapsible expanded, call `tierService.getCardsInTier(tierId)`
   - Display cards in scrollable list within collapsible

## No Data Migration Required

This feature does not require data migration:
- Existing tier data structures remain unchanged
- Existing tier service APIs remain unchanged
- Existing tier store remains unchanged
- Only UI presentation layer is refactored

