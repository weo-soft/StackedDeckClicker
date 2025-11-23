# Tasks: Card Label Click to View Details

**Input**: Design documents from `/specs/006-card-details-click/`
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

**Purpose**: Project initialization and basic structure

- [x] T001 Verify existing project structure and dependencies in package.json
- [x] T002 [P] Review existing canvas rendering system in src/lib/canvas/
- [x] T003 [P] Review existing LastCardZone component in src/lib/components/LastCardZone.svelte

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create TypeScript interfaces for click detection in src/lib/models/ (LabelClickEvent, LabelHitTestResult, ClickedCardState, HoverState)
- [x] T005 [P] Review existing CardAnimation interface in src/lib/canvas/cardAnimation.ts to understand label position properties

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Click Card Label to View Details (Priority: P1) 🎯 MVP

**Goal**: Enable users to click on card labels in the yellow zone to display that card's full details in the purple zone, replacing the currently shown card.

**Independent Test**: Drop a card in the yellow zone, click its label, and verify that the purple zone displays that card's complete details (artwork, name, rewards, flavour text, weight, value).

### Tests for User Story 1 (MANDATORY per constitution) ⚠️

> **NOTE: Per constitution Principle 2, tests MUST be written FIRST and ensure they FAIL before implementation. All critical paths require ≥80% coverage.**

- [x] T006 [P] [US1] Unit test for Scene.getCardAtLabelPosition() with single label in tests/unit/canvas/scene.test.ts
- [x] T007 [P] [US1] Unit test for Scene.getCardAtLabelPosition() with overlapping labels in tests/unit/canvas/scene.test.ts
- [x] T008 [P] [US1] Unit test for Scene.getCardAtLabelPosition() with empty cards array in tests/unit/canvas/scene.test.ts
- [x] T009 [P] [US1] Unit test for CanvasService.handleClick() in tests/unit/canvas/renderer.test.ts
- [x] T010 [P] [US1] Integration test for click event flow (GameCanvas → GameAreaLayout → LastCardZone) in tests/integration/cardLabelClick.test.ts
- [x] T011 [P] [US1] E2E test for clicking card label and verifying purple zone update in tests/e2e/card-label-click.spec.ts

### Implementation for User Story 1

- [x] T012 [US1] Implement Scene.getCardAtLabelPosition(x, y) method in src/lib/canvas/scene.ts
- [x] T013 [US1] Implement CanvasService.handleClick(x, y, event) method in src/lib/canvas/renderer.ts
- [x] T014 [US1] Add click event handler to GameCanvas component in src/lib/components/GameCanvas.svelte
- [x] T015 [US1] Add 'cardLabelClick' event dispatch in GameCanvas component in src/lib/components/GameCanvas.svelte
- [x] T016 [US1] Add convertAnimationToCardDraw() helper function in GameCanvas component in src/lib/components/GameCanvas.svelte
- [x] T017 [US1] Add clickedCard state management in GameAreaLayout component in src/lib/components/GameAreaLayout.svelte
- [x] T018 [US1] Add handleCardLabelClick() event handler in GameAreaLayout component in src/lib/components/GameAreaLayout.svelte
- [x] T019 [US1] Extend LastCardZone component to accept clickedCard prop in src/lib/components/LastCardZone.svelte
- [x] T020 [US1] Update LastCardZone reactive statement to use clickedCard when available in src/lib/components/LastCardZone.svelte
- [x] T021 [US1] Pass clickedCard prop from GameAreaLayout to LastCardZone in src/lib/components/GameAreaLayout.svelte

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Users can click card labels and see details in purple zone.

---

## Phase 4: User Story 2 - Visual Feedback for Clickable Labels (Priority: P2)

**Goal**: Provide visual feedback (cursor changes, hover effects) to indicate that card labels are clickable, improving discoverability and user experience.

**Independent Test**: Hover over card labels and verify visual feedback (cursor changes to pointer, hover effect appears on label). Click a label and verify immediate visual feedback confirms the interaction.

### Tests for User Story 2 (MANDATORY per constitution) ⚠️

