# Service Interfaces: Card Label Click to View Details

**Feature**: 006-card-details-click  
**Date**: 2025-01-27

## Overview

This document defines the service interfaces and component contracts for the card label click detection feature. These contracts ensure consistent implementation and testability.

## Service Interfaces

### Scene Class (Extended)

Extended methods for label hit testing and hover detection.

```typescript
interface Scene {
  /**
   * Get the card animation at a given label position.
   * Performs hit testing against all card labels, returning the topmost match.
   * 
   * @param x - X coordinate in canvas space
   * @param y - Y coordinate in canvas space
   * @returns CardAnimation if label was hit, null otherwise
   */
  getCardAtLabelPosition(x: number, y: number): CardAnimation | null;

  /**
   * Set the hovered card animation for visual feedback.
   * 
   * @param cardAnimation - CardAnimation being hovered, or null to clear hover
   */
  setHoveredCard(cardAnimation: CardAnimation | null): void;

  /**
   * Get the currently hovered card animation.
   * 
   * @returns CardAnimation if hovering, null otherwise
   */
  getHoveredCard(): CardAnimation | null;
}
```

**Implementation Requirements**:
- Must iterate cards in reverse order (newest first, topmost)
- Must calculate absolute label positions from card positions and offsets
- Must perform rectangle intersection test for each label
- Must return first matching card (topmost)
- Should handle edge cases (invalid bounds, empty cards array)

**Error Handling**:
- Invalid coordinates: Return null
- Empty cards array: Return null
- Invalid label bounds: Skip that card, continue with others

### CanvasService (Extended)

Extended methods for click and hover event handling.

```typescript
interface CanvasService {
  /**
   * Handle click event on canvas.
   * Performs label hit testing and emits result.
   * 
   * @param x - Click X coordinate in canvas space
   * @param y - Click Y coordinate in canvas space
   * @param event - Original mouse event
   * @returns CardAnimation if label was clicked, null otherwise
   */
  handleClick(x: number, y: number, event: MouseEvent): CardAnimation | null;

  /**
   * Handle mouse move event on canvas for hover detection.
   * Updates hover state and cursor style.
   * 
   * @param x - Mouse X coordinate in canvas space
   * @param y - Mouse Y coordinate in canvas space
   * @param event - Original mouse event
   */
  handleMouseMove(x: number, y: number, event: MouseEvent): void;

  /**
   * Handle mouse leave event on canvas.
   * Clears hover state and resets cursor.
   */
  handleMouseLeave(): void;

  /**
   * Set callback for click events.
   * Called when a label is successfully clicked.
   * 
   * @param callback - Function called with CardAnimation when label is clicked
   */
  setClickCallback(callback: ((cardAnimation: CardAnimation) => void) | null): void;
}
```

**Implementation Requirements**:
- Must debounce hover detection (50ms)
- Must update canvas cursor style ('pointer' or 'default')
- Must trigger canvas redraw when hover state changes
- Should handle rapid clicks gracefully
- Must validate coordinates before hit testing

**Error Handling**:
- Invalid coordinates: Ignore event
- Callback not set: Process click but don't call callback
- Scene not initialized: Return null, log warning

## Component Contracts

### GameCanvas Component Props

```typescript
interface GameCanvasProps {
  /** Canvas width in pixels */
  width: number;
  /** Canvas height in pixels */
  height: number;
  /** Zone layout for boundary validation */
  zoneLayout: ZoneLayout | null;
  /** Zone boundary validator function */
  zoneBoundaryValidator: ((x: number, y: number) => boolean) | null;
}
```

**Component Events**:
```typescript
interface GameCanvasEvents {
  /**
   * Emitted when a card label is clicked.
   * 
   * @event cardLabelClick
   * @param detail - CardDrawResult for the clicked card
   */
  cardLabelClick: CustomEvent<CardDrawResult>;
}
```

**Props Validation**:
- `width` must be > 0
- `height` must be > 0
- `zoneLayout` can be null (fallback behavior)

**Component Behavior**:
- Initializes canvas and canvas service on mount
- Adds click event listener to canvas element
- Adds mousemove event listener for hover detection
- Adds mouseleave event listener to clear hover
- Emits 'cardLabelClick' event when label is clicked
- Updates canvas cursor style based on hover state
- Cleans up event listeners on destroy

### LastCardZone Component Props (Extended)

Extended to accept optional clicked card.

```typescript
interface LastCardZoneProps {
  /** Zone width in pixels */
  width: number;
  /** Zone height in pixels */
  height: number;
  /** Last card draw result (null if no card drawn) */
  lastCardDraw: CardDrawResult | null;
  /** Clicked card draw result (takes precedence over lastCardDraw) */
  clickedCard: CardDrawResult | null;
  /** Optional custom style string */
  style?: string;
}
```

**Props Validation**:
- `width` must be > 0
- `height` must be > 0
- `lastCardDraw` can be null (empty state)
- `clickedCard` can be null (shows lastCardDraw instead)

