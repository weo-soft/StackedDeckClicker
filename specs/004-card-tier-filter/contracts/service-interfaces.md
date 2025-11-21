# Service Interfaces: Card Tier Filter System

**Feature**: 004-card-tier-filter  
**Date**: 2025-01-27

## Overview

This document defines the service interfaces and component contracts for the tier-based card filtering system. These contracts ensure consistent implementation and testability.

## Service Interfaces

### TierService

Service responsible for tier management business logic (assignments, lookups, operations).

```typescript
interface TierService {
  /**
   * Initialize tier system with default tiers and card assignments.
   * Called once on app startup.
   * 
   * @param cards - Array of all cards to assign to default tiers
   * @returns Promise resolving when initialization is complete
   */
  initialize(cards: DivinationCard[]): Promise<void>;

  /**
   * Get tier for a specific card.
   * 
   * @param cardName - Card name to lookup
   * @returns Tier object or null if card not assigned
   */
  getTierForCard(cardName: string): Tier | null;

  /**
   * Get tier configuration for a tier ID.
   * 
   * @param tierId - Tier identifier
   * @returns TierConfiguration or null if tier not found
   */
  getTierConfiguration(tierId: string): TierConfiguration | null;

  /**
   * Get all tiers (default + custom).
   * 
   * @returns Array of Tier objects, ordered by display order
   */
  getAllTiers(): Tier[];

  /**
   * Get default tiers only (S, A, B, C, D, E, F).
   * 
   * @returns Array of default Tier objects
   */
  getDefaultTiers(): Tier[];

  /**
   * Get custom tiers only.
   * 
   * @returns Array of custom Tier objects
   */
  getCustomTiers(): Tier[];

  /**
   * Move a card from one tier to another.
   * 
   * @param cardName - Card name to move
   * @param targetTierId - Target tier ID
   * @returns Promise resolving when move is complete
   */
  moveCardToTier(cardName: string, targetTierId: string): Promise<void>;

  /**
   * Move multiple cards to a tier.
   * 
   * @param cardNames - Array of card names to move
   * @param targetTierId - Target tier ID
   * @returns Promise resolving when all moves are complete
   */
  moveCardsToTier(cardNames: string[], targetTierId: string): Promise<void>;

  /**
   * Create a new custom tier.
   * 
   * @param name - Tier name (must be unique, 1-50 chars)
   * @returns Promise resolving to created Tier
   * @throws ValidationError if name is invalid
   */
  createCustomTier(name: string): Promise<Tier>;

  /**
   * Update tier configuration (colors, sound, enabled state).
   * 
   * @param tierId - Tier identifier
   * @param config - Partial tier configuration to update
   * @returns Promise resolving when update is complete
   * @throws ValidationError if configuration is invalid
   */
  updateTierConfiguration(tierId: string, config: Partial<TierConfiguration>): Promise<void>;

  /**
   * Enable or disable a tier.
   * 
   * @param tierId - Tier identifier
   * @param enabled - Whether tier should be enabled
   * @returns Promise resolving when update is complete
   */
  setTierEnabled(tierId: string, enabled: boolean): Promise<void>;

  /**
   * Delete a custom tier (only if no cards assigned).
   * 
   * @param tierId - Custom tier identifier
   * @returns Promise resolving when deletion is complete
   * @throws Error if tier has cards assigned or is a default tier
   */
  deleteCustomTier(tierId: string): Promise<void>;

  /**
   * Get all cards assigned to a tier.
   * 
   * @param tierId - Tier identifier
   * @returns Array of card names assigned to tier
   */
  getCardsInTier(tierId: string): string[];

  /**
   * Check if a tier is enabled.
   * 
   * @param tierId - Tier identifier
   * @returns true if tier is enabled, false otherwise
   */
  isTierEnabled(tierId: string): boolean;

  /**
   * Check if a card should be displayed based on its tier.
   * 
   * @param cardName - Card name to check
   * @returns true if card's tier is enabled, false otherwise
   */
  shouldDisplayCard(cardName: string): boolean;
}
```

