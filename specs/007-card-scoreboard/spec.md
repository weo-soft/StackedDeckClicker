# Feature Specification: Card Drop Scoreboard

**Feature Branch**: `007-card-scoreboard`  
**Created**: 2025-01-27  
**Status**: Draft  
**Input**: User description: "create a scoreboard that shows the cards that where dropped by the player. The Scoreboard shows the number of times a card has been dropped in the current session, the cards value, the total value accumulated from it. The Board is sorted by highest card value to lowest, with given the user the option to change the sort order (ASC/DESC) or changed the column its ordered by. By defaul only cards are added to the scoreboard that are not hidden by the filter. with the option for the user to also add the jidden cards to the score board and also including the cards that have been dropped, but been hidden sofar, to be added to the board"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Scoreboard with Dropped Cards (Priority: P1)

A player opens the scoreboard to see a list of all cards they have dropped during the current session. The scoreboard displays each card's name, the number of times it was dropped, the card's value, and the total value accumulated from that card. The scoreboard is sorted by card value from highest to lowest by default, making it easy to see which high-value cards have been dropped.

**Why this priority**: This is the core functionality that provides immediate value. Players can see their drop statistics at a glance, understand which cards they've collected, and track their progress. This establishes the foundation for all other scoreboard features.

**Independent Test**: Can be fully tested by opening the scoreboard after dropping some cards and verifying that all dropped cards appear with correct counts, values, and totals. Delivers immediate visibility into drop statistics without requiring any configuration.

**Acceptance Scenarios**:

1. **Given** a player has dropped multiple cards in the current session, **When** the player opens the scoreboard, **Then** all dropped cards are displayed with their drop count, card value, and total accumulated value
2. **Given** a player has dropped the same card multiple times, **When** the player views the scoreboard, **Then** the card appears once with the correct total drop count and accumulated value
3. **Given** cards with different values have been dropped, **When** the player views the scoreboard, **Then** cards are sorted by card value from highest to lowest by default
4. **Given** a player has not dropped any cards in the current session, **When** the player opens the scoreboard, **Then** the scoreboard displays an empty state or message indicating no cards have been dropped
5. **Given** a player drops a new card during an active session, **When** the player views the scoreboard, **Then** the new card appears in the scoreboard with updated statistics

---

### User Story 2 - Change Sort Order and Sort Column (Priority: P2)

A player wants to reorganize the scoreboard view by changing which column is used for sorting or by reversing the sort order. The player can click on column headers to sort by that column, and toggle between ascending and descending order. This allows players to view cards by drop count, card value, or total accumulated value in either order.

**Why this priority**: This feature provides flexibility and control over how players view their statistics. Different players may want to see their most frequently dropped cards, highest value cards, or highest total value cards. This enables personalized data organization while maintaining the core scoreboard functionality.

**Independent Test**: Can be fully tested by opening the scoreboard, clicking different column headers, and verifying the sort order changes correctly. Delivers flexible data organization with immediate visual feedback.

**Acceptance Scenarios**:

1. **Given** the scoreboard is sorted by card value (descending), **When** the player clicks the card value column header, **Then** the scoreboard re-sorts by card value in ascending order
2. **Given** the scoreboard is sorted by card value, **When** the player clicks the drop count column header, **Then** the scoreboard re-sorts by drop count in descending order
3. **Given** the scoreboard is sorted by total accumulated value, **When** the player clicks the same column header again, **Then** the sort order toggles between ascending and descending
4. **Given** multiple cards have been dropped, **When** the player sorts by drop count (descending), **Then** cards with the highest drop counts appear at the top
5. **Given** the scoreboard has an active sort, **When** the player drops a new card, **Then** the new card appears in the correct position according to the current sort order

---

### User Story 3 - Filter by Tier Visibility (Priority: P2)

A player wants to control which cards appear in the scoreboard based on tier filter settings. By default, only cards from enabled tiers (not hidden by the filter) appear in the scoreboard. The player can optionally include cards from disabled tiers, allowing them to see statistics for all dropped cards regardless of tier visibility settings.

**Why this priority**: This feature provides integration with the existing tier filter system, allowing players to focus on visible cards by default while having the option to see all statistics. This respects the player's tier preferences while providing flexibility for comprehensive statistics.

**Independent Test**: Can be fully tested by disabling a tier, dropping cards from that tier, viewing the scoreboard with default settings (hidden cards excluded), then enabling the option to include hidden cards and verifying all cards appear. Delivers tier-aware filtering with user control.

**Acceptance Scenarios**:

