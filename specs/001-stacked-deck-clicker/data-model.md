# Data Model: Stacked Deck Clicker Game

**Created**: 2025-01-27  
**Purpose**: Define entities, their attributes, relationships, and validation rules

## Entities

### DivinationCard

Represents a collectible card that can be drawn from a Stacked Deck.

**Attributes**:
- `name: string` - Unique identifier for the card (e.g., "The Doctor", "House of Mirrors")
- `weight: number` - Probability weight for random selection (lower = rarer, must be > 0)
- `value: number` - Score contribution when card is drawn (must be >= 0)
- `qualityTier: QualityTier` - Categorical value for visual/audio effects

**Type Definition**:
```typescript
type QualityTier = 'common' | 'rare' | 'epic' | 'legendary';

interface DivinationCard {
  name: string;
  weight: number;
  value: number;
  qualityTier: QualityTier;
}
```

**Validation Rules**:
- `name` must be non-empty string, unique within card pool
- `weight` must be positive number (> 0)
- `value` must be non-negative number (>= 0)
- `qualityTier` must be one of the defined enum values

**Relationships**:
- Belongs to a CardPool (collection of all available cards)
- Referenced by CardDrawResult (result of opening a deck)

**State Transitions**:
- Static entity - cards are defined at game initialization, not modified during gameplay

---

### CardPool

Collection of all available Divination Cards that can be drawn.

**Attributes**:
- `cards: DivinationCard[]` - Array of all cards in the pool
- `totalWeight: number` - Sum of all card weights (cached for performance)

**Type Definition**:
```typescript
interface CardPool {
  cards: DivinationCard[];
  totalWeight: number;
  cumulativeWeights: number[]; // Precomputed for weighted random selection
}
```

**Validation Rules**:
- Must contain at least one card (per FR-003 requirement)
- All cards must have valid weights (> 0)
- `totalWeight` must equal sum of all card weights

**Relationships**:
- Contains multiple DivinationCard entities
- Used by CardService for drawing cards

**State Transitions**:
- Initialized at game start with predefined card set
- Can be modified by "Improved Rarity" upgrade (weight manipulation)

---

### Upgrade

Represents a purchased enhancement that modifies gameplay mechanics.

**Attributes**:
- `type: UpgradeType` - Category of upgrade
- `level: number` - Current level of the upgrade (starts at 0, increases with purchases)
- `baseCost: number` - Base cost for first purchase
- `costMultiplier: number` - Multiplier for cost increase per level (typically 1.5-2.0)

**Type Definition**:
```typescript
type UpgradeType = 
  | 'autoOpening'      // Decks opened per second
  | 'improvedRarity'   // Weight manipulation for rarer cards
  | 'luck'             // Extra rolls, best-of-N selection
  | 'multidraw'        // Open 10/50/100 decks at once
  | 'deckProduction'   // Passive deck generation rate
  | 'sceneCustomization'; // Cosmetic scene changes

interface Upgrade {
  type: UpgradeType;
  level: number;
  baseCost: number;
  costMultiplier: number;
}
```

**Validation Rules**:
- `level` must be non-negative integer (>= 0)
- `baseCost` must be positive number (> 0)
- `costMultiplier` must be >= 1.0
- `type` must be one of the defined enum values

**Computed Properties**:
- `currentCost: number` - Cost to purchase next level: `baseCost * (costMultiplier ^ level)`
- `effectValue: number` - Current effect magnitude based on level (varies by upgrade type)

**Relationships**:
- Belongs to UpgradeCollection (all owned upgrades)
- Affects various game mechanics (card drawing, score calculation, etc.)

**State Transitions**:
- Created at level 0 when upgrade type is first available
- Level increases when player purchases upgrade
- Effect is immediately active after purchase

---

### UpgradeCollection

Collection of all upgrades owned by the player.

**Attributes**:
- `upgrades: Map<UpgradeType, Upgrade>` - Map of upgrade type to upgrade instance

