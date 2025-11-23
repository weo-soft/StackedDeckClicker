# Data Model: Card Label Click to View Details

**Feature**: 006-card-details-click  
**Date**: 2025-01-27

## Overview

This document defines the data structures and models required for detecting clicks on card labels in the yellow zone and displaying clicked card details in the purple zone. The models extend existing canvas rendering structures with click detection and state management.

## Core Entities

### LabelClickEvent

Represents a click event on the canvas that may target a card label.

```typescript
interface LabelClickEvent {
  /** X coordinate of click in canvas space */
  x: number;
  /** Y coordinate of click in canvas space */
  y: number;
  /** Original mouse event (for additional metadata if needed) */
  originalEvent: MouseEvent;
}
```

**Fields**:
- `x`: Click X coordinate in canvas pixels (from event.offsetX)
- `y`: Click Y coordinate in canvas pixels (from event.offsetY)
- `originalEvent`: Original browser MouseEvent (for timestamp, button, modifiers if needed)

**Validation Rules**:
- `x` must be >= 0 and <= canvas width
- `y` must be >= 0 and <= canvas height
- `originalEvent` must be a valid MouseEvent

**State Transitions**:
- Created when user clicks on canvas
- Processed immediately by Scene.getCardAtLabelPosition()
- Discarded after processing (no persistence needed)

### LabelHitTestResult

Result of hit testing a click position against card labels.

```typescript
interface LabelHitTestResult {
  /** The card animation that was hit (null if no label hit) */
  cardAnimation: CardAnimation | null;
  /** Whether a label was successfully hit */
  hit: boolean;
  /** Label bounds that were hit (for debugging/visual feedback) */
  labelBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
```

**Fields**:
- `cardAnimation`: The CardAnimation object whose label was clicked, or null if no label hit
- `hit`: Boolean indicating if a label was hit
- `labelBounds`: Optional bounds of the hit label (for debugging or visual feedback)

**Validation Rules**:
- `hit` is true if and only if `cardAnimation` is not null
- `labelBounds` should only be present if `hit` is true
- `cardAnimation.card` must be a valid DivinationCard if present

**State Transitions**:
- Created by Scene.getCardAtLabelPosition() during click processing
- Used to determine which card to display
- Discarded after use (no persistence needed)

### ClickedCardState

State tracking for the currently clicked card displayed in purple zone.

```typescript
interface ClickedCardState {
  /** The card draw result for the clicked card */
  cardDrawResult: CardDrawResult | null;
  /** Timestamp when card was clicked */
  clickedAt: number;
  /** Whether this is a user-clicked card (true) or last drawn card (false) */
  isClicked: boolean;
}
```

**Fields**:
- `cardDrawResult`: CardDrawResult for the clicked card (same structure as lastCardDraw)
- `clickedAt`: Unix timestamp when card was clicked
- `isClicked`: Boolean flag to distinguish clicked cards from last drawn cards

**Validation Rules**:
- `cardDrawResult` is null when no card is clicked (shows last drawn card instead)
- `clickedAt` must be a valid timestamp (positive number)
- `isClicked` is true if and only if `cardDrawResult` is not null

**State Transitions**:
1. Initial: `{ cardDrawResult: null, clickedAt: 0, isClicked: false }` (shows last drawn card)
2. Card clicked: `{ cardDrawResult: CardDrawResult, clickedAt: Date.now(), isClicked: true }`
3. New card drawn: Optionally clear clicked state to show new card
4. Manual clear: Reset to initial state

### HoverState

State tracking for hover detection on card labels.

```typescript
interface HoverState {
  /** The card animation currently being hovered (null if none) */
  hoveredCard: CardAnimation | null;
  /** Last hover check timestamp (for debouncing) */
  lastHoverCheck: number;
  /** Whether cursor should show pointer style */
  showPointer: boolean;
}
```

**Fields**:
- `hoveredCard`: CardAnimation object under cursor, or null
- `lastHoverCheck`: Timestamp of last hover hit test (for debouncing)
- `showPointer`: Whether canvas cursor should be 'pointer' (true) or 'default' (false)

**Validation Rules**:
- `hoveredCard` is null if and only if `showPointer` is false
- `lastHoverCheck` must be <= current time
- `showPointer` is true if and only if `hoveredCard` is not null

**State Transitions**:
1. Initial: `{ hoveredCard: null, lastHoverCheck: 0, showPointer: false }`
2. Mouse move: Update `lastHoverCheck`, perform hit test after debounce
3. Label hovered: `{ hoveredCard: CardAnimation, lastHoverCheck: timestamp, showPointer: true }`
4. Mouse leave label: `{ hoveredCard: null, lastHoverCheck: timestamp, showPointer: false }`

## Extended Entities

### CardAnimation (Extended)

The existing CardAnimation interface already contains all necessary fields for hit testing:
- `labelX`, `labelY`: Label position offsets from card center
- `labelWidth`, `labelHeight`: Label dimensions
- `x`, `y`: Card position in canvas space

**Hit Test Calculation**:
```typescript
function getLabelBounds(animation: CardAnimation): { x: number; y: number; width: number; height: number } {
  const labelX = animation.x + animation.labelX - animation.labelWidth / 2;
  const labelY = animation.y + animation.labelY;
  return {
    x: labelX,
    y: labelY,
    width: animation.labelWidth,
    height: animation.labelHeight
  };
}
```

### CardDrawResult (Existing)

The existing CardDrawResult interface is used for clicked cards:
- `card`: DivinationCard (name, weight, value, qualityTier)
- `timestamp`: Unix timestamp (reused from original draw, or set to click time)
- `scoreGained`: Score value (reused from original draw)

