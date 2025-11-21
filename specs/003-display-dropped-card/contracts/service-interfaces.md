# Service Interfaces: Purple Zone Card Graphical Display

**Feature**: 003-display-dropped-card  
**Date**: 2025-01-27

## Overview

This document defines the service interfaces and component contracts for the card graphical display feature. These contracts ensure consistent implementation and testability.

## Service Interfaces

### CardImageService

Service responsible for loading and resolving card artwork images.

```typescript
interface CardImageService {
  /**
   * Resolve card artwork image URL from artFilename.
   * Tries optimized import first, then falls back to runtime path.
   * 
   * @param artFilename - Artwork filename (e.g., "AChillingWind")
   * @returns Resolved image URL or null if not found
   */
  resolveCardImageUrl(artFilename: string | null): string | null;

  /**
   * Load card image and return loading state.
   * Handles image loading, error states, and caching.
   * 
   * @param artFilename - Artwork filename
   * @returns Promise resolving to CardImageState
   */
  loadCardImage(artFilename: string | null): Promise<CardImageState>;

  /**
   * Preload card images for better performance.
   * Can be called with array of likely cards to preload.
   * 
   * @param artFilenames - Array of artwork filenames to preload
   * @returns Promise resolving when all images are loaded or failed
   */
  preloadCardImages(artFilenames: string[]): Promise<void>;

  /**
   * Get cached image URL if available.
   * 
   * @param artFilename - Artwork filename
   * @returns Cached URL or null
   */
  getCachedImageUrl(artFilename: string | null): string | null;
}
```

**Implementation Requirements**:
- Must handle missing images gracefully (return null, not throw)
- Should cache resolved URLs to avoid repeated lookups
- Must support both build-time optimized imports and runtime paths
- Should implement image preloading for performance

**Error Handling**:
- Missing artFilename: Return null
- Image not found: Return null (component handles fallback)
- Network error: Return error state in CardImageState

### CardDataService

Service for loading extended card data from cards.json.

```typescript
interface CardDataService {
  /**
   * Load full card data from cards.json by card name.
   * 
   * @param cardName - Card name to lookup
   * @returns Promise resolving to FullCardData or null if not found
   */
  loadFullCardData(cardName: string): Promise<FullCardData | null>;

  /**
   * Load full card data by artFilename.
   * 
   * @param artFilename - Artwork filename to lookup
   * @returns Promise resolving to FullCardData or null if not found
   */
  loadFullCardDataByArt(artFilename: string): Promise<FullCardData | null>;

  /**
   * Preload full card data for multiple cards.
   * 
   * @param cardNames - Array of card names to load
   * @returns Promise resolving when all data is loaded
   */
  preloadCardData(cardNames: string[]): Promise<void>;
}
```

**Implementation Requirements**:
- Must cache loaded card data to avoid repeated fetches
- Should handle missing cards gracefully (return null)
- Must parse cards.json efficiently (consider indexing by name/artFilename)

**Error Handling**:
- Card not found: Return null
- JSON parse error: Log error, return null
- Network error: Return null, log error

## Component Contracts

