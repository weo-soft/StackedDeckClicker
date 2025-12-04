# Data Model: Game Mode Selection

**Feature**: Game Mode Selection  
**Date**: 2025-01-27  
**Phase**: 1 - Design

## Overview

This document defines the data entities, relationships, and data flow for the Game Mode Selection feature. Game modes configure starting conditions (decks, chaos, upgrades, shop availability, rarity settings) and available features.

## Entities

### GameMode

Represents a game mode configuration preset that defines starting conditions and available features.

**Attributes**:
- `id: GameModeId` - Unique identifier for the game mode
- `name: string` - Display name for the game mode
- `description: string` - User-facing description of the game mode
- `startingDecks: number | 'unlimited'` - Starting number of decks (or 'unlimited' for Classic mode)
- `startingChaos: number` - Starting chaos/score value
- `shopEnabled: boolean` - Whether the upgrade shop is available
- `allowedUpgrades: UpgradeType[]` - List of upgrade types available in this mode
- `initialUpgradeLevels: Map<UpgradeType, number>` - Initial levels for specific upgrades (e.g., luckyDrop level 1)
- `customRarityPercentage?: number` - Optional base rarity percentage override (0-100)

**Type Definition**:
```typescript
type GameModeId = 'classic' | 'ruthless' | 'dopamine' | 'stacked-deck-clicker';

interface GameMode {
  id: GameModeId;
  name: string;
  description: string;
  startingDecks: number | 'unlimited';
  startingChaos: number;
  shopEnabled: boolean;
  allowedUpgrades: UpgradeType[];
  initialUpgradeLevels: Map<UpgradeType, number>;
  customRarityPercentage?: number;
}
```

**Validation Rules**:
- `id` must be one of the defined GameModeId values
- `startingDecks` must be positive number or 'unlimited'
- `startingChaos` must be non-negative number (>= 0)
- `allowedUpgrades` must contain valid UpgradeType values
- `initialUpgradeLevels` keys must be valid UpgradeType values
- `customRarityPercentage` must be between 0 and 100 if provided

**Relationships**:
- Referenced by GameModeService (configuration storage)
- Used to initialize GameState
- Stored in localStorage as string ID

**State Transitions**:
- Created at application startup with predefined configurations
- Selected by user via GameModeSelection component
- Applied during game state initialization
- Can be changed by user (resets game state)

---

### GameModeSelection

Represents the user's current game mode selection state.

**Attributes**:
- `selectedMode: GameModeId | null` - Currently selected game mode (null if not yet selected)
- `isSelectionPending: boolean` - Whether user is in the process of selecting a mode
- `pendingModeChange: GameModeId | null` - Mode pending confirmation (for mid-session changes)

**Type Definition**:
```typescript
interface GameModeSelection {
  selectedMode: GameModeId | null;
  isSelectionPending: boolean;
  pendingModeChange: GameModeId | null;
}
```

**Validation Rules**:
- `selectedMode` must be valid GameModeId or null
- `pendingModeChange` must be valid GameModeId or null
- `isSelectionPending` true only when user is actively selecting

**Relationships**:
- Managed by GameModeService
- Stored in localStorage as string (mode ID only)
- Used by GameModeSelection component for UI state

**State Transitions**:
- Initialized as `null` (no mode selected)
- Set when user selects a mode
- Cleared when mode is changed (pending confirmation)
- Persisted to localStorage on selection

---

## Data Flow

### Game Mode Selection Flow

1. Application loads
2. Check localStorage for `'gameMode'` key
3. If no mode found → Show GameModeSelection component
4. User selects a mode → Store mode ID in localStorage
5. Call `gameModeService.applyModeConfiguration(modeId)`
6. Initialize game state with mode configuration
7. Load game area

### Game State Initialization with Mode

1. `gameModeService.getCurrentMode()` → Returns GameMode configuration
2. `createDefaultGameState(mode)` → Creates GameState with mode-specific values:
   - `decks`: Set from `mode.startingDecks` (or enable infinite if 'unlimited')
   - `score`: Set from `mode.startingChaos`
   - `upgrades`: Initialize all upgrades, apply `mode.initialUpgradeLevels`
   - `customRarityPercentage`: Set from `mode.customRarityPercentage` if provided
3. `gameStateService.setInfiniteDecks(mode.startingDecks === 'unlimited')`
4. Return configured GameState

### Mode Change Flow

1. User requests mode change (via settings or selection screen)
2. Check if game state exists (has progress)
3. If progress exists → Show confirmation dialog
4. User confirms → Clear game state storage
5. Store new mode ID in localStorage
6. Apply new mode configuration
7. Reinitialize game state
8. Reload game area

### Deck Purchase Flow (Ruthless Mode)

1. User clicks "Purchase Decks" button
2. `gameStateService.purchaseDecks(chaosCost, deckCount)` called
3. Validate: `gameState.score >= chaosCost`
4. Update game state:
   - `score -= chaosCost`
   - `decks += deckCount`
5. Save game state (immediate)
6. Update UI to reflect new values

### Upgrade Filtering Flow

