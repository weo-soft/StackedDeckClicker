# Tasks: Card Drop Scoreboard

**Input**: Design documents from `/specs/007-card-scoreboard/`
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

- [x] T001 Verify existing project structure matches plan.md requirements
- [x] T002 [P] Review existing tierService.ts and tierStore.ts patterns for consistency
- [x] T003 [P] Review existing gameStateService.ts card drop tracking for integration points

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data models and infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 [P] Create ScoreboardEntry interface in src/lib/models/ScoreboardEntry.ts
- [x] T005 [P] Create ScoreboardState interface with SortColumn and SortOrder types in src/lib/models/ScoreboardState.ts
- [x] T006 [P] Create CardDropEvent interface in src/lib/models/CardDropEvent.ts
- [x] T007 [P] Create SessionDropHistory interface in src/lib/models/SessionDropHistory.ts
- [x] T008 Create scoreboardService.ts skeleton with class structure in src/lib/services/scoreboardService.ts
- [x] T009 Create scoreboardStore.ts skeleton with store structure in src/lib/stores/scoreboardStore.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Scoreboard with Dropped Cards (Priority: P1) 🎯 MVP

**Goal**: Display a scoreboard showing all cards dropped in the current session with drop counts, card values, and total accumulated values, sorted by card value (descending) by default.

**Independent Test**: Open the scoreboard after dropping some cards and verify that all dropped cards appear with correct counts, values, and totals. Empty state should display when no cards dropped.

### Tests for User Story 1 (MANDATORY per constitution) ⚠️

> **NOTE: Per constitution Principle 2, tests MUST be written FIRST and ensure they FAIL before implementation. All critical paths require ≥80% coverage.**

- [x] T010 [P] [US1] Write unit test for ScoreboardEntry model validation in tests/unit/models/scoreboardModels.test.ts
- [x] T011 [P] [US1] Write unit test for scoreboardService.trackDrop() in tests/unit/services/scoreboardService.test.ts
- [x] T012 [P] [US1] Write unit test for scoreboardService.getEntries() with default sorting in tests/unit/services/scoreboardService.test.ts
- [x] T013 [P] [US1] Write unit test for scoreboardService aggregation logic (multiple drops of same card) in tests/unit/services/scoreboardService.test.ts
- [x] T014 [P] [US1] Write integration test for scoreboardService initialization and reset in tests/integration/scoreboardIntegration.test.ts
- [x] T015 [P] [US1] Write E2E test for scoreboard display with dropped cards in tests/e2e/scoreboard.spec.ts

### Implementation for User Story 1

- [x] T016 [US1] Implement scoreboardService.initialize() method in src/lib/services/scoreboardService.ts
- [x] T017 [US1] Implement scoreboardService.trackDrop() method to create CardDropEvent and update SessionDropHistory in src/lib/services/scoreboardService.ts
- [x] T018 [US1] Implement scoreboardService.updateAggregatedStats() private method to aggregate drop events into ScoreboardEntry objects in src/lib/services/scoreboardService.ts
- [x] T019 [US1] Implement scoreboardService.getEntries() method with default sort by cardValue descending in src/lib/services/scoreboardService.ts
- [x] T020 [US1] Implement scoreboardService.getState() method to return current ScoreboardState in src/lib/services/scoreboardService.ts
- [x] T021 [US1] Implement scoreboardService.reset() method to clear session data in src/lib/services/scoreboardService.ts
- [x] T022 [US1] Implement scoreboardStore with subscribe, getEntries, getState, and refresh methods in src/lib/stores/scoreboardStore.ts
- [x] T023 [US1] Create Scoreboard.svelte component with table structure for displaying entries in src/lib/components/Scoreboard.svelte
- [x] T024 [US1] Implement empty state display in Scoreboard.svelte when no cards dropped in src/lib/components/Scoreboard.svelte
- [x] T025 [US1] Integrate scoreboardService.trackDrop() call in card drop handler in src/routes/+page.svelte
- [x] T026 [US1] Initialize scoreboardService on application startup in src/routes/+layout.ts or app initialization
- [x] T027 [US1] Add Scoreboard component to UI (create route or add to existing page) in src/routes/+page.svelte or new route

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Players can view scoreboard with dropped cards sorted by value.