1. **Given** tier D is disabled and cards from tier D have been dropped, **When** the player views the scoreboard with default settings, **Then** cards from tier D do not appear in the scoreboard
2. **Given** cards from both enabled and disabled tiers have been dropped, **When** the player enables the option to include hidden cards, **Then** all dropped cards appear in the scoreboard regardless of tier visibility
3. **Given** the scoreboard is showing hidden cards, **When** the player disables the option to include hidden cards, **Then** only cards from enabled tiers remain visible in the scoreboard
4. **Given** a player has dropped cards from multiple tiers, some enabled and some disabled, **When** the player views the scoreboard with default settings, **Then** only cards from enabled tiers are displayed with correct statistics
5. **Given** a player enables the option to include hidden cards, **When** the player drops a new card from a disabled tier, **Then** the new card immediately appears in the scoreboard

---

### User Story 4 - Include Previously Hidden Drops (Priority: P3)

A player wants to see statistics for cards that were dropped but hidden at the time of drop (due to tier filter settings). When the option to include hidden cards is enabled, the scoreboard should show all cards that were dropped during the session, including those that were hidden when dropped. This provides a complete view of all drop activity regardless of tier visibility at the time of drop.

**Why this priority**: This feature provides comprehensive statistics tracking that captures all drop activity, even when cards were not visible. While less critical than the core filtering functionality, this enables players to see complete session statistics and understand their full drop history.

**Independent Test**: Can be fully tested by disabling a tier, dropping cards from that tier (which are hidden), then enabling the option to include hidden cards and verifying those previously hidden drops appear in the scoreboard with correct statistics. Delivers complete drop history visibility.

**Acceptance Scenarios**:

1. **Given** tier E is disabled and a card from tier E is dropped (hidden), **When** the player enables the option to include hidden cards, **Then** the card from tier E appears in the scoreboard with correct drop count and accumulated value
2. **Given** multiple cards have been dropped from disabled tiers throughout the session, **When** the player enables the option to include hidden cards, **Then** all previously hidden drops appear in the scoreboard with accurate statistics
3. **Given** a card was dropped when its tier was disabled, **When** the player views the scoreboard with hidden cards included, **Then** the card's drop count and accumulated value reflect all drops, including the hidden drop
4. **Given** cards have been dropped from both visible and hidden tiers, **When** the player enables the option to include hidden cards, **Then** the scoreboard shows all cards with correct combined statistics
5. **Given** the scoreboard is showing previously hidden drops, **When** the player disables the option to include hidden cards, **Then** previously hidden drops are removed from the scoreboard view

---

### Edge Cases

- What happens when a player drops the same card multiple times with different tier visibility states (some drops visible, some hidden)? The scoreboard should track all drops and show combined statistics when hidden cards are included
- How does the system handle cards that are moved between tiers during a session? Cards should maintain their drop statistics regardless of tier changes, with visibility based on current tier state
- What happens when a player changes tier visibility settings while viewing the scoreboard? The scoreboard should update to reflect the new visibility settings immediately
- How does the system handle sorting when multiple cards have the same value in the sort column? The system should maintain a consistent secondary sort order (e.g., by card name alphabetically)
- What happens when a player has dropped many cards (100+)? The scoreboard should handle large datasets efficiently without performance degradation
- How does the system handle cards that are dropped but then their tier is deleted or renamed? Cards should maintain their statistics, with visibility determined by whether the tier exists and is enabled
- What happens when the session is reset or the game is restarted? The scoreboard should reset to show only cards dropped in the new session
- How does the system handle rapid card drops while the scoreboard is open? The scoreboard should update in real-time or near real-time to reflect new drops
- What happens when a player sorts by a column, then drops a new card? The new card should appear in the correct sorted position immediately
- How does the system handle edge cases with zero-value cards or cards with very high values? All cards should display correctly regardless of value magnitude

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a scoreboard showing all cards dropped by the player in the current session
- **FR-002**: System MUST display for each card: the card name, number of times dropped, card value, and total accumulated value (drop count × card value)
- **FR-003**: System MUST sort the scoreboard by card value in descending order by default (highest value first)
- **FR-004**: System MUST allow users to change the sort order (ascending or descending) for any sortable column
- **FR-005**: System MUST allow users to change which column the scoreboard is sorted by (card name, drop count, card value, or total accumulated value)
- **FR-006**: System MUST by default only include cards in the scoreboard that are not hidden by the tier filter (cards from enabled tiers only)
- **FR-007**: System MUST provide an option for users to include cards from disabled tiers (hidden cards) in the scoreboard
- **FR-008**: System MUST include cards that were dropped but hidden at the time of drop when the option to include hidden cards is enabled
- **FR-009**: System MUST track drop counts and accumulated values for all cards dropped during the session, regardless of tier visibility at the time of drop
- **FR-010**: System MUST update the scoreboard in real-time or near real-time when new cards are dropped
- **FR-011**: System MUST maintain accurate statistics when the same card is dropped multiple times
- **FR-012**: System MUST reset the scoreboard statistics when a new session begins
- **FR-013**: System MUST handle sorting correctly when multiple cards have the same value in the sort column (use consistent secondary sort, e.g., alphabetical by card name)
- **FR-014**: System MUST persist sort preferences (column and order) for the duration of the session
- **FR-015**: System MUST update the scoreboard when tier visibility settings change, reflecting the current filter state
- **FR-016**: System MUST display an empty state or appropriate message when no cards have been dropped in the current session
- **FR-017**: System MUST handle large numbers of dropped cards (100+) without performance degradation
- **FR-018**: System MUST maintain scoreboard statistics accurately when cards are moved between tiers during a session
- **FR-019**: System MUST display column headers that indicate the current sort column and sort direction
- **FR-020**: System MUST allow users to toggle the sort order by clicking the same column header multiple times

