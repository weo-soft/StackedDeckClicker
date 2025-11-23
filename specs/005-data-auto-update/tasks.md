# Tasks: Data Auto-Update System

**Input**: Design documents from `/specs/005-data-auto-update/`
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

- [x] T001 [P] Create TypeScript model interfaces in src/lib/models/DataVersion.ts
- [x] T002 [P] Create validation utility functions in src/lib/utils/dataValidation.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 [P] Create CacheEntry interface and types in src/lib/models/DataVersion.ts
- [x] T004 [P] Create MetadataFile and FileMetadata interfaces in src/lib/models/DataVersion.ts
- [x] T005 Create core data fetching utility in src/lib/utils/dataFetcher.ts (adapted from example_files/data-fetcher.ts)
- [x] T006 [P] Implement fetchMetadata function in src/lib/utils/dataFetcher.ts
- [x] T007 [P] Implement isCacheStale function in src/lib/utils/dataFetcher.ts
- [x] T008 [P] Implement checkForUpdates background function in src/lib/utils/dataFetcher.ts
- [x] T009 [P] Implement fetchFreshData function in src/lib/utils/dataFetcher.ts
- [x] T010 Implement fetchDataWithFallback exported function in src/lib/utils/dataFetcher.ts
- [x] T011 [P] Implement getCacheInfo exported function in src/lib/utils/dataFetcher.ts
- [x] T012 [P] Implement checkForNewData exported function in src/lib/utils/dataFetcher.ts
- [x] T013 [P] Implement forceRefreshData exported function in src/lib/utils/dataFetcher.ts
- [x] T014 [P] Add validation functions (validateFileName, validateHash, validateTimestamp) in src/lib/utils/dataValidation.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Automatic Data Updates (Priority: P1) 🎯 MVP

**Goal**: System automatically fetches and updates card price and weighting data from https://data.poeatlas.app/ without manual intervention. Data is cached for performance and falls back gracefully when network is unavailable.

**Independent Test**: Run application, verify data fetches from remote on initial load, confirm system checks for updates at regular intervals. Application should work offline with cached data.

### Tests for User Story 1 (MANDATORY per constitution) ⚠️

> **NOTE: Per constitution Principle 2, tests MUST be written FIRST and ensure they FAIL before implementation. All critical paths require ≥80% coverage.**

- [ ] T015 [P] [US1] Unit test for fetchDataWithFallback cache hit scenario in tests/unit/utils/dataFetcher.test.ts
- [ ] T016 [P] [US1] Unit test for fetchDataWithFallback cache miss scenario in tests/unit/utils/dataFetcher.test.ts
- [ ] T017 [P] [US1] Unit test for fetchDataWithFallback remote failure fallback in tests/unit/utils/dataFetcher.test.ts
- [ ] T018 [P] [US1] Unit test for fetchDataWithFallback local fallback in tests/unit/utils/dataFetcher.test.ts
- [ ] T019 [P] [US1] Unit test for cache expiration logic in tests/unit/utils/dataFetcher.test.ts
- [ ] T020 [P] [US1] Unit test for hash comparison logic in tests/unit/utils/dataFetcher.test.ts
- [ ] T021 [P] [US1] Unit test for background update checking in tests/unit/utils/dataFetcher.test.ts
- [ ] T022 [US1] Integration test for automatic update workflow in tests/integration/dataUpdate.test.ts

### Implementation for User Story 1

- [x] T023 [US1] Create DataUpdateService class in src/lib/services/dataUpdateService.ts
- [x] T024 [US1] Implement fetchDataWithFallback method in src/lib/services/dataUpdateService.ts
- [x] T025 [US1] Implement startAutomaticUpdates method in src/lib/services/dataUpdateService.ts
- [x] T026 [US1] Implement stopAutomaticUpdates method in src/lib/services/dataUpdateService.ts
- [x] T027 [US1] Implement checkAllForUpdates method in src/lib/services/dataUpdateService.ts
- [x] T028 [US1] Add error handling and logging in src/lib/services/dataUpdateService.ts
- [x] T029 [US1] Update createDefaultCardPool to use dataUpdateService in src/lib/utils/defaultCardPool.ts
- [x] T030 [US1] Update CardDataService.loadCardsData to use dataUpdateService in src/lib/services/cardDataService.ts
- [x] T031 [US1] Initialize automatic updates in GameStateService.initialize in src/lib/services/gameStateService.ts
- [x] T032 [US1] Add data file mapping configuration (divinationCardDetails.json → cards.json, divinationCardPrices.json → cardValues.json) in src/lib/services/dataUpdateService.ts

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Application fetches data automatically, caches it, and checks for updates in background.

---

## Phase 4: User Story 2 - View Current Data Version (Priority: P2)

**Goal**: Player can view information about data version currently in use, including timestamp, source, and whether newer data is available.