---

## Phase 4: User Story 2 - Change Sort Order and Sort Column (Priority: P2)

**Goal**: Allow players to change which column the scoreboard is sorted by (name, drop count, card value, total value) and toggle between ascending/descending order by clicking column headers.

**Independent Test**: Open scoreboard, click different column headers, verify sort order changes correctly. Click same header again to toggle asc/desc.

### Tests for User Story 2 (MANDATORY per constitution) ⚠️

- [x] T028 [P] [US2] Write unit test for scoreboardService.setSortColumn() in tests/unit/services/scoreboardService.test.ts
- [x] T029 [P] [US2] Write unit test for scoreboardService.toggleSort() logic in tests/unit/services/scoreboardService.test.ts
- [x] T030 [P] [US2] Write unit test for sorting by each column type (name, dropCount, cardValue, totalValue) in tests/unit/services/scoreboardService.test.ts
- [x] T031 [P] [US2] Write unit test for secondary sort (alphabetical by name when primary values equal) in tests/unit/services/scoreboardService.test.ts
- [x] T032 [P] [US2] Write integration test for sort persistence during session in tests/integration/scoreboardIntegration.test.ts
- [x] T033 [P] [US2] Write E2E test for column header click interactions in tests/e2e/scoreboard.spec.ts

### Implementation for User Story 2

- [x] T034 [US2] Implement scoreboardService.setSortColumn() method in src/lib/services/scoreboardService.ts
- [x] T035 [US2] Implement scoreboardService.setSortOrder() method in src/lib/services/scoreboardService.ts
- [x] T036 [US2] Implement scoreboardService.toggleSort() method with column toggle logic in src/lib/services/scoreboardService.ts
- [x] T037 [US2] Update scoreboardService.getEntries() to use current sortColumn and sortOrder from state in src/lib/services/scoreboardService.ts
- [x] T038 [US2] Implement sort comparators for each column type (name, dropCount, cardValue, totalValue) with secondary sort in src/lib/services/scoreboardService.ts
- [x] T039 [US2] Add scoreboardStore.setSortColumn() method in src/lib/stores/scoreboardStore.ts
- [x] T040 [US2] Add scoreboardStore.toggleSort() method in src/lib/stores/scoreboardStore.ts
- [x] T041 [US2] Add column headers with click handlers in Scoreboard.svelte in src/lib/components/Scoreboard.svelte
- [x] T042 [US2] Add visual indicators (arrows/icons) for current sort column and direction in Scoreboard.svelte in src/lib/components/Scoreboard.svelte
- [x] T043 [US2] Add ARIA labels for sortable column headers in Scoreboard.svelte in src/lib/components/Scoreboard.svelte
- [x] T044 [US2] Implement keyboard navigation for column headers (Enter/Space to sort) in Scoreboard.svelte in src/lib/components/Scoreboard.svelte

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Players can view and sort scoreboard by any column.

---

## Phase 5: User Story 3 - Filter by Tier Visibility (Priority: P2)

**Goal**: By default, only show cards from enabled tiers in the scoreboard. Provide option to include cards from disabled tiers (hidden cards).

**Independent Test**: Disable a tier, drop cards from that tier, view scoreboard (should exclude them). Enable "include hidden cards" option, verify all cards appear.

### Tests for User Story 3 (MANDATORY per constitution) ⚠️