**Type Definition**:
```typescript
interface UpgradeCollection {
  upgrades: Map<UpgradeType, Upgrade>;
}
```

**Validation Rules**:
- Each upgrade type can appear at most once
- All upgrades must have valid types and levels

**Relationships**:
- Contains multiple Upgrade entities
- Referenced by GameState

**State Transitions**:
- Initialized empty or with default upgrades
- Modified when player purchases upgrades

---

### CardDrawResult

Result of opening a single Stacked Deck.

**Attributes**:
- `card: DivinationCard` - The card that was drawn
- `timestamp: number` - Unix timestamp when deck was opened
- `scoreGained: number` - Score value from this card (equals card.value)

**Type Definition**:
```typescript
interface CardDrawResult {
  card: DivinationCard;
  timestamp: number;
  scoreGained: number;
}
```

**Validation Rules**:
- `card` must be a valid DivinationCard from the card pool
- `timestamp` must be valid Unix timestamp
- `scoreGained` must equal `card.value`

**Relationships**:
- References a DivinationCard
- Part of DrawHistory (optional: for tracking recent draws)

**State Transitions**:
- Created when a deck is opened
- Used to update player score
- Can be displayed in scene or stored in history

---

### GameState

Complete game state that must be persisted between sessions.

**Attributes**:
- `score: number` - Current player score (accumulated from card values, spent on upgrades)
- `decks: number` - Number of Stacked Decks available to open
- `lastSessionTimestamp: number` - Unix timestamp of last game session (for offline progression)
- `upgrades: UpgradeCollection` - All owned upgrades and their levels
- `customizations: Map<string, boolean>` - Active scene customizations (key = customization ID)
- `cardCollection: Map<string, number>` - Optional: Track count of each card collected (key = card name)

**Type Definition**:
```typescript
interface GameState {
  score: number;
  decks: number;
  lastSessionTimestamp: number;
  upgrades: UpgradeCollection;
  customizations: Map<string, boolean>;
  cardCollection?: Map<string, number>; // Optional tracking feature
}
```

**Validation Rules**:
- `score` must be non-negative number (>= 0)
- `decks` must be non-negative integer (>= 0)
- `lastSessionTimestamp` must be valid Unix timestamp
- `upgrades` must be valid UpgradeCollection
- `customizations` keys must be valid customization IDs
- `cardCollection` keys must match card names from CardPool

**Relationships**:
- Contains UpgradeCollection
- References CardPool (indirectly, via card names in collection)
- Persisted to IndexedDB via StorageService

**State Transitions**:
- Initialized with default values on first play
- Updated on every deck opening (score increase, decks decrease)
- Updated on upgrade purchase (score decrease, upgrade level increase)
- Updated on customization purchase (score decrease, customization activated)
- Updated on offline progression calculation (score increase, decks decrease)
- Saved to storage periodically and on critical events

**Serialization**:
- Must be serializable to JSON for IndexedDB storage
- Maps converted to objects/arrays for JSON serialization
- Timestamps stored as numbers (Unix time)

---

### OfflineProgressionResult

Result of calculating offline progression when game reopens.

**Attributes**:
- `elapsedSeconds: number` - Time elapsed since last session
- `decksOpened: number` - Number of decks that were auto-opened
- `cardsDrawn: CardDrawResult[]` - All cards drawn during offline period
- `scoreGained: number` - Total score accumulated during offline period
- `capped: boolean` - Whether elapsed time was capped to maximum

**Type Definition**:
```typescript
interface OfflineProgressionResult {
  elapsedSeconds: number;
  decksOpened: number;
  cardsDrawn: CardDrawResult[];
  scoreGained: number;
  capped: boolean;
}
```