**Independent Test**: Access data version information display, verify it shows current data timestamp, source indicator, and update availability status. Display should update reactively when data changes.

### Tests for User Story 2 (MANDATORY per constitution) ⚠️

- [ ] T033 [P] [US2] Unit test for DataVersionStore reactive updates in tests/unit/stores/dataVersionStore.test.ts
- [ ] T034 [P] [US2] Unit test for getVersionInfo formatting function in tests/unit/stores/dataVersionStore.test.ts
- [ ] T035 [P] [US2] Unit test for hasAnyUpdates computed function in tests/unit/stores/dataVersionStore.test.ts
- [ ] T036 [US2] Integration test for data version display workflow in tests/integration/dataVersionDisplay.test.ts

### Implementation for User Story 2

- [x] T037 [P] [US2] Create UpdateStatus interface in src/lib/models/DataVersion.ts
- [x] T038 [P] [US2] Create DataVersionInfo interface in src/lib/models/DataVersion.ts
- [x] T039 [US2] Create DataVersionStore writable store in src/lib/stores/dataVersionStore.ts
- [x] T040 [US2] Implement getUpdateStatus helper function in src/lib/stores/dataVersionStore.ts
- [x] T041 [US2] Implement setUpdateStatus helper function in src/lib/stores/dataVersionStore.ts
- [x] T042 [US2] Implement getVersionInfo formatting function in src/lib/stores/dataVersionStore.ts
- [x] T043 [US2] Implement hasAnyUpdates computed function in src/lib/stores/dataVersionStore.ts
- [x] T044 [US2] Create DataVersionOverlay component in src/lib/components/DataVersionOverlay.svelte
- [x] T045 [US2] Implement data file list display in src/lib/components/DataVersionOverlay.svelte
- [x] T046 [US2] Implement timestamp display with formatting in src/lib/components/DataVersionOverlay.svelte
- [x] T047 [US2] Implement status chip display (Up to Date, Update Available, etc.) in src/lib/components/DataVersionOverlay.svelte
- [x] T048 [US2] Implement loading state indicators in src/lib/components/DataVersionOverlay.svelte
- [x] T049 [US2] Add keyboard navigation and accessibility (WCAG 2.1 AA) in src/lib/components/DataVersionOverlay.svelte
- [x] T050 [US2] Add modal overlay styling consistent with existing modals in src/lib/components/DataVersionOverlay.svelte
- [x] T051 [US2] Add trigger button to main page in src/routes/+page.svelte
- [x] T052 [US2] Connect DataUpdateService to update DataVersionStore on data changes in src/lib/services/dataUpdateService.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Players can see data version information and status.

---

## Phase 5: User Story 3 - Manual Data Update Trigger (Priority: P2)

**Goal**: Player can manually trigger data update at any time to immediately fetch latest data files, bypassing automatic update schedule.

**Independent Test**: Click manual update button, verify system fetches fresh data from remote source, confirm updated data is immediately available for use. Button should show loading state and prevent duplicate requests.

### Tests for User Story 3 (MANDATORY per constitution) ⚠️

- [ ] T053 [P] [US3] Unit test for forceRefreshData method in tests/unit/services/dataUpdateService.test.ts
- [ ] T054 [P] [US3] Unit test for forceRefreshAll method in tests/unit/services/dataUpdateService.test.ts
- [ ] T055 [P] [US3] Unit test for duplicate request prevention in tests/unit/services/dataUpdateService.test.ts
- [ ] T056 [US3] Integration test for manual update workflow in tests/integration/manualUpdate.test.ts
- [ ] T057 [US3] E2E test for manual update button interaction in tests/e2e/dataUpdate.spec.ts

### Implementation for User Story 3

- [x] T058 [US3] Implement forceRefreshData method in src/lib/services/dataUpdateService.ts
- [x] T059 [US3] Implement forceRefreshAll method in src/lib/services/dataUpdateService.ts
- [x] T060 [US3] Add update-in-progress state tracking in src/lib/services/dataUpdateService.ts
- [x] T061 [US3] Add duplicate request prevention logic in src/lib/components/DataVersionOverlay.svelte (via disabled states)
- [x] T062 [US3] Add "Check for Updates" button in src/lib/components/DataVersionOverlay.svelte
- [x] T063 [US3] Add "Refresh Data" button in src/lib/components/DataVersionOverlay.svelte
- [x] T064 [US3] Implement button loading states and disabled states in src/lib/components/DataVersionOverlay.svelte
- [x] T065 [US3] Implement success message display after update in src/lib/components/DataVersionOverlay.svelte
- [x] T066 [US3] Implement error message display on update failure in src/lib/components/DataVersionOverlay.svelte
- [x] T067 [US3] Implement "up to date" message when no update available in src/lib/components/DataVersionOverlay.svelte (via status display)
- [x] T068 [US3] Connect buttons to DataUpdateService methods in src/lib/components/DataVersionOverlay.svelte
- [x] T069 [US3] Update DataVersionStore when manual updates complete in src/lib/services/dataUpdateService.ts
- [x] T070 [US3] Add update availability alert banner in src/lib/components/DataVersionOverlay.svelte

