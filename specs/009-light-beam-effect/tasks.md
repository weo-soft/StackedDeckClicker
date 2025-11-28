# Tasks: Light Beam Effect for Dropped Cards

**Input**: Design documents from `/specs/009-light-beam-effect/`
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

**Purpose**: Project setup and review of existing code structure

- [x] T001 Review existing Scene class structure in src/lib/canvas/scene.ts
- [x] T002 [P] Review existing CardAnimation interface in src/lib/canvas/cardAnimation.ts
- [x] T003 [P] Review existing TierConfiguration interface in src/lib/models/Tier.ts
- [x] T004 [P] Review existing TierSettings component in src/lib/components/TierSettings.svelte
- [x] T005 [P] Review existing tier service APIs in src/lib/services/tierService.ts
- [x] T006 [P] Review existing color validation utilities in src/lib/utils/colorValidation.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data model extensions that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Create LightBeamConfiguration interface in src/lib/models/Tier.ts
- [x] T008 Extend TierConfiguration interface with optional lightBeam property in src/lib/models/Tier.ts
- [x] T009 Extend CardAnimation interface with beam state fields (beamColor, beamEnabled, beamAge, beamHeight) in src/lib/canvas/cardAnimation.ts
- [x] T010 Update createDefaultTierConfigurations to include default beam settings in src/lib/utils/tierAssignment.ts
- [x] T011 Create validateLightBeamConfig validation function in src/lib/utils/colorValidation.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Visual Light Beam Effect on Card Drop (Priority: P1) 🎯 MVP

**Goal**: Display light beam effects emitting upward from cards when they are dropped, using tier-configured colors.

**Independent Test**: Drop a card and verify that a light beam effect appears upward from the card's position, using the tier's configured beam color.

### Tests for User Story 1 (MANDATORY per constitution) ⚠️

> **NOTE: Per constitution Principle 2, tests MUST be written FIRST and ensure they FAIL before implementation. All critical paths require ≥80% coverage.**

- [ ] T012 [P] [US1] Unit test for beam state initialization in createCardAnimation in tests/unit/canvas/lightBeamEffect.test.ts
- [ ] T013 [P] [US1] Unit test for beam age increment in updateCardAnimation in tests/unit/canvas/lightBeamEffect.test.ts
- [ ] T014 [P] [US1] Unit test for beam rendering with correct color in tests/unit/canvas/lightBeamEffect.test.ts
- [ ] T015 [P] [US1] Unit test for beam fade-out calculation in tests/unit/canvas/lightBeamEffect.test.ts
- [ ] T016 [P] [US1] Unit test for beam rendering when beam disabled in tests/unit/canvas/lightBeamEffect.test.ts
- [ ] T017 [P] [US1] Integration test for card drop with beam effect in tests/integration/lightBeamEffect.test.ts
- [ ] T018 [P] [US1] Performance test for 20+ simultaneous beams in tests/performance/lightBeamEffect.test.ts

### Implementation for User Story 1

- [x] T019 [US1] Initialize beam state from tier configuration in createCardAnimation in src/lib/canvas/cardAnimation.ts
- [x] T020 [US1] Update beam age in updateCardAnimation function in src/lib/canvas/cardAnimation.ts
- [x] T021 [US1] Implement drawLightBeams private method in Scene class in src/lib/canvas/scene.ts
- [x] T022 [US1] Integrate beam rendering into Scene.render method (between card objects and labels) in src/lib/canvas/scene.ts
- [x] T023 [US1] Implement beam fade-out logic (exponential fade over 5-8 seconds) in src/lib/canvas/scene.ts
- [x] T024 [US1] Handle missing tier configuration gracefully (default to no beam) in src/lib/canvas/cardAnimation.ts
- [x] T025 [US1] Handle invalid tier gracefully (default to no beam) in src/lib/canvas/cardAnimation.ts

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently - cards display beam effects when dropped (if tier has beam configured)

---