- [x] T022 [P] [US2] Unit test for Scene.setHoveredCard() and getHoveredCard() in tests/unit/canvas/scene.test.ts
- [x] T023 [P] [US2] Unit test for CanvasService.handleMouseMove() with debouncing in tests/unit/canvas/renderer.test.ts
- [x] T024 [P] [US2] Unit test for CanvasService.handleMouseLeave() in tests/unit/canvas/renderer.test.ts
- [x] T025 [P] [US2] Unit test for drawCardLabel() with hover state in tests/unit/canvas/cardAnimation.test.ts
- [x] T026 [P] [US2] Integration test for hover detection flow in tests/integration/cardLabelHover.test.ts
- [x] T027 [P] [US2] E2E test for hover visual feedback in tests/e2e/card-label-hover.spec.ts

### Implementation for User Story 2

- [x] T028 [US2] Add hoveredCard property to Scene class in src/lib/canvas/scene.ts
- [x] T029 [US2] Implement Scene.setHoveredCard() method in src/lib/canvas/scene.ts
- [x] T030 [US2] Implement Scene.getHoveredCard() method in src/lib/canvas/scene.ts
- [x] T031 [US2] Add hover state properties to CanvasService in src/lib/canvas/renderer.ts
- [x] T032 [US2] Implement CanvasService.handleMouseMove() with debouncing (50ms) in src/lib/canvas/renderer.ts
- [x] T033 [US2] Implement CanvasService.handleMouseLeave() in src/lib/canvas/renderer.ts
- [x] T034 [US2] Add updateCursorStyle() private method to CanvasService in src/lib/canvas/renderer.ts
- [x] T035 [US2] Add mousemove event handler to GameCanvas component in src/lib/components/GameCanvas.svelte
- [x] T036 [US2] Add mouseleave event handler to GameCanvas component in src/lib/components/GameCanvas.svelte
- [x] T037 [US2] Update drawCardLabel() to accept isHovered parameter in src/lib/canvas/cardAnimation.ts
- [x] T038 [US2] Add hover visual effects (lighten background, add border) in drawCardLabel() in src/lib/canvas/cardAnimation.ts
- [x] T039 [US2] Add lightenColor() helper function in src/lib/canvas/cardAnimation.ts
- [x] T040 [US2] Update Scene.render() to pass hover state to drawCardLabel() in src/lib/canvas/scene.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Users can click labels (US1) and see hover feedback (US2).

---

## Phase 5: User Story 3 - Handling Edge Cases and Multiple Cards (Priority: P3)

**Goal**: Ensure robust handling of edge cases including overlapping labels, rapid clicks, fading cards, and empty states, maintaining accurate card identification and display.

**Independent Test**: Create scenarios with overlapping labels, rapid clicking, and disappearing cards, verifying that the correct card details are always displayed and no errors occur.

### Tests for User Story 3 (MANDATORY per constitution) ⚠️

- [x] T041 [P] [US3] Unit test for overlapping labels hit testing (topmost selected) in tests/unit/canvas/scene.test.ts
- [x] T042 [P] [US3] Unit test for rapid successive clicks handling in tests/unit/canvas/renderer.test.ts
- [x] T043 [P] [US3] Unit test for clicking fading card (labelAlpha > 0) in tests/unit/canvas/scene.test.ts
- [x] T044 [P] [US3] Unit test for clicking empty space (no label hit) in tests/unit/canvas/scene.test.ts
- [x] T045 [P] [US3] Unit test for invalid coordinates handling in tests/unit/canvas/scene.test.ts
- [x] T046 [P] [US3] Integration test for card removed during click processing in tests/integration/cardLabelClick.test.ts
- [x] T047 [P] [US3] E2E test for overlapping labels scenario in tests/e2e/card-label-click.spec.ts
- [x] T048 [P] [US3] E2E test for rapid clicks scenario in tests/e2e/card-label-click.spec.ts

### Implementation for User Story 3

