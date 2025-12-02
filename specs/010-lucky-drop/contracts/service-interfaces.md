# Service Interfaces: Lucky Drop Feature

**Created**: 2025-01-27  
**Purpose**: Define service interface changes for lucky drop feature implementation

## Overview

This document defines the changes to existing service interfaces required for the lucky drop feature. The lucky drop feature replaces the existing "luck" upgrade with "luckyDrop" upgrade, requiring updates to CardService and UpgradeService interfaces.

## CardService Interface Changes

### Updated Method: applyLuckyDropUpgrade

**Change**: Rename `applyLuckUpgrade` to `applyLuckyDropUpgrade` and update parameter name.

**Before**:
```typescript
/**
 * Apply luck upgrade (best-of-N selection).
 * 
 * @param cardPool - Card pool to draw from
 * @param luckLevel - Level of luck upgrade (determines N)
 * @param prng - Seeded PRNG instance
 * @returns Best card from N draws
 */
applyLuckUpgrade(
  cardPool: CardPool,
  luckLevel: number,
  prng: () => number
): DivinationCard;
```

**After**:
```typescript
/**
 * Apply lucky drop upgrade (best-of-N selection).
 * 
 * @param cardPool - Card pool to draw from
 * @param luckyDropLevel - Level of lucky drop upgrade (determines N)
 * @param prng - Seeded PRNG instance
 * @returns Best card from N draws (highest value among rolled cards)
 */
applyLuckyDropUpgrade(
  cardPool: CardPool,
  luckyDropLevel: number,
  prng: () => number
): DivinationCard;
```

**Behavior**: Unchanged - performs (level + 1) rolls and selects card with highest value.

### Updated Method: drawCard

**Change**: Update reference from 'luck' to 'luckyDrop' in upgrade lookup.

**Before**:
```typescript
// Apply luck upgrade (best-of-N selection)
const luckUpgrade = upgrades.upgrades.get('luck');
if (luckUpgrade && luckUpgrade.level > 0) {
  return this.applyLuckUpgrade(modifiedPool, luckUpgrade.level, prng);
}
```

**After**:
```typescript
// Apply lucky drop upgrade (best-of-N selection)
const luckyDropUpgrade = upgrades.upgrades.get('luckyDrop');
if (luckyDropUpgrade && luckyDropUpgrade.level > 0) {
  return this.applyLuckyDropUpgrade(modifiedPool, luckyDropUpgrade.level, prng);
}
```

**Behavior**: Unchanged - checks for lucky drop upgrade and applies multi-roll selection if active.

---

## UpgradeService Interface Changes

### Updated Method: calculateUpgradeEffect

**Change**: Replace 'luck' case with 'luckyDrop' case in switch statement.

**Before**:
```typescript
switch (upgrade.type) {
  case 'autoOpening':
    return this.calculateAutoOpeningRate(upgrade.level);
  case 'improvedRarity':
    return upgrade.level;
  case 'luck':
    return upgrade.level; // Level represents number of extra draws
  case 'multidraw':
    // ...
  // ...
}
```

**After**:
```typescript
switch (upgrade.type) {
  case 'autoOpening':
    return this.calculateAutoOpeningRate(upgrade.level);
  case 'improvedRarity':
    return upgrade.level;
  case 'luckyDrop':
    return upgrade.level; // Level represents number of extra draws
  case 'multidraw':
    // ...
  // ...
}
```

**Behavior**: Unchanged - returns upgrade level as effect value.

### Updated Method: getEffectDescription

**Change**: Replace 'luck' case with 'luckyDrop' case in switch statement.

**Before**:
```typescript
switch (type) {
  case 'autoOpening':
    return `${effect.toFixed(1)} decks/second`;
  case 'improvedRarity':
    return `+${effect * 10}% rare card chance`;
  case 'luck':
    return `Best of ${effect + 1} draws`;
  case 'multidraw':
    return `Open ${effect} decks at once`;
  // ...
}
```

**After**:
```typescript
switch (type) {
  case 'autoOpening':
    return `${effect.toFixed(1)} decks/second`;
  case 'improvedRarity':
    return `+${effect * 10}% rare card chance`;
  case 'luckyDrop':
    return `Best of ${effect + 1} draws`;
  case 'multidraw':
    return `Open ${effect} decks at once`;
  // ...
}
```

**Behavior**: Unchanged - returns "Best of N draws" description where N = effect + 1.

---

## GameStateService Interface Changes

### New Method: migrateLuckToLuckyDrop (Internal)

**Purpose**: Migrate existing 'luck' upgrade to 'luckyDrop' upgrade in game state.