### LastCardZone Component Props

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
}
```

**Props Validation**:
- `width` must be > 0
- `height` must be > 0
- `lastCardDraw` can be null (empty state)

**Component Behavior**:
- Displays graphical card when `lastCardDraw` is not null
- Shows empty state when `lastCardDraw` is null
- Updates display when `lastCardDraw` changes
- Handles image loading states (loading, error, success)
- Maintains responsive scaling based on width/height

### CardDisplay Sub-component Props

```typescript
interface CardDisplayProps {
  /** Card display data */
  cardData: CardDisplayData;
  /** Display configuration */
  config: CardDisplayConfig;
  /** Image loading state */
  imageState: CardImageState;
}
```

**Props Validation**:
- `cardData` must be valid CardDisplayData
- `config` must have valid scaleFactor > 0
- `imageState` must be valid CardImageState

**Component Behavior**:
- Renders card frame, artwork, separator, and text
- Applies responsive scaling based on config
- Handles image loading/error states
- Parses and renders PoE styled text

## Function Contracts

### resolveCardImageUrl

```typescript
function resolveCardImageUrl(
  artFilename: string | null,
  cardArtModules: Record<string, { default: string }>
): string | null
```

**Preconditions**:
- `cardArtModules` is a valid import.meta.glob result
- `artFilename` is null or a non-empty string

**Postconditions**:
- Returns valid image URL string or null
- URL is either from optimized import or runtime path
- Never throws (returns null on error)

**Side Effects**: None

### convertToCardDisplayData

```typescript
function convertToCardDisplayData(
  cardDraw: CardDrawResult,
  fullCardData?: FullCardData
): CardDisplayData
```

**Preconditions**:
- `cardDraw` is a valid CardDrawResult
- `fullCardData` is optional (can be undefined)

**Postconditions**:
- Returns valid CardDisplayData
- All required fields are populated
- `artFilename` is set from fullCardData if available

**Side Effects**: None

### parseStyledText

```typescript
function parseStyledText(text: string): string
```

**Preconditions**:
- `text` is a string (can be empty)

**Postconditions**:
- Returns HTML string with PoE styling applied
- All HTML is properly escaped (XSS-safe)
- PoE metadata tags are converted to CSS classes

**Side Effects**: None

**Security Requirements**:
- Must escape all user-provided text
- Must validate tag names against whitelist
- Must sanitize output to prevent XSS

### calculateCardDisplayConfig

```typescript
function calculateCardDisplayConfig(
  zoneWidth: number,
  zoneHeight: number,
  baseWidth?: number
): CardDisplayConfig
```

**Preconditions**:
- `zoneWidth` > 0
- `zoneHeight` > 0
- `baseWidth` > 0 (defaults to 300)

**Postconditions**:
- Returns valid CardDisplayConfig
- `scaleFactor` is calculated correctly
- `baseHeight` maintains 455:300 aspect ratio

**Side Effects**: None

## Error Handling Contracts

### Image Loading Errors

```typescript
interface ImageLoadError {
  artFilename: string;
  error: Error;
  fallbackUsed: boolean;
}
```

**Error Handling Strategy**:
1. Try optimized import → if fails, try runtime path
2. If both fail, set error state
3. Component displays fallback (placeholder or text-only)
4. Log error for debugging (non-blocking)

### Data Loading Errors

```typescript
interface DataLoadError {
  cardName: string;
  error: Error;
  source: 'cards.json' | 'cardValues.json';
}
```

**Error Handling Strategy**:
1. Try loading full card data
2. If fails, use basic card info only
3. Log error (non-blocking)
4. Continue with available data

## Performance Contracts

### Image Load Time

- **Target**: <500ms for card image load (PERF-001)
- **Measurement**: Time from artFilename resolution to image onload event
- **Optimization**: Preload frame/separator, lazy load card art

### Display Update Time

- **Target**: <200ms for card display update (PERF-002)
- **Measurement**: Time from CardDrawResult change to visual update
- **Optimization**: Reactive updates, efficient state management

### Scaling Calculation Time

- **Target**: <50ms for scaling calculations (PERF-004)
- **Measurement**: Time to calculate CardDisplayConfig
- **Optimization**: Cache calculations, use CSS transforms

## Testing Contracts

### Unit Test Requirements

- CardImageService: ≥80% coverage (TC-001)
- Image resolution logic: All paths tested
- Error handling: All error cases covered
- Styled text parsing: All PoE tag types tested

### Integration Test Requirements

- Card display update flow: End-to-end test
- Image loading with fallback: Error scenarios
- Responsive scaling: Various zone sizes

### E2E Test Requirements

- Visual regression: Card display matches reference
- Performance: Load times meet requirements
- Accessibility: Screen reader compatibility

## Migration Contracts

### Backward Compatibility

- Existing LastCardZone props must remain valid
- Text-only display must work if images fail
- No breaking changes to CardDrawResult interface
- Zone layout integration must be preserved

### Future Extensibility

- Service interfaces allow for additional image sources
- Component props can be extended without breaking changes
- Data models support additional card metadata
- Styling system supports new PoE tag types

