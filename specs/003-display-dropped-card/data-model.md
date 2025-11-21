# Data Model: Purple Zone Card Graphical Display

**Feature**: 003-display-dropped-card  
**Date**: 2025-01-27

## Overview

This document defines the data structures and models required for displaying graphical card representations in the purple zone. The models extend existing card data with display-specific information and image loading state.

## Core Entities

### CardDisplayData

Extended card data structure that includes display-specific information needed for rendering the graphical card representation.

```typescript
interface CardDisplayData {
  /** Base card information from CardDrawResult */
  card: DivinationCard;
  /** Timestamp when card was drawn */
  timestamp: number;
  /** Score gained from this card */
  scoreGained: number;
  /** Artwork filename for loading card image */
  artFilename: string | null;
  /** Full card data from cards.json (if available) */
  fullCardData?: FullCardData;
}
```

**Fields**:
- `card`: The base DivinationCard interface (name, weight, value, qualityTier)
- `timestamp`: Unix timestamp when deck was opened
- `scoreGained`: Score value from this card draw
- `artFilename`: Filename for card artwork image (e.g., "AChillingWind")
- `fullCardData`: Optional extended data from cards.json (explicitModifiers, flavourText, stackSize, etc.)

**Validation Rules**:
- `card` must be a valid DivinationCard
- `timestamp` must be a positive number
- `scoreGained` must be >= 0
- `artFilename` can be null if artwork is not available

**State Transitions**:
- Created when a card is drawn → `CardDrawResult` is converted to `CardDisplayData`
- Updated when a new card is drawn → previous data is replaced
- Cleared when no card is available → set to `null`

### FullCardData

Extended card information from cards.json that includes display text and metadata.

```typescript
interface FullCardData {
  /** Card name */
  name: string;
  /** Artwork filename */
  artFilename: string;
  /** Stack size (how many cards in a stack) */
  stackSize?: number;
  /** Explicit modifiers/rewards text with PoE styling */
  explicitModifiers?: Array<{
    text: string;
    optional: boolean;
  }>;
  /** Flavor text */
  flavourText?: string;
  /** Card details ID (for matching with cardValues.json) */
  detailsId: string;
  /** Card ID */
  id: string;
  /** Drop weight for probability calculation */
  dropWeight: number;
}
```

**Fields**:
- `name`: Card display name
- `artFilename`: Filename for artwork image
- `stackSize`: Optional stack size (displayed on card)
- `explicitModifiers`: Array of reward text with PoE styling metadata
- `flavourText`: Optional flavor text for card
- `detailsId`: Identifier for matching with cardValues.json
- `id`: Unique card identifier
- `dropWeight`: Probability weight (not used for display, but part of data)

**Validation Rules**:
- `name` must be non-empty string
- `artFilename` must be non-empty string if provided
- `detailsId` must match format used in cardValues.json
- `dropWeight` must be > 0

### CardImageState

State tracking for card image loading and display.

```typescript
interface CardImageState {
  /** Image URL (resolved path) */
  url: string | null;
  /** Whether image is currently loading */
  loading: boolean;
  /** Whether image failed to load */
  error: boolean;
  /** Error message if load failed */
  errorMessage?: string;
}
```

**Fields**:
- `url`: Resolved image URL (from import or runtime path)
- `loading`: Boolean indicating if image is currently loading
- `error`: Boolean indicating if image load failed
- `errorMessage`: Optional error message for debugging

**State Transitions**:
1. Initial: `{ url: null, loading: true, error: false }`
2. Loading: `{ url: null, loading: true, error: false }`
3. Success: `{ url: "<resolved-url>", loading: false, error: false }`
4. Error: `{ url: null, loading: false, error: true, errorMessage: "..." }`

**Validation Rules**:
- `url` is null when loading or on error
- `loading` and `error` cannot both be true
- If `error` is true, `url` must be null

### CardDisplayConfig

Configuration for card display rendering, including sizing and positioning.

```typescript
interface CardDisplayConfig {
  /** Base card width in pixels */
  baseWidth: number;
  /** Base card height in pixels (calculated from aspect ratio) */
  baseHeight: number;
  /** Scale factor based on zone dimensions */
  scaleFactor: number;
  /** Zone width */
  zoneWidth: number;
  /** Zone height */
  zoneHeight: number;
}
```

**Fields**:
- `baseWidth`: Base card width (300px from reference)
- `baseHeight`: Calculated height based on aspect ratio (455/300)
- `scaleFactor`: Scaling factor for responsive sizing
- `zoneWidth`: Current purple zone width
- `zoneHeight`: Current purple zone height

**Calculation**:
- `baseHeight = baseWidth * (455 / 300)` (maintains card aspect ratio)
- `scaleFactor = zoneWidth / baseWidth` (scales to fit zone)

