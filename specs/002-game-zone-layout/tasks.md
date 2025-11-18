---
description: "Task list for Game Area Zone Layout feature implementation"
---

# Tasks: Game Area Zone Layout

**Input**: Design documents from `/specs/002-game-zone-layout/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Per constitution Principle 2 (Testing Standards), all features MUST include corresponding tests. Test tasks are MANDATORY for critical business logic and user-facing features, with ≥80% coverage target. Tests MUST be written before implementation (TDD approach recommended).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths shown below assume single project structure per plan.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 [P] Create zone layout models directory structure in src/lib/models/
- [x] T002 [P] Create zone layout services directory structure in src/lib/services/
- [x] T003 [P] Create zone layout utilities directory structure in src/lib/utils/
- [x] T004 [P] Create zone layout components directory structure in src/lib/components/
- [x] T005 [P] Create zone layout test directory structure in tests/unit/services/, tests/unit/utils/, tests/integration/, tests/e2e/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Create ZoneType enum in src/lib/models/ZoneLayout.ts
- [x] T007 Create ZoneProportions interface in src/lib/models/ZoneLayout.ts
- [x] T008 Create ZoneContent interface in src/lib/models/ZoneLayout.ts
- [x] T009 Create Zone interface in src/lib/models/ZoneLayout.ts
- [x] T010 Create ZoneBoundary interface in src/lib/models/ZoneLayout.ts
- [x] T011 Create ZoneLayout interface in src/lib/models/ZoneLayout.ts
- [x] T012 [P] Create zoneBoundaries utility functions in src/lib/utils/zoneBoundaries.ts (contains, intersects, createBoundary, getIntersection)
- [x] T013 Create ZoneLayoutService class skeleton in src/lib/services/zoneLayoutService.ts with all method signatures from contracts
- [x] T014 [P] Write unit tests for zoneBoundaries utilities in tests/unit/utils/zoneBoundaries.test.ts (must fail initially per TDD)
- [x] T015 [P] Write unit tests for ZoneLayoutService in tests/unit/services/zoneLayoutService.test.ts (must fail initially per TDD)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Integrated Zone-Based Game Area (Priority: P1) 🎯 MVP

**Goal**: Display all five zones in a cohesive zone-based layout where zones are properly positioned and sized according to layout proportions. This establishes the foundational visual structure.

**Independent Test**: Load the game and verify that all five zones (White, Yellow logical, Blue, Orange, Green) are visible, properly positioned, and sized according to reference image proportions. Zones should maintain boundaries and not overlap.

### Tests for User Story 1 (MANDATORY per constitution) ⚠️

> **NOTE: Per constitution Principle 2, tests MUST be written FIRST and ensure they FAIL before implementation. All critical paths require ≥80% coverage.**

- [x] T016 [P] [US1] Write unit test for zone layout initialization in tests/unit/services/zoneLayoutService.test.ts
- [x] T017 [P] [US1] Write unit test for zone position calculations in tests/unit/services/zoneLayoutService.test.ts
- [x] T018 [P] [US1] Write unit test for zone size calculations in tests/unit/services/zoneLayoutService.test.ts
- [x] T019 [P] [US1] Write integration test for zone layout rendering in tests/integration/zoneLayout.test.ts
- [x] T020 [P] [US1] Write E2E test for zone visibility in tests/e2e/zone-layout.spec.ts

### Implementation for User Story 1

- [x] T021 [US1] Implement ZoneLayoutService.initializeLayout() in src/lib/services/zoneLayoutService.ts
- [x] T022 [US1] Implement zone position calculation logic in src/lib/services/zoneLayoutService.ts (white zone ~67% left, right zones ~33% width)
- [x] T023 [US1] Implement zone size calculation logic in src/lib/services/zoneLayoutService.ts (blue 50% height, orange 25%, green 25% of right side)
- [x] T024 [US1] Implement ZoneLayoutService.resizeLayout() in src/lib/services/zoneLayoutService.ts
- [x] T025 [US1] Create GameAreaLayout component skeleton in src/lib/components/GameAreaLayout.svelte
- [x] T026 [US1] Implement zone container structure in src/lib/components/GameAreaLayout.svelte using CSS Grid/Flexbox
- [x] T027 [US1] Implement zone positioning in src/lib/components/GameAreaLayout.svelte based on ZoneLayoutService calculations
- [x] T028 [US1] Add responsive layout handling in src/lib/components/GameAreaLayout.svelte (maintain proportions on resize)
- [x] T029 [US1] Create placeholder zone components in src/lib/components/AmbientSceneZone.svelte, UpgradeStoreZone.svelte, StateInfoZone.svelte, InventoryZone.svelte
- [x] T030 [US1] Integrate GameAreaLayout into src/routes/+page.svelte replacing existing layout
- [x] T031 [US1] Add ARIA labels and accessibility attributes to all zones in src/lib/components/GameAreaLayout.svelte
- [x] T032 [US1] Add keyboard navigation support for zones in src/lib/components/GameAreaLayout.svelte

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently - all five zones visible and properly positioned

---

## Phase 4: User Story 2 - Ambient Scene Zone with Card Drop Area (Priority: P2)

**Goal**: Display the ambient scene (background/room image) within the white zone and ensure cards drop within the designated drop area (yellow zone logical area) that matches the scene's visual design.

**Independent Test**: Open decks and verify that cards appear within the ambient scene zone in the correct drop area. Cards should not overlap with other zones and should remain within drop area boundaries.

### Tests for User Story 2 (MANDATORY per constitution) ⚠️

- [x] T033 [P] [US2] Write unit test for card drop position validation in tests/unit/services/zoneLayoutService.test.ts
- [x] T034 [P] [US2] Write unit test for random drop position generation in tests/unit/services/zoneLayoutService.test.ts
- [x] T035 [P] [US2] Write integration test for card drop within zone boundaries in tests/integration/zoneLayout.test.ts
- [x] T036 [P] [US2] Write E2E test for card drop in ambient scene zone in tests/e2e/zone-layout.spec.ts

### Implementation for User Story 2

- [x] T037 [US2] Implement ZoneLayoutService.isValidCardDropPosition() in src/lib/services/zoneLayoutService.ts
- [x] T038 [US2] Implement ZoneLayoutService.getRandomDropPosition() in src/lib/services/zoneLayoutService.ts
- [x] T039 [US2] Adapt scene.ts isValidDropPosition() to use zone boundaries in src/lib/canvas/scene.ts
- [x] T040 [US2] Update scene.ts findNonOverlappingCardPosition() to respect zone boundaries in src/lib/canvas/scene.ts
- [x] T041 [US2] Implement AmbientSceneZone component in src/lib/components/AmbientSceneZone.svelte wrapping GameCanvas
- [x] T042 [US2] Pass zone dimensions to GameCanvas component in src/lib/components/AmbientSceneZone.svelte
- [x] T043 [US2] Integrate zone boundary checking into canvas card drop logic in src/lib/canvas/scene.ts
- [x] T044 [US2] Ensure card animations respect zone boundaries in src/lib/canvas/cardAnimation.ts
- [x] T045 [US2] Update GameCanvas component to use zone-aware drop positions in src/lib/components/GameCanvas.svelte
- [x] T046 [US2] Apply scene customizations within white zone boundaries in src/lib/canvas/scene.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - cards drop correctly within ambient scene zone

---

## Phase 5: User Story 3 - Upgrade Store Zone (Priority: P2)

**Goal**: Display available upgrades in a grid-like layout within the blue zone and allow players to purchase upgrades directly from the store zone interface.

**Independent Test**: View the upgrade store zone, browse available upgrades displayed in a grid within blue zone boundaries, and purchase an upgrade successfully. Purchase should complete and upgrade should activate.

### Tests for User Story 3 (MANDATORY per constitution) ⚠️

- [x] T047 [P] [US3] Write unit test for upgrade store zone content display in tests/unit/services/zoneLayoutService.test.ts
- [x] T048 [P] [US3] Write integration test for upgrade purchase from store zone in tests/integration/zoneLayout.test.ts
- [x] T049 [P] [US3] Write E2E test for upgrade store zone functionality in tests/e2e/zone-layout.spec.ts

### Implementation for User Story 3

- [x] T050 [US3] Create UpgradeStoreZone component in src/lib/components/UpgradeStoreZone.svelte wrapping UpgradeShop
- [x] T051 [US3] Adapt UpgradeShop component styling for blue zone constraints in src/lib/components/UpgradeShop.svelte
- [x] T052 [US3] Implement grid layout for upgrades within blue zone boundaries in src/lib/components/UpgradeStoreZone.svelte
- [x] T053 [US3] Ensure upgrade grid scrolls/paginates if content exceeds zone capacity in src/lib/components/UpgradeStoreZone.svelte
- [x] T054 [US3] Connect upgrade purchase events from UpgradeStoreZone to parent in src/lib/components/UpgradeStoreZone.svelte
- [x] T055 [US3] Add zone-specific styling to upgrade store zone in src/lib/components/UpgradeStoreZone.svelte
- [x] T056 [US3] Ensure upgrade purchase feedback is visible within blue zone in src/lib/components/UpgradeStoreZone.svelte
- [x] T057 [US3] Add keyboard navigation for upgrade grid in src/lib/components/UpgradeStoreZone.svelte

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently - upgrade store functional in blue zone

---

## Phase 6: User Story 4 - State Information Zone (Priority: P3)

**Goal**: Display active buffs, purchased upgrades, and state-related information within the orange zone in an organized, readable format.

**Independent Test**: View the state information zone and verify that active upgrades, buffs, and state information are displayed correctly within orange zone boundaries. Information should be organized clearly and scroll if needed.

### Tests for User Story 4 (MANDATORY per constitution) ⚠️

- [x] T058 [P] [US4] Write unit test for state information zone content display in tests/unit/services/zoneLayoutService.test.ts
- [x] T059 [P] [US4] Write integration test for state information updates in tests/integration/zoneLayout.test.ts
- [x] T060 [P] [US4] Write E2E test for state information zone in tests/e2e/zone-layout.spec.ts

### Implementation for User Story 4

- [x] T061 [US4] Create StateInfoZone component in src/lib/components/StateInfoZone.svelte
- [x] T062 [US4] Implement active upgrades display in src/lib/components/StateInfoZone.svelte
- [x] T063 [US4] Implement active buffs display in src/lib/components/StateInfoZone.svelte
- [x] T064 [US4] Implement state information organization and layout in src/lib/components/StateInfoZone.svelte
- [x] T065 [US4] Add scrolling/pagination for state information if content exceeds zone capacity in src/lib/components/StateInfoZone.svelte
- [x] T066 [US4] Ensure state information updates reactively when game state changes in src/lib/components/StateInfoZone.svelte
- [x] T067 [US4] Add zone-specific styling to state information zone in src/lib/components/StateInfoZone.svelte
- [x] T068 [US4] Add ARIA labels for state information zone in src/lib/components/StateInfoZone.svelte

**Checkpoint**: At this point, User Stories 1, 2, 3, AND 4 should all work independently - state information displayed in orange zone

---

## Phase 7: User Story 5 - Inventory Zone with Deck Opening (Priority: P1) 🎯 MVP

**Goal**: Provide a main click area within the green zone for opening Stacked Decks and display upgrades that require user interaction in a grid-like layout within the inventory zone.

**Independent Test**: Click in the inventory zone's main click area to open a deck. Verify that deck opening action is processed and resulting card appears in ambient scene drop area. Interactive upgrades should be accessible within green zone.

### Tests for User Story 5 (MANDATORY per constitution) ⚠️

- [x] T069 [P] [US5] Write unit test for inventory zone interaction handling in tests/unit/services/zoneLayoutService.test.ts
- [x] T070 [P] [US5] Write integration test for deck opening from inventory zone in tests/integration/zoneLayout.test.ts
- [x] T071 [P] [US5] Write E2E test for inventory zone deck opening in tests/e2e/zone-layout.spec.ts
- [x] T072 [P] [US5] Write E2E test for rapid clicking handling in tests/e2e/zone-layout.spec.ts

### Implementation for User Story 5

- [x] T073 [US5] Create InventoryZone component in src/lib/components/InventoryZone.svelte
- [x] T074 [US5] Implement main click area for deck opening in src/lib/components/InventoryZone.svelte
- [x] T075 [US5] Connect deck opening click handler to gameStateService in src/lib/components/InventoryZone.svelte
- [x] T076 [US5] Implement interactive upgrades grid layout in src/lib/components/InventoryZone.svelte
- [x] T077 [US5] Filter upgrades to show only interactive ones in src/lib/components/InventoryZone.svelte
- [x] T078 [US5] Ensure deck opening feedback is visible within green zone in src/lib/components/InventoryZone.svelte
- [x] T079 [US5] Add error handling for no decks available scenario in src/lib/components/InventoryZone.svelte
- [x] T080 [US5] Implement click event routing to correct zone in src/lib/components/GameAreaLayout.svelte
- [x] T081 [US5] Ensure rapid clicking is handled correctly (no race conditions) in src/lib/components/InventoryZone.svelte
- [x] T082 [US5] Add keyboard support for deck opening in src/lib/components/InventoryZone.svelte
- [x] T083 [US5] Connect inventory zone deck opening to ambient scene card drop in src/lib/components/GameAreaLayout.svelte

**Checkpoint**: At this point, all user stories should be independently functional - complete zone-based layout with all interactions working

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T084 [P] Add comprehensive error handling for zone boundary violations in src/lib/services/zoneLayoutService.ts
- [x] T085 [P] Add performance monitoring for zone layout calculations in src/lib/services/zoneLayoutService.ts
- [x] T086 [P] Optimize zone boundary calculations with caching in src/lib/utils/zoneBoundaries.ts
- [x] T087 [P] Add debouncing for resize events in src/lib/components/GameAreaLayout.svelte
- [x] T088 [P] Ensure all zones meet WCAG 2.1 Level AA accessibility standards across all zone components
- [x] T089 [P] Add visual feedback for zone interactions (hover states, focus indicators) in all zone components
- [x] T090 [P] Add unit tests to achieve ≥80% coverage for zone layout logic in tests/unit/
- [x] T091 [P] Add integration tests for zone boundary containment in tests/integration/zoneLayout.test.ts
- [x] T092 [P] Add E2E tests for responsive behavior across screen sizes in tests/e2e/zone-layout.spec.ts
- [x] T093 [P] Performance testing and validation against constitution benchmarks (PERF-001 through PERF-006)
- [x] T094 [P] Accessibility testing (WCAG 2.1 AA compliance) and UX consistency review
- [x] T095 [P] Code cleanup and refactoring across all zone components
- [x] T096 [P] Documentation updates in quickstart.md validation
- [x] T097 [P] Verify all existing functionality (deck opening, upgrade purchasing, card display) works correctly within zone-based layout

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 (P1): Can start after Foundational - No dependencies on other stories
  - User Story 2 (P2): Can start after Foundational - Depends on US1 for zone structure
  - User Story 3 (P2): Can start after Foundational - Depends on US1 for zone structure
  - User Story 4 (P3): Can start after Foundational - Depends on US1 for zone structure
  - User Story 5 (P1): Can start after Foundational - Depends on US1 and US2 (needs zone structure and card drop area)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundation - Must complete first. No dependencies on other stories.
- **User Story 2 (P2)**: Depends on US1 (needs zone structure). Can proceed in parallel with US3 after US1.
- **User Story 3 (P2)**: Depends on US1 (needs zone structure). Can proceed in parallel with US2 after US1.
- **User Story 4 (P3)**: Depends on US1 (needs zone structure). Can proceed after US1.
- **User Story 5 (P1)**: Depends on US1 (needs zone structure) and US2 (needs card drop area). Must complete after US1 and US2.

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks (T001-T005) marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes:
  - User Story 1 can start (blocks US2, US3, US4, US5)
  - After US1 completes: US2 and US3 can run in parallel
  - After US1 and US2 complete: US5 can start
  - US4 can start after US1 (independent)
- All tests for a user story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members (after dependencies met)

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: T016 - Write unit test for zone layout initialization
Task: T017 - Write unit test for zone position calculations
Task: T018 - Write unit test for zone size calculations
Task: T019 - Write integration test for zone layout rendering
Task: T020 - Write E2E test for zone visibility

# After tests are written and failing, launch implementation:
Task: T021 - Implement ZoneLayoutService.initializeLayout()
Task: T022 - Implement zone position calculation logic
Task: T023 - Implement zone size calculation logic
```

