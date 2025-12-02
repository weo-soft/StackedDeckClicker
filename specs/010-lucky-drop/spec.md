# Feature Specification: Lucky Drop Feature

**Feature Branch**: `010-lucky-drop`  
**Created**: 2025-01-27  
**Status**: Draft  
**Input**: User description: "add a \"lucky drop\" feature. Depending on the lucky drop level the card that is dropped is rolled multiple times (level 1-> rolled twiced, level 2-> rolled three times and so on), The card with the highest values out of the rolles is actually dropped."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Lucky Drop Multi-Roll Card Selection (Priority: P1)

A player with lucky drop upgrade active opens a deck, and the system rolls multiple cards based on the lucky drop level (level 1 = 2 rolls, level 2 = 3 rolls, etc.), then automatically selects and drops the card with the highest value from those rolls. This provides better card outcomes compared to standard single-roll draws.

**Why this priority**: This is the core functionality of the lucky drop feature. The multi-roll mechanism with best-card selection is the primary value proposition that improves player outcomes and creates strategic upgrade decisions.

**Independent Test**: Can be fully tested by activating lucky drop at a specific level, opening decks, and verifying that the dropped card has the highest value among the rolled options. Delivers immediate gameplay advantage through improved card selection.

**Acceptance Scenarios**:

1. **Given** a player has lucky drop level 1 active, **When** the player opens a deck, **Then** the system rolls 2 cards and drops the card with the highest value among those 2 rolls
2. **Given** a player has lucky drop level 2 active, **When** the player opens a deck, **Then** the system rolls 3 cards and drops the card with the highest value among those 3 rolls
3. **Given** a player has lucky drop level N active, **When** the player opens a deck, **Then** the system rolls (N+1) cards and drops the card with the highest value among those rolls
4. **Given** a player has lucky drop active and opens a deck, **When** multiple cards are rolled with identical highest values, **Then** the system selects one of the tied cards (first encountered or random selection)
5. **Given** a player opens a deck with lucky drop active, **When** the card is dropped, **Then** the player's score increases by the selected card's value, and the card is added to the collection

---

### User Story 2 - Lucky Drop Upgrade Acquisition and Leveling (Priority: P2)

A player purchases and upgrades the lucky drop feature, increasing the number of rolls per deck opening. Higher levels provide better chances of receiving high-value cards by rolling more options.

**Why this priority**: The upgrade system enables progression and strategic investment. Players need to be able to acquire and level up lucky drop to experience the full feature value, making this essential for long-term engagement.

**Independent Test**: Can be fully tested by purchasing lucky drop upgrade, verifying it activates, then upgrading to higher levels and confirming that the number of rolls increases accordingly. Delivers progression mechanics and upgrade value.

**Acceptance Scenarios**:

1. **Given** a player has sufficient score to purchase lucky drop level 1, **When** the player purchases the upgrade, **Then** lucky drop is activated at level 1, and subsequent deck openings use 2 rolls
2. **Given** a player has lucky drop at level 1, **When** the player upgrades to level 2, **Then** lucky drop level increases to 2, and subsequent deck openings use 3 rolls
3. **Given** a player has insufficient score for a lucky drop upgrade, **When** the player attempts to purchase it, **Then** the system prevents the purchase and indicates how much additional score is needed
4. **Given** a player views the lucky drop upgrade, **When** the upgrade is displayed, **Then** the current level and effect (number of rolls) are clearly shown
5. **Given** a player has lucky drop at a specific level, **When** the player opens decks, **Then** the number of rolls matches the level (level N = N+1 rolls)

---

### User Story 3 - Lucky Drop Integration with Existing Systems (Priority: P3)

A player uses lucky drop in combination with other game systems (scoreboard tracking, card display, tier filtering, etc.), and all systems correctly handle the lucky drop-selected cards as they would standard single-roll cards.

**Why this priority**: Lucky drop must integrate seamlessly with existing game features. The selected card should be treated identically to a standard card draw in all downstream systems to maintain consistency and avoid breaking existing functionality.

**Independent Test**: Can be fully tested by activating lucky drop, opening decks, and verifying that the dropped card appears correctly in scoreboard, card display zones, tier filters, and collection tracking. Delivers system consistency and feature compatibility.

**Acceptance Scenarios**:

1. **Given** a player has lucky drop active and opens a deck, **When** a card is selected via lucky drop, **Then** the card is tracked in the scoreboard with correct value and timestamp
2. **Given** a player has lucky drop active and opens a deck, **When** a card is selected via lucky drop, **Then** the card is displayed in the purple zone and ambient scene zone as with standard draws
3. **Given** a player has lucky drop active and opens a deck, **When** a card is selected via lucky drop, **Then** the card is added to the card collection with correct count increment
4. **Given** a player has lucky drop active and tier filtering enabled, **When** a card is selected via lucky drop, **Then** the card respects tier visibility settings and displays only if the tier is visible
5. **Given** a player has lucky drop active and opens multiple decks, **When** cards are selected via lucky drop, **Then** all selected cards are processed correctly in batch operations (multidraw, offline progression)