**Validation Rules**:
- `elapsedSeconds` must be non-negative number (>= 0)
- `decksOpened` must be non-negative integer (>= 0)
- `cardsDrawn.length` must equal `decksOpened`
- `scoreGained` must equal sum of all `card.value` in `cardsDrawn`
- `capped` true if elapsed time exceeded maximum (e.g., 7 days)

**Relationships**:
- Contains multiple CardDrawResult entities
- Used to update GameState

**State Transitions**:
- Created when game loads and detects offline time
- Used to update GameState (score, decks, card collection)
- Displayed to player as summary notification

---

## Data Flow

### Deck Opening Flow

1. Player initiates deck opening
2. Validate: `gameState.decks > 0`
3. Apply upgrade effects (rarity improvements, luck bonuses)
4. Draw card from CardPool using weighted random selection
5. Create CardDrawResult
6. Update GameState:
   - `score += cardDrawResult.scoreGained`
   - `decks -= 1`
   - `cardCollection[card.name] += 1` (if tracking enabled)
7. Trigger visual/audio feedback
8. Save GameState to storage (debounced)

### Upgrade Purchase Flow

1. Player selects upgrade to purchase
2. Calculate cost: `upgrade.currentCost`
3. Validate: `gameState.score >= upgrade.currentCost`
4. Update GameState:
   - `score -= upgrade.currentCost`
   - `upgrades[upgradeType].level += 1`
5. Apply upgrade effect immediately
6. Save GameState to storage

### Offline Progression Flow

1. Game loads, reads GameState from storage
2. Calculate elapsed time: `currentTime - gameState.lastSessionTimestamp`
3. Cap elapsed time to maximum (7 days)
4. Calculate decks to open based on auto-opening rate and upgrades
5. For each deck, simulate card draw (using deterministic PRNG)
6. Create OfflineProgressionResult
7. Update GameState:
   - `score += offlineResult.scoreGained`
   - `decks -= offlineResult.decksOpened`
   - `lastSessionTimestamp = currentTime`
   - Update `cardCollection` with all drawn cards
8. Display offline progression summary to player
9. Save updated GameState to storage

---

## Storage Schema

### IndexedDB Structure

**Database Name**: `stackedDeckClicker`  
**Version**: 1  
**Object Stores**:

1. **gameState** (key: "current")
   - Stores single GameState object
   - Key is always "current" (single player game)
   - Value: Serialized GameState JSON

2. **cardPool** (key: "default")
   - Stores CardPool definition
   - Key is "default" (can be extended for multiple pools later)
   - Value: Serialized CardPool JSON

### Migration Strategy

- Version 1: Initial schema
- Future versions: Add migration logic in StorageService
- Validate loaded data structure before using
- Provide fallback to defaults if migration fails

---

## Validation Functions

### validateGameState(state: GameState): boolean

Validates complete game state structure and values.

**Checks**:
- All required fields present
- Score >= 0
- Decks >= 0
- Valid timestamp
- Valid upgrades structure
- Valid customizations structure

### validateCardPool(pool: CardPool): boolean

Validates card pool structure and weights.

**Checks**:
- At least one card
- All cards have valid weights (> 0)
- Total weight matches sum of individual weights
- No duplicate card names

### validateUpgrade(upgrade: Upgrade): boolean

Validates upgrade structure and values.

**Checks**:
- Valid upgrade type
- Level >= 0
- Base cost > 0
- Cost multiplier >= 1.0

---

## Error Handling

### Invalid Game State

- **Scenario**: Loaded state fails validation
- **Action**: Reset to default state, log error, notify user
- **Recovery**: Attempt to preserve score if possible, reset other fields

### Storage Quota Exceeded

- **Scenario**: IndexedDB quota full
- **Action**: Show user-friendly error message, suggest clearing browser data
- **Recovery**: Continue gameplay in memory, attempt periodic saves

### Corrupted Data

- **Scenario**: JSON parse error or invalid structure
- **Action**: Reset to default state, log error
- **Recovery**: Attempt to extract valid data (score, upgrades) if possible

