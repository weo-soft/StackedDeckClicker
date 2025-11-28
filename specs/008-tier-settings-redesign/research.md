# Research: Tier Settings Redesign

**Feature**: 008-tier-settings-redesign  
**Date**: 2025-01-27  
**Status**: Complete

## Research Questions

### 1. Svelte Collapsible/Accordion Pattern

**Question**: What is the best pattern for implementing collapsible sections in Svelte that supports multiple independent expand/collapse states?

**Research**: Examined existing codebase for collapsible patterns.

**Findings**:
- `Scoreboard.svelte` uses a simple boolean state (`isCollapsed`) with conditional rendering
- Pattern: `{#if !isCollapsed}` block with toggle button
- Uses `aria-expanded` attribute for accessibility
- No external library needed - native Svelte reactivity handles state management

**Decision**: Use Svelte's native conditional rendering with a Set to track expanded tier IDs, allowing multiple tiers to be expanded simultaneously.

**Rationale**: 
- Simple and performant (no external dependencies)
- Consistent with existing codebase patterns
- Full control over animation/transition behavior
- Easy to test and maintain

**Alternatives Considered**:
- External accordion library (e.g., svelte-collapsible): Rejected - adds dependency, existing pattern is sufficient
- Single expanded tier (accordion behavior): Rejected - spec requires multiple tiers expandable simultaneously

---

### 2. Label Preview Rendering

**Question**: How should the label preview be rendered to match the actual card label appearance?

**Research**: Examined `cardAnimation.ts` and `drawCardLabel` function to understand label rendering.

**Findings**:
- Labels use `drawCardLabel` function with tier color scheme
- Label dimensions: height 26px, padding 10px, font size 15px bold Arial
- Label style includes: backgroundColor, textColor, borderColor, borderWidth
- Labels are drawn on canvas, but preview can use CSS to match visual appearance

**Decision**: Render label preview using CSS with inline styles matching tier color scheme. Use representative card name (e.g., "THE DOCTOR" for S tier) or placeholder text.

**Rationale**:
- CSS rendering is simpler and more performant than canvas for preview
- Visual accuracy sufficient for preview purposes
- Matches existing color preview pattern in TierSettings component
- Easy to update reactively when color scheme changes

**Alternatives Considered**:
- Canvas-based preview: Rejected - overkill for preview, adds complexity
- Static preview image: Rejected - doesn't reflect real-time color changes

---

### 3. Card List Display in Collapsible

**Question**: How should the card list be displayed within the collapsible section, especially for tiers with many cards?

**Research**: Examined `TierManagement.svelte` for card list display patterns.

**Findings**:
- `TierManagement.svelte` displays cards in a scrollable list with checkboxes
- Uses `getCardsInTier` from tierService
- Cards displayed as buttons with card names
- No pagination - relies on scrolling for large lists
- Performance acceptable for up to 500 cards (spec requirement)

**Decision**: Display cards in a scrollable list within the collapsible section, similar to TierManagement pattern but read-only (no selection/checkboxes). Use virtual scrolling if performance issues arise with 500+ cards.

**Rationale**:
- Consistent with existing card list display patterns
- Simple implementation - reuse existing tierService.getCardsInTier API
- Scrolling is sufficient for 500 cards (spec requirement PERF-004: <1 second render)
- Can add virtual scrolling later if needed

**Alternatives Considered**:
- Pagination: Rejected - adds complexity, scrolling is sufficient for 500 cards
- Grid layout: Rejected - list is more readable for card names, consistent with existing patterns

---

### 4. State Management for Expanded Tiers

**Question**: How should expanded/collapsed state be managed and persisted?

**Research**: Examined spec requirements and existing component patterns.

**Findings**:
- Spec FR-008: "System MUST preserve the expanded/collapsed state of tier entries during the current session (until page refresh or navigation away)"
- No persistence requirement beyond session
- Existing components use local component state