---

### Edge Cases

- What happens when lucky drop level 0 is somehow active? The system should default to standard single-roll behavior (no lucky drop effect)
- How does the system handle lucky drop when all rolled cards have value 0? The system should select one of the rolled cards (first encountered or random)
- What happens when lucky drop is active during multidraw operations? Each deck opening in the multidraw should independently apply lucky drop multi-roll selection
- How does the system handle lucky drop with offline progression? Offline deck openings should apply lucky drop multi-roll selection based on the level at the time of offline calculation
- What happens when lucky drop level exceeds reasonable maximums (e.g., level 100)? The system should handle high levels gracefully, rolling (level+1) cards as specified
- How does lucky drop interact with other card-affecting upgrades? Lucky drop replaces the existing luck upgrade. The existing luck upgrade is removed/renamed to lucky drop, and any existing luck upgrade levels are migrated to lucky drop levels. Lucky drop works independently of other upgrades like improved rarity (which affects card pool weights, not selection method).
- What happens when card pool is empty or contains only one card? The system should handle gracefully, rolling the same card multiple times if necessary and selecting it

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST roll multiple cards when lucky drop is active, where the number of rolls equals (lucky drop level + 1)
- **FR-002**: System MUST select the card with the highest value from the rolled cards when lucky drop is active
- **FR-003**: System MUST drop the selected highest-value card as the result of deck opening when lucky drop is active
- **FR-004**: System MUST allow players to purchase and upgrade lucky drop feature using score currency
- **FR-005**: System MUST track lucky drop level in the upgrade system and persist it across game sessions
- **FR-006**: System MUST apply lucky drop multi-roll selection independently for each deck opening in multidraw operations
- **FR-007**: System MUST apply lucky drop multi-roll selection during offline progression calculations based on the lucky drop level at calculation time
- **FR-008**: System MUST handle tied highest values by selecting one of the tied cards (deterministic or random selection)
- **FR-009**: System MUST treat lucky drop-selected cards identically to standard single-roll cards in all downstream systems (scoreboard, display, collection, tier filtering)
- **FR-010**: System MUST default to standard single-roll behavior when lucky drop is not active or at level 0
- **FR-011**: System MUST prevent deck opening when insufficient decks are available, regardless of lucky drop activation
- **FR-012**: System MUST calculate score gain based on the selected card's value, not the values of rolled but not selected cards
- **FR-013**: System MUST replace the existing luck upgrade with lucky drop, removing the old luck upgrade from the upgrade system
- **FR-014**: System MUST migrate any existing luck upgrade levels to corresponding lucky drop levels when the feature is implemented (e.g., luck level 3 becomes lucky drop level 3)

### Key Entities *(include if feature involves data)*

- **Lucky Drop Upgrade**: Represents the upgrade that enables multi-roll card selection. Key attributes: upgrade level (determines number of rolls), upgrade cost (score required to purchase/upgrade), activation state (active/inactive), effect description (number of rolls per level).

- **Multi-Roll Card Selection**: Represents the process of rolling multiple cards and selecting the best one. Key attributes: number of rolls (based on lucky drop level), rolled cards (array of candidate cards), selected card (highest value card), selection method (value comparison), tie-breaking logic (handling equal values).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players with lucky drop level 1 active receive cards with average value at least 10% higher than standard single-roll draws over 100 deck openings
- **SC-002**: Lucky drop upgrade purchase and leveling completes within 100ms of player action without blocking other game interactions
- **SC-003**: Lucky drop multi-roll selection completes within 50ms per deck opening, maintaining responsive gameplay feel
- **SC-004**: Lucky drop-selected cards are correctly tracked in scoreboard, collection, and display systems with 100% accuracy compared to standard draws
- **SC-005**: Lucky drop integrates seamlessly with multidraw operations, applying multi-roll selection to each deck independently without performance degradation
- **SC-006**: Lucky drop level persists correctly across game sessions, maintaining activation state and level for 100% of save/load cycles
- **SC-007**: Players can upgrade lucky drop through at least 10 levels, with each level providing measurable improvement in average card value received
- **SC-008**: Lucky drop works correctly during offline progression, applying multi-roll selection based on saved lucky drop level with same accuracy as online play

## Testing Requirements *(mandatory)*

### Test Coverage Requirements

