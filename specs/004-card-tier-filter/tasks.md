---
description: "Task list for Card Tier Filter System feature implementation"
---

# Tasks: Card Tier Filter System

**Input**: Design documents from `/specs/004-card-tier-filter/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Per constitution Principle 2 (Testing Standards), all features MUST include corresponding tests. Test tasks are MANDATORY for critical business logic and user-facing features, with ≥80% coverage target. Tests MUST be written before implementation (TDD approach recommended).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths shown below assume single SvelteKit project structure

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create Tier model interfaces in src/lib/models/Tier.ts
- [x] T002 [P] Create color validation utilities in src/lib/utils/colorValidation.ts
- [x] T003 [P] Create tier assignment utilities in src/lib/utils/tierAssignment.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create TierStorageService in src/lib/services/tierStorageService.ts
- [x] T005 Create TierService in src/lib/services/tierService.ts
- [x] T006 Create tierStore reactive store in src/lib/stores/tierStore.ts
- [ ] T007 [P] Write unit tests for tierAssignment utilities in tests/unit/utils/tierAssignment.test.ts
- [ ] T008 [P] Write unit tests for colorValidation utilities in tests/unit/utils/colorValidation.test.ts
- [ ] T009 [P] Write unit tests for TierStorageService in tests/unit/services/tierStorageService.test.ts
- [ ] T010 Write unit tests for TierService in tests/unit/services/tierService.test.ts (≥80% coverage)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Default Tier System with Card Assignments (Priority: P1) 🎯 MVP

**Goal**: Implement default tier system (S, A, B, C, D, E, F) with automatic card assignments. When cards are dropped, they display with tier color schemes and play tier sounds based on default assignments.

**Independent Test**: Open the application, drop cards, and verify that cards display with tier-appropriate colors and sounds based on their default tier assignments. All cards should be assigned to one of the default tiers (S, A, B, C, D, E, F).

### Tests for User Story 1 (MANDATORY per constitution) ⚠️

> **NOTE: Per constitution Principle 2, tests MUST be written FIRST and ensure they FAIL before implementation. All critical paths require ≥80% coverage.**

- [ ] T011 [P] [US1] Write integration test for tier system initialization in tests/integration/tierSystemInitialization.test.ts
- [ ] T012 [P] [US1] Write integration test for default card assignment logic in tests/integration/defaultCardAssignment.test.ts
- [ ] T013 [P] [US1] Write E2E test for card drop with tier colors and sounds in tests/e2e/card-drop-tier-display.spec.ts

### Implementation for User Story 1

- [x] T014 [US1] Initialize tier system in gameStateService.initialize() in src/lib/services/gameStateService.ts (call tierService.initialize after card pool loads)
- [x] T015 [US1] Extend AudioManager with playTierSound method in src/lib/audio/audioManager.ts
- [x] T016 [US1] Update LastCardZone component to apply tier color scheme to card label in src/lib/components/LastCardZone.svelte
- [x] T017 [US1] Update card drop flow in src/routes/+page.svelte to use tier system (check shouldDisplayCard, play tier sound, apply tier colors)
- [x] T018 [US1] Add tier system initialization to app startup in src/routes/+layout.ts or +page.svelte
- [x] T019 [US1] Add error handling for tier lookup failures with qualityTier fallback

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Cards should display with tier colors and play tier sounds when dropped.

---

## Phase 4: User Story 2 - Customize Tier Properties (Priority: P2)

**Goal**: Allow users to customize tier drop sounds and color schemes. When cards from a customized tier are dropped, they use the customized properties.

**Independent Test**: Open tier settings, modify a tier's sound or color, drop a card from that tier, and verify the customized properties are applied.

### Tests for User Story 2 (MANDATORY per constitution) ⚠️

- [ ] T020 [P] [US2] Write unit test for tier configuration updates in tests/unit/services/tierService.test.ts (updateTierConfiguration method)
- [ ] T021 [P] [US2] Write integration test for tier property customization in tests/integration/tierCustomization.test.ts
- [ ] T022 [P] [US2] Write E2E test for tier settings UI in tests/e2e/tier-settings.spec.ts

### Implementation for User Story 2

- [x] T023 [US2] Create TierSettings component in src/lib/components/TierSettings.svelte
- [x] T024 [US2] Add color scheme picker/editor to TierSettings component
- [x] T025 [US2] Add sound file picker to TierSettings component
- [x] T026 [US2] Implement color scheme validation in TierSettings (real-time validation with error messages)
- [x] T027 [US2] Add save/apply functionality to TierSettings component
- [x] T028 [US2] Add visual preview of color scheme in TierSettings component
- [x] T029 [US2] Integrate TierSettings component into application (add route or modal)
- [x] T030 [US2] Add keyboard navigation support to TierSettings (UX-003)
- [x] T031 [US2] Add ARIA labels and screen reader support to TierSettings (UX-004)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Users can customize tier properties and see changes applied to dropped cards.

---

## Phase 5: User Story 3 - Move Cards Between Tiers (Priority: P2)

**Goal**: Allow users to move cards from one tier to another. Cards immediately use the new tier's properties when dropped.

**Independent Test**: Select a card, move it from one tier to another, drop the card, and verify it uses the new tier's properties.

### Tests for User Story 3 (MANDATORY per constitution) ⚠️

- [ ] T032 [P] [US3] Write unit test for moveCardToTier method in tests/unit/services/tierService.test.ts
- [ ] T033 [P] [US3] Write unit test for moveCardsToTier method in tests/unit/services/tierService.test.ts
- [ ] T034 [P] [US3] Write integration test for card movement between tiers in tests/integration/cardTierAssignment.test.ts
- [ ] T035 [P] [US3] Write E2E test for card movement UI in tests/e2e/card-movement.spec.ts

### Implementation for User Story 3

- [x] T036 [US3] Create TierManagement component in src/lib/components/TierManagement.svelte
- [x] T037 [US3] Add card list display organized by tier in TierManagement component
- [ ] T038 [US3] Add drag-and-drop functionality for moving cards between tiers in TierManagement component (optional enhancement)
- [x] T039 [US3] Add selection-based card movement (select cards, choose target tier) in TierManagement component
- [x] T040 [US3] Add visual feedback when cards are moved (UX-012) in TierManagement component
- [x] T041 [US3] Add search/filter functionality for large card lists in TierManagement component
- [x] T042 [US3] Integrate TierManagement component into application (add route or modal)
- [x] T043 [US3] Add keyboard navigation support to TierManagement (UX-003)
- [x] T044 [US3] Add ARIA labels and screen reader support to TierManagement (UX-004)
- [x] T045 [US3] Update tierStore to reactively reflect card assignment changes

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently. Users can move cards between tiers and see immediate property updates.

---

## Phase 6: User Story 4 - Enable/Disable Tier Display (Priority: P3)

**Goal**: Allow users to enable/disable tiers for display filtering. Cards from disabled tiers are not displayed when dropped, but are still processed in the background.

**Independent Test**: Disable a tier, drop cards from that tier, verify they are not displayed, then re-enable the tier and verify cards are displayed again.

### Tests for User Story 4 (MANDATORY per constitution) ⚠️

- [ ] T046 [P] [US4] Write unit test for setTierEnabled method in tests/unit/services/tierService.test.ts
- [ ] T047 [P] [US4] Write unit test for shouldDisplayCard method in tests/unit/services/tierService.test.ts
- [ ] T048 [P] [US4] Write integration test for tier enable/disable functionality in tests/integration/tierEnableDisable.test.ts
- [ ] T049 [P] [US4] Write E2E test for tier enable/disable UI in tests/e2e/tier-enable-disable.spec.ts

### Implementation for User Story 4

- [x] T050 [US4] Add tier enable/disable toggle to TierSettings component in src/lib/components/TierSettings.svelte
- [x] T051 [US4] Add visual indicator for disabled tiers in TierSettings component (UX-014)
- [x] T052 [US4] Update card drop flow to check shouldDisplayCard before displaying in src/routes/+page.svelte
- [x] T053 [US4] Ensure disabled tier cards are still processed (score, collection) but not displayed
- [x] T054 [US4] Add keyboard navigation for enable/disable toggles (UX-003)
- [x] T055 [US4] Add visual feedback when tier is disabled/enabled (UX-014)

**Checkpoint**: At this point, User Stories 1-4 should all work independently. Users can filter card display by enabling/disabling tiers.

---

## Phase 7: User Story 5 - Create Custom Tiers (Priority: P3)

**Goal**: Allow users to create custom tiers beyond the default S-A-B-C-D-E-F tiers. Custom tiers function identically to default tiers with full customization capabilities.

**Independent Test**: Create a custom tier, configure its properties, assign cards to it, and verify cards from the custom tier display with the tier's properties when dropped.

### Tests for User Story 5 (MANDATORY per constitution) ⚠️

- [ ] T056 [P] [US5] Write unit test for createCustomTier method in tests/unit/services/tierService.test.ts
- [ ] T057 [P] [US5] Write unit test for deleteCustomTier method in tests/unit/services/tierService.test.ts
- [ ] T058 [P] [US5] Write unit test for tier name validation in tests/unit/utils/tierNameValidation.test.ts
- [ ] T059 [P] [US5] Write integration test for custom tier creation and management in tests/integration/customTierManagement.test.ts
- [ ] T060 [P] [US5] Write E2E test for custom tier creation UI in tests/e2e/custom-tier-creation.spec.ts

### Implementation for User Story 5

- [x] T061 [US5] Add create custom tier functionality to TierSettings component in src/lib/components/TierSettings.svelte
- [x] T062 [US5] Add tier name validation (unique, 1-50 chars, no reserved names) to TierSettings component
- [x] T063 [US5] Add delete custom tier functionality to TierSettings component (only if no cards assigned)
- [x] T064 [US5] Ensure custom tiers appear after default tiers in tier list (order 7+)
- [x] T065 [US5] Add custom tier configuration UI (same as default tiers) in TierSettings component
- [x] T066 [US5] Update TierManagement component to show custom tiers in tier list
- [x] T067 [US5] Add visual distinction between default and custom tiers in UI
- [x] T068 [US5] Add error handling for duplicate tier names with user-friendly messages (UX-015)
- [x] T069 [US5] Add keyboard navigation for custom tier creation (UX-003)

**Checkpoint**: All user stories should now be independently functional. Users can create custom tiers and manage the complete tier system.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T070 [P] Add performance tests for tier operations (initialization <2s, lookup <50ms) in tests/performance/tierPerformance.test.ts
- [ ] T071 [P] Add accessibility testing (WCAG 2.1 AA compliance) for all tier UI components
- [ ] T072 [P] Add visual regression tests for tier color schemes in tests/e2e/tier-visual-regression.spec.ts
- [ ] T073 [P] Add error handling tests for invalid sound files and color configurations in tests/unit/services/tierService.test.ts
- [ ] T074 [P] Add edge case tests (empty tiers, duplicate names, all tiers disabled) in tests/integration/tierEdgeCases.test.ts
- [ ] T075 [P] Code cleanup and refactoring across tier system components
- [ ] T076 [P] Documentation updates (JSDoc comments for all public methods)
- [ ] T077 [P] Additional unit tests to achieve ≥80% coverage in tests/unit/
- [ ] T078 [P] Run quickstart.md validation to ensure implementation matches guide
- [ ] T079 [P] Performance optimization (ensure tier operations meet benchmarks)
- [ ] T080 [P] UX consistency review (verify all components follow design system patterns)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 for tier system foundation
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 for tier system foundation
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - Depends on US1 for tier system foundation
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Depends on US1 for tier system foundation, may integrate with US2/US3

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002, T003)
- All Foundational test tasks marked [P] can run in parallel (T007, T008, T009)
- Once Foundational phase completes, user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members (after US1 is complete)

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Write integration test for tier system initialization in tests/integration/tierSystemInitialization.test.ts"
Task: "Write integration test for default card assignment logic in tests/integration/defaultCardAssignment.test.ts"
Task: "Write E2E test for card drop with tier colors and sounds in tests/e2e/card-drop-tier-display.spec.ts"

# After tests are written, launch implementation tasks:
Task: "Initialize tier system in gameStateService.initialize() in src/lib/services/gameStateService.ts"
Task: "Extend AudioManager with playTierSound method in src/lib/audio/audioManager.ts"
Task: "Update LastCardZone component to apply tier color scheme to card label in src/lib/components/LastCardZone.svelte"
```