**Interface** (internal, not part of public API):
```typescript
/**
 * Migrate 'luck' upgrade to 'luckyDrop' upgrade in game state.
 * This is a one-time migration that runs during game state initialization.
 * 
 * @param gameState - Game state to migrate
 * @returns Updated game state with 'luckyDrop' instead of 'luck'
 */
private migrateLuckToLuckyDrop(gameState: GameState): GameState {
  const luckUpgrade = gameState.upgrades.upgrades.get('luck');
  
  if (luckUpgrade) {
    // Create luckyDrop upgrade with same level and costs
    const luckyDropUpgrade: Upgrade = {
      type: 'luckyDrop',
      level: luckUpgrade.level,
      baseCost: luckUpgrade.baseCost,
      costMultiplier: luckUpgrade.costMultiplier
    };
    
    // Add luckyDrop and remove luck
    gameState.upgrades.upgrades.set('luckyDrop', luckyDropUpgrade);
    gameState.upgrades.upgrades.delete('luck');
  }
  
  return gameState;
}
```

**Behavior**:
- Checks if 'luck' upgrade exists in game state
- If exists: creates 'luckyDrop' upgrade with same level, baseCost, costMultiplier
- Removes 'luck' upgrade from collection
- Returns updated game state
- Idempotent: safe to run multiple times (no-op if 'luck' doesn't exist)

**Integration**: Called during `initialize()` method after loading game state from storage.

---

## StorageService Interface Changes

**Change**: No interface changes required. Migration logic is handled by GameStateService.

**Note**: StorageService continues to save/load GameState as before. Migration occurs in memory after load, before game state is used.

---

## UpgradeType Enum Change

### Updated Type Definition

**Before**:
```typescript
export type UpgradeType =
  | 'autoOpening'
  | 'improvedRarity'
  | 'luck'              // Extra rolls, best-of-N selection
  | 'multidraw'
  | 'deckProduction'
  | 'sceneCustomization';
```

**After**:
```typescript
export type UpgradeType =
  | 'autoOpening'
  | 'improvedRarity'
  | 'luckyDrop'         // Extra rolls, best-of-N selection (replaces 'luck')
  | 'multidraw'
  | 'deckProduction'
  | 'sceneCustomization';
```

**Location**: `src/lib/models/types.ts`

---

## Default Game State Changes

### Updated Function: createDefaultGameState

**Change**: Replace 'luck' with 'luckyDrop' in upgradeTypes array and cost functions.

**Before**:
```typescript
const upgradeTypes: UpgradeType[] = [
  'autoOpening',
  'improvedRarity',
  'luck',
  'multidraw',
  'deckProduction',
  'sceneCustomization'
];
```

**After**:
```typescript
const upgradeTypes: UpgradeType[] = [
  'autoOpening',
  'improvedRarity',
  'luckyDrop',
  'multidraw',
  'deckProduction',
  'sceneCustomization'
];
```

**Cost Functions** (before):
```typescript
function getBaseCost(type: UpgradeType): number {
  const costs: Record<UpgradeType, number> = {
    autoOpening: 100,
    improvedRarity: 500,
    luck: 250,
    multidraw: 1000,
    deckProduction: 200,
    sceneCustomization: 50
  };
  return costs[type] || 100;
}

function getCostMultiplier(type: UpgradeType): number {
  const multipliers: Record<UpgradeType, number> = {
    autoOpening: 1.5,
    improvedRarity: 2.0,
    luck: 1.75,
    multidraw: 2.5,
    deckProduction: 1.6,
    sceneCustomization: 1.3
  };
  return multipliers[type] || 1.5;
}
```

**Cost Functions** (after):
```typescript
function getBaseCost(type: UpgradeType): number {
  const costs: Record<UpgradeType, number> = {
    autoOpening: 100,
    improvedRarity: 500,
    luckyDrop: 250,        // Same cost as luck upgrade
    multidraw: 1000,
    deckProduction: 200,
    sceneCustomization: 50
  };
  return costs[type] || 100;
}

function getCostMultiplier(type: UpgradeType): number {
  const multipliers: Record<UpgradeType, number> = {
    autoOpening: 1.5,
    improvedRarity: 2.0,
    luckyDrop: 1.75,       // Same multiplier as luck upgrade
    multidraw: 2.5,
    deckProduction: 1.6,
    sceneCustomization: 1.3
  };
  return multipliers[type] || 1.5;
}
```

**Location**: `src/lib/utils/defaultGameState.ts`

---

## Service Contract Summary

### Breaking Changes
- **UpgradeType enum**: 'luck' removed, 'luckyDrop' added
- **CardService method**: `applyLuckUpgrade` renamed to `applyLuckyDropUpgrade`
- **UpgradeService**: Switch cases updated from 'luck' to 'luckyDrop'

### Non-Breaking Changes
- **Migration logic**: Internal to GameStateService, transparent to other services
- **Card drawing behavior**: Unchanged (same multi-roll selection logic)
- **Upgrade costs**: Unchanged (same baseCost and costMultiplier)

### Backward Compatibility
- **Migration**: Existing game states with 'luck' upgrade are automatically migrated to 'luckyDrop'
- **Data preservation**: Upgrade levels, costs, and multipliers are preserved during migration
- **Idempotent migration**: Safe to run multiple times without data loss

---

## Testing Contracts

All service interface changes must maintain:
- **Type safety**: Full TypeScript type definitions
- **Testability**: Methods can be tested in isolation with mocked dependencies
- **Error handling**: All error cases documented and handled gracefully
- **Documentation**: JSDoc comments updated for renamed methods