- [x] T049 [US3] Add validation for click coordinates in CanvasService.handleClick() in src/lib/canvas/renderer.ts
- [x] T050 [US3] Add validation for card existence before processing click in Scene.getCardAtLabelPosition() in src/lib/canvas/scene.ts
- [x] T051 [US3] Ensure iteration order is correct (reverse, newest first) for topmost label selection in Scene.getCardAtLabelPosition() in src/lib/canvas/scene.ts
- [x] T052 [US3] Add handling for cards with labelAlpha <= 0 (skip faded cards) in Scene.getCardAtLabelPosition() in src/lib/canvas/scene.ts
- [x] T053 [US3] Add error handling for invalid CardDrawResult in LastCardZone component in src/lib/components/LastCardZone.svelte
- [x] T054 [US3] Add handling for clicked card persistence when card object is removed in GameAreaLayout component in src/lib/components/GameAreaLayout.svelte
- [x] T055 [US3] Add validation for empty cards array in Scene.getCardAtLabelPosition() in src/lib/canvas/scene.ts
- [x] T056 [US3] Add logging for edge case scenarios (invalid coordinates, empty array, etc.) in src/lib/canvas/scene.ts

**Checkpoint**: All user stories should now be independently functional. Feature handles all edge cases robustly.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T057 [P] Add keyboard accessibility (Tab navigation, Enter/Space activation) to GameCanvas component in src/lib/components/GameCanvas.svelte
- [x] T058 [P] Add ARIA labels and roles for clickable labels in GameCanvas component in src/lib/components/GameCanvas.svelte
- [x] T059 [P] Add screen reader announcements for card label clicks in GameCanvas component in src/lib/components/GameCanvas.svelte
- [x] T060 [P] Performance testing for click detection (<50ms requirement) in tests/performance/clickDetection.test.ts
- [x] T061 [P] Performance testing for purple zone update (<200ms requirement) in tests/performance/purpleZoneUpdate.test.ts
- [x] T062 [P] Performance testing for hover feedback (<50ms requirement) in tests/performance/hoverFeedback.test.ts
- [x] T063 [P] Accessibility testing (WCAG 2.1 AA compliance) for keyboard navigation in tests/accessibility/keyboardNavigation.test.ts
- [x] T064 [P] Code cleanup and refactoring - ensure all code follows project conventions
- [x] T065 [P] Documentation updates - update component JSDoc comments in src/lib/components/GameCanvas.svelte
- [x] T066 [P] Documentation updates - update service JSDoc comments in src/lib/canvas/renderer.ts and scene.ts
- [x] T067 [P] Run quickstart.md validation - verify all implementation steps are complete
- [x] T068 [P] Additional unit tests to achieve ≥80% coverage in tests/unit/canvas/
- [x] T069 [P] Visual regression tests for hover effects in tests/e2e/visual-regression.spec.ts

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
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Enhances US1 but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Enhances US1/US2 but independently testable

### Within Each User Story

- Tests (MANDATORY) MUST be written and FAIL before implementation
- Scene methods before CanvasService methods
- CanvasService methods before component updates
- Component updates before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit test for Scene.getCardAtLabelPosition() with single label in tests/unit/canvas/scene.test.ts"
Task: "Unit test for Scene.getCardAtLabelPosition() with overlapping labels in tests/unit/canvas/scene.test.ts"
Task: "Unit test for Scene.getCardAtLabelPosition() with empty cards array in tests/unit/canvas/scene.test.ts"
Task: "Unit test for CanvasService.handleClick() in tests/unit/canvas/renderer.test.ts"
Task: "Integration test for click event flow in tests/integration/cardLabelClick.test.ts"
Task: "E2E test for clicking card label in tests/e2e/card-label-click.spec.ts"
```

---

## Parallel Example: User Story 2

```bash
# Launch all tests for User Story 2 together:
Task: "Unit test for Scene.setHoveredCard() and getHoveredCard() in tests/unit/canvas/scene.test.ts"
Task: "Unit test for CanvasService.handleMouseMove() with debouncing in tests/unit/canvas/renderer.test.ts"
Task: "Unit test for CanvasService.handleMouseLeave() in tests/unit/canvas/renderer.test.ts"
Task: "Unit test for drawCardLabel() with hover state in tests/unit/canvas/cardAnimation.test.ts"
Task: "Integration test for hover detection flow in tests/integration/cardLabelHover.test.ts"
Task: "E2E test for hover visual feedback in tests/e2e/card-label-hover.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (write tests first, then implementation)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (click detection)
   - Developer B: User Story 2 (hover feedback)
   - Developer C: User Story 3 (edge cases)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All test tasks are MANDATORY per constitution Principle 2
- Tests must achieve ≥80% coverage for critical paths (click detection, card identification)