**Implementation Requirements**:
- Must handle missing tiers gracefully (return null, not throw)
- Should cache tier lookups for performance (<50ms requirement)
- Must validate all inputs before operations
- Should batch storage operations when possible
- Must maintain tier order (default: 0-6, custom: 7+)

**Error Handling**:
- Invalid tier ID: Return null or throw ValidationError
- Card not found: Return null for getTierForCard
- Invalid configuration: Throw ValidationError with details
- Tier deletion with cards: Throw Error with message

### TierStorageService

Service for persisting tier configurations to IndexedDB.

```typescript
interface TierStorageService {
  /**
   * Load tier configurations from IndexedDB.
   * 
   * @returns Promise resolving to TierConfigurationState or null if not found
   */
  loadTierConfigurations(): Promise<TierConfigurationState | null>;

  /**
   * Save tier configurations to IndexedDB.
   * 
   * @param state - Tier configuration state to save
   * @returns Promise resolving when save is complete
   */
  saveTierConfigurations(state: TierConfigurationState): Promise<void>;

  /**
   * Check if storage is available.
   * 
   * @returns Promise resolving to true if storage is available
   */
  isStorageAvailable(): Promise<boolean>;

  /**
   * Clear all tier configurations (reset to defaults).
   * 
   * @returns Promise resolving when cleared
   */
  clearTierConfigurations(): Promise<void>;

  /**
   * Export tier configurations as JSON string.
   * 
   * @returns Promise resolving to JSON string
   */
  exportTierConfigurations(): Promise<string>;

  /**
   * Import tier configurations from JSON string.
   * 
   * @param json - JSON string to import
   * @returns Promise resolving when import is complete
   * @throws ValidationError if JSON is invalid
   */
  importTierConfigurations(json: string): Promise<void>;
}
```

