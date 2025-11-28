# Tasks: Tier Settings Redesign

**Input**: Design documents from `/specs/008-tier-settings-redesign/`
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

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Component refactoring preparation (no new infrastructure needed)

**Note**: This is a UI refactor of an existing component. No new project setup required. Existing tier service, store, and models remain unchanged.

- [x] T001 Review existing TierSettings.svelte component structure in src/lib/components/TierSettings.svelte
- [x] T002 [P] Review existing tier service APIs in src/lib/services/tierService.ts
- [x] T003 [P] Review existing tier store in src/lib/stores/tierStore.ts
- [x] T004 [P] Review existing color validation utilities in src/lib/utils/colorValidation.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core refactoring infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

**Note**: Since this is a UI refactor using existing services, foundational tasks are minimal. The main prerequisite is understanding the existing component structure.

- [x] T005 Create backup of existing TierSettings.svelte component in src/lib/components/TierSettings.svelte.backup
- [x] T006 Document current component props and state structure for reference

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - View All Tiers at a Glance (Priority: P1) 🎯 MVP

**Goal**: Display all tiers as single-line list entries with tier names and visual label previews when Tier Settings opens.

**Independent Test**: Open Tier Settings and verify that all tiers are displayed as list entries with tier names and label previews, without requiring any tier selection or configuration changes.

### Tests for User Story 1 (MANDATORY per constitution) ⚠️

> **NOTE: Per constitution Principle 2, tests MUST be written FIRST and ensure they FAIL before implementation. All critical paths require ≥80% coverage.**

- [ ] T007 [P] [US1] Unit test for tier list rendering in tests/unit/components/TierSettings.test.ts
- [ ] T008 [P] [US1] Unit test for label preview generation in tests/unit/components/TierSettings.test.ts
- [ ] T009 [P] [US1] Unit test for disabled tier visual indication in tests/unit/components/TierSettings.test.ts
- [ ] T010 [P] [US1] Unit test for empty tier list message in tests/unit/components/TierSettings.test.ts

### Implementation for User Story 1

- [x] T011 [US1] Add expandedTiers state management (Set<string>) in src/lib/components/TierSettings.svelte
- [x] T012 [US1] Replace dropdown tier selection with tier list rendering in src/lib/components/TierSettings.svelte
- [x] T013 [US1] Implement getTierDisplayName helper function in src/lib/components/TierSettings.svelte
- [x] T014 [US1] Implement getTierPreviewText helper function in src/lib/components/TierSettings.svelte
- [x] T015 [US1] Create LabelPreview component structure in src/lib/components/TierSettings.svelte
- [x] T016 [US1] Implement label preview rendering with tier color scheme in src/lib/components/TierSettings.svelte
- [x] T017 [US1] Add disabled tier visual indication styling in src/lib/components/TierSettings.svelte
- [x] T018 [US1] Add empty tier list message handling in src/lib/components/TierSettings.svelte
- [x] T019 [US1] Update component styling for list-based layout in src/lib/components/TierSettings.svelte

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently - all tiers display as list entries with label previews

---

## Phase 4: User Story 2 - Expand/Collapse Tier Configuration (Priority: P1) 🎯 MVP

**Goal**: Enable clicking tier list entries to expand/collapse sections containing configuration options and card lists. Support multiple tiers expanded simultaneously.

**Independent Test**: Click tier entries and verify that collapsibles open/close correctly, showing configuration options and card lists when expanded. Verify multiple tiers can be expanded at once.

### Tests for User Story 2 (MANDATORY per constitution) ⚠️

- [ ] T020 [P] [US2] Unit test for expand/collapse toggle functionality in tests/unit/components/TierSettings.test.ts
- [ ] T021 [P] [US2] Unit test for multiple tiers expanded simultaneously in tests/unit/components/TierSettings.test.ts
- [ ] T022 [P] [US2] Unit test for configuration editor visibility when expanded in tests/unit/components/TierSettings.test.ts
- [ ] T023 [P] [US2] Integration test for expand tier → edit config → save workflow in tests/integration/tier-settings.test.ts

### Implementation for User Story 2

- [x] T024 [US2] Implement toggleTierExpansion function in src/lib/components/TierSettings.svelte
- [x] T025 [US2] Add collapsible section structure with conditional rendering in src/lib/components/TierSettings.svelte
- [x] T026 [US2] Implement loadTierForEditing function in src/lib/components/TierSettings.svelte
- [x] T027 [US2] Move existing color scheme editor into collapsible section in src/lib/components/TierSettings.svelte
- [x] T028 [US2] Move existing sound configuration editor into collapsible section in src/lib/components/TierSettings.svelte
- [x] T029 [US2] Move existing display settings editor into collapsible section in src/lib/components/TierSettings.svelte
- [x] T030 [US2] Add collapsible animation/transition styling in src/lib/components/TierSettings.svelte
- [x] T031 [US2] Update save logic to refresh preview after save in src/lib/components/TierSettings.svelte
- [x] T032 [US2] Add keyboard navigation support (Enter/Space to toggle) in src/lib/components/TierSettings.svelte
- [x] T033 [US2] Add ARIA attributes (aria-expanded, aria-controls) for accessibility in src/lib/components/TierSettings.svelte

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - tiers display with previews and can be expanded/collapsed to show configuration options

---

## Phase 5: User Story 3 - View Cards in Tier (Priority: P2)

**Goal**: Display list of cards assigned to a tier when the tier's collapsible is expanded. Handle empty tiers and large card lists (up to 500 cards).

**Independent Test**: Expand a tier and verify that the card list displays correctly, showing all cards assigned to that tier. Verify empty tier message and scrolling for large lists.

### Tests for User Story 3 (MANDATORY per constitution) ⚠️