**Validation Rules**:
- `baseWidth` must be > 0
- `baseHeight` must maintain 455:300 aspect ratio
- `scaleFactor` must be > 0
- `zoneWidth` and `zoneHeight` must match actual zone dimensions

## Data Flow

### Card Draw to Display

```
CardDrawResult (from gameStateService)
  ↓
Convert to CardDisplayData
  ↓
Load FullCardData from cards.json (optional, async)
  ↓
Resolve artFilename to image URL
  ↓
Load card image (async)
  ↓
Update CardImageState
  ↓
Render in LastCardZone component
```

### Image Loading Flow

```
artFilename (from CardDisplayData)
  ↓
Try import.meta.glob() lookup (build-time optimized)
  ↓ (if not found)
Try resolvePath() runtime path
  ↓ (if not found)
Set error state, use fallback
  ↓
Update CardImageState
  ↓
Component reacts to state change
```

## Relationships

### CardDisplayData ↔ DivinationCard
- **Relationship**: Composition
- **Cardinality**: 1:1
- **Description**: CardDisplayData contains a DivinationCard instance

### CardDisplayData ↔ FullCardData
- **Relationship**: Optional composition
- **Cardinality**: 1:0..1
- **Description**: CardDisplayData may include FullCardData for extended display information

### CardDisplayData ↔ CardImageState
- **Relationship**: Association
- **Cardinality**: 1:1
- **Description**: Each CardDisplayData has a corresponding CardImageState for image loading

### CardDisplayData ↔ CardDisplayConfig
- **Relationship**: Association
- **Cardinality**: 1:1
- **Description**: CardDisplayData uses CardDisplayConfig for rendering dimensions

## Data Sources

### Static Files

1. **cards.json** (`/static/cards/cards.json`)
   - Contains FullCardData for all cards
   - Includes artFilename, explicitModifiers, flavourText
   - Used for extended card display information

2. **cardValues.json** (`/static/cards/cardValues.json`)
   - Contains card value data (chaosValue, divineValue)
   - Matched by detailsId
   - Already used by gameStateService for card pool creation

3. **Card Art Images** (`/static/cards/cardArt/*.png`)
   - 450+ PNG image files
   - Named using artFilename from cards.json
   - Format: `{artFilename}.png` (e.g., "AChillingWind.png")

4. **Frame Image** (`/static/cards/Divination_card_frame.png`)
   - Overlay frame for card display
   - Used for all cards

5. **Separator Image** (`/static/cards/Divination_card_separator.png`)
   - Separator line between artwork and text
   - Used for all cards

### Runtime Data

1. **CardDrawResult** (from gameStateService)
   - Current last drawn card
   - Updated when decks are opened
   - Contains: card, timestamp, scoreGained

2. **Zone Layout** (from zoneLayoutService)
   - Purple zone dimensions
   - Used for responsive scaling
   - Contains: x, y, width, height

## Data Transformation

### Converting CardDrawResult to CardDisplayData

```typescript
function convertToCardDisplayData(
  cardDraw: CardDrawResult,
  fullCardData?: FullCardData
): CardDisplayData {
  return {
    card: cardDraw.card,
    timestamp: cardDraw.timestamp,
    scoreGained: cardDraw.scoreGained,
    artFilename: fullCardData?.artFilename || null,
    fullCardData: fullCardData
  };
}
```

### Resolving Art Filename to Image URL

```typescript
function resolveCardImageUrl(
  artFilename: string | null,
  cardArtModules: Record<string, { default: string }>
): string | null {
  if (!artFilename) return null;
  
  const expectedFilename = `${artFilename}.png`;
  const modulePath = Object.keys(cardArtModules).find(path =>
    path.includes(expectedFilename)
  );
  
  if (modulePath) {
    return cardArtModules[modulePath].default;
  }
  
  return resolvePath(`/cards/cardArt/${expectedFilename}`);
}
```

## Validation Rules Summary

| Entity | Validation Rule | Error Handling |
|--------|----------------|----------------|
| CardDisplayData | card must be valid DivinationCard | Use default/empty card |
| CardDisplayData | artFilename can be null | Show placeholder/fallback |
| CardImageState | url null when loading/error | Show loading/error state |
| CardDisplayConfig | scaleFactor > 0 | Default to 1.0 if invalid |
| FullCardData | artFilename non-empty if provided | Skip extended data if missing |

## Edge Cases

1. **Missing artFilename**: Use placeholder image or text-only display
2. **Image load failure**: Set error state, show fallback representation
3. **Zone resize during load**: Recalculate scaleFactor, maintain aspect ratio
4. **Rapid card changes**: Cancel previous image load, start new load
5. **FullCardData not loaded**: Render with basic card info only
6. **Invalid card data**: Fallback to text-only display with error logging