**Implementation Requirements**:
- Must handle storage quota errors gracefully
- Should validate loaded data before returning
- Must serialize/deserialize Maps correctly
- Should provide migration support for future schema changes
- Must handle storage unavailability (return null, don't throw)

**Error Handling**:
- Storage unavailable: Return null for load, log warning
- Quota exceeded: Throw StorageError with user-friendly message
- Invalid data: Return null, log error, fallback to defaults
- JSON parse error: Throw ValidationError with details

### AudioManager Extension

Extended audio service to support tier-based sounds.

```typescript
interface AudioManager {
  // Existing methods (unchanged)
  playCardDropSound(qualityTier: QualityTier): void;
  playUpgradeSound(): void;
  // ... other existing methods

  /**
   * Play sound for card drop based on tier.
   * Falls back to qualityTier-based sound if tier sound not available.
   * 
   * @param tierId - Tier identifier
   * @param qualityTier - Fallback quality tier if tier sound unavailable
   * @returns void
   */
  playTierSound(tierId: string, qualityTier: QualityTier): void;

  /**
   * Preload tier sound files.
   * 
   * @param tierIds - Array of tier IDs to preload sounds for
   * @returns Promise resolving when sounds are loaded
   */
  preloadTierSounds(tierIds: string[]): Promise<void>;

  /**
   * Check if tier sound is available.
   * 
   * @param tierId - Tier identifier
   * @returns true if sound is loaded and available
   */
  isTierSoundAvailable(tierId: string): boolean;
}
```

**Implementation Requirements**:
- Must maintain backward compatibility with existing qualityTier sounds
- Should fallback gracefully if tier sound not available
- Must handle invalid sound files (log warning, use fallback)
- Should preload tier sounds asynchronously (don't block UI)
- Must respect mute/volume settings

**Error Handling**:
- Invalid tier ID: Use qualityTier fallback, log warning
- Sound file not found: Use qualityTier fallback, log warning
- Sound load error: Use qualityTier fallback, log error

## Component Contracts

### TierSettings Component Props

```typescript
interface TierSettingsProps {
  /** Optional: Specific tier ID to display (if null, shows all tiers) */
  tierId?: string | null;
  /** Optional: Callback when tier configuration is updated */
  onTierUpdated?: (tierId: string) => void;
}
```

**Props Validation**:
- `tierId` can be null (shows all tiers) or valid tier ID
- `onTierUpdated` is optional callback

**Component Behavior**:
- Displays tier list (default + custom) with configuration options
- Allows editing tier color schemes, sounds, and enabled state
- Provides visual feedback when configurations are saved
- Handles validation errors with inline error messages
- Supports keyboard navigation (UX-003)

### TierManagement Component Props

```typescript
interface TierManagementProps {
  /** Optional: Callback when card assignment changes */
  onAssignmentChanged?: (cardName: string, tierId: string) => void;
}
```

**Props Validation**:
- `onAssignmentChanged` is optional callback

**Component Behavior**:
- Displays cards organized by tier
- Allows moving cards between tiers (drag-and-drop or selection)
- Shows tier enable/disable toggles
- Provides search/filter functionality for large card lists
- Supports keyboard navigation for card movement (UX-003)
- Shows visual feedback when cards are moved (UX-012)

### LastCardZone Component Props (Extended)

```typescript
interface LastCardZoneProps {
  /** Zone width in pixels */
  width: number;
  /** Zone height in pixels */
  height: number;
  /** Last card draw result (null if no card drawn) */
  lastCardDraw: CardDrawResult | null;
  /** Optional custom style string */
  style?: string;
  /** NEW: Tier color scheme to apply to card label */
  tierColorScheme?: ColorScheme | null;
}
```

**Props Validation**:
- `width` must be > 0
- `height` must be > 0
- `lastCardDraw` can be null (empty state)
- `tierColorScheme` is optional (falls back to default styling if null)

**Component Behavior**:
- Applies tier color scheme to card label when `tierColorScheme` is provided
- Falls back to default styling if `tierColorScheme` is null
- Maintains all existing functionality (card display, information)
- Updates color scheme reactively when tier configuration changes

## Function Contracts

### assignCardToDefaultTier

```typescript
function assignCardToDefaultTier(card: DivinationCard): DefaultTier
```

**Preconditions**:
- `card` is a valid DivinationCard with `value` property >= 0

**Postconditions**:
- Returns valid DefaultTier ('S', 'A', 'B', 'C', 'D', 'E', or 'F')
- Assignment is deterministic based on card.value
- Never throws (always returns a tier)

**Side Effects**: None

### validateTierName

```typescript
function validateTierName(
  name: string,
  existingTiers: Tier[]
): ValidationResult
```

**Preconditions**:
- `name` is a string (can be empty or whitespace)
- `existingTiers` is an array of Tier objects

**Postconditions**:
- Returns ValidationResult with `isValid: boolean` and `error?: string`
- Trims whitespace before validation
- Checks uniqueness, length, and reserved names

**Side Effects**: None

### validateColorScheme

```typescript
function validateColorScheme(
  colors: ColorScheme
): ValidationResult
```

**Preconditions**:
- `colors` is a ColorScheme object with hex color strings

**Postconditions**:
- Returns ValidationResult with `isValid: boolean`, `contrastRatio?: number`, and `error?: string`
- Calculates contrast ratio between textColor and backgroundColor
- Validates hex color format

**Side Effects**: None

### calculateContrastRatio

```typescript
function calculateContrastRatio(
  color1: string,
  color2: string
): number
```

**Preconditions**:
- `color1` and `color2` are valid hex color strings (#RRGGBB format)

**Postconditions**:
- Returns contrast ratio as number (>= 1.0)
- Uses WCAG contrast calculation formula
- Never throws (returns 1.0 on invalid colors)

**Side Effects**: None

## Error Handling Contracts

### TierOperationError

```typescript
interface TierOperationError {
  tierId?: string;
  cardName?: string;
  operation: 'move' | 'create' | 'update' | 'delete' | 'enable';
  error: Error;
  message: string;
}
```

**Error Handling Strategy**:
1. Validate inputs before operation
2. Check preconditions (tier exists, card exists, etc.)
3. Perform operation
4. If fails, throw TierOperationError with details
5. UI displays user-friendly error message

### ValidationError

```typescript
interface ValidationError extends Error {
  field: string;
  value: any;
  rule: string;
  message: string;
}
```

**Error Handling Strategy**:
1. Validate input against rules
2. If invalid, throw ValidationError with field and rule
3. UI displays inline error message next to field
4. Prevent form submission until valid

### StorageError

```typescript
interface StorageError extends Error {
  code: 'QUOTA_EXCEEDED' | 'UNAVAILABLE' | 'INVALID_DATA';
  message: string;
}
```

**Error Handling Strategy**:
1. Try storage operation
2. If quota exceeded, show user-friendly message with guidance
3. If unavailable, log warning, continue with in-memory state
4. If invalid data, reset to defaults, log error

## Performance Contracts

### Tier Lookup Time

- **Target**: <50ms for tier property lookup (PERF-002)
- **Measurement**: Time from cardName to TierConfiguration retrieval
- **Optimization**: Map-based lookups, cache tier configurations

### Tier System Initialization

- **Target**: <2s for tier system initialization (PERF-001, SC-001)
- **Measurement**: Time from app start to tier system ready
- **Optimization**: Async loading, don't block app startup, batch card assignments

### Card Movement Time

- **Target**: <1s for card movement operation (PERF-003, SC-003)
- **Measurement**: Time from moveCardToTier call to UI update
- **Optimization**: Batch storage operations, efficient state updates

### Tier Configuration Update

- **Target**: <500ms for tier configuration save (PERF-004, SC-004)
- **Measurement**: Time from updateTierConfiguration call to save complete
- **Optimization**: Debounce rapid updates, efficient serialization

## Testing Contracts

### Unit Test Requirements

- TierService: ≥80% coverage (TC-001)
- Tier assignment logic: All value ranges tested
- Tier name validation: All validation rules tested
- Color scheme validation: Contrast calculations tested
- Error handling: All error cases covered

### Integration Test Requirements

- Tier system initialization: End-to-end test with card pool
- Card movement between tiers: All movement scenarios
- Tier enable/disable: Display filtering tested
- Storage persistence: Save/load cycle tested
- Audio integration: Tier sound playback with fallback

### E2E Test Requirements

- Tier management UI: Complete user workflows
- Card assignment UI: Drag-and-drop and selection
- Tier settings UI: Configuration updates
- Performance: Operations meet time requirements
- Accessibility: Keyboard navigation and screen readers

## Migration Contracts

### Backward Compatibility

- Existing LastCardZone props must remain valid
- QualityTier-based sounds must continue to work
- Card drop flow must work without tier system
- No breaking changes to existing interfaces

### Future Extensibility

- Service interfaces allow for additional tier properties
- Component props can be extended without breaking changes
- Data models support additional tier metadata
- Storage schema supports version migration

## Store Contracts

### TierStore (Svelte Store)

```typescript
interface TierStore {
  /** Reactive tier configuration state */
  subscribe: (callback: (state: TierConfigurationState) => void) => () => void;
  /** Get tier for card (reactive) */
  getTierForCard: (cardName: string) => Tier | null;
  /** Get tier configuration (reactive) */
  getTierConfiguration: (tierId: string) => TierConfiguration | null;
  /** Check if card should be displayed (reactive) */
  shouldDisplayCard: (cardName: string) => boolean;
}
```

**Store Behavior**:
- Reactive updates when tier configurations change
- Efficient lookups using Map-based data structures
- Subscriptions trigger component updates automatically
- Store updates trigger UI re-renders