**Checkpoint**: All user stories should now be independently functional. Players can automatically receive updates, view version info, and manually trigger updates.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T071 [P] Add comprehensive error handling for network failures across all services
- [ ] T072 [P] Add data validation before replacing cached data in src/lib/utils/dataFetcher.ts
- [ ] T073 [P] Add performance monitoring and logging for data fetch operations
- [ ] T074 [P] Additional unit tests to achieve ≥80% coverage in tests/unit/
- [ ] T075 [P] Performance testing and validation against constitution benchmarks (PERF-001 through PERF-008)
- [ ] T076 [P] Accessibility testing (WCAG 2.1 AA compliance) and UX consistency review
- [ ] T077 [P] Add error boundary handling for data fetch failures in UI components
- [ ] T078 [P] Code cleanup and refactoring for consistency with existing patterns
- [ ] T079 [P] Documentation updates in code comments and README
- [ ] T080 Run quickstart.md validation to ensure integration steps work correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P2)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 for data fetching infrastructure
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 and US2 for UI and service methods

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, user stories can start sequentially (US1 → US2 → US3)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different components within a story marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit test for fetchDataWithFallback cache hit scenario in tests/unit/utils/dataFetcher.test.ts"
Task: "Unit test for fetchDataWithFallback cache miss scenario in tests/unit/utils/dataFetcher.test.ts"
Task: "Unit test for fetchDataWithFallback remote failure fallback in tests/unit/utils/dataFetcher.test.ts"
Task: "Unit test for fetchDataWithFallback local fallback in tests/unit/utils/dataFetcher.test.ts"
Task: "Unit test for cache expiration logic in tests/unit/utils/dataFetcher.test.ts"
Task: "Unit test for hash comparison logic in tests/unit/utils/dataFetcher.test.ts"
Task: "Unit test for background update checking in tests/unit/utils/dataFetcher.test.ts"

# Launch foundational utility functions in parallel:
Task: "Implement fetchMetadata function in src/lib/utils/dataFetcher.ts"
Task: "Implement isCacheStale function in src/lib/utils/dataFetcher.ts"
Task: "Implement checkForUpdates background function in src/lib/utils/dataFetcher.ts"
Task: "Implement fetchFreshData function in src/lib/utils/dataFetcher.ts"
Task: "Implement getCacheInfo exported function in src/lib/utils/dataFetcher.ts"
Task: "Implement checkForNewData exported function in src/lib/utils/dataFetcher.ts"
Task: "Implement forceRefreshData exported function in src/lib/utils/dataFetcher.ts"
```

---

## Parallel Example: User Story 2

```bash
# Launch model interfaces in parallel:
Task: "Create UpdateStatus interface in src/lib/models/DataVersion.ts"
Task: "Create DataVersionInfo interface in src/lib/models/DataVersion.ts"

# Launch store tests in parallel:
Task: "Unit test for DataVersionStore reactive updates in tests/unit/stores/dataVersionStore.test.ts"
Task: "Unit test for getVersionInfo formatting function in tests/unit/stores/dataVersionStore.test.ts"
Task: "Unit test for hasAnyUpdates computed function in tests/unit/stores/dataVersionStore.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (models and validation)
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (automatic data updates)
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
   - Developer A: User Story 1 (automatic updates)
   - Developer B: Can start User Story 2 (version display) after US1 core is done
   - Developer C: Can start User Story 3 (manual trigger) after US1 and US2 are done
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
- Follow existing patterns from CardDataService, StorageService, TierSettings component
- Adapt example_files/data-fetcher.ts patterns to SvelteKit structure
- Ensure all file paths use SvelteKit $lib and $static aliases

---

## Task Summary

- **Total Tasks**: 80
- **Phase 1 (Setup)**: 2 tasks
- **Phase 2 (Foundational)**: 12 tasks
- **Phase 3 (User Story 1)**: 18 tasks (8 tests + 10 implementation)
- **Phase 4 (User Story 2)**: 20 tasks (4 tests + 16 implementation)
- **Phase 5 (User Story 3)**: 18 tasks (5 tests + 13 implementation)
- **Phase 6 (Polish)**: 10 tasks

**MVP Scope**: Phases 1-3 (32 tasks total) deliver automatic data updates functionality

**Independent Test Criteria**:
- **US1**: Application loads, fetches data automatically, caches it, checks for updates in background
- **US2**: Data version information displays correctly with timestamp, source, and status
- **US3**: Manual update button triggers immediate data refresh with proper feedback

