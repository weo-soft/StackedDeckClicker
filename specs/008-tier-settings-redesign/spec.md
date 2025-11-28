# Feature Specification: Tier Settings Redesign

**Feature Branch**: `008-tier-settings-redesign`  
**Created**: 2025-01-27  
**Status**: Draft  
**Input**: User description: "rework the design for the Tier Settings."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View All Tiers at a Glance (Priority: P1)

When a user opens the Tier Settings, they see all available tiers displayed as single-line list entries. Each entry shows the tier name and a visual preview of how the configured label will appear when cards from that tier are displayed. This allows users to quickly understand the visual configuration of all tiers without needing to select each one individually.

**Why this priority**: This is the core visual change that transforms the interface from a dropdown-based selection to a list-based overview. It provides immediate value by showing all tier configurations at once.

**Independent Test**: Can be fully tested by opening Tier Settings and verifying that all tiers are displayed as list entries with tier names and label previews, without requiring any tier selection or configuration changes.

**Acceptance Scenarios**:

1. **Given** the Tier Settings is open, **When** the page loads, **Then** all available tiers are displayed as single-line list entries
2. **Given** a tier has a configured color scheme, **When** the tier list entry is displayed, **Then** the entry shows a preview of the label using the tier's configured colors (background, text, border)
3. **Given** a tier is disabled, **When** the tier list entry is displayed, **Then** the entry visually indicates the disabled state (e.g., grayed out, strikethrough, or visual indicator)
4. **Given** there are no tiers available, **When** the Tier Settings opens, **Then** an appropriate message is displayed indicating no tiers are available

---

### User Story 2 - Expand/Collapse Tier Configuration (Priority: P1)

When a user clicks on a tier list entry, the corresponding collapsible section opens or closes to reveal the tier's configuration options and the list of cards contained in that tier. Users can have multiple tiers expanded simultaneously to compare configurations.

**Why this priority**: This is essential for the new interaction model - users must be able to access tier configuration through the list entries rather than a dropdown.

**Independent Test**: Can be fully tested by clicking tier entries and verifying that collapsibles open/close correctly, showing configuration options and card lists when expanded.

**Acceptance Scenarios**:

1. **Given** a tier list entry is collapsed, **When** the user clicks the entry, **Then** the collapsible expands to show configuration options and contained cards
2. **Given** a tier list entry is expanded, **When** the user clicks the entry again, **Then** the collapsible collapses to hide the configuration options
3. **Given** multiple tier entries are expanded, **When** the user clicks a different tier entry, **Then** that tier's collapsible toggles independently without affecting other expanded tiers
4. **Given** a tier has configuration options, **When** the collapsible is expanded, **Then** all configuration options (color scheme, sound, display settings) are visible and editable
5. **Given** a tier has cards assigned, **When** the collapsible is expanded, **Then** the list of cards in that tier is displayed

---

### User Story 3 - View Cards in Tier (Priority: P2)

When a tier's collapsible is expanded, users can see all cards currently assigned to that tier. This helps users understand which cards will be affected by the tier's configuration and provides context for tier management.

**Why this priority**: While not the primary focus, showing contained cards provides valuable context for tier configuration and helps users understand the impact of their changes.

**Independent Test**: Can be fully tested by expanding a tier and verifying that the card list displays correctly, showing all cards assigned to that tier.

**Acceptance Scenarios**:

1. **Given** a tier has cards assigned, **When** the tier's collapsible is expanded, **Then** the list of cards is displayed within the collapsible section
2. **Given** a tier has no cards assigned, **When** the tier's collapsible is expanded, **Then** a message indicates that no cards are currently assigned to this tier
3. **Given** a tier has many cards assigned, **When** the tier's collapsible is expanded, **Then** the card list is scrollable or paginated to handle large numbers of cards
4. **Given** cards are displayed in a tier, **When** the user views the card list, **Then** card names are displayed in a readable format (e.g., list, grid, or similar)

---

### Edge Cases

- What happens when a tier has an invalid color configuration (e.g., missing colors)?
- How does the system handle tiers with very long names in the list entry?
- What happens when there are 20+ tiers (scrolling, performance)?
- How does the label preview handle edge cases like very long card names?
- What happens if a tier's configuration is being edited while another user/process modifies it?
- How does the interface handle rapid clicking on multiple tier entries (debouncing)?
- What happens when a tier has hundreds of cards assigned (performance, pagination)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display all available tiers as single-line list entries when Tier Settings opens
- **FR-002**: Each tier list entry MUST display the tier name
- **FR-003**: Each tier list entry MUST display a visual preview of the configured label showing the tier's color scheme (background color, text color, border)
- **FR-004**: System MUST allow users to click a tier list entry to expand/collapse the tier's configuration section
- **FR-005**: When a tier's collapsible is expanded, System MUST display all tier configuration options (color scheme editor, sound configuration, display settings)
- **FR-006**: When a tier's collapsible is expanded, System MUST display the list of cards currently assigned to that tier
- **FR-007**: System MUST allow multiple tier collapsibles to be expanded simultaneously
- **FR-008**: System MUST preserve the expanded/collapsed state of tier entries during the current session (until page refresh or navigation away)
- **FR-009**: System MUST visually indicate when a tier is disabled in the list entry
- **FR-010**: System MUST allow users to edit tier configuration options when the collapsible is expanded
- **FR-011**: System MUST save tier configuration changes when the user clicks the save button
- **FR-012**: System MUST update the label preview in the list entry when tier configuration is saved
- **FR-013**: System MUST handle cases where a tier has no cards assigned (display appropriate message)
- **FR-014**: System MUST display custom tiers and default tiers in the list (no distinction in list entry format)
- **FR-015**: System MUST maintain existing functionality for creating custom tiers (create button/option should still be available)