### Key Entities *(include if feature involves data)*

- **ScoreboardEntry**: Represents a single card's statistics in the scoreboard. Key attributes: card name (unique identifier), drop count (number of times dropped in current session), card value (chaos value from card definition), total accumulated value (drop count × card value), tier identifier (for visibility filtering), first drop timestamp (when first dropped in session), last drop timestamp (when most recently dropped).

- **ScoreboardState**: Represents the current state and configuration of the scoreboard. Key attributes: entries (collection of ScoreboardEntry objects), sort column (which column is used for sorting: name, drop count, card value, or total value), sort order (ascending or descending), include hidden cards (boolean flag for tier filter integration), last update timestamp (when scoreboard was last refreshed).

- **CardDropEvent**: Represents a single card drop event that contributes to scoreboard statistics. Key attributes: card name, drop timestamp, card value, tier identifier at time of drop, was visible (whether card was displayed when dropped based on tier filter).

- **SessionDropHistory**: Represents the complete history of card drops for the current session. Key attributes: session start timestamp, drop events (array of CardDropEvent objects), aggregated statistics (Map of card name to ScoreboardEntry for quick lookup).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view the scoreboard and see all dropped cards with correct statistics within 1 second of opening the scoreboard
- **SC-002**: Scoreboard updates to reflect new card drops within 500ms of the drop event
- **SC-003**: Users can change sort column and sort order, with the scoreboard re-sorting within 200ms of the interaction
- **SC-004**: Scoreboard correctly filters cards based on tier visibility settings with 100% accuracy (only shows cards from enabled tiers by default)
- **SC-005**: When the option to include hidden cards is enabled, the scoreboard shows all dropped cards including previously hidden drops with 100% accuracy
- **SC-006**: Scoreboard maintains accurate drop counts and accumulated values for all cards, with 100% accuracy even when the same card is dropped multiple times
- **SC-007**: Scoreboard handles at least 200 unique cards with 1000+ total drops without performance degradation (sorting and filtering complete within 500ms)
- **SC-008**: Scoreboard correctly calculates total accumulated value (drop count × card value) for all entries with 100% accuracy
- **SC-009**: Scoreboard updates correctly when tier visibility settings change, reflecting the new filter state within 500ms
- **SC-010**: Users can successfully sort by any column (name, drop count, card value, total value) in both ascending and descending order with 100% accuracy

## Testing Requirements *(mandatory)*

### Test Coverage Requirements

- **TC-001**: Scoreboard display logic (entry creation, statistics calculation) must have unit tests with ≥80% coverage
- **TC-002**: Sorting functionality (column selection, order toggling) must have comprehensive unit tests
- **TC-003**: Tier filter integration (visibility filtering, hidden card inclusion) must have integration tests with the tier service
- **TC-004**: Drop tracking and statistics aggregation must have unit tests covering all aggregation scenarios
- **TC-005**: Real-time scoreboard updates must have integration tests verifying updates occur when cards are dropped
- **TC-006**: Edge cases (empty scoreboard, duplicate cards, tier changes) must have comprehensive test coverage
- **TC-007**: Performance tests must verify scoreboard handles large datasets (200+ cards, 1000+ drops) within performance requirements
- **TC-008**: Session reset functionality must have tests verifying scoreboard clears correctly on new session
- **TC-009**: Sort persistence and state management must have tests verifying sort preferences are maintained correctly

### Test Scenarios