**Note**: When a card is clicked, we create a CardDrawResult from the CardAnimation's card. The timestamp and scoreGained can be preserved from the original draw if available, or set to current time and card.value respectively.

## Data Flow

### Click Detection Flow

```
User clicks canvas
  ↓
LabelClickEvent created (x, y from event.offsetX, event.offsetY)
  ↓
Scene.getCardAtLabelPosition(x, y)
  ↓
Iterate cards in reverse order (newest first)
  ↓
For each card, calculate label bounds
  ↓
Check if (x, y) is within label bounds
  ↓
Return first matching CardAnimation (topmost label)
  ↓
LabelHitTestResult created
  ↓
Convert CardAnimation to CardDrawResult
  ↓
Update ClickedCardState
  ↓
Pass CardDrawResult to LastCardZone component
```

### Hover Detection Flow

```
Mouse moves over canvas
  ↓
Debounce hover check (50ms)
  ↓
Scene.getCardAtLabelPosition(x, y)
  ↓
Update HoverState
  ↓
Update canvas cursor style ('pointer' or 'default')
  ↓
Trigger canvas redraw (if hover state changed)
  ↓
drawCardLabel applies hover style if animation === hoveredCard
```

### State Management Flow

```
GameCanvas component
  ↓
Canvas click event → LabelClickEvent
  ↓
Scene.getCardAtLabelPosition() → LabelHitTestResult
  ↓
Convert to CardDrawResult
  ↓
Emit 'cardLabelClick' event with CardDrawResult
  ↓
GameAreaLayout receives event
  ↓
Update clickedCard state
  ↓
Pass clickedCard prop to LastCardZone
  ↓
LastCardZone displays clicked card (or lastCardDraw if clickedCard is null)
```

## Relationships

### LabelClickEvent → LabelHitTestResult
- **Relationship**: Processing
- **Cardinality**: 1:1
- **Description**: Each click event is processed into a hit test result

### LabelHitTestResult → CardAnimation
- **Relationship**: Reference
- **Cardinality**: 0..1:1
- **Description**: Hit test result may reference a CardAnimation if label was hit

### CardAnimation → CardDrawResult
- **Relationship**: Conversion
- **Cardinality**: 1:1
- **Description**: CardAnimation is converted to CardDrawResult for display

### ClickedCardState → CardDrawResult
- **Relationship**: Composition
- **Cardinality**: 0..1:1
- **Description**: ClickedCardState contains an optional CardDrawResult

### HoverState → CardAnimation
- **Relationship**: Reference
- **Cardinality**: 0..1:1
- **Description**: HoverState references the currently hovered CardAnimation

## Data Sources

### Runtime Data

1. **CardAnimation[]** (from Scene.cards)
   - Array of active card animations
   - Each contains card data and label position/dimensions
   - Updated continuously during animations

2. **Mouse Events** (from browser)
   - click: MouseEvent for click detection
   - mousemove: MouseEvent for hover detection
   - mouseleave: MouseEvent for clearing hover state

3. **Canvas Element** (from GameCanvas component)
   - Canvas dimensions (width, height)
   - Canvas position (for coordinate conversion if needed)

### State Storage

1. **ClickedCardState** (in GameAreaLayout component)
   - Component-level state
   - Persists until new card clicked or cleared
   - Not persisted across page reloads

2. **HoverState** (in Scene class)
   - Instance-level state
   - Cleared on mouse leave
   - Not persisted

## Data Transformation

### Converting CardAnimation to CardDrawResult

```typescript
function convertAnimationToCardDraw(animation: CardAnimation): CardDrawResult {
  return {
    card: animation.card,
    timestamp: Date.now(), // Or preserve original timestamp if available
    scoreGained: animation.card.value // Or preserve original scoreGained if available
  };
}
```

**Note**: The original CardDrawResult from when the card was drawn may not be available. In this case, we use current timestamp and card.value. If the original CardDrawResult is needed, it could be stored in CardAnimation or retrieved from game state.

### Calculating Label Hit Test

```typescript
function isPointInLabel(
  pointX: number,
  pointY: number,
  animation: CardAnimation
): boolean {
  const labelX = animation.x + animation.labelX - animation.labelWidth / 2;
  const labelY = animation.y + animation.labelY;
  
  return (
    pointX >= labelX &&
    pointX <= labelX + animation.labelWidth &&
    pointY >= labelY &&
    pointY <= labelY + animation.labelHeight
  );
}
```

## Validation Rules Summary

| Entity | Validation Rule | Error Handling |
|--------|----------------|----------------|
| LabelClickEvent | x, y within canvas bounds | Clamp to bounds or ignore |
| LabelHitTestResult | hit === (cardAnimation !== null) | Ensure consistency |
| ClickedCardState | isClicked === (cardDrawResult !== null) | Ensure consistency |
| HoverState | showPointer === (hoveredCard !== null) | Ensure consistency |
| CardAnimation | labelWidth, labelHeight > 0 | Use default values if invalid |

## Edge Cases

1. **Click outside any label**: LabelHitTestResult.hit = false, no card displayed
2. **Overlapping labels**: Return topmost (last in array, highest z-index)
3. **Card removed during click processing**: Validate card still exists before processing
4. **Invalid label bounds**: Skip hit test for that card, continue with others
5. **Rapid clicks**: Process each click independently, last click wins
6. **Canvas resize during interaction**: Recalculate coordinates if needed (usually not needed as offsetX/Y are relative)
7. **Card fading out**: Still clickable as long as labelAlpha > 0 and card in array
8. **Empty cards array**: Return null hit test result immediately

