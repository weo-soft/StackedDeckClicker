# Data Model: Card Tier Filter System

**Feature**: 004-card-tier-filter  
**Date**: 2025-01-27

## Overview

This document defines the data structures and models required for the tier-based card filtering system. The models support default tiers (S, A, B, C, D, E, F), custom tiers, tier configurations (colors, sounds), card-to-tier assignments, and tier enable/disable states.

## Core Entities

### Tier

Represents a grouping of cards with shared properties (color scheme, drop sound, enabled state).

```typescript
type DefaultTier = 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

interface Tier {
  /** Unique tier identifier (default tier name or custom tier ID) */
  id: string;
  /** Tier display name */
  name: string;
  /** Tier type: 'default' for S-A-B-C-D-E-F, 'custom' for user-created tiers */
  type: 'default' | 'custom';
  /** Display order (default tiers: S=0, A=1, B=2, C=3, D=4, E=5, F=6, custom tiers: 7+) */
  order: number;
  /** Tier configuration (colors, sound, enabled state) */
  config: TierConfiguration;
  /** Creation timestamp (for custom tiers only) */
  createdAt?: number;
  /** Last modification timestamp */
  modifiedAt: number;
}
```

**Fields**:
- `id`: Unique identifier (default tiers use their name "S", "A", etc., custom tiers use UUID)
- `name`: Display name (default tiers: "S", "A", "B", "C", "D", "E", "F", custom tiers: user-defined)
- `type`: Distinguishes system tiers from user-created tiers
- `order`: Display order (default tiers fixed 0-6, custom tiers start at 7)
- `config`: Tier configuration (colors, sound, enabled state)
- `createdAt`: Timestamp when custom tier was created (undefined for default tiers)
- `modifiedAt`: Timestamp when tier was last modified

**Validation Rules**:
- `id` must be unique across all tiers
- `name` must be non-empty, 1-50 characters
- Default tier names cannot be used for custom tiers
- `order` must be >= 0, default tiers must have order 0-6
- `config` must be a valid TierConfiguration

**State Transitions**:
- Default tiers: Created on system initialization, cannot be deleted
- Custom tiers: Created by user → can be modified → can be deleted (if no cards assigned)
- Tier order: Fixed for default tiers, custom tiers maintain creation order

### TierConfiguration

User-customizable properties of a tier (color scheme, drop sound, enabled state).

```typescript
interface TierConfiguration {
  /** Color scheme for card label display */
  colorScheme: ColorScheme;
  /** Drop sound configuration */
  sound: SoundConfiguration;
  /** Whether cards from this tier should be displayed when dropped */
  enabled: boolean;
  /** Last modification timestamp */
  modifiedAt: number;
}
```

**Fields**:
- `colorScheme`: Color configuration for card label (background, text, border)
- `sound`: Sound file configuration for drop audio
- `enabled`: Whether tier is enabled for display (independent of order)
- `modifiedAt`: Timestamp when configuration was last modified

**Validation Rules**:
- `colorScheme` must meet WCAG 2.1 AA contrast requirements (4.5:1 normal, 3:1 large)
- `sound.filePath` must be valid file path or null
- `enabled` is boolean (default: true)

**State Transitions**:
- Created with default values on tier creation
- Updated when user modifies tier properties
- `enabled` can be toggled independently of other properties

### ColorScheme

Color configuration for tier card label display.

```typescript
interface ColorScheme {
  /** Background color (hex format, e.g., "#FFD700") */
  backgroundColor: string;
  /** Text color (hex format, e.g., "#000000") */
  textColor: string;
  /** Border color (hex format, e.g., "#FFA500") */
  borderColor: string;
  /** Border width in pixels (default: 2) */
  borderWidth?: number;
}
```

**Fields**:
- `backgroundColor`: Background color for card label
- `textColor`: Text color for card label text
- `borderColor`: Border color for card label border
- `borderWidth`: Optional border width (default: 2px)