- [x] T045 [P] [US3] Write unit test for scoreboardService.setIncludeHiddenCards() in tests/unit/services/scoreboardService.test.ts
- [x] T046 [P] [US3] Write integration test for tier filter integration using tierStore.shouldDisplayCard() in tests/integration/scoreboardTierFilter.test.ts
- [x] T047 [P] [US3] Write integration test for filtering entries by tier visibility in tests/integration/scoreboardTierFilter.test.ts
- [x] T048 [P] [US3] Write integration test for scoreboard update when tier visibility changes in tests/integration/scoreboardTierFilter.test.ts
- [x] T049 [P] [US3] Write E2E test for "include hidden cards" toggle functionality in tests/e2e/scoreboard.spec.ts

### Implementation for User Story 3

- [x] T050 [US3] Implement scoreboardService.setIncludeHiddenCards() method in src/lib/services/scoreboardService.ts
- [x] T051 [US3] Update scoreboardService.getEntries() to filter by tier visibility using tierStore.shouldDisplayCard() in src/lib/services/scoreboardService.ts
- [x] T052 [US3] Implement filterAndSort() private method that applies tier filter before sorting in src/lib/services/scoreboardService.ts
- [x] T053 [US3] Add subscription to tierStore changes to update scoreboard when tier visibility changes in src/lib/components/Scoreboard.svelte
- [x] T054 [US3] Add scoreboardStore.setIncludeHiddenCards() method in src/lib/stores/scoreboardStore.ts
- [x] T055 [US3] Add "include hidden cards" checkbox/toggle control in Scoreboard.svelte in src/lib/components/Scoreboard.svelte
- [x] T056 [US3] Connect toggle to scoreboardStore.setIncludeHiddenCards() in Scoreboard.svelte in src/lib/components/scoreboard.svelte
- [x] T057 [US3] Add ARIA label for "include hidden cards" toggle in Scoreboard.svelte in src/lib/components/Scoreboard.svelte
- [x] T058 [US3] Update scoreboardService.trackDrop() to capture tier visibility state (wasVisible) in CardDropEvent in src/lib/services/scoreboardService.ts

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently. Players can view, sort, and filter scoreboard by tier visibility.

---

## Phase 6: User Story 4 - Include Previously Hidden Drops (Priority: P3)

**Goal**: When "include hidden cards" is enabled, show all cards dropped during the session, including those that were hidden when dropped (due to tier filter).

**Independent Test**: Disable tier, drop cards (hidden), enable "include hidden cards", verify previously hidden drops appear with correct statistics.

### Tests for User Story 4 (MANDATORY per constitution) ⚠️

- [x] T059 [P] [US4] Write unit test for CardDropEvent.wasVisible flag tracking in tests/integration/scoreboardTierFilter.test.ts
- [x] T060 [P] [US4] Write integration test for previously hidden drops appearing when includeHiddenCards enabled in tests/integration/scoreboardTierFilter.test.ts
- [x] T061 [P] [US4] Write integration test for combined statistics (visible + hidden drops) in tests/integration/scoreboardTierFilter.test.ts
- [x] T062 [P] [US4] Write E2E test for previously hidden drops functionality in tests/e2e/scoreboard.spec.ts

### Implementation for User Story 4

- [x] T063 [US4] Verify scoreboardService.trackDrop() captures wasVisible flag correctly (already done in T058) in src/lib/services/scoreboardService.ts
- [x] T064 [US4] Update filterAndSort() to include all entries when includeHiddenCards is true, regardless of wasVisible flag in src/lib/services/scoreboardService.ts
- [x] T065 [US4] Ensure aggregatedStats includes all drops (visible and hidden) when calculating dropCount and totalAccumulatedValue in src/lib/services/scoreboardService.ts
- [x] T066 [US4] Add test coverage for edge case: same card dropped with different tier visibility states in tests/integration/scoreboardTierFilter.test.ts