- [ ] Happy path: Player drops multiple cards, opens scoreboard, sees all cards with correct statistics sorted by value
- [ ] Happy path: Player clicks column headers to change sort column and order, scoreboard re-sorts correctly
- [ ] Happy path: Player enables option to include hidden cards, previously hidden drops appear in scoreboard
- [ ] Happy path: Player drops new card while scoreboard is open, scoreboard updates immediately
- [ ] Edge case: Player drops same card multiple times, scoreboard shows correct combined statistics
- [ ] Edge case: Player drops cards from disabled tier, scoreboard excludes them by default, includes them when option enabled
- [ ] Edge case: Multiple cards have same value, secondary sort (alphabetical) applies correctly
- [ ] Edge case: Player changes tier visibility while viewing scoreboard, scoreboard updates to reflect new filter
- [ ] Edge case: Player drops 100+ cards, scoreboard handles large dataset without performance issues
- [ ] Edge case: Session resets, scoreboard clears and shows empty state
- [ ] Integration: Scoreboard correctly integrates with tier filter system and respects tier visibility
- [ ] Integration: Scoreboard correctly integrates with card drop tracking system
- [ ] Performance: Scoreboard sorting and filtering complete within specified time requirements for large datasets

## User Experience Requirements *(mandatory)*

### Accessibility Requirements

- **UX-001**: Feature MUST meet WCAG 2.1 Level AA standards
- **UX-002**: Scoreboard table must be keyboard navigable, allowing users to navigate between entries and interact with sort controls using keyboard only
- **UX-003**: Column headers must have appropriate ARIA labels indicating sortable state and current sort direction
- **UX-004**: Scoreboard must be accessible to screen readers, with proper table structure and row/column headers
- **UX-005**: Sort controls must have clear visual indicators (icons, arrows) showing current sort column and direction
- **UX-006**: Option to include hidden cards must be clearly labeled and accessible via keyboard navigation
- **UX-007**: Empty state message must be clearly communicated to screen readers when no cards have been dropped

### Consistency Requirements

- **UX-008**: Scoreboard interface must follow established design system patterns and component styles used elsewhere in the application
- **UX-009**: Sort controls must use consistent interaction patterns with other sortable tables or lists in the application
- **UX-010**: Filter toggle (include hidden cards) must use consistent toggle or checkbox patterns with the rest of the application
- **UX-011**: Scoreboard layout and typography must match the visual style of other game statistics displays
- **UX-012**: Column headers must follow consistent styling and interaction patterns with other table headers in the application

### User Feedback Requirements

- **UX-013**: When a new card is dropped, the scoreboard must provide visual feedback showing the update (e.g., highlight new entry, scroll to new entry, or animation)
- **UX-014**: When sort column or order changes, the scoreboard must provide immediate visual feedback showing the new sort state
- **UX-015**: When the option to include hidden cards is toggled, the scoreboard must update immediately with clear visual indication of the change
- **UX-016**: Column headers must provide clear visual indication of which column is currently sorted and in which direction (ascending/descending)
- **UX-017**: When the scoreboard is empty, the system must display a clear, helpful message explaining why (no cards dropped in session)
- **UX-018**: Scoreboard must show loading state or skeleton content if data is being calculated or loaded (for large datasets)

## Performance Requirements *(mandatory)*

### Performance Benchmarks

- **PERF-001**: Scoreboard must render and display all entries within 1 second for up to 200 unique cards
- **PERF-002**: Scoreboard sorting must complete within 200ms for datasets up to 200 cards
- **PERF-003**: Scoreboard filtering (tier visibility) must complete within 100ms for datasets up to 200 cards
- **PERF-004**: Scoreboard updates when new cards are dropped must complete within 500ms, including statistics recalculation
- **PERF-005**: Scoreboard must handle at least 1000 total drops across 200 unique cards without performance degradation
- **PERF-006**: Scoreboard statistics calculation (drop counts, accumulated values) must complete within 50ms for the entire dataset
- **PERF-007**: Scoreboard must update when tier visibility changes within 500ms, including re-filtering and re-sorting if needed
- **PERF-008**: Scoreboard must maintain responsive interactions (sorting, filtering) even when processing large datasets (200+ cards)
- **PERF-009**: Scoreboard memory usage must not exceed reasonable limits (e.g., 10MB) for typical session data (200 cards, 1000 drops)

## Assumptions

- The current session is defined as the time between application start and application close, or until the player explicitly resets the session
- Card drop tracking already exists in the game state (cardCollection Map) and can be used or extended for scoreboard statistics
- Tier filter system (tier visibility) is already implemented and can be queried to determine which cards should be shown
- Card values are static properties that do not change during a session (value comes from card definition)
- The scoreboard is a separate view/component that can be opened and closed by the player
- Session statistics are not persisted between application sessions (scoreboard resets on new session)
- The scoreboard displays data in a table or list format with sortable columns
- Players can view the scoreboard at any time during gameplay
- The option to include hidden cards is a toggle or checkbox control that persists for the session
- Sort preferences (column and order) are maintained for the duration of the session but reset on new session
- All cards dropped during the session are tracked, regardless of tier visibility at the time of drop
- The scoreboard integrates with existing card drop tracking system and tier filter system