---

## Parallel Example: User Story 2

```bash
# Launch all tests for User Story 2 together:
Task: "Write unit test for tier configuration updates in tests/unit/services/tierService.test.ts"
Task: "Write integration test for tier property customization in tests/integration/tierCustomization.test.ts"
Task: "Write E2E test for tier settings UI in tests/e2e/tier-settings.spec.ts"

# After tests, implementation can proceed:
Task: "Create TierSettings component in src/lib/components/TierSettings.svelte"
# (Other implementation tasks follow sequentially within US2)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

**MVP delivers**: Default tier system with automatic card assignments, tier colors and sounds on card drop

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (Customization)
4. Add User Story 3 → Test independently → Deploy/Demo (Card Movement)
5. Add User Story 4 → Test independently → Deploy/Demo (Filtering)
6. Add User Story 5 → Test independently → Deploy/Demo (Custom Tiers)
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (MVP - highest priority)
   - Developer B: Can start User Story 2 after US1 is complete
   - Developer C: Can start User Story 3 after US1 is complete
3. Stories complete and integrate independently
4. User Stories 4 and 5 can proceed in parallel after US1-3 are complete

---

## Task Summary

- **Total Tasks**: 80
- **Setup Phase**: 3 tasks
- **Foundational Phase**: 7 tasks
- **User Story 1 (P1)**: 9 tasks (3 tests + 6 implementation)
- **User Story 2 (P2)**: 11 tasks (3 tests + 8 implementation)
- **User Story 3 (P2)**: 14 tasks (4 tests + 10 implementation)
- **User Story 4 (P3)**: 10 tasks (4 tests + 6 implementation)
- **User Story 5 (P3)**: 14 tasks (5 tests + 9 implementation)
- **Polish Phase**: 11 tasks

### Parallel Opportunities

- **Setup**: 2 tasks can run in parallel (T002, T003)
- **Foundational**: 3 test tasks can run in parallel (T007, T008, T009)
- **User Stories**: After US1 is complete, US2-5 can proceed in parallel (with coordination)
- **Tests**: All test tasks within a user story can run in parallel

### Independent Test Criteria

- **US1**: Open app, drop cards, verify tier colors and sounds applied
- **US2**: Modify tier properties, drop card, verify customized properties applied
- **US3**: Move card between tiers, drop card, verify new tier properties applied
- **US4**: Disable tier, drop cards, verify not displayed; re-enable, verify displayed
- **US5**: Create custom tier, configure, assign cards, drop cards, verify custom tier properties applied

### Suggested MVP Scope

**MVP = User Story 1 only** (Phases 1-3):
- Default tier system with automatic assignments
- Tier colors and sounds on card drop
- No user customization required
- Delivers immediate value with minimal complexity

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All tasks include exact file paths for clarity
- Test tasks are MANDATORY per constitution Principle 2 (Testing Standards)