## Phase 4: User Story 2 - Configure Light Beam Color per Tier Group (Priority: P1) 🎯 MVP

**Goal**: Allow users to configure beam color for each tier group through Tier Settings interface.

**Independent Test**: Open Tier Settings, select a tier, configure a beam color, save, and verify that dropped cards from that tier use the configured color.

### Tests for User Story 2 (MANDATORY per constitution) ⚠️

- [ ] T026 [P] [US2] Unit test for beam color configuration UI rendering in tests/unit/components/TierSettings.test.ts
- [ ] T027 [P] [US2] Unit test for beam color picker input handling in tests/unit/components/TierSettings.test.ts
- [ ] T028 [P] [US2] Unit test for beam color hex text input handling in tests/unit/components/TierSettings.test.ts
- [ ] T029 [P] [US2] Unit test for beam color preview display in tests/unit/components/TierSettings.test.ts
- [ ] T030 [P] [US2] Integration test for save beam color configuration in tests/integration/lightBeamEffect.test.ts
- [ ] T031 [P] [US2] Integration test for beam color persistence in tests/integration/lightBeamEffect.test.ts
- [ ] T032 [P] [US2] E2E test for configure beam color workflow in tests/e2e/light-beam-effect.spec.ts

### Implementation for User Story 2

- [x] T033 [US2] Add editingLightBeam state variable in TierSettings component in src/lib/components/TierSettings.svelte
- [x] T034 [US2] Load beam configuration into editing state in loadTierForEditing function in src/lib/components/TierSettings.svelte
- [x] T035 [US2] Add Light Beam Effect configuration section in tier collapsible in src/lib/components/TierSettings.svelte
- [x] T036 [US2] Implement handleBeamColorInput function for color picker in src/lib/components/TierSettings.svelte
- [x] T037 [US2] Implement handleBeamColorTextInput function for hex input in src/lib/components/TierSettings.svelte
- [x] T038 [US2] Add beam color preview UI element in src/lib/components/TierSettings.svelte
- [x] T039 [US2] Update handleSave to include lightBeam in tier configuration update in src/lib/components/TierSettings.svelte
- [x] T040 [US2] Add beam color validation in handleSave function in src/lib/components/TierSettings.svelte
- [x] T041 [US2] Handle backward compatibility for existing tier configs without lightBeam in src/lib/services/tierService.ts

**Checkpoint**: At this point, User Story 2 should be fully functional and testable independently - users can configure beam colors for tiers through Tier Settings

---

## Phase 5: User Story 3 - Enable/Disable Light Beam Effect per Tier Group (Priority: P2)

**Goal**: Allow users to enable or disable the light beam effect for each tier group.

**Independent Test**: Configure a tier to disable the beam effect, save, and verify that dropped cards from that tier do not display a light beam.

### Tests for User Story 3 (MANDATORY per constitution) ⚠️

- [ ] T042 [P] [US3] Unit test for beam enabled toggle UI in tests/unit/components/TierSettings.test.ts
- [ ] T043 [P] [US3] Unit test for beam enabled state persistence in tests/unit/components/TierSettings.test.ts
- [ ] T044 [P] [US3] Integration test for disable beam effect workflow in tests/integration/lightBeamEffect.test.ts
- [ ] T045 [P] [US3] E2E test for enable/disable beam effect workflow in tests/e2e/light-beam-effect.spec.ts

### Implementation for User Story 3

- [ ] T046 [US3] Add enable/disable checkbox toggle in Light Beam Effect section in src/lib/components/TierSettings.svelte
- [ ] T047 [US3] Implement handleBeamEnabledChange function in src/lib/components/TierSettings.svelte
- [ ] T048 [US3] Update handleSave to persist beam enabled state in src/lib/components/TierSettings.svelte
- [ ] T049 [US3] Ensure beam color editor only shows when beam is enabled in src/lib/components/TierSettings.svelte
- [ ] T050 [US3] Update beam rendering logic to respect beamEnabled flag in src/lib/canvas/scene.ts