**Checkpoint**: All user stories should now be independently functional. Complete scoreboard with sorting, filtering, and hidden card inclusion.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T067 [P] Add real-time update feedback when new cards are dropped (highlight, animation, or scroll to new entry) in src/lib/components/Scoreboard.svelte
- [x] T068 [P] Add loading state or skeleton content for large datasets in src/lib/components/Scoreboard.svelte
- [x] T069 [P] Performance optimization: Add debouncing for rapid card drops in src/lib/services/scoreboardService.ts
- [x] T070 [P] Performance optimization: Memoize totalAccumulatedValue calculations in ScoreboardEntry in src/lib/services/scoreboardService.ts
- [ ] T071 [P] Add performance tests for large datasets (200+ cards, 1000+ drops) in tests/performance/scoreboardPerformance.test.ts
- [ ] T072 [P] Add additional unit tests to achieve ≥80% coverage target in tests/unit/services/scoreboardService.test.ts
- [ ] T073 [P] Accessibility testing: Verify WCAG 2.1 AA compliance for scoreboard table and controls
- [ ] T074 [P] Accessibility testing: Verify keyboard navigation works for all interactive elements
- [ ] T075 [P] UX consistency review: Verify scoreboard matches design system patterns from TierManagement.svelte
- [x] T076 [P] Add error handling for edge cases (missing card data, tier service not initialized) in src/lib/services/scoreboardService.ts
- [x] T077 [P] Add logging for scoreboard operations (trackDrop, sort changes, filter changes) in src/lib/services/scoreboardService.ts
- [x] T078 [P] Documentation: Update code comments and JSDoc for all public methods in src/lib/services/scoreboardService.ts
- [x] T079 [P] Documentation: Update code comments and JSDoc for Scoreboard component in src/lib/components/Scoreboard.svelte
- [ ] T080 Run quickstart.md validation: Verify all code examples work correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 for basic scoreboard display
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 for basic scoreboard, integrates with tierStore
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - Depends on US3 for tier filtering functionality

### Within Each User Story

- Tests (MANDATORY) MUST be written and FAIL before implementation
- Models before services
- Services before stores
- Stores before components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] (T004-T007) can run in parallel (within Phase 2)
- Once Foundational phase completes, user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members (with coordination)

---

## Parallel Example: User Story 1

```bash
# Launch all model tests in parallel:
Task: "Write unit test for ScoreboardEntry model validation in tests/unit/models/scoreboardModels.test.ts"
Task: "Write unit test for scoreboardService.trackDrop() in tests/unit/services/scoreboardService.test.ts"
Task: "Write unit test for scoreboardService.getEntries() with default sorting in tests/unit/services/scoreboardService.test.ts"
Task: "Write unit test for scoreboardService aggregation logic in tests/unit/services/scoreboardService.test.ts"

# Launch all service implementation tasks (after tests):
Task: "Implement scoreboardService.initialize() method in src/lib/services/scoreboardService.ts"
Task: "Implement scoreboardService.trackDrop() method in src/lib/services/scoreboardService.ts"
Task: "Implement scoreboardService.updateAggregatedStats() private method in src/lib/services/scoreboardService.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (tests first, then implementation)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (MVP)
   - Developer B: User Story 2 (can start after US1 basic structure)
   - Developer C: User Story 3 (can start after US1, works with tierStore)
3. Stories complete and integrate independently
4. Developer D: User Story 4 (after US3 complete)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD approach)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All tests are MANDATORY per constitution Principle 2
- Performance targets: render <1s, sort <200ms, update <500ms
- Accessibility: WCAG 2.1 AA compliance required

---

## Task Summary

- **Total Tasks**: 80
- **Setup Phase**: 3 tasks
- **Foundational Phase**: 6 tasks
- **User Story 1 (P1)**: 18 tasks (6 tests + 12 implementation)
- **User Story 2 (P2)**: 17 tasks (6 tests + 11 implementation)
- **User Story 3 (P2)**: 14 tasks (5 tests + 9 implementation)
- **User Story 4 (P3)**: 8 tasks (4 tests + 4 implementation)
- **Polish Phase**: 14 tasks

**Suggested MVP Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1) = 27 tasks

**Parallel Opportunities**: 
- 4 model creation tasks (T004-T007) can run in parallel
- All test tasks within a story can run in parallel
- User Stories 2 and 3 can start after US1 foundation is laid

