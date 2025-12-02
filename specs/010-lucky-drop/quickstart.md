# Quickstart Guide: Lucky Drop Feature

**Created**: 2025-01-27  
**Purpose**: Quick reference for implementing the lucky drop feature

## Overview

The lucky drop feature replaces the existing "luck" upgrade with "luckyDrop" upgrade. The functionality remains identical (multi-roll selection with best-of-N), but the naming is updated to match the feature specification.

## Implementation Steps

### 1. Update UpgradeType Enum

**File**: `src/lib/models/types.ts`

```typescript
export type UpgradeType =
  | 'autoOpening'
  | 'improvedRarity'
  | 'luckyDrop'         // Changed from 'luck'
  | 'multidraw'
  | 'deckProduction'
  | 'sceneCustomization';
```

### 2. Update CardService

**File**: `src/lib/services/cardService.ts`

**Changes**:
- Rename `applyLuckUpgrade` method to `applyLuckyDropUpgrade`
- Update parameter name from `luckLevel` to `luckyDropLevel`
- Update upgrade lookup from `upgrades.get('luck')` to `upgrades.get('luckyDrop')`
- Update method call from `this.applyLuckUpgrade(...)` to `this.applyLuckyDropUpgrade(...)`

**Example**:
```typescript
// Apply lucky drop upgrade (best-of-N selection)
const luckyDropUpgrade = upgrades.upgrades.get('luckyDrop');
if (luckyDropUpgrade && luckyDropUpgrade.level > 0) {
  return this.applyLuckyDropUpgrade(modifiedPool, luckyDropUpgrade.level, prng);
}

// Method signature
applyLuckyDropUpgrade(
  cardPool: CardPool,
  luckyDropLevel: number,
  prng: () => number
): DivinationCard {
  // Implementation unchanged (same logic as applyLuckUpgrade)
  const numDraws = 1 + luckyDropLevel;
  const draws: DivinationCard[] = [];
  for (let i = 0; i < numDraws; i++) {
    draws.push(selectWeightedCard(cardPool, prng));
  }
  return draws.reduce((best, current) => (current.value > best.value ? current : best));
}
```

### 3. Update UpgradeService

**File**: `src/lib/services/upgradeService.ts`

**Changes**:
- Replace `case 'luck':` with `case 'luckyDrop':` in `calculateUpgradeEffect` method
- Replace `case 'luck':` with `case 'luckyDrop':` in `getEffectDescription` method

**Example**:
```typescript
case 'luckyDrop':
  return upgrade.level; // Level represents number of extra draws

// In getEffectDescription:
case 'luckyDrop':
  return `Best of ${effect + 1} draws`;
```

### 4. Update Default Game State

**File**: `src/lib/utils/defaultGameState.ts`

**Changes**:
- Replace `'luck'` with `'luckyDrop'` in `upgradeTypes` array
- Update `getBaseCost` function: replace `luck: 250` with `luckyDrop: 250`
- Update `getCostMultiplier` function: replace `luck: 1.75` with `luckyDrop: 1.75`

### 5. Add Migration Logic

**File**: `src/lib/services/gameStateService.ts` (or `storageService.ts`)

**Add migration method** (call during `initialize()` after loading game state):

```typescript
/**
 * Migrate 'luck' upgrade to 'luckyDrop' upgrade.
 * Idempotent: safe to run multiple times.
 */
private migrateLuckToLuckyDrop(gameState: GameState): GameState {
  const luckUpgrade = gameState.upgrades.upgrades.get('luck');
  
  if (luckUpgrade) {
    const luckyDropUpgrade: Upgrade = {
      type: 'luckyDrop',
      level: luckUpgrade.level,
      baseCost: luckUpgrade.baseCost,
      costMultiplier: luckUpgrade.costMultiplier
    };
    
    gameState.upgrades.upgrades.set('luckyDrop', luckyDropUpgrade);
    gameState.upgrades.upgrades.delete('luck');
    
    // Save migrated state
    this.saveGameState(gameState);
  }
  
  return gameState;
}
```

**Call migration in initialize()**:
```typescript
async initialize(): Promise<void> {
  const savedState = await storageService.loadGameState();
  if (savedState) {
    const migratedState = this.migrateLuckToLuckyDrop(savedState);
    this.currentState = migratedState;
  } else {
    this.currentState = createDefaultGameState();
  }
}
```

### 6. Update Tests

**Files to update**:
- `tests/unit/services/cardService.test.ts`: Update all references from 'luck' to 'luckyDrop'
- `tests/unit/services/upgradeService.test.ts`: Update all references from 'luck' to 'luckyDrop'

**New test file**:
- `tests/integration/upgradeMigration.test.ts`: Test migration from 'luck' to 'luckyDrop'

**Example migration test**:
```typescript
describe('Upgrade Migration', () => {
  it('should migrate luck upgrade to luckyDrop', () => {
    const gameState = createGameStateWithLuckUpgrade(level: 3);
    const migrated = migrateLuckToLuckyDrop(gameState);
    
    expect(migrated.upgrades.upgrades.has('luck')).toBe(false);
    expect(migrated.upgrades.upgrades.has('luckyDrop')).toBe(true);
    expect(migrated.upgrades.upgrades.get('luckyDrop')?.level).toBe(3);
  });
  
  it('should be idempotent', () => {
    const gameState = createGameStateWithLuckUpgrade(level: 2);
    const migrated1 = migrateLuckToLuckyDrop(gameState);
    const migrated2 = migrateLuckToLuckyDrop(migrated1);
    
    expect(migrated1).toEqual(migrated2);
  });
});
```

## Verification Checklist

- [ ] UpgradeType enum updated ('luck' → 'luckyDrop')
- [ ] CardService method renamed and updated
- [ ] UpgradeService switch cases updated
- [ ] Default game state updated
- [ ] Migration logic implemented and called during initialization
- [ ] All tests updated to use 'luckyDrop'
- [ ] Migration tests added and passing
- [ ] Manual test: Load game with existing 'luck' upgrade, verify migration
- [ ] Manual test: Purchase luckyDrop upgrade, verify multi-roll selection works
- [ ] Manual test: Verify upgrade description shows "Best of N draws"

## Key Points

1. **No functional changes**: The multi-roll selection logic remains identical
2. **Migration is critical**: Must preserve existing player progress
3. **Idempotent migration**: Safe to run multiple times
4. **Type safety**: TypeScript will catch any missed references during compilation
5. **Test coverage**: Ensure all tests pass and migration is thoroughly tested

## Common Pitfalls

- **Forgetting migration**: Existing players will lose their luck upgrade levels
- **Incomplete test updates**: Tests may fail if not all references updated
- **UI components**: Check if any UI components reference 'luck' upgrade type directly
- **Storage format**: Verify IndexedDB migration works correctly