**Checkpoint**: At this point, User Story 3 should be fully functional and testable independently - users can enable/disable beam effects per tier

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Performance optimization, accessibility, edge cases, and final polish

### Performance Optimization

- [ ] T051 [P] Optimize beam rendering loop for 20+ simultaneous beams in src/lib/canvas/scene.ts
- [ ] T052 [P] Implement gradient object reuse to reduce GC pressure in src/lib/canvas/scene.ts
- [ ] T053 [P] Add performance monitoring for beam rendering (measure render time) in src/lib/canvas/scene.ts
- [ ] T054 [P] Verify memory usage stays under 1MB per 50 active beams in tests/performance/lightBeamEffect.test.ts

### Accessibility

- [ ] T055 [P] Add ARIA labels to beam color picker inputs in src/lib/components/TierSettings.svelte
- [ ] T056 [P] Ensure keyboard navigation works for beam configuration UI in src/lib/components/TierSettings.svelte
- [ ] T057 [P] Verify screen reader compatibility for beam configuration in tests/accessibility/lightBeamEffect.test.ts
- [ ] T058 [P] Ensure beam effects don't cause visual flashing (WCAG 2.3.1 compliance) in src/lib/canvas/scene.ts

### Edge Cases & Error Handling

- [ ] T059 [P] Handle rapid card drops with beam effects (performance) in src/lib/canvas/scene.ts
- [ ] T060 [P] Handle tier deletion while cards with beams are displayed in src/lib/canvas/cardAnimation.ts
- [ ] T061 [P] Handle invalid beam color (malformed hex) gracefully in src/lib/components/TierSettings.svelte
- [ ] T062 [P] Handle tier service not initialized when card is dropped in src/lib/canvas/cardAnimation.ts
- [ ] T063 [P] Handle canvas resize with active beam effects in src/lib/canvas/scene.ts

### Visual Polish

- [ ] T064 [P] Fine-tune beam height calculation based on canvas size in src/lib/canvas/scene.ts
- [ ] T065 [P] Adjust beam taper (width from base to top) for visual appeal in src/lib/canvas/scene.ts
- [ ] T066 [P] Ensure beam effects complement existing visual effects (particle effects, glow borders) in src/lib/canvas/scene.ts
- [ ] T067 [P] Verify beam effects don't obscure card labels in visual testing

### Documentation

- [ ] T068 [P] Add JSDoc comments to drawLightBeams method in src/lib/canvas/scene.ts
- [ ] T069 [P] Add JSDoc comments to beam state fields in CardAnimation interface in src/lib/canvas/cardAnimation.ts
- [ ] T070 [P] Update component documentation for beam configuration UI in src/lib/components/TierSettings.svelte

---

## Dependencies & Story Completion Order

### Story Dependencies

1. **Phase 2 (Foundational)** → **MUST complete before all user stories**
   - Data model extensions are prerequisites for all implementation

2. **Phase 3 (User Story 1)** → **Can start after Phase 2**
   - Independent: Core beam rendering functionality
   - No dependencies on configuration UI

3. **Phase 4 (User Story 2)** → **Can start after Phase 2, can run parallel with Phase 3**
   - Independent: Configuration UI separate from rendering
   - Can be developed in parallel with US1 if different developers

4. **Phase 5 (User Story 3)** → **Requires Phase 4**
   - Depends on: Beam configuration UI (US2)
   - Adds enable/disable toggle to existing configuration

5. **Phase 6 (Polish)** → **Requires all user stories complete**
   - Depends on: All functionality implemented
   - Optimization and edge cases

### Recommended Execution Order

**MVP Path (Fastest to working feature)**:
1. Phase 2 (Foundational) - 5 tasks
2. Phase 3 (User Story 1) - 14 tasks (7 tests + 7 implementation)
3. **MVP Complete** - Beam effects work with hardcoded/default colors