- [ ] T034 [P] [US3] Unit test for card list display in collapsible in tests/unit/components/TierSettings.test.ts
- [ ] T035 [P] [US3] Unit test for empty tier message display in tests/unit/components/TierSettings.test.ts
- [ ] T036 [P] [US3] Unit test for card list scrolling with 500 cards in tests/unit/components/TierSettings.test.ts
- [ ] T037 [P] [US3] Integration test for card list performance with large datasets in tests/integration/tier-settings.test.ts

### Implementation for User Story 3

- [x] T038 [US3] Add card list section within collapsible in src/lib/components/TierSettings.svelte
- [x] T039 [US3] Implement card list rendering using tierService.getCardsInTier in src/lib/components/TierSettings.svelte
- [x] T040 [US3] Add empty tier message display in src/lib/components/TierSettings.svelte
- [x] T041 [US3] Add scrollable card list container styling in src/lib/components/TierSettings.svelte
- [x] T042 [US3] Add card item styling for readable card name display in src/lib/components/TierSettings.svelte
- [x] T043 [US3] Optimize card list rendering for performance (500 cards) in src/lib/components/TierSettings.svelte

**Checkpoint**: At this point, all user stories should now be independently functional - tiers display with previews, can be expanded to show config and cards

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and ensure quality standards

- [x] T044 [P] Update component documentation and JSDoc comments in src/lib/components/TierSettings.svelte
- [x] T045 [P] Verify label preview updates reactively when color scheme changes in src/lib/components/TierSettings.svelte
- [x] T046 [P] Add hover and focus states for tier entry buttons in src/lib/components/TierSettings.svelte
- [x] T047 [P] Verify keyboard navigation works for all interactive elements in src/lib/components/TierSettings.svelte
- [x] T048 [P] Add screen reader announcements for tier states in src/lib/components/TierSettings.svelte
- [x] T049 [P] Verify WCAG 2.1 Level AA compliance (color contrast, focus indicators) in src/lib/components/TierSettings.svelte
- [ ] T050 [P] Performance testing: Verify tier list renders within 500ms in tests/integration/tier-settings.test.ts
- [ ] T051 [P] Performance testing: Verify expand/collapse responds within 100ms in tests/integration/tier-settings.test.ts
- [ ] T052 [P] Performance testing: Verify label preview generation within 50ms per tier in tests/integration/tier-settings.test.ts
- [ ] T053 [P] Performance testing: Verify card list rendering (500 cards) within 1 second in tests/integration/tier-settings.test.ts
- [ ] T054 [P] E2E test: Full user workflow (open → view tiers → expand → edit → save) in tests/e2e/tier-settings.spec.ts
- [ ] T055 [P] E2E test: Keyboard navigation workflow in tests/e2e/tier-settings.spec.ts
- [ ] T056 [P] E2E test: Screen reader accessibility workflow in tests/e2e/tier-settings.spec.ts
- [ ] T057 [P] Code cleanup and refactoring in src/lib/components/TierSettings.svelte
- [ ] T058 [P] Additional unit tests to achieve ≥80% coverage in tests/unit/components/TierSettings.test.ts
- [x] T059 [P] Verify backward compatibility with tierId prop and onTierUpdated callback in src/lib/components/TierSettings.svelte
- [x] T060 [P] Update Create Custom Tier button placement above tier list in src/lib/components/TierSettings.svelte
- [ ] T061 [P] Run quickstart.md validation checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 (P1) can start after Foundational
  - User Story 2 (P1) can start after Foundational (can work in parallel with US1 after US1 tests pass)
  - User Story 3 (P2) depends on User Story 2 (needs collapsible to be implemented first)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Can work in parallel with US1 after US1 basic structure is in place, but needs US1 tier list rendering complete
- **User Story 3 (P2)**: Depends on User Story 2 - Needs collapsible structure to display card list within

### Within Each User Story

- Tests (MANDATORY) MUST be written and FAIL before implementation
- Component structure before styling
- Basic functionality before enhancements
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- All tests for a user story marked [P] can run in parallel
- User Stories 1 and 2 can be worked on in parallel after US1 basic structure is complete
- Polish tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit test for tier list rendering in tests/unit/components/TierSettings.test.ts"
Task: "Unit test for label preview generation in tests/unit/components/TierSettings.test.ts"
Task: "Unit test for disabled tier visual indication in tests/unit/components/TierSettings.test.ts"
Task: "Unit test for empty tier list message in tests/unit/components/TierSettings.test.ts"
```

---

## Parallel Example: User Story 2

```bash
# Launch all tests for User Story 2 together:
Task: "Unit test for expand/collapse toggle functionality in tests/unit/components/TierSettings.test.ts"
Task: "Unit test for multiple tiers expanded simultaneously in tests/unit/components/TierSettings.test.ts"
Task: "Unit test for configuration editor visibility when expanded in tests/unit/components/TierSettings.test.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (tier list with previews)
4. Complete Phase 4: User Story 2 (expand/collapse with config editor)
5. **STOP and VALIDATE**: Test User Stories 1 & 2 independently
6. Deploy/demo if ready

**MVP Scope**: Users can view all tiers at a glance and expand/collapse to edit configurations. Card list display (US3) can be added in next increment.

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (Basic MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (Full MVP!)
4. Add User Story 3 → Test independently → Deploy/Demo (Complete feature)
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (tier list rendering)
   - Developer B: User Story 2 (expand/collapse) - can start after US1 basic structure
3. Once US1 and US2 complete:
   - Developer C: User Story 3 (card list display)
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- This is a UI refactor - existing tier service, store, and models remain unchanged
- All configuration editing functionality is preserved, just accessed through new UI