1. `UpgradeShop` component renders
2. Get current mode: `gameModeService.getCurrentMode()`
3. Get allowed upgrades: `mode.allowedUpgrades`
4. Filter `upgradeService.getAvailableUpgrades()`:
   - Keep only upgrades where `type` is in `allowedUpgrades`
5. Render filtered upgrades in shop grid

---

## Mode Configurations

### Classic Mode

```typescript
{
  id: 'classic',
  name: 'Classic',
  description: 'Unlimited Stacked Decks, no shop, no upgrades',
  startingDecks: 'unlimited',
  startingChaos: 0,
  shopEnabled: false,
  allowedUpgrades: [],
  initialUpgradeLevels: new Map(),
  customRarityPercentage: undefined
}
```

### Ruthless Mode

```typescript
{
  id: 'ruthless',
  name: 'Ruthless',
  description: 'Limited Stacked Decks, low starting chaos, buy decks with chaos, no shop, no upgrades',
  startingDecks: 5,
  startingChaos: 25,
  shopEnabled: false,
  allowedUpgrades: [],
  initialUpgradeLevels: new Map(),
  customRarityPercentage: undefined
}
```

### Give me my Dopamine Mode

```typescript
{
  id: 'dopamine',
  name: 'Give me my Dopamine',
  description: 'High starting resources, increased rarity, lucky drop level 1, only Rarity and Luck upgrades',
  startingDecks: 75,
  startingChaos: 750,
  shopEnabled: true,
  allowedUpgrades: ['improvedRarity', 'luckyDrop'],
  initialUpgradeLevels: new Map([['luckyDrop', 1]]),
  customRarityPercentage: 25
}
```

### Stacked Deck Clicker Mode

```typescript
{
  id: 'stacked-deck-clicker',
  name: 'Stacked Deck Clicker',
  description: 'Limited decks, no starting chaos, enabled shop, all upgrades available',
  startingDecks: 10,
  startingChaos: 0,
  shopEnabled: true,
  allowedUpgrades: ['autoOpening', 'improvedRarity', 'luckyDrop', 'multidraw', 'deckProduction', 'sceneCustomization'],
  initialUpgradeLevels: new Map(),
  customRarityPercentage: undefined
}
```

---

## Storage Schema

### localStorage Keys

- **`'gameMode'`**: String value storing GameModeId
  - Values: `'classic' | 'ruthless' | 'dopamine' | 'stacked-deck-clicker' | null`
  - Persists across sessions
  - Independent of game state storage

### Game State Storage (IndexedDB via LocalForage)

Game state is stored separately and includes:
- `score`: Current chaos/score
- `decks`: Current deck count
- `upgrades`: Upgrade collection
- `customizations`: Scene customizations
- `cardCollection`: Card collection
- `customRarityPercentage`: Custom rarity override

**Note**: Game mode is NOT stored in game state. Mode change resets game state.

---

## Validation Rules

### GameMode Validation

- All required fields must be present
- `startingDecks` must be positive number or 'unlimited'
- `startingChaos` must be >= 0
- `allowedUpgrades` must contain only valid UpgradeType values
- `initialUpgradeLevels` keys must be valid UpgradeType values
- `customRarityPercentage` must be 0-100 if provided

### Mode Selection Validation

- Selected mode ID must exist in available modes
- Mode change requires confirmation if game state exists
- Invalid mode IDs fall back to null (show selection screen)

### Deck Purchase Validation (Ruthless Mode)

- Player must have sufficient chaos: `score >= chaosCost`
- `chaosCost` must be positive
- `deckCount` must be positive
- Purchase only available in Ruthless mode

---

## Relationships Summary

```
GameMode (configuration)
  ├── Used by → GameModeService
  ├── Applied to → GameState (initialization)
  └── Selected via → GameModeSelection (component)

GameModeSelection (UI state)
  ├── Managed by → GameModeService
  ├── Stored in → localStorage ('gameMode')
  └── Rendered by → GameModeSelection.svelte

GameState (game data)
  ├── Initialized with → GameMode configuration
  ├── Stored in → IndexedDB (via LocalForage)
  └── Reset on → Mode change

UpgradeShop (component)
  ├── Filters by → GameMode.allowedUpgrades
  └── Renders → Filtered upgrade list
```

---

## Migration Considerations

### Existing Players

- Players without saved game mode → Show selection screen on next load
- Players with existing game state → Preserve game state, but require mode selection
- Mode selection does not migrate existing game state (intentional reset)

### Future Mode Additions

- New modes can be added by extending GameModeId type
- Add mode configuration to GameModeService
- No changes needed to existing modes
- Existing players will see new mode in selection screen

---

## Error Handling

### Invalid Mode Data

- **Corrupted localStorage**: Clear and show selection screen
- **Invalid mode ID**: Clear and show selection screen
- **Missing mode configuration**: Fall back to default (Stacked Deck Clicker)

### Mode Application Errors

- **State initialization failure**: Show error, allow retry
- **Storage write failure**: Log warning, continue with in-memory mode
- **Mode change failure**: Revert to previous mode, show error message