---

## Parallel Example: User Stories 2 and 3 (After US1 Complete)

```bash
# User Story 2 and User Story 3 can proceed in parallel after US1:
# Developer A: User Story 2
Task: T033-T036 - Tests for US2
Task: T037-T046 - Implementation for US2

# Developer B: User Story 3
Task: T047-T049 - Tests for US3
Task: T050-T057 - Implementation for US3
```

---

## Implementation Strategy

### MVP First (User Stories 1 and 5 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (zone layout structure)
4. Complete Phase 4: User Story 2 (card drop area) - needed for US5
5. Complete Phase 7: User Story 5 (deck opening)
6. **STOP and VALIDATE**: Test User Stories 1, 2, and 5 independently
7. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (Basic layout)
3. Add User Story 2 → Test independently → Deploy/Demo (Card drops working)
4. Add User Story 5 → Test independently → Deploy/Demo (MVP!)
5. Add User Story 3 → Test independently → Deploy/Demo (Upgrade store integrated)
6. Add User Story 4 → Test independently → Deploy/Demo (State info displayed)
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (blocks others)
3. Once User Story 1 is done:
   - Developer A: User Story 2
   - Developer B: User Story 3
   - Developer C: User Story 4
4. Once User Stories 1 and 2 are done:
   - Developer A: User Story 5
5. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Total tasks: 97
- Tasks per story: US1 (17), US2 (14), US3 (11), US4 (11), US5 (15), Setup (5), Foundational (10), Polish (14)
- MVP scope: User Stories 1, 2, and 5 (zone layout + card drops + deck opening)

