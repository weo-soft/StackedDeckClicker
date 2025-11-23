# Research: Card Label Click to View Details

**Feature**: 006-card-details-click  
**Date**: 2025-01-27  
**Purpose**: Document technical decisions and approaches for implementing canvas label click detection

## Canvas Click Detection

### Decision: Use Canvas Mouse Event Handlers

**Rationale**: 
- HTML5 Canvas elements support standard mouse events (click, mousemove, mouseenter, mouseleave)
- Canvas coordinates can be obtained from event.offsetX and event.offsetY
- No additional libraries needed - native browser APIs are sufficient
- Performance is excellent for click detection (<50ms requirement easily met)

**Alternatives Considered**:
- Overlaying transparent DOM elements: Rejected - would require complex positioning and z-index management, doesn't work well with canvas animations
- Using a hit-testing library: Rejected - overkill for this use case, adds unnecessary dependency
- Converting canvas to SVG: Rejected - major refactoring, would break existing rendering system

**Implementation Approach**:
- Add click event listener to canvas element in GameCanvas.svelte
- Use event.offsetX and event.offsetY to get click coordinates in canvas space
- Pass coordinates to Scene class for label hit testing
- Scene maintains list of CardAnimation objects with label positions and dimensions

## Label Hit Testing

### Decision: Iterate Through Cards and Check Label Bounds

**Rationale**:
- Each CardAnimation already stores labelX, labelY, labelWidth, labelHeight
- Label positions are calculated relative to card position (card.x + labelX, card.y + labelY)
- Simple rectangle intersection test: check if click point is within label bounds
- For overlapping labels, select the topmost (last in array, highest z-index)

**Alternatives Considered**:
- Spatial indexing (quadtree, R-tree): Rejected - overkill for 150 cards max, adds complexity
- Pre-computed hit map: Rejected - labels move dynamically, would need constant updates
- Canvas pixel-based hit testing: Rejected - requires offscreen canvas, more complex, slower

**Implementation Approach**:
- Scene.getCardAtLabelPosition(x, y) method
- Iterate cards in reverse order (newest first, topmost)
- For each card, calculate absolute label position: labelX = card.x + animation.labelX - labelWidth/2, labelY = card.y + animation.labelY
- Check if click point is within label bounds: x >= labelX && x <= labelX + labelWidth && y >= labelY && y <= labelY + labelHeight
- Return first matching card (topmost)

## Visual Feedback

### Decision: CSS Cursor Changes and Canvas-Based Hover Effects

**Rationale**:
- CSS cursor property provides instant visual feedback (<50ms requirement)
- Canvas can be redrawn to show hover state on labels (highlight, border change)
- No DOM manipulation needed - works with existing canvas rendering
- Consistent with web standards for interactive elements

**Alternatives Considered**:
- DOM overlay elements for hover: Rejected - complex positioning, z-index issues, doesn't work with canvas animations
- Canvas-only hover detection: Accepted - clean, performant, integrates with existing rendering

**Implementation Approach**:
- Track hovered card in Scene class (hoveredCardAnimation: CardAnimation | null)
- On mousemove, perform hit test to find card under cursor
- Update hoveredCardAnimation, trigger canvas redraw
- In drawCardLabel, check if animation === hoveredCardAnimation and apply hover style (border, background highlight)
- Set canvas.style.cursor = 'pointer' when hovering over label, 'default' otherwise

## Purple Zone Update

### Decision: Extend LastCardZone to Accept Optional Clicked Card

**Rationale**:
- LastCardZone already accepts lastCardDraw prop
- Can add optional clickedCard prop that takes precedence over lastCardDraw
- Minimal changes to existing component
- Maintains backward compatibility (if no clickedCard, shows lastCardDraw as before)

**Alternatives Considered**:
- Separate component for clicked cards: Rejected - unnecessary duplication, harder to maintain
- Always show clicked card, remove lastCardDraw: Rejected - breaks existing functionality
- State management service: Rejected - overkill, simple prop passing is sufficient