- **TC-001**: Lucky drop multi-roll selection logic must have unit tests with ≥80% coverage, including edge cases (tied values, single card pool, level 0)
- **TC-002**: Lucky drop upgrade purchase and leveling must have integration tests verifying activation and level persistence
- **TC-003**: Lucky drop integration with card drawing service must have tests verifying correct number of rolls per level
- **TC-004**: Lucky drop integration with downstream systems (scoreboard, collection, display) must have integration tests verifying identical treatment to standard draws
- **TC-005**: Lucky drop with multidraw operations must have tests verifying independent multi-roll selection for each deck
- **TC-006**: Lucky drop with offline progression must have tests verifying correct application of multi-roll selection during offline calculations
- **TC-007**: Lucky drop value selection algorithm must have tests verifying highest value selection across various card value distributions
- **TC-008**: Lucky drop tie-breaking logic must have tests covering scenarios with multiple cards having identical highest values
- **TC-009**: Lucky drop migration from existing luck upgrade must have tests verifying that luck upgrade levels are correctly converted to lucky drop levels
- **TC-010**: Lucky drop replacement of luck upgrade must have tests verifying that the old luck upgrade is removed and no longer functional

### Test Scenarios

- [ ] Happy path: Player activates lucky drop level 1, opens deck, receives card selected from 2 rolls with highest value
- [ ] Happy path: Player upgrades lucky drop to level 3, opens deck, receives card selected from 4 rolls with highest value
- [ ] Edge case: All rolled cards have identical values - system selects one card correctly
- [ ] Edge case: Lucky drop level 0 or inactive - system uses standard single-roll behavior
- [ ] Edge case: Card pool contains only one card - system handles gracefully, rolling same card multiple times
- [ ] Integration: Lucky drop with multidraw - each deck opening applies multi-roll selection independently
- [ ] Integration: Lucky drop with offline progression - multi-roll selection applied correctly during offline calculations
- [ ] Integration: Lucky drop-selected card appears correctly in scoreboard, collection, and display zones
- [ ] Performance: Lucky drop multi-roll selection completes within performance requirements for various level values
- [ ] Regression: Lucky drop does not break existing card drawing, scoring, or collection functionality
- [ ] Migration: Existing luck upgrade levels are correctly converted to lucky drop levels
- [ ] Migration: Old luck upgrade is removed and no longer appears in upgrade system

## User Experience Requirements *(mandatory)*

### Accessibility Requirements

- **UX-001**: Feature MUST meet WCAG 2.1 Level AA standards
- **UX-002**: Lucky drop upgrade purchase and level information must be accessible via keyboard navigation and screen readers
- **UX-003**: Lucky drop effect description (number of rolls per level) must be clearly communicated in accessible format
- **UX-004**: Lucky drop activation state and current level must be clearly visible and readable with appropriate color contrast ratios (WCAG 4.5:1 for normal text)

### Consistency Requirements

- **UX-005**: Lucky drop upgrade must follow established design patterns and visual style of other upgrades in the game
- **UX-006**: Lucky drop-selected cards must display identically to standard single-roll cards in all visual zones (purple zone, ambient scene)
- **UX-007**: Lucky drop upgrade cost and level progression must follow consistent patterns with other upgrade systems
- **UX-008**: Lucky drop effect description must use consistent terminology and formatting with other upgrade descriptions

### User Feedback Requirements

- **UX-009**: Lucky drop upgrade purchase must provide immediate visual feedback when purchased or upgraded
- **UX-010**: Lucky drop activation state and current level must be clearly displayed in the upgrade interface
- **UX-011**: Lucky drop effect (number of rolls) must be clearly communicated to players before purchase
- **UX-012**: Lucky drop-selected cards must provide same visual and audio feedback as standard card draws (no special indication needed to maintain consistency)
- **UX-013**: Lucky drop upgrade must show cost and level requirements clearly before purchase attempt

## Performance Requirements *(mandatory)*

### Performance Benchmarks

- **PERF-001**: Lucky drop multi-roll selection must complete within 50ms per deck opening, regardless of lucky drop level
- **PERF-002**: Lucky drop upgrade purchase and leveling must complete within 100ms without blocking other game interactions
- **PERF-003**: Lucky drop with multidraw operations must maintain performance, applying multi-roll selection to each deck without cumulative slowdown
- **PERF-004**: Lucky drop during offline progression calculations must not significantly increase offline calculation time (within 10% of standard offline time)
- **PERF-005**: Lucky drop multi-roll selection must not cause memory issues or performance degradation at high levels (level 50+)
- **PERF-006**: Lucky drop integration must not impact existing card drawing, scoring, or display system performance

## Assumptions

- Lucky drop replaces the existing luck upgrade in the upgrade system (the old luck upgrade is removed/renamed)
- Any existing luck upgrade levels are migrated to corresponding lucky drop levels during implementation
- Lucky drop level starts at 0 (inactive) and can be upgraded to higher levels using score currency
- Lucky drop works independently of other upgrades like improved rarity (which affects card pool weights, not selection method)
- The "highest value" comparison uses the card's `value` property (chaos value/score contribution)
- Lucky drop applies to all deck opening operations (manual, auto-opening, multidraw, offline progression)
- Lucky drop level is persisted in the game state along with other upgrade levels
- Lucky drop upgrade costs and level progression follow similar patterns to existing upgrades
- Lucky drop-selected cards are treated identically to standard draws in all downstream systems (no special handling needed)
