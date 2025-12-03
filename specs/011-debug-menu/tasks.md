# Tasks: Debug Menu

**Input**: Design documents from `/specs/011-debug-menu/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Per constitution Principle 2 (Testing Standards), all features MUST include corresponding tests. Test tasks are MANDATORY for critical business logic and user-facing features, with ≥80% coverage target. Tests MUST be written before implementation (TDD approach recommended).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 [P] Review existing modal patterns in src/routes/+page.svelte and src/lib/components/DataVersionOverlay.svelte
- [x] T002 [P] Review existing debug tools in src/lib/components/InventoryZone.svelte and src/lib/components/UpgradeShop.svelte
- [x] T003 [P] Review gameStateService methods (addChaos, addDecks, setCustomRarityPercentage, setLuckyDropLevel) in src/lib/services/gameStateService.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

**Note**: This feature uses existing services and patterns, so no new foundational infrastructure is required. Phase 2 is minimal but ensures understanding of existing patterns.

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Access Debug Menu (Priority: P1) 🎯 MVP

**Goal**: Create a debug menu component that can be opened and closed, providing a single entry point for all debug tools.

**Independent Test**: Can be fully tested by verifying the debug menu can be opened and closed, and that it appears in a consistent location. This delivers immediate value by providing a single entry point for all debug tools.

### Tests for User Story 1 (MANDATORY per constitution) ⚠️

> **NOTE: Per constitution Principle 2, tests MUST be written FIRST and ensure they FAIL before implementation. All critical paths require ≥80% coverage.**

- [x] T004 [P] [US1] Create unit test file tests/unit/components/DebugMenu.test.ts with tests for menu open/close state
- [x] T005 [P] [US1] Add unit test for F12 keyboard shortcut opening menu in tests/unit/components/DebugMenu.test.ts
- [x] T006 [P] [US1] Add unit test for Escape key closing menu in tests/unit/components/DebugMenu.test.ts
- [x] T007 [P] [US1] Add unit test for backdrop click closing menu in tests/unit/components/DebugMenu.test.ts
- [x] T008 [P] [US1] Add unit test for close button closing menu in tests/unit/components/DebugMenu.test.ts
- [x] T009 [P] [US1] Add unit test for focus management (focus trap and return) in tests/unit/components/DebugMenu.test.ts
- [x] T010 [P] [US1] Add E2E test for opening menu with F12 in tests/e2e/debug-menu.spec.ts
- [x] T011 [P] [US1] Add E2E test for closing menu with Escape in tests/e2e/debug-menu.spec.ts

### Implementation for User Story 1

- [x] T012 [US1] Create DebugMenu.svelte component skeleton in src/lib/components/DebugMenu.svelte with props interface (gameState)
- [x] T013 [US1] Add isOpen and isVisible state management to DebugMenu.svelte in src/lib/components/DebugMenu.svelte
- [x] T014 [US1] Implement open() function with focus management in src/lib/components/DebugMenu.svelte
- [x] T015 [US1] Implement close() function with focus return in src/lib/components/DebugMenu.svelte
- [x] T016 [US1] Add modal overlay structure (modal-overlay, modal-content, modal-header) to DebugMenu.svelte in src/lib/components/DebugMenu.svelte
- [x] T017 [US1] Add debug menu trigger button with visibility control (import.meta.env.DEV) in src/lib/components/DebugMenu.svelte
- [x] T018 [US1] Implement F12 keyboard shortcut handler in src/lib/components/DebugMenu.svelte
- [x] T019 [US1] Implement Escape key handler for closing menu in src/lib/components/DebugMenu.svelte
- [x] T020 [US1] Implement backdrop click handler (on:click|self) in src/lib/components/DebugMenu.svelte
- [x] T021 [US1] Add close button (×) in modal header in src/lib/components/DebugMenu.svelte
- [x] T022 [US1] Implement focus trap when menu is open in src/lib/components/DebugMenu.svelte
- [x] T023 [US1] Implement focus return to trigger button when menu closes in src/lib/components/DebugMenu.svelte
- [x] T024 [US1] Add ARIA attributes (role="dialog", aria-modal, aria-labelledby) to DebugMenu.svelte in src/lib/components/DebugMenu.svelte
- [x] T025 [US1] Add modal styling using existing .modal-overlay, .modal-content classes in src/lib/components/DebugMenu.svelte
- [x] T026 [US1] Set z-index to 2001 (above existing modals at 2000) in src/lib/components/DebugMenu.svelte
- [x] T027 [US1] Integrate DebugMenu component in src/routes/+page.svelte with gameState prop binding

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. The debug menu can be opened and closed, but contains no tools yet.

---

## Phase 4: User Story 2 - Consolidated Debug Tools (Priority: P1)

**Goal**: Move all existing debug tools (Add Chaos, Add Decks, Rarity slider, Lucky Drop slider, Debug mode toggle) into the debug menu and remove them from their original locations.

**Independent Test**: Can be fully tested by verifying each existing debug tool is present and functional within the debug menu. This delivers value by reducing cognitive load and improving developer experience.

### Tests for User Story 2 (MANDATORY per constitution) ⚠️

- [x] T028 [P] [US2] Add unit test for Add Chaos button in DebugMenu in tests/unit/components/DebugMenu.test.ts
- [x] T029 [P] [US2] Add unit test for Add Decks button in DebugMenu in tests/unit/components/DebugMenu.test.ts
- [x] T030 [P] [US2] Add unit test for Rarity slider in DebugMenu in tests/unit/components/DebugMenu.test.ts
- [x] T031 [P] [US2] Add unit test for Lucky Drop slider in DebugMenu in tests/unit/components/DebugMenu.test.ts
- [x] T032 [P] [US2] Add unit test for Debug Mode toggle in DebugMenu in tests/unit/components/DebugMenu.test.ts
- [x] T033 [P] [US2] Add integration test verifying Add Chaos functionality preservation in tests/integration/debugMenu.test.ts
- [x] T034 [P] [US2] Add integration test verifying Add Decks functionality preservation in tests/integration/debugMenu.test.ts
- [x] T035 [P] [US2] Add integration test verifying Rarity slider functionality preservation in tests/integration/debugMenu.test.ts
- [x] T036 [P] [US2] Add integration test verifying Lucky Drop slider functionality preservation in tests/integration/debugMenu.test.ts
- [x] T037 [P] [US2] Add integration test verifying Debug Mode toggle functionality preservation in tests/integration/debugMenu.test.ts
- [x] T038 [P] [US2] Add integration test verifying tools removed from InventoryZone in tests/integration/debugMenu.test.ts
- [x] T039 [P] [US2] Add integration test verifying tools removed from UpgradeShop in tests/integration/debugMenu.test.ts
- [x] T040 [P] [US2] Add E2E test for using Add Chaos tool from debug menu in tests/e2e/debug-menu.spec.ts
- [x] T041 [P] [US2] Add E2E test for using Rarity slider from debug menu in tests/e2e/debug-menu.spec.ts

### Implementation for User Story 2

#### Resources Section (Add Chaos, Add Decks)

- [x] T042 [US2] Extract handleAddChaos function from InventoryZone.svelte to DebugMenu.svelte in src/lib/components/DebugMenu.svelte
- [x] T043 [US2] Extract handleAddDecks function from InventoryZone.svelte to DebugMenu.svelte in src/lib/components/DebugMenu.svelte
- [x] T044 [US2] Add Resources section header in DebugMenu.svelte in src/lib/components/DebugMenu.svelte
- [x] T045 [US2] Add Add Chaos button in Resources section in src/lib/components/DebugMenu.svelte
- [x] T046 [US2] Add Add Decks button in Resources section in src/lib/components/DebugMenu.svelte
- [x] T047 [US2] Add error message display for Resources section tools in src/lib/components/DebugMenu.svelte
- [x] T048 [US2] Remove ADD_DECKS_POS constant from src/lib/components/InventoryZone.svelte
- [x] T049 [US2] Remove ADD_CHAOS_POS constant from src/lib/components/InventoryZone.svelte
- [x] T050 [US2] Remove isAddDecksCell function from src/lib/components/InventoryZone.svelte
- [x] T051 [US2] Remove isAddChaosCell function from src/lib/components/InventoryZone.svelte
- [x] T052 [US2] Remove handleAddDecks function from src/lib/components/InventoryZone.svelte
- [x] T053 [US2] Remove handleAddChaos function from src/lib/components/InventoryZone.svelte
- [x] T054 [US2] Remove Add Decks button grid cell from InventoryZone template in src/lib/components/InventoryZone.svelte
- [x] T055 [US2] Remove Add Chaos button grid cell from InventoryZone template in src/lib/components/InventoryZone.svelte

#### Upgrades Section (Rarity Slider, Lucky Drop Slider)

- [x] T056 [US2] Extract raritySliderValue state from UpgradeShop.svelte to DebugMenu.svelte in src/lib/components/DebugMenu.svelte
- [x] T057 [US2] Extract isDraggingRaritySlider state from UpgradeShop.svelte to DebugMenu.svelte in src/lib/components/DebugMenu.svelte
- [x] T058 [US2] Extract luckyDropSliderValue state from UpgradeShop.svelte to DebugMenu.svelte in src/lib/components/DebugMenu.svelte
- [x] T059 [US2] Extract isDraggingLuckyDropSlider state from UpgradeShop.svelte to DebugMenu.svelte in src/lib/components/DebugMenu.svelte
- [x] T060 [US2] Extract handleRaritySliderChange function from UpgradeShop.svelte to DebugMenu.svelte in src/lib/components/DebugMenu.svelte
- [x] T061 [US2] Extract handleRaritySliderInput function from UpgradeShop.svelte to DebugMenu.svelte in src/lib/components/DebugMenu.svelte
- [x] T062 [US2] Extract handleLuckyDropSliderChange function from UpgradeShop.svelte to DebugMenu.svelte in src/lib/components/DebugMenu.svelte
- [x] T063 [US2] Extract handleLuckyDropSliderInput function from UpgradeShop.svelte to DebugMenu.svelte in src/lib/components/DebugMenu.svelte
- [x] T064 [US2] Add reactive statements for currentRarityPercentage and currentLuckyDropLevel in src/lib/components/DebugMenu.svelte
- [x] T065 [US2] Add Upgrades section header in DebugMenu.svelte in src/lib/components/DebugMenu.svelte
- [x] T066 [US2] Add Rarity slider UI (label, input range, percentage display) in Upgrades section in src/lib/components/DebugMenu.svelte
- [x] T067 [US2] Add Lucky Drop slider UI (label, input range, level display) in Upgrades section in src/lib/components/DebugMenu.svelte
- [x] T068 [US2] Add error message display for Upgrades section tools in src/lib/components/DebugMenu.svelte
- [x] T069 [US2] Remove showRaritySlider reactive statement from src/lib/components/UpgradeShop.svelte
- [x] T070 [US2] Remove showLuckyDropSlider reactive statement from src/lib/components/UpgradeShop.svelte
- [x] T071 [US2] Remove rarity slider section UI from UpgradeShop template in src/lib/components/UpgradeShop.svelte
- [x] T072 [US2] Remove lucky drop slider section UI from UpgradeShop template in src/lib/components/UpgradeShop.svelte

#### Settings Section (Debug Mode Toggle)

- [x] T073 [US2] Extract debugModeEnabled state from UpgradeShop.svelte to DebugMenu.svelte in src/lib/components/DebugMenu.svelte
- [x] T074 [US2] Extract toggleDebugMode function from UpgradeShop.svelte to DebugMenu.svelte in src/lib/components/DebugMenu.svelte
- [x] T075 [US2] Add Settings section header in DebugMenu.svelte in src/lib/components/DebugMenu.svelte
- [x] T076 [US2] Add Debug Mode toggle button in Settings section in src/lib/components/DebugMenu.svelte
- [x] T077 [US2] Add visual indicator for debug mode state (ON/OFF) in src/lib/components/DebugMenu.svelte
- [x] T078 [US2] Remove debug mode toggle button from UpgradeShop template in src/lib/components/UpgradeShop.svelte
- [x] T079 [US2] Remove debug-badge spans from UpgradeShop template in src/lib/components/UpgradeShop.svelte

#### Cleanup and Styling

- [x] T080 [US2] Add styling for Resources section in src/lib/components/DebugMenu.svelte
- [x] T081 [US2] Add styling for Upgrades section in src/lib/components/DebugMenu.svelte
- [x] T082 [US2] Add styling for Settings section in src/lib/components/DebugMenu.svelte
- [x] T083 [US2] Add section separators and spacing in DebugMenu.svelte in src/lib/components/DebugMenu.svelte
- [x] T084 [US2] Verify no visual artifacts remain in InventoryZone after removal in src/lib/components/InventoryZone.svelte
- [x] T085 [US2] Verify no visual artifacts remain in UpgradeShop after removal in src/lib/components/UpgradeShop.svelte

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. All debug tools are consolidated in the debug menu and removed from original locations.

---

## Phase 5: User Story 3 - Debug Menu Visibility Control (Priority: P2)

**Goal**: Control debug menu visibility based on environment (development vs production) so production users don't see debugging tools.

**Independent Test**: Can be fully tested by verifying the menu visibility can be controlled based on environment or user preference. This delivers value by maintaining a clean production interface.

### Tests for User Story 3 (MANDATORY per constitution) ⚠️

- [x] T086 [P] [US3] Add unit test for menu visibility in development mode in tests/unit/components/DebugMenu.test.ts
- [x] T087 [P] [US3] Add unit test for menu visibility in production mode in tests/unit/components/DebugMenu.test.ts
- [x] T088 [P] [US3] Add unit test for localStorage flag enabling menu in production in tests/unit/components/DebugMenu.test.ts
- [x] T089 [P] [US3] Add E2E test for menu visibility in development mode in tests/e2e/debug-menu.spec.ts
- [x] T090 [P] [US3] Add E2E test for menu not visible in production mode in tests/e2e/debug-menu.spec.ts

### Implementation for User Story 3

- [x] T091 [US3] Update isVisible logic to check import.meta.env.DEV in src/lib/components/DebugMenu.svelte
- [x] T092 [US3] Add optional localStorage check for debugMenuEnabled flag in src/lib/components/DebugMenu.svelte
- [x] T093 [US3] Add conditional rendering for trigger button based on isVisible in src/lib/components/DebugMenu.svelte
- [x] T094 [US3] Ensure menu cannot be opened if isVisible is false (defensive check) in src/lib/components/DebugMenu.svelte
- [x] T095 [US3] Add visual indicator when debug mode is enabled via localStorage in src/lib/components/DebugMenu.svelte

**Checkpoint**: All user stories should now be independently functional. Debug menu visibility is properly controlled.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T096 [P] Add keyboard navigation tests (Tab, Arrow keys) for all tools in tests/unit/components/DebugMenu.test.ts
- [x] T097 [P] Add responsive design tests (small screen behavior) in tests/e2e/debug-menu.spec.ts
- [x] T098 [P] Add test for multiple rapid interactions with debug tools in tests/integration/debugMenu.test.ts
- [x] T099 [P] Add test for menu opening while another modal is active in tests/e2e/debug-menu.spec.ts
- [x] T100 [P] Verify WCAG 2.1 Level AA compliance (color contrast, ARIA labels) in src/lib/components/DebugMenu.svelte
- [x] T101 [P] Add loading states for debug tool actions (>100ms operations) in src/lib/components/DebugMenu.svelte
- [x] T102 [P] Add visual feedback for active/enabled tools in src/lib/components/DebugMenu.svelte
- [x] T103 [P] Performance testing: Verify menu opens/closes within 200ms in tests/performance/debugMenu.test.ts
- [x] T104 [P] Performance testing: Verify tool interactions respond within 100ms in tests/performance/debugMenu.test.ts
- [x] T105 [P] Performance testing: Verify no frame rate drops when menu is open in tests/performance/debugMenu.test.ts
- [x] T106 [P] Memory testing: Verify menu memory usage <5MB when open in tests/performance/debugMenu.test.ts
- [x] T107 [P] Code cleanup: Remove unused imports and variables from modified files
- [x] T108 [P] Documentation: Update quickstart.md with any implementation notes in specs/011-debug-menu/quickstart.md
- [ ] T109 [P] Run all tests and verify ≥80% coverage for critical paths
- [x] T110 [P] Accessibility audit: Screen reader testing and keyboard navigation verification
- [x] T111 [P] UX consistency review: Verify debug menu matches existing modal patterns

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - Minimal for this feature (just understanding existing patterns)
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 (P1): Can start after Foundational - No dependencies on other stories
  - User Story 2 (P1): Depends on User Story 1 completion (menu must exist before adding tools)
  - User Story 3 (P2): Depends on User Story 1 completion (menu must exist before controlling visibility)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Depends on User Story 1 - Menu component must exist before adding tools
- **User Story 3 (P2)**: Depends on User Story 1 - Menu component must exist before controlling visibility

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Component structure before tool implementation
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All test tasks for a user story marked [P] can run in parallel
- Different sections of User Story 2 (Resources, Upgrades, Settings) can be worked on in parallel after menu structure exists
- All Polish tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Create unit test file tests/unit/components/DebugMenu.test.ts with tests for menu open/close state"
Task: "Add unit test for F12 keyboard shortcut opening menu in tests/unit/components/DebugMenu.test.ts"
Task: "Add unit test for Escape key closing menu in tests/unit/components/DebugMenu.test.ts"
Task: "Add unit test for backdrop click closing menu in tests/unit/components/DebugMenu.test.ts"
Task: "Add unit test for close button closing menu in tests/unit/components/DebugMenu.test.ts"
Task: "Add unit test for focus management (focus trap and return) in tests/unit/components/DebugMenu.test.ts"
Task: "Add E2E test for opening menu with F12 in tests/e2e/debug-menu.spec.ts"
Task: "Add E2E test for closing menu with Escape in tests/e2e/debug-menu.spec.ts"
```

