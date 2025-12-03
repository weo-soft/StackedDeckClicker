# Research: Debug Menu

**Feature**: Debug Menu (011-debug-menu)  
**Date**: 2025-01-27  
**Status**: Complete

## Modal/Overlay Implementation Pattern

### Decision: Use Existing Modal-Overlay Pattern

**Rationale**:
- Application already has established modal pattern in `+page.svelte` (Tier Settings, Tier Management, Reset Confirmation)
- Consistent with existing `DataVersionOverlay.svelte` component
- Pattern includes: fixed overlay, backdrop click to close, Escape key handling, ARIA attributes
- Styling already defined (`.modal-overlay`, `.modal-content`, `.modal-header`, `.modal-close`)

**Alternatives Considered**:
- New modal library: Rejected - unnecessary dependency, existing pattern works
- Drawer/sidebar: Considered but rejected - modals are more appropriate for debug tools that need focus
- Inline panel: Rejected - would interfere with game layout

**Implementation Approach**:
- Create `DebugMenu.svelte` component following `DataVersionOverlay.svelte` pattern
- Use existing modal CSS classes from `+page.svelte`
- Implement backdrop click to close
- Handle Escape key in component
- Set appropriate z-index (existing modals use 2000, debug menu should use 2001 or higher)

## Keyboard Navigation and Shortcuts

### Decision: Support Keyboard Navigation with Default Shortcut F12

**Rationale**:
- F12 is standard for developer tools in browsers
- Existing codebase handles keyboard events in components (see `GameCanvas.svelte`, `InventoryZone.svelte`)
- WCAG 2.1 Level AA requires keyboard accessibility
- Escape key already handled in modal pattern

**Alternatives Considered**:
- Ctrl+Shift+D: Considered but F12 is more standard
- No keyboard shortcut: Rejected - violates accessibility and developer experience
- Configurable shortcut: Considered but default F12 is sufficient for MVP

**Implementation Approach**:
- Add global keyboard listener for F12 key (when not in input fields)
- Tab navigation between debug tools within menu
- Arrow keys for slider navigation (existing pattern)
- Enter/Space for button activation
- Escape closes menu (existing modal pattern)
- Focus trap when menu is open (prevent tabbing outside menu)

## Environment Detection for Visibility

### Decision: Use import.meta.env.DEV for Development Detection

**Rationale**:
- SvelteKit provides `import.meta.env.DEV` for development mode detection
- Existing code already uses this pattern (see `UpgradeShop.svelte` line 190: `showLuckyDropSlider = debugModeEnabled || import.meta.env.DEV`)
- Simple boolean check, no additional dependencies
- Works with Vite build system

**Alternatives Considered**:
- Feature flags in localStorage: Considered but adds complexity
- URL parameter: Rejected - not secure for production
- Environment variable: Considered but import.meta.env.DEV is simpler

**Implementation Approach**:
- Show debug menu trigger button when `import.meta.env.DEV === true`
- Optionally allow enabling via localStorage flag for production debugging (advanced users)
- Menu trigger visibility: `import.meta.env.DEV || localStorage.getItem('debugMenuEnabled') === 'true'`

## Component Migration Strategy

### Decision: Extract Debug Tools into DebugMenu, Remove from Original Locations

**Rationale**:
- Clean separation: debug tools belong in debug menu, not scattered across UI
- Maintains existing functionality by reusing same service calls
- Reduces code duplication
- Clear migration path: move code, update imports, remove from original components

**Alternatives Considered**:
- Keep tools in both places: Rejected - violates requirement FR-003
- Create wrapper components: Considered but adds unnecessary abstraction
- Service layer abstraction: Considered but existing services are sufficient

**Implementation Approach**:
- **Add Chaos/Decks buttons**: Move from `InventoryZone.svelte` to `DebugMenu.svelte`
  - Keep same handlers: `handleAddChaos()`, `handleAddDecks()`
  - Use same service calls: `gameStateService.addChaos(10)`, `gameStateService.addDecks(10)`
  - Remove from InventoryZone grid cells (ADD_DECKS_POS, ADD_CHAOS_POS)
  
- **Rarity/Lucky Drop sliders**: Move from `UpgradeShop.svelte` to `DebugMenu.svelte`
  - Keep same handlers: `handleRaritySliderChange()`, `handleLuckyDropSliderChange()`
  - Keep same reactive state: `raritySliderValue`, `luckyDropSliderValue`
  - Remove debug mode toggle button from UpgradeShop
  - Remove rarity/lucky drop slider sections from UpgradeShop
  
- **Debug mode toggle**: Move from `UpgradeShop.svelte` to `DebugMenu.svelte`
  - Keep same state: `debugModeEnabled`
  - Move toggle function: `toggleDebugMode()`

## Debug Menu Organization

### Decision: Group Tools by Category (Resources, Upgrades, Settings)

**Rationale**:
- Logical grouping improves discoverability
- Reduces cognitive load
- Follows common UI patterns for tool organization
- Makes menu scalable for future debug tools

**Alternatives Considered**:
- Single flat list: Rejected - too many tools, hard to scan
- Alphabetical: Rejected - not intuitive for debug tools
- By frequency of use: Considered but categories are clearer

**Implementation Approach**:
- **Resources Section**: Add Chaos, Add Decks
- **Upgrades Section**: Rarity Slider, Lucky Drop Slider
- **Settings Section**: Debug Mode Toggle

## Focus Management

### Decision: Implement Focus Trap and Focus Return

**Rationale**:
- WCAG 2.1 Level AA requires proper focus management for modals
- Prevents keyboard navigation from escaping modal
- Improves accessibility for screen reader users
- Existing modals don't fully implement this, but we should for debug menu

**Alternatives Considered**:
- No focus trap: Rejected - violates accessibility requirements
- Manual focus management: Considered but Svelte's built-in features are sufficient

**Implementation Approach**:
- When menu opens: Focus first interactive element (or close button)
- When menu closes: Return focus to trigger button
- Trap focus within menu using `tabindex` and focus event handlers
- Use Svelte's `autofocus` or manual `focus()` calls

## Error Handling

### Decision: Preserve Existing Error Handling Patterns

**Rationale**:
- Debug tools already have error handling (see `UpgradeShop.svelte`, `+page.svelte`)
- Error messages displayed in component state
- Console logging for debugging
- No need to change error handling when moving tools

**Alternatives Considered**:
- Centralized error handling: Considered but existing pattern works
- Toast notifications: Considered but existing error display is sufficient

**Implementation Approach**:
- Keep existing error message state in DebugMenu component
- Display errors inline with each tool (same as current implementation)
- Console.error for debugging (preserve existing behavior)

## Testing Strategy

### Decision: Comprehensive Test Coverage Following Existing Patterns

**Rationale**:
- Existing test structure: unit/, integration/, e2e/
- Tests use @testing-library/svelte and Vitest
- E2E tests use Playwright
- Need to verify tool migration doesn't break functionality

**Alternatives Considered**:
- Minimal testing: Rejected - violates constitution Principle 2
- Only unit tests: Rejected - need integration tests for migration verification

**Implementation Approach**:
- **Unit tests**: DebugMenu component (open/close, keyboard events, tool rendering)
- **Integration tests**: Verify each debug tool works identically in menu vs original location
- **E2E tests**: Complete workflows (open menu, use tool, verify game state change, close menu)
- **Migration tests**: Verify original locations show no visual artifacts or broken references