**Implementation Approach**:
- Add optional clickedCard prop to LastCardZone: clickedCard: CardDrawResult | null = null
- Update reactive statement: if clickedCard exists, use it; otherwise use lastCardDraw
- Convert clickedCard to CardDisplayData using existing convertToCardDisplayData function
- GameCanvas emits click event with CardDrawResult, parent (GameAreaLayout) updates clickedCard prop

## Click Event Flow

### Decision: Event-Driven Architecture with Component Communication

**Rationale**:
- Svelte's component communication patterns (events, props) are well-suited for this
- Keeps concerns separated: canvas handles click detection, parent coordinates state
- Easy to test: can mock events and verify prop updates

**Alternatives Considered**:
- Global state store: Rejected - unnecessary for single parent-child relationship
- Direct component reference: Rejected - tight coupling, harder to test

**Implementation Approach**:
- GameCanvas emits 'cardLabelClick' event with CardDrawResult
- GameAreaLayout listens to event, updates clickedCard state
- GameAreaLayout passes clickedCard to LastCardZone as prop
- When new card is drawn, can clear clickedCard to show new lastCardDraw

## Performance Optimization

### Decision: Debounce Hover Detection, Throttle Click Events

**Rationale**:
- Hover detection on every mousemove can be expensive with many cards
- Debouncing hover (50ms) reduces unnecessary hit tests
- Click events are already infrequent, no throttling needed
- Maintains <50ms response time requirement

**Alternatives Considered**:
- No optimization: Rejected - could cause performance issues with 150 cards
- RequestAnimationFrame batching: Considered but not needed - debouncing is sufficient

**Implementation Approach**:
- Debounce hover hit testing: only perform hit test 50ms after last mousemove
- Cache hover result until next mousemove
- Click events processed immediately (no debounce needed)

## Accessibility

### Decision: Keyboard Navigation via Tab Order and Enter/Space Activation

**Rationale**:
- WCAG 2.1 Level AA requires keyboard accessibility
- Canvas elements can receive focus and keyboard events
- Tab order can be managed programmatically
- Enter/Space keys can trigger click action

**Alternatives Considered**:
- Skip keyboard support: Rejected - violates accessibility requirements
- Virtual cursor system: Considered but complex - simpler approach first

**Implementation Approach**:
- Make canvas focusable: tabindex="0"
- Track focused card index (keyboard navigation)
- Arrow keys navigate between cards
- Enter/Space activates focused card (triggers click)
- Visual indicator for focused card (outline, different style)

## Error Handling

### Decision: Graceful Degradation for Edge Cases

**Rationale**:
- Cards may be removed during click processing
- Label positions may be invalid
- Card data may be unavailable

**Alternatives Considered**:
- Strict validation with errors: Rejected - poor user experience
- Silent failures: Rejected - users won't know why clicks don't work

**Implementation Approach**:
- Validate card exists before processing click
- Check label bounds are valid before hit testing
- If card data unavailable, show error state in purple zone
- Log warnings for debugging but don't break user experience

## Testing Strategy

### Decision: Unit Tests for Hit Testing, Integration Tests for Click Flow, E2E for User Interactions

**Rationale**:
- Unit tests ensure hit testing logic is correct (overlapping labels, edge cases)
- Integration tests verify component communication (canvas → parent → LastCardZone)
- E2E tests verify actual user experience (clicking, visual feedback, updates)

**Alternatives Considered**:
- Only unit tests: Rejected - misses integration issues
- Only E2E tests: Rejected - slower feedback, harder to debug

**Implementation Approach**:
- Unit: Scene.getCardAtLabelPosition with various scenarios (overlapping, nearby, empty)
- Integration: GameCanvas click → GameAreaLayout state → LastCardZone display
- E2E: User clicks label, verifies purple zone updates, visual feedback appears