**Decision**: Use local component state (Set<string> for expanded tier IDs). No persistence needed - state resets on page refresh/navigation, which is acceptable per spec.

**Rationale**:
- Simple and performant
- Meets spec requirement (session-only persistence)
- No need for localStorage or store - component-level state is sufficient
- Easy to reset when needed

**Alternatives Considered**:
- Store in tierStore: Rejected - not tier configuration data, just UI state
- localStorage persistence: Rejected - spec only requires session persistence

---

### 5. Create Custom Tier Button Placement

**Question**: Where should the "Create Custom Tier" button be placed in the new list-based design?

**Research**: Examined spec and existing component structure.

**Findings**:
- Spec FR-015: "System MUST maintain existing functionality for creating custom tiers"
- Current implementation has button above dropdown
- Spec assumption: "location to be determined - could be a button above the list or within the list"

**Decision**: Place "Create Custom Tier" button above the tier list, similar to current placement but above list instead of dropdown.

**Rationale**:
- Consistent with current UX (button location familiar to users)
- Clear separation between list and action button
- Easy to find and access
- Follows common UI patterns (actions above content lists)

**Alternatives Considered**:
- Within list as first entry: Rejected - mixes actions with data, less clear
- Floating action button: Rejected - adds complexity, not necessary for this use case

---

### 6. Label Preview Text Selection

**Question**: What text should be displayed in the label preview?

**Research**: Examined spec assumptions and tier assignment logic.

**Findings**:
- Spec assumption: "Label preview will use a representative card name or placeholder text (e.g., 'THE DOCTOR', 'Preview Text')"
- S tier has "THE DOCTOR" as a notable card
- Each tier has representative cards from tierAssignment.ts

**Decision**: Use tier-specific representative card names when available (e.g., "THE DOCTOR" for S tier, "THE NURSE" for A tier), fallback to "Preview Text" for tiers without obvious representative cards.

**Rationale**:
- More meaningful than generic placeholder
- Helps users understand tier context
- Representative cards are well-known and recognizable
- Fallback ensures all tiers have preview text

**Alternatives Considered**:
- Generic "Preview Text" for all: Rejected - less informative, misses opportunity for context
- First card in tier: Rejected - may not be representative, changes as cards are reassigned

---

## Technology Decisions Summary

| Decision | Technology/Pattern | Rationale |
|----------|-------------------|-----------|
| Collapsible Implementation | Native Svelte conditional rendering with Set state | Simple, performant, consistent with codebase |
| Label Preview | CSS with inline styles | Matches visual appearance, reactive updates |
| Card List Display | Scrollable list (read-only) | Consistent with existing patterns, sufficient for 500 cards |
| State Management | Component-level Set<string> | Session-only persistence, simple and performant |
| Create Button Placement | Above tier list | Familiar UX, clear separation |
| Preview Text | Tier-specific representative cards | More informative than generic placeholder |

## Dependencies

No new dependencies required. Feature uses:
- Existing Svelte 4.2.0 (already in project)
- Existing tierService APIs (no changes needed)
- Existing tierStore (no changes needed)
- Existing color validation utilities (no changes needed)

## Performance Considerations

- Label preview generation: CSS rendering is fast (<50ms per tier target met)
- Collapsible toggle: Native Svelte reactivity is performant (<100ms target met)
- Card list rendering: 500 cards in scrollable list should render within 1 second (target met)
- Multiple expanded tiers: No performance concerns - conditional rendering is efficient

## Accessibility Considerations

- Keyboard navigation: Tab to navigate tier entries, Enter/Space to expand/collapse
- ARIA attributes: `aria-expanded`, `aria-controls` for collapsibles
- Screen reader support: Announce tier names, expanded/collapsed state
- Focus indicators: Visible focus states for all interactive elements
- Color contrast: Inherited from tier color scheme validation (WCAG 2.1 AA)

## Open Questions Resolved

All research questions resolved. No remaining clarifications needed.

