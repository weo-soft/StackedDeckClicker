# Data Model: Lucky Drop Feature

**Created**: 2025-01-27  
**Purpose**: Define entities, their attributes, relationships, and validation rules for the lucky drop feature

## Entities

### Lucky Drop Upgrade

Represents the upgrade that enables multi-roll card selection, replacing the existing "luck" upgrade.

**Attributes**:
- `type: UpgradeType` - Must be 'luckyDrop' (replaces 'luck')
- `level: number` - Current level of the upgrade (starts at 0, increases with purchases)
- `baseCost: number` - Base cost for first purchase (inherited from luck upgrade: 250)
- `costMultiplier: number` - Multiplier for cost increase per level (inherited from luck upgrade: 1.75)

**Type Definition**:
```typescript
type UpgradeType = 
  | 'autoOpening'
  | 'improvedRarity'
  | 'luckyDrop'        // Replaces 'luck' - Extra rolls, best-of-N selection
  | 'multidraw'
  | 'deckProduction'
  | 'sceneCustomization';

interface Upgrade {
  type: UpgradeType;
  level: number;
  baseCost: number;
  costMultiplier: number;
}
```

**Validation Rules**:
- `type` must be 'luckyDrop' (no longer 'luck')
- `level` must be non-negative integer (>= 0)
- `baseCost` must be positive number (> 0)
- `costMultiplier` must be positive number (> 1.0)
- Level 0 means lucky drop is inactive (standard single-roll behavior)
- Level N means (N+1) rolls are performed (level 1 = 2 rolls, level 2 = 3 rolls, etc.)

**Relationships**:
- Part of UpgradeCollection (Map<UpgradeType, Upgrade>)
- Used by CardService for multi-roll selection logic
- Used by UpgradeService for cost/effect calculations
- Stored in GameState and persisted to IndexedDB

**State Transitions**:
- Initialized at level 0 in default game state
- Level increases when player purchases upgrade
- Level persists across game sessions
- Migration: Existing 'luck' upgrade levels are converted to 'luckyDrop' levels at game state load

---

### Multi-Roll Card Selection Process

Represents the process of rolling multiple cards and selecting the best one when lucky drop is active.

**Attributes** (runtime, not persisted):
- `luckyDropLevel: number` - Current lucky drop upgrade level (from UpgradeCollection)
- `numberOfRolls: number` - Calculated as (luckyDropLevel + 1)
- `rolledCards: DivinationCard[]` - Array of cards rolled during selection process
- `selectedCard: DivinationCard` - Card with highest value from rolledCards

**Type Definition** (conceptual, not a TypeScript interface):
```typescript
// Conceptual representation of multi-roll selection process
interface MultiRollSelection {
  luckyDropLevel: number;        // From upgrade.level
  numberOfRolls: number;         // Calculated: level + 1
  rolledCards: DivinationCard[]; // Temporary array during selection
  selectedCard: DivinationCard;  // Result: card with highest value
}
```

**Validation Rules**:
- `luckyDropLevel` must be >= 0
- `numberOfRolls` must equal (luckyDropLevel + 1) when level > 0
- `numberOfRolls` must equal 1 when level = 0 (standard single-roll)
- `rolledCards` array length must equal `numberOfRolls`
- `selectedCard` must be the card from `rolledCards` with maximum `value` property
- If multiple cards have identical highest value, selection is deterministic (first encountered) or random

**Relationships**:
- Uses CardPool for rolling cards (via selectWeightedCard function)
- Produces DivinationCard as result (same interface as standard single-roll)
- Result is used by CardDrawResult (no special handling needed)

**State Transitions**:
- Process executes during deck opening (gameStateService.openDeck)
- Process is stateless (no persistence of rolledCards or selection process)
- Only the final selectedCard is used (treated identically to standard draw)

---

### Game State Migration

Represents the migration of existing 'luck' upgrade to 'luckyDrop' upgrade in saved game states.

**Attributes** (migration metadata, not persisted):
- `sourceUpgradeType: 'luck'` - Original upgrade type to migrate from
- `targetUpgradeType: 'luckyDrop'` - New upgrade type to migrate to
- `migratedLevel: number` - Level value copied from luck to luckyDrop
- `migrationTimestamp: number` - When migration occurred (for logging/debugging)

**Type Definition** (conceptual, for migration logic):
```typescript
// Migration result (not persisted, used during migration)
interface UpgradeMigration {
  sourceType: 'luck';
  targetType: 'luckyDrop';
  migratedLevel: number;
  migrationTimestamp: number;
}
```

**Validation Rules**:
- Migration only occurs if 'luck' upgrade exists in saved game state
- Migration preserves level, baseCost, and costMultiplier from luck upgrade
- Migration removes 'luck' upgrade after copying to 'luckyDrop'
- Migration is idempotent (safe to run multiple times - no-op if luck doesn't exist)
- Migration must not affect other upgrades in UpgradeCollection

**Relationships**:
- Operates on UpgradeCollection during game state load
- Reads from persisted GameState (IndexedDB)
- Writes updated GameState back to IndexedDB

**State Transitions**:
- Migration runs once at game state load time (storageService or gameStateService)
- After migration, game state contains 'luckyDrop' instead of 'luck'
- Future game state saves contain only 'luckyDrop' (no 'luck' reference)

---

## Entity Relationships

```
UpgradeCollection
  └── Map<UpgradeType, Upgrade>
       └── 'luckyDrop': Upgrade
            ├── level: number (determines numberOfRolls)
            ├── baseCost: number
            └── costMultiplier: number

CardService
  └── drawCard(cardPool, upgrades, prng)
       └── applyLuckyDropUpgrade(cardPool, luckyDropLevel, prng)
            ├── Rolls (level + 1) cards
            ├── Selects card with highest value
            └── Returns DivinationCard (same as standard draw)

GameState
  └── upgrades: UpgradeCollection
       └── Contains 'luckyDrop' upgrade (migrated from 'luck')
```

---

## Validation Rules Summary

### Lucky Drop Upgrade
- Level must be non-negative integer (>= 0)
- Level 0 = inactive (standard single-roll)
- Level N = (N+1) rolls, select highest value
- Base cost: 250 (inherited from luck upgrade)
- Cost multiplier: 1.75 (inherited from luck upgrade)

### Multi-Roll Selection
- Number of rolls = (luckyDropLevel + 1) when level > 0
- Number of rolls = 1 when level = 0
- Selected card must have maximum value among rolled cards
- Tie-breaking: deterministic (first encountered) or random

### Migration
- Only migrate if 'luck' upgrade exists in saved state
- Preserve level, baseCost, costMultiplier
- Remove 'luck' after migration
- Idempotent (safe to run multiple times)

---

## Data Flow

1. **Game State Load**:
   - Load GameState from IndexedDB
   - Check for 'luck' upgrade existence
   - If exists: create 'luckyDrop' with same level, remove 'luck'
   - Save updated GameState back to IndexedDB

2. **Deck Opening**:
   - gameStateService.openDeck() called
   - cardService.drawCard() called with UpgradeCollection
   - Check for 'luckyDrop' upgrade (level > 0)
   - If active: applyLuckyDropUpgrade() performs multi-roll selection
   - Returns DivinationCard (highest value from rolls)
   - CardDrawResult created with selected card
   - Downstream systems process card normally (no special handling)

3. **Upgrade Purchase**:
   - Player purchases luckyDrop upgrade
   - upgradeService.calculateUpgradeCost() calculates cost
   - GameState updated: luckyDrop.level++
   - GameState saved to IndexedDB
   - Future deck openings use new level for multi-roll selection