### Key Entities *(include if feature involves data)*

- **Tier List Entry**: Represents a single tier in the list view, containing tier name and label preview
- **Tier Collapsible**: Expandable/collapsible section containing tier configuration options and card list
- **Label Preview**: Visual representation of how a tier's configured label will appear, using the tier's color scheme
- **Tier Configuration**: Existing entity containing color scheme, sound settings, and display settings
- **Card List**: Collection of card names assigned to a specific tier

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view all tier configurations at a glance without selecting individual tiers (all tiers visible in list format)
- **SC-002**: Users can expand/collapse tier configurations with a single click, responding within 100ms
- **SC-003**: Label previews accurately reflect tier color configurations (100% visual accuracy)
- **SC-004**: Users can successfully edit and save tier configurations through the collapsible interface (same functionality as before, new access method)
- **SC-005**: Interface handles up to 20 tiers without performance degradation (list rendering and interactions remain smooth)
- **SC-006**: Card lists display correctly for tiers with up to 500 cards assigned (scrollable or paginated as needed)

## Testing Requirements *(mandatory)*

### Test Coverage Requirements

- **TC-001**: All tier list rendering logic must have unit tests (tier entry creation, label preview generation)
- **TC-002**: Collapsible expand/collapse functionality must have unit tests
- **TC-003**: Tier configuration editing through collapsibles must have integration tests
- **TC-004**: Critical user paths (view tiers, expand tier, edit configuration, save) must achieve ≥80% test coverage
- **TC-005**: Tests must verify label preview accuracy matches actual tier color schemes
- **TC-006**: Tests must use isolated test data, no external dependencies

### Test Scenarios

- [ ] Happy path: Open Tier Settings, view all tiers, expand a tier, edit configuration, save
- [ ] Edge case: Tier with no cards assigned - verify appropriate message displays
- [ ] Edge case: Tier with invalid color configuration - verify graceful handling
- [ ] Edge case: Rapid clicking on multiple tier entries - verify no UI glitches
- [ ] Edge case: Tier with 500+ cards - verify card list performance
- [ ] Edge case: Disabled tier - verify visual indication in list entry
- [ ] Accessibility: Keyboard navigation through tier list entries
- [ ] Accessibility: Screen reader announces tier names and states correctly

## User Experience Requirements *(mandatory)*

### Accessibility Requirements

- **UX-001**: Feature MUST meet WCAG 2.1 Level AA standards
- **UX-002**: All tier list entries MUST be keyboard navigable (Tab to navigate, Enter/Space to expand/collapse)
- **UX-003**: Color contrast ratios in label previews MUST meet WCAG standards (inherited from tier color scheme validation)
- **UX-004**: Collapsible sections MUST have proper ARIA attributes (aria-expanded, aria-controls)
- **UX-005**: Screen readers MUST announce tier names, expanded/collapsed state, and label preview information
- **UX-006**: Focus indicators MUST be visible for all interactive tier list entries

### Consistency Requirements

- **UX-007**: Feature MUST use established design system components and patterns (consistent with existing Tier Settings styling)
- **UX-008**: Label previews MUST match the visual style of actual card labels displayed in the game
- **UX-009**: Collapsible animation/transition MUST be consistent with other collapsible elements in the application
- **UX-010**: Error messages and success notifications MUST follow standard format and tone

### User Feedback Requirements

- **UX-011**: Loading states MUST be shown when tier data is being fetched (if applicable)
- **UX-012**: Visual feedback MUST be provided when clicking tier entries (hover states, active states)
- **UX-013**: Success/error messages MUST be clear and actionable when saving tier configurations
- **UX-014**: Label preview MUST update immediately when color scheme changes are made (before saving)

## Performance Requirements *(mandatory)*

### Performance Benchmarks

- **PERF-001**: Tier list must render all tiers within 500ms of opening Tier Settings
- **PERF-002**: Expanding/collapsing a tier collapsible must respond within 100ms
- **PERF-003**: Label preview generation must complete within 50ms per tier
- **PERF-004**: Card list rendering for tiers with up to 500 cards must complete within 1 second
- **PERF-005**: Scrolling through card lists must maintain 60fps performance
- **PERF-006**: Memory usage must not increase significantly when multiple collapsibles are expanded (no memory leaks)

## Assumptions

- Users will have a reasonable number of tiers (typically 7-15, but system should handle up to 20)
- Label preview will use a representative card name or placeholder text (e.g., "THE DOCTOR", "Preview Text")
- Existing tier configuration data structure and validation logic will remain unchanged
- The create custom tier functionality will remain accessible (location to be determined - could be a button above the list or within the list)
- Tier order will be maintained (default tiers first, then custom tiers, or as configured)
- Card assignment to tiers is handled by existing tier management system (not part of this redesign)