---

## Parallel Example: User Story 2

```bash
# After menu structure exists, work on different sections in parallel:
# Resources Section:
Task: "Extract handleAddChaos function from InventoryZone.svelte to DebugMenu.svelte"
Task: "Extract handleAddDecks function from InventoryZone.svelte to DebugMenu.svelte"

# Upgrades Section:
Task: "Extract raritySliderValue state from UpgradeShop.svelte to DebugMenu.svelte"
Task: "Extract luckyDropSliderValue state from UpgradeShop.svelte to DebugMenu.svelte"

# Settings Section:
Task: "Extract debugModeEnabled state from UpgradeShop.svelte to DebugMenu.svelte"
Task: "Extract toggleDebugMode function from UpgradeShop.svelte to DebugMenu.svelte"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (review existing patterns)
2. Complete Phase 2: Foundational (minimal - understand existing patterns)
3. Complete Phase 3: User Story 1 (debug menu opens/closes)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP - menu opens/closes)
3. Add User Story 2 → Test independently → Deploy/Demo (Full functionality - all tools consolidated)
4. Add User Story 3 → Test independently → Deploy/Demo (Production-ready visibility control)
5. Add Polish → Final validation → Deploy

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (menu structure)
   - Developer B: Prepare test infrastructure
3. Once User Story 1 is done:
   - Developer A: User Story 2 Resources section
   - Developer B: User Story 2 Upgrades section
   - Developer C: User Story 2 Settings section
4. Once User Story 2 is done:
   - Developer A: User Story 3
   - Developer B: Polish tasks
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
- User Story 2 depends on User Story 1 (menu must exist before adding tools)
- User Story 3 depends on User Story 1 (menu must exist before controlling visibility)