**Component Behavior**:
- If `clickedCard` is not null, displays `clickedCard`
- If `clickedCard` is null, displays `lastCardDraw`
- Updates display when either prop changes
- Handles image loading states (loading, error, success)
- Maintains responsive scaling based on width/height
- Preserves all existing functionality when `clickedCard` is null

### GameAreaLayout Component State

State management for clicked card.

```typescript
interface GameAreaLayoutState {
  /** Currently clicked card (null if showing last drawn card) */
  clickedCard: CardDrawResult | null;
  /** Last card draw result */
  lastCardDraw: CardDrawResult | null;
}
```

**State Management**:
- `clickedCard` is set when 'cardLabelClick' event is received
- `clickedCard` is cleared when new card is drawn (optional behavior)
- `lastCardDraw` is updated from game state service
- Both props are passed to LastCardZone component

**State Transitions**:
1. Initial: `{ clickedCard: null, lastCardDraw: null }`
2. Card drawn: `{ clickedCard: null, lastCardDraw: CardDrawResult }`
3. Label clicked: `{ clickedCard: CardDrawResult, lastCardDraw: CardDrawResult }`
4. New card drawn: `{ clickedCard: null, lastCardDraw: new CardDrawResult }` (optional: could keep clickedCard)

## Event Flow Contracts

### Click Event Flow

```
Canvas click event
  ↓
GameCanvas.handleClick()
  ↓
CanvasService.handleClick()
  ↓
Scene.getCardAtLabelPosition()
  ↓
LabelHitTestResult
  ↓
Convert CardAnimation to CardDrawResult
  ↓
GameCanvas emits 'cardLabelClick' event
  ↓
GameAreaLayout receives event
  ↓
Update clickedCard state
  ↓
Pass clickedCard to LastCardZone
  ↓
LastCardZone displays clicked card
```

### Hover Event Flow

```
Canvas mousemove event
  ↓
GameCanvas.handleMouseMove()
  ↓
Debounce (50ms)
  ↓
CanvasService.handleMouseMove()
  ↓
Scene.getCardAtLabelPosition()
  ↓
Scene.setHoveredCard()
  ↓
Update canvas cursor style
  ↓
Trigger canvas redraw
  ↓
drawCardLabel() applies hover style
```

## Type Definitions

### LabelClickEvent

```typescript
interface LabelClickEvent {
  x: number;
  y: number;
  originalEvent: MouseEvent;
}
```

### LabelHitTestResult

```typescript
interface LabelHitTestResult {
  cardAnimation: CardAnimation | null;
  hit: boolean;
  labelBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
```

### ClickedCardState

```typescript
interface ClickedCardState {
  cardDrawResult: CardDrawResult | null;
  clickedAt: number;
  isClicked: boolean;
}
```

### HoverState

```typescript
interface HoverState {
  hoveredCard: CardAnimation | null;
  lastHoverCheck: number;
  showPointer: boolean;
}
```

## Error Handling Contracts

### Click Detection Errors

| Error Condition | Handling | User Impact |
|----------------|----------|-------------|
| Invalid coordinates | Ignore click | No action |
| Scene not initialized | Return null, log warning | No action |
| Empty cards array | Return null | No action |
| Card removed during processing | Validate before processing | No action or show error |

### Hover Detection Errors

| Error Condition | Handling | User Impact |
|----------------|----------|-------------|
| Invalid coordinates | Ignore hover | Cursor stays default |
| Scene not initialized | Clear hover state | Cursor stays default |
| Rapid mouse movement | Debounce prevents excessive checks | Smooth hover feedback |

### Component Errors

| Error Condition | Handling | User Impact |
|----------------|----------|-------------|
| Invalid CardDrawResult | Show error state in purple zone | Error message displayed |
| Image load failure | Show fallback representation | Placeholder shown |
| Missing card data | Show available information only | Partial card display |

## Performance Contracts

### Click Detection Performance

- **Target**: <50ms from click to CardDrawResult creation
- **Measurement**: Time from MouseEvent to callback execution
- **Optimization**: Direct hit test, no debouncing for clicks

### Hover Detection Performance

- **Target**: <50ms visual feedback after mouse movement
- **Measurement**: Time from mousemove to cursor/style update
- **Optimization**: Debounce hover checks (50ms), cache hover result

### Purple Zone Update Performance

- **Target**: <200ms from click to display update
- **Measurement**: Time from click event to LastCardZone render
- **Optimization**: Immediate state update, async image loading

## Testing Contracts

### Unit Test Requirements

- Scene.getCardAtLabelPosition() with various scenarios
- Label bounds calculation accuracy
- Overlapping label handling
- Edge case handling (empty array, invalid bounds)

### Integration Test Requirements

- GameCanvas click → GameAreaLayout state → LastCardZone display
- Hover detection → cursor update → canvas redraw
- Event propagation and state updates

### E2E Test Requirements

- User clicks label → purple zone updates
- User hovers label → cursor changes
- User clicks overlapping labels → correct card displayed
- Rapid clicks → all clicks processed correctly

