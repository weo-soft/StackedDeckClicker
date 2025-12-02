# Tasks: Lucky Drop Feature

**Input**: Design documents from `/specs/010-lucky-drop/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Per constitution Principle 2 (Testing Standards), all features MUST include corresponding tests. Test tasks are MANDATORY for critical business logic and user-facing features, with ≥80% coverage target. Tests MUST be written before implementation (TDD approach recommended).

**Organization**: Tasks are organized by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths shown below use single project structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and preparation for code changes

**Note**: This feature is a rename/migration of existing functionality. No new infrastructure is needed, but we need to prepare for the migration.

- [x] T001 Verify existing codebase structure matches plan.md expectations
- [x] T002 [P] Review existing 'luck' upgrade implementation in src/lib/services/cardService.ts
- [x] T003 [P] Review existing 'luck' upgrade tests in tests/unit/services/cardService.test.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core changes that MUST be complete before user stories can be fully tested

**⚠️ CRITICAL**: Migration logic must be implemented before user stories can be validated with existing game states

- [x] T004 Update UpgradeType enum: Replace 'luck' with 'luckyDrop' in src/lib/models/types.ts
- [x] T005 [P] Update default game state: Replace 'luck' with 'luckyDrop' in upgradeTypes array in src/lib/utils/defaultGameState.ts
- [x] T006 [P] Update default game state costs: Replace 'luck' with 'luckyDrop' in getBaseCost function in src/lib/utils/defaultGameState.ts
- [x] T007 [P] Update default game state multipliers: Replace 'luck' with 'luckyDrop' in getCostMultiplier function in src/lib/utils/defaultGameState.ts
- [x] T008 Implement migration function: Add migrateLuckToLuckyDrop method in src/lib/services/gameStateService.ts
- [x] T009 Integrate migration: Call migrateLuckToLuckyDrop during initialize() in src/lib/services/gameStateService.ts

**Checkpoint**: Foundation ready - upgrade type renamed, migration logic in place, default state updated

---

## Phase 3: User Story 1 - Lucky Drop Multi-Roll Card Selection (Priority: P1) 🎯 MVP

**Goal**: Replace 'luck' upgrade with 'luckyDrop' upgrade in card drawing service. When lucky drop is active, system rolls multiple cards (level 1 = 2 rolls, level 2 = 3 rolls, etc.) and selects the card with highest value.

**Independent Test**: Activate lucky drop at a specific level, open decks, verify that dropped card has highest value among rolled options. Test with level 1 (2 rolls), level 2 (3 rolls), and level 0 (standard single-roll).

### Tests for User Story 1 (MANDATORY per constitution) ⚠️

> **NOTE: Per constitution Principle 2, tests MUST be written FIRST and ensure they FAIL before implementation. All critical paths require ≥80% coverage.**

- [x] T010 [P] [US1] Update unit test: Rename applyLuckUpgrade tests to applyLuckyDropUpgrade in tests/unit/services/cardService.test.ts
- [x] T011 [P] [US1] Update unit test: Update upgrade lookup from 'luck' to 'luckyDrop' in tests/unit/services/cardService.test.ts
- [x] T012 [P] [US1] Add unit test: Verify multi-roll selection with level 1 (2 rolls) selects highest value in tests/unit/services/cardService.test.ts
- [x] T013 [P] [US1] Add unit test: Verify multi-roll selection with level 2 (3 rolls) selects highest value in tests/unit/services/cardService.test.ts
- [x] T014 [P] [US1] Add unit test: Verify level 0 uses standard single-roll behavior in tests/unit/services/cardService.test.ts
- [x] T015 [P] [US1] Add unit test: Verify tie-breaking when multiple cards have identical highest value in tests/unit/services/cardService.test.ts

### Implementation for User Story 1

- [x] T016 [US1] Rename method: Change applyLuckUpgrade to applyLuckyDropUpgrade in src/lib/services/cardService.ts
- [x] T017 [US1] Update parameter: Change luckLevel parameter to luckyDropLevel in applyLuckyDropUpgrade method in src/lib/services/cardService.ts
- [x] T018 [US1] Update upgrade lookup: Change upgrades.get('luck') to upgrades.get('luckyDrop') in drawCard method in src/lib/services/cardService.ts
- [x] T019 [US1] Update method call: Change this.applyLuckUpgrade to this.applyLuckyDropUpgrade in drawCard method in src/lib/services/cardService.ts
- [x] T020 [US1] Update comments: Replace 'luck' references with 'luckyDrop' in JSDoc comments in src/lib/services/cardService.ts

**Checkpoint**: At this point, User Story 1 should be fully functional. Lucky drop multi-roll selection works when upgrade is active. Test by opening decks with lucky drop at various levels.

---

## Phase 4: User Story 2 - Lucky Drop Upgrade Acquisition and Leveling (Priority: P2)

**Goal**: Update upgrade service to support 'luckyDrop' upgrade type. Players can purchase and upgrade lucky drop, increasing number of rolls per deck opening.

**Independent Test**: Purchase lucky drop upgrade, verify it activates at level 1, upgrade to level 2, verify subsequent deck openings use correct number of rolls (level 1 = 2 rolls, level 2 = 3 rolls).

### Tests for User Story 2 (MANDATORY per constitution) ⚠️

- [x] T021 [P] [US2] Update unit test: Replace 'luck' with 'luckyDrop' in calculateUpgradeEffect tests in tests/unit/services/upgradeService.test.ts
- [x] T022 [P] [US2] Update unit test: Replace 'luck' with 'luckyDrop' in getEffectDescription tests in tests/unit/services/upgradeService.test.ts
- [x] T023 [P] [US2] Add unit test: Verify luckyDrop upgrade effect calculation returns correct level in tests/unit/services/upgradeService.test.ts
- [x] T024 [P] [US2] Add unit test: Verify luckyDrop upgrade description shows "Best of N draws" format in tests/unit/services/upgradeService.test.ts
- [x] T025 [P] [US2] Add integration test: Verify upgrade purchase flow for luckyDrop in tests/integration/upgradePurchase.test.ts (if exists)

### Implementation for User Story 2

- [x] T026 [US2] Update switch case: Replace 'luck' with 'luckyDrop' in calculateUpgradeEffect method in src/lib/services/upgradeService.ts
- [x] T027 [US2] Update switch case: Replace 'luck' with 'luckyDrop' in getEffectDescription method in src/lib/services/upgradeService.ts
- [x] T028 [US2] Update comments: Replace 'luck' references with 'luckyDrop' in JSDoc comments in src/lib/services/upgradeService.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Players can purchase and upgrade lucky drop, and it affects card drawing correctly.

---

## Phase 5: User Story 3 - Lucky Drop Integration with Existing Systems (Priority: P3)

**Goal**: Ensure lucky drop-selected cards are treated identically to standard single-roll cards in all downstream systems (scoreboard, card display, tier filtering, collection tracking).

**Independent Test**: Activate lucky drop, open decks, verify cards appear correctly in scoreboard, display zones, tier filters, and collection. Verify no special handling is needed (cards are identical to standard draws).

### Tests for User Story 3 (MANDATORY per constitution) ⚠️

- [ ] T029 [P] [US3] Add integration test: Verify luckyDrop-selected cards tracked in scoreboard in tests/integration/scoreboardIntegration.test.ts
- [ ] T030 [P] [US3] Add integration test: Verify luckyDrop-selected cards displayed in purple zone in tests/integration/cardDisplay.test.ts
- [ ] T031 [P] [US3] Add integration test: Verify luckyDrop-selected cards added to collection in tests/integration/collectionTracking.test.ts (if exists)
- [ ] T032 [P] [US3] Add integration test: Verify luckyDrop works with multidraw operations in tests/integration/multidraw.test.ts (if exists)
- [ ] T033 [P] [US3] Add integration test: Verify luckyDrop works with offline progression in tests/integration/offlineProgression.test.ts (if exists)

### Implementation for User Story 3

**Note**: User Story 3 requires no code changes - lucky drop-selected cards are already treated identically because they use the same DivinationCard interface. However, we need to verify integration and add tests.

- [x] T034 [US3] Verify integration: Test that scoreboardService.trackDrop() works with luckyDrop-selected cards (no changes needed, verification only)
- [x] T035 [US3] Verify integration: Test that card display components work with luckyDrop-selected cards (no changes needed, verification only)
- [x] T036 [US3] Verify integration: Test that tier filtering works with luckyDrop-selected cards (no changes needed, verification only)

**Checkpoint**: All user stories should now be independently functional. Lucky drop integrates seamlessly with all existing systems.

---

## Phase 6: Migration Testing and Validation

**Purpose**: Ensure backward compatibility - existing players with 'luck' upgrade levels are migrated correctly

### Tests for Migration (MANDATORY per constitution) ⚠️

- [x] T037 [P] Create migration test file: Add tests/integration/upgradeMigration.test.ts
- [x] T038 [P] Add migration test: Verify luck level 1 migrates to luckyDrop level 1 in tests/integration/upgradeMigration.test.ts
- [x] T039 [P] Add migration test: Verify luck level 5 migrates to luckyDrop level 5 in tests/integration/upgradeMigration.test.ts
- [x] T040 [P] Add migration test: Verify luck level 0 migrates to luckyDrop level 0 in tests/integration/upgradeMigration.test.ts
- [x] T041 [P] Add migration test: Verify migration is idempotent (safe to run multiple times) in tests/integration/upgradeMigration.test.ts
- [x] T042 [P] Add migration test: Verify game state without luck upgrade doesn't break migration in tests/integration/upgradeMigration.test.ts
- [x] T043 [P] Add migration test: Verify other upgrades unaffected by migration in tests/integration/upgradeMigration.test.ts
- [x] T044 [P] Add migration test: Verify upgrade costs and multipliers preserved during migration in tests/integration/upgradeMigration.test.ts

### Migration Validation

- [x] T045 Verify migration: Test migration with real saved game state containing luck upgrade
- [x] T046 Verify migration: Test that migrated state saves correctly to IndexedDB
- [x] T047 Verify migration: Test that migrated state loads correctly on subsequent game start

**Checkpoint**: Migration is fully tested and validated. Existing players will not lose progress.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, cleanup, and cross-cutting improvements

- [x] T048 [P] Run all existing tests: Verify no regressions in tests/unit/ and tests/integration/
- [x] T049 [P] Update documentation: Update any documentation referencing 'luck' upgrade to 'luckyDrop'
- [x] T050 [P] Code cleanup: Remove any remaining 'luck' references (comments, variable names, etc.)
- [x] T051 [P] Verify TypeScript compilation: Run `npm run check` to ensure no type errors
- [x] T052 [P] Verify linting: Run `npm run lint` to ensure code style compliance
- [x] T053 [P] Performance validation: Verify lucky drop multi-roll selection meets 50ms performance requirement
- [x] T054 [P] Manual testing: Test upgrade purchase flow in UI (UpgradeShop component)
- [x] T055 [P] Manual testing: Test deck opening with lucky drop at various levels
- [x] T056 [P] Manual testing: Verify migration works when loading existing game state
- [x] T057 Run quickstart.md validation: Verify all steps in quickstart.md work correctly
- [x] T058 [P] Test coverage validation: Verify ≥80% coverage for cardService and upgradeService changes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User Story 1 (Phase 3): Can start after Foundational - No dependencies on other stories
  - User Story 2 (Phase 4): Can start after Foundational - Depends on US1 for full functionality
  - User Story 3 (Phase 5): Can start after Foundational - Depends on US1 and US2 for full functionality
- **Migration Testing (Phase 6)**: Depends on Foundational phase (migration logic) and can run in parallel with user stories
- **Polish (Phase 7)**: Depends on all previous phases being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
  - Core functionality: Multi-roll card selection
  - Must complete before US2 can be fully tested
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 for full testing
  - Upgrade system: Purchase and leveling
  - Requires US1 to verify upgrade effects work correctly
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Depends on US1 and US2
  - Integration: Downstream system compatibility
  - Requires US1 and US2 to be functional for integration testing

### Within Each User Story

- Tests (MANDATORY) MUST be written and FAIL before implementation
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1**: All setup tasks marked [P] can run in parallel
- **Phase 2**: Tasks T005, T006, T007 can run in parallel (different functions in same file)
- **Phase 3 (US1)**: All test tasks (T010-T015) can run in parallel, implementation tasks (T016-T020) are sequential
- **Phase 4 (US2)**: All test tasks (T021-T025) can run in parallel, implementation tasks (T026-T028) are sequential
- **Phase 5 (US3)**: All test tasks (T029-T033) can run in parallel, verification tasks (T034-T036) are sequential
- **Phase 6**: All migration test tasks (T037-T044) can run in parallel
- **Phase 7**: All polish tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Update unit test: Rename applyLuckUpgrade tests to applyLuckyDropUpgrade in tests/unit/services/cardService.test.ts"
Task: "Update unit test: Update upgrade lookup from 'luck' to 'luckyDrop' in tests/unit/services/cardService.test.ts"
Task: "Add unit test: Verify multi-roll selection with level 1 (2 rolls) selects highest value in tests/unit/services/cardService.test.ts"
Task: "Add unit test: Verify multi-roll selection with level 2 (3 rolls) selects highest value in tests/unit/services/cardService.test.ts"
Task: "Add unit test: Verify level 0 uses standard single-roll behavior in tests/unit/services/cardService.test.ts"
Task: "Add unit test: Verify tie-breaking when multiple cards have identical highest value in tests/unit/services/cardService.test.ts"

# Then implement (sequential):
Task: "Rename method: Change applyLuckUpgrade to applyLuckyDropUpgrade in src/lib/services/cardService.ts"
Task: "Update parameter: Change luckLevel parameter to luckyDropLevel in applyLuckyDropUpgrade method in src/lib/services/cardService.ts"
# ... etc
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (review existing code)
2. Complete Phase 2: Foundational (rename enum, update defaults, add migration)
3. Complete Phase 3: User Story 1 (rename cardService methods, update tests)
4. **STOP and VALIDATE**: Test User Story 1 independently
   - Verify lucky drop multi-roll selection works
   - Verify migration preserves existing luck upgrade levels
   - Verify level 0 uses standard single-roll
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
   - Core functionality: Multi-roll selection works
3. Add User Story 2 → Test independently → Deploy/Demo
   - Upgrade system: Purchase and leveling works
4. Add User Story 3 → Test independently → Deploy/Demo
   - Integration: All systems work together
5. Add Migration Testing → Validate backward compatibility → Deploy
6. Polish → Final validation → Release

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (cardService changes)
   - Developer B: User Story 2 (upgradeService changes) - can start after T004
   - Developer C: Migration tests (Phase 6) - can start after T008
3. Developer D: User Story 3 (integration tests) - can start after US1 and US2 complete
4. All polish tasks can be done in parallel

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD approach)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Migration is critical - must preserve existing player progress
- No UI changes needed - uses existing UpgradeShop component
- All downstream systems (scoreboard, display, collection) work automatically - no changes needed

## Task Summary

- **Total Tasks**: 58
- **Phase 1 (Setup)**: 3 tasks
- **Phase 2 (Foundational)**: 6 tasks
- **Phase 3 (User Story 1)**: 11 tasks (6 tests + 5 implementation)
- **Phase 4 (User Story 2)**: 8 tasks (5 tests + 3 implementation)
- **Phase 5 (User Story 3)**: 8 tasks (5 tests + 3 verification)
- **Phase 6 (Migration Testing)**: 12 tasks (8 tests + 3 validation)
- **Phase 7 (Polish)**: 10 tasks

**Parallel Opportunities**: 35+ tasks can run in parallel (marked with [P])

**MVP Scope**: Phases 1-3 (User Story 1) = 20 tasks total