**Full Feature Path**:
1. Phase 2 (Foundational) - 5 tasks
2. Phase 3 (User Story 1) - 14 tasks
3. Phase 4 (User Story 2) - 18 tasks (7 tests + 11 implementation)
4. Phase 5 (User Story 3) - 9 tasks (4 tests + 5 implementation)
5. Phase 6 (Polish) - 20 tasks
6. **Feature Complete** - All functionality + polish

### Parallel Execution Opportunities

**Within Phase 3 (US1)**:
- T012-T018 (all test tasks) can run in parallel
- T019-T025 (implementation tasks) have dependencies but some can be parallel:
  - T019, T020 (cardAnimation.ts changes) can be done together
  - T021, T022, T023 (scene.ts changes) can be done together
  - T024, T025 (error handling) can be done in parallel

**Within Phase 4 (US2)**:
- T026-T032 (all test tasks) can run in parallel
- T033-T041 (implementation tasks):
  - T033-T038 (UI components) can be done together
  - T039-T041 (save/validation logic) can be done together

**Within Phase 5 (US3)**:
- T042-T045 (all test tasks) can run in parallel
- T046-T050 (implementation tasks) can be done together (all in same component)

**Within Phase 6 (Polish)**:
- All tasks marked [P] can run in parallel
- Performance, accessibility, edge cases, visual polish, documentation can all be done independently

---

## Implementation Strategy

### MVP First Approach

**MVP Scope**: User Story 1 only
- Enables beam effects with default/hardcoded colors
- Provides immediate visual value
- Can be tested independently
- Establishes rendering infrastructure

**MVP Tasks**: Phase 2 (5 tasks) + Phase 3 (14 tasks) = **19 tasks**

**After MVP**:
- Add configuration UI (User Story 2)
- Add enable/disable (User Story 3)
- Polish and optimize

### Incremental Delivery

1. **Week 1**: Phase 2 + Phase 3 (MVP)
   - Foundation + core beam rendering
   - Beam effects work with defaults

2. **Week 2**: Phase 4 (User Story 2)
   - Configuration UI
   - Users can customize beam colors

3. **Week 3**: Phase 5 (User Story 3) + Phase 6 (Polish)
   - Enable/disable functionality
   - Performance, accessibility, edge cases

### Testing Strategy

**TDD Approach** (Recommended):
1. Write tests first (all test tasks before implementation)
2. Ensure tests fail (verify test correctness)
3. Implement feature (make tests pass)
4. Refactor (improve code while keeping tests green)

**Test Coverage Targets**:
- Unit tests: ≥80% coverage for beam rendering logic
- Integration tests: All critical workflows
- E2E tests: Complete user journeys
- Performance tests: Verify 60fps with 20+ beams

---

## Task Summary

- **Total Tasks**: 70
- **Phase 1 (Setup)**: 6 tasks
- **Phase 2 (Foundational)**: 5 tasks
- **Phase 3 (User Story 1)**: 14 tasks (7 tests + 7 implementation)
- **Phase 4 (User Story 2)**: 18 tasks (7 tests + 11 implementation)
- **Phase 5 (User Story 3)**: 9 tasks (4 tests + 5 implementation)
- **Phase 6 (Polish)**: 20 tasks

### Parallel Opportunities

- **Test tasks**: 18 test tasks can run in parallel (within their phases)
- **Implementation tasks**: Many can run in parallel within same phase
- **Polish tasks**: 20 tasks marked [P] can run in parallel

### Independent Test Criteria

- **User Story 1**: Drop card → verify beam appears with tier color
- **User Story 2**: Configure beam color → save → drop card → verify color matches
- **User Story 3**: Disable beam → save → drop card → verify no beam

### Suggested MVP Scope

**MVP = Phase 2 + Phase 3** (19 tasks)
- Provides working beam effects with default colors
- Establishes rendering infrastructure
- Can be demonstrated and tested independently
- Foundation for adding configuration in subsequent phases