**Validation Rules**:
- All colors must be valid hex color strings (format: #RRGGBB or #RGB)
- Contrast ratio between `textColor` and `backgroundColor` must be >= 4.5:1 (normal text) or >= 3:1 (large text)
- Border colors should have sufficient contrast with background for visibility

**Default Values** (from research.md):
- Tier S: bg="#FFD700", text="#000000", border="#FFA500"
- Tier A: bg="#FF6B6B", text="#FFFFFF", border="#FF4757"
- Tier B: bg="#4ECDC4", text="#000000", border="#45B7B8"
- Tier C: bg="#95E1D3", text="#000000", border="#6BC5B8"
- Tier D: bg="#F38181", text="#000000", border="#E85A4F"
- Tier E: bg="#AA96DA", text="#FFFFFF", border="#8B7FB8"
- Tier F: bg="#C7CEEA", text="#000000", border="#A8B5D1"

### SoundConfiguration

Sound file configuration for tier drop audio.

```typescript
interface SoundConfiguration {
  /** Sound file path (relative to /static/sounds/ or absolute URL) */
  filePath: string | null;
  /** Sound volume (0.0 to 1.0, default: 1.0) */
  volume?: number;
  /** Whether sound is enabled (default: true) */
  enabled?: boolean;
}
```

**Fields**:
- `filePath`: Path to sound file (null if using default/fallback sound)
- `volume`: Playback volume (0.0 = silent, 1.0 = full volume)
- `enabled`: Whether sound should play (allows per-tier mute)

**Validation Rules**:
- `filePath` must be valid file path or null
- `volume` must be between 0.0 and 1.0
- If `filePath` is null, system uses qualityTier-based fallback sound
- Sound file must exist and be valid audio format (mp3, ogg, wav)

**State Transitions**:
- Created with default filePath (null) or user-selected file
- Updated when user changes sound file
- `enabled` can be toggled independently

### CardTierAssignment

Represents the relationship between a card and its assigned tier.

```typescript
interface CardTierAssignment {
  /** Card name (unique identifier) */
  cardName: string;
  /** Tier ID this card is assigned to */
  tierId: string;
  /** Assignment source: 'default' for automatic assignment, 'user' for user modification */
  source: 'default' | 'user';
  /** Timestamp when assignment was created */
  assignedAt: number;
  /** Timestamp when assignment was last modified (if user-modified) */
  modifiedAt?: number;
}
```

**Fields**:
- `cardName`: Unique card identifier (matches DivinationCard.name)
- `tierId`: Tier identifier (default tier name or custom tier ID)
- `source`: Whether assignment is default (automatic) or user-modified
- `assignedAt`: Timestamp when assignment was created
- `modifiedAt`: Timestamp when user modified assignment (undefined for default assignments)

**Validation Rules**:
- `cardName` must match an existing card name
- `tierId` must reference an existing tier
- Each card must be assigned to exactly one tier (enforced by data structure)
- `source` must be 'default' or 'user'

**State Transitions**:
- Created on system initialization (default assignments) or user action (user assignments)
- Updated when user moves card to different tier (source changes to 'user', modifiedAt set)
- Never deleted (cards always assigned to a tier)

### TierConfigurationState

Complete state of the tier system, persisted to IndexedDB.

```typescript
interface TierConfigurationState {
  /** Version of tier system schema (for migration) */
  version: number;
  /** Map of tier ID to Tier object */
  tiers: Map<string, Tier>;
  /** Map of card name to tier ID (card assignments) */
  cardAssignments: Map<string, string>;
  /** Timestamp when state was last saved */
  savedAt: number;
}
```

**Fields**:
- `version`: Schema version for migration (current: 1)
- `tiers`: All tiers (default + custom) keyed by tier ID
- `cardAssignments`: Card-to-tier assignments keyed by card name
- `savedAt`: Timestamp when state was persisted

**Validation Rules**:
- `version` must be >= 1
- All `cardAssignments` values must reference existing tier IDs in `tiers`
- All default tiers (S, A, B, C, D, E, F) must exist in `tiers`
- Default tier IDs must be exactly "S", "A", "B", "C", "D", "E", "F"

**State Transitions**:
- Created on first app load with default tiers and default card assignments
- Updated when user modifies tier configurations, creates custom tiers, or moves cards
- Persisted to IndexedDB after each modification
- Loaded from IndexedDB on app initialization

## Default Tier Assignment Logic

### assignCardToDefaultTier(card: DivinationCard): DefaultTier

Determines which default tier a card should be assigned to based on its value.

```typescript
function assignCardToDefaultTier(card: DivinationCard): DefaultTier {
  const value = card.value;
  
  if (value > 1000) return 'S';
  if (value > 500) return 'A';
  if (value > 200) return 'B';
  if (value > 50) return 'C';
  if (value > 10) return 'D';
  if (value > 1) return 'E';
  return 'F';
}
```

**Input**: DivinationCard with `value` property (chaos value)  
**Output**: DefaultTier ('S', 'A', 'B', 'C', 'D', 'E', or 'F')  
**Rules**:
- S: value > 1000
- A: 500 < value <= 1000
- B: 200 < value <= 500
- C: 50 < value <= 200
- D: 10 < value <= 50
- E: 1 < value <= 10
- F: value <= 1

## Storage Schema

### IndexedDB Structure

**Database Name**: `stackedDeckClicker` (existing)  
**Version**: 1 (existing, tier system adds new key)  
**Object Stores**:

1. **gameState** (existing key: "current")
   - Stores GameState object (unchanged)

2. **cardPool** (existing key: "default")
   - Stores CardPool definition (unchanged)

3. **tierConfigurations** (new key: "tierConfigurations")
   - Stores TierConfigurationState object
   - Key is always "tierConfigurations" (single configuration per user)
   - Value: Serialized TierConfigurationState JSON

### Serialization

Maps are serialized to objects for JSON storage:

```typescript
// Serialization (before save)
const serializable = {
  version: state.version,
  tiers: Object.fromEntries(state.tiers),
  cardAssignments: Object.fromEntries(state.cardAssignments),
  savedAt: state.savedAt
};

// Deserialization (after load)
const state: TierConfigurationState = {
  version: data.version,
  tiers: new Map(Object.entries(data.tiers)),
  cardAssignments: new Map(Object.entries(data.cardAssignments)),
  savedAt: data.savedAt
};
```

### Migration Strategy

- **Version 1**: Initial tier system schema
- **Future versions**: Add migration logic in TierStorageService
- Validate loaded data structure before using
- Provide fallback to defaults if migration fails
- Preserve user customizations during migration when possible

## Validation Functions

### validateTier(tier: Tier): boolean

Validates tier structure and values.

**Checks**:
- `id` is non-empty string
- `name` is non-empty, 1-50 characters
- `type` is 'default' or 'custom'
- `order` is >= 0
- `config` is valid TierConfiguration
- Default tiers have correct IDs ("S", "A", "B", "C", "D", "E", "F")
- Default tiers have order 0-6

### validateTierConfiguration(config: TierConfiguration): boolean

Validates tier configuration properties.

**Checks**:
- `colorScheme` meets contrast requirements
- `sound.filePath` is valid path or null
- `sound.volume` is between 0.0 and 1.0
- `enabled` is boolean

### validateColorScheme(colors: ColorScheme): ValidationResult

Validates color scheme and calculates contrast ratios.

**Checks**:
- All colors are valid hex format
- Contrast ratio between textColor and backgroundColor >= 4.5:1 (normal) or >= 3:1 (large)
- Returns ValidationResult with isValid, contrastRatio, and error message if invalid

### validateTierName(name: string, existingTiers: Tier[]): ValidationResult

Validates custom tier name.

**Checks**:
- Name is non-empty, 1-50 characters (after trim)
- Name is unique (not in existingTiers)
- Name is not reserved (not "S", "A", "B", "C", "D", "E", "F" case-insensitive)
- Returns ValidationResult with isValid and error message if invalid

### validateTierConfigurationState(state: TierConfigurationState): boolean

Validates complete tier system state.

**Checks**:
- `version` >= 1
- All default tiers exist (S, A, B, C, D, E, F)
- All `cardAssignments` reference valid tier IDs
- All tiers have valid Tier structure
- No duplicate tier IDs

## Error Handling

### Invalid Tier Configuration

- **Scenario**: Loaded tier configuration fails validation
- **Action**: Reset to default tier configurations, log error, preserve user assignments if possible
- **Recovery**: Attempt to migrate valid parts, reset invalid parts to defaults

### Missing Tier Assignment

- **Scenario**: Card has no tier assignment
- **Action**: Assign card to default tier based on value (assignCardToDefaultTier)
- **Recovery**: Automatic assignment on next tier system initialization

### Invalid Sound File

- **Scenario**: Tier sound file path is invalid or file doesn't exist
- **Action**: Use qualityTier-based fallback sound, log warning
- **Recovery**: User can update sound file in tier settings

### Storage Quota Exceeded

- **Scenario**: IndexedDB quota full when saving tier configurations
- **Action**: Display error message, attempt to reduce data size (remove unused custom tiers)
- **Recovery**: User can delete custom tiers or clear tier configurations

### Duplicate Tier Name

- **Scenario**: User attempts to create custom tier with duplicate name
- **Action**: Prevent creation, display error message with validation result
- **Recovery**: User must choose different name

## Relationships

### Tier → TierConfiguration (1:1)
- Each tier has exactly one configuration
- Configuration cannot exist without tier

### Tier → CardTierAssignment (1:many)
- Each tier can have many card assignments
- Each assignment references exactly one tier

### Card → CardTierAssignment (1:1)
- Each card has exactly one tier assignment
- Assignment cannot exist without card

### TierConfigurationState → Tier (1:many)
- State contains all tiers
- Tiers cannot exist outside state

### TierConfigurationState → CardTierAssignment (1:many)
- State contains all card assignments
- Assignments cannot exist outside state

