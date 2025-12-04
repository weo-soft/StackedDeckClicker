# Tasks: Game Mode Selection

**Input**: Design documents from `/specs/012-game-mode/`
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
- [x] T002 [P] Review game state initialization flow in src/lib/services/gameStateService.ts and src/routes/+page.svelte
- [x] T003 [P] Review existing upgrade shop implementation in src/lib/components/UpgradeShop.svelte and src/lib/components/UpgradeStoreZone.svelte
- [x] T004 [P] Review localStorage usage patterns in src/lib/services/gameStateService.ts
- [x] T005 [P] Review infinite decks implementation in src/lib/services/gameStateService.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Create GameMode type definitions in src/lib/models/GameMode.ts with GameModeId type and GameMode interface
- [x] T007 Create game mode configurations (classic, ruthless, dopamine, stacked-deck-clicker) in src/lib/models/GameMode.ts
- [x] T008 Create GameModeService class skeleton in src/lib/services/gameModeService.ts with basic structure
- [x] T009 Implement getAvailableModes() method in src/lib/services/gameModeService.ts returning all mode configurations
- [x] T010 Implement getModeConfiguration(modeId) method in src/lib/services/gameModeService.ts
- [x] T011 Implement localStorage read/write methods (loadGameMode, saveGameMode, clearGameMode) in src/lib/services/gameModeService.ts
- [x] T012 Implement getCurrentModeId() method in src/lib/services/gameModeService.ts reading from localStorage
- [x] T013 Implement getCurrentMode() method in src/lib/services/gameModeService.ts returning full configuration
- [x] T014 Implement isValidModeId() validation method in src/lib/services/gameModeService.ts
- [x] T015 Create unit test file tests/unit/services/gameModeService.test.ts with tests for mode configuration retrieval
- [x] T016 [P] Add unit test for localStorage persistence in tests/unit/services/gameModeService.test.ts
- [x] T017 [P] Add unit test for invalid mode ID handling in tests/unit/services/gameModeService.test.ts

**Checkpoint**: Foundation ready - game mode service exists with mode configurations. User story implementation can now begin.

---

## Phase 3: User Story 1 - Game Mode Selection Prompt (Priority: P1) 🎯 MVP

**Goal**: Display a game mode selection screen before the game loads, showing all four available game modes with clear names and descriptions, and allowing selection.

**Independent Test**: Can be fully tested by verifying the game mode selection screen appears before the game area, displays all available game modes, and allows selection. This delivers immediate value by giving players control over their gameplay experience.

### Tests for User Story 1 (MANDATORY per constitution) ⚠️

- [x] T018 [P] [US1] Create unit test file tests/unit/components/GameModeSelection.test.ts with tests for component rendering
- [x] T019 [P] [US1] Add unit test for displaying all four game modes in tests/unit/components/GameModeSelection.test.ts
- [x] T020 [P] [US1] Add unit test for mode selection interaction in tests/unit/components/GameModeSelection.test.ts
- [x] T021 [P] [US1] Add unit test for keyboard navigation (Tab, Enter, Arrow keys) in tests/unit/components/GameModeSelection.test.ts
- [x] T022 [P] [US1] Add unit test for ARIA labels and accessibility in tests/unit/components/GameModeSelection.test.ts

### Implementation for User Story 1

- [x] T026 [US1] Create GameModeSelection.svelte component skeleton in src/lib/components/GameModeSelection.svelte with props interface
- [x] T027 [US1] Add isVisible prop and conditional rendering to GameModeSelection.svelte in src/lib/components/GameModeSelection.svelte
- [x] T028 [US1] Import gameModeService and get available modes in GameModeSelection.svelte in src/lib/components/GameModeSelection.svelte
- [x] T029 [US1] Create mode selection UI with cards/buttons for each mode in GameModeSelection.svelte in src/lib/components/GameModeSelection.svelte
- [x] T030 [US1] Display mode names and descriptions for each mode in GameModeSelection.svelte in src/lib/components/GameModeSelection.svelte
- [x] T031 [US1] Implement mode selection handler (onModeSelect) in GameModeSelection.svelte in src/lib/components/GameModeSelection.svelte
- [x] T032 [US1] Add selectedMode state management in GameModeSelection.svelte in src/lib/components/GameModeSelection.svelte
- [x] T033 [US1] Add visual feedback for selected mode in GameModeSelection.svelte in src/lib/components/GameModeSelection.svelte
- [x] T034 [US1] Implement keyboard navigation (Tab, Enter, Arrow keys) in GameModeSelection.svelte in src/lib/components/GameModeSelection.svelte
- [x] T035 [US1] Add ARIA labels and roles for accessibility in GameModeSelection.svelte in src/lib/components/GameModeSelection.svelte
- [x] T036 [US1] Add modal overlay styling using existing patterns in GameModeSelection.svelte in src/lib/components/GameModeSelection.svelte
- [x] T037 [US1] Integrate GameModeSelection component in src/routes/+page.svelte before game area
- [x] T038 [US1] Add conditional rendering logic to show GameModeSelection when no mode selected in src/routes/+page.svelte
- [x] T039 [US1] Prevent game area from loading until mode is selected in src/routes/+page.svelte

**Checkpoint**: At this point, User Story 1 should be fully functional. Players can see and select a game mode, but mode configuration is not yet applied.

---

## Phase 4: User Story 2 - Classic Game Mode Configuration (Priority: P1)

**Goal**: Initialize Classic mode with unlimited stacked decks, disabled shop, and disabled upgrades.

**Independent Test**: Can be fully tested by selecting Classic mode and verifying unlimited decks, disabled shop, and disabled upgrades. This delivers value by providing a straightforward gameplay option.

### Tests for User Story 2 (MANDATORY per constitution) ⚠️

- [x] T040 [P] [US2] Add unit test for Classic mode configuration in tests/unit/models/GameMode.test.ts
- [x] T041 [P] [US2] Add unit test for applyModeConfiguration() with Classic mode in tests/unit/services/gameModeService.test.ts
- [x] T042 [P] [US2] Add integration test for Classic mode initialization in tests/integration/gameModeSelection.test.ts
- [x] T043 [P] [US2] Add E2E test for Classic mode unlimited decks in tests/e2e/game-mode-selection.spec.ts
- [x] T044 [P] [US2] Add E2E test for Classic mode shop disabled in tests/e2e/game-mode-selection.spec.ts

### Implementation for User Story 2

- [x] T045 [US2] Implement setMode(modeId) method in src/lib/services/gameModeService.ts to persist mode selection
- [x] T046 [US2] Implement applyModeConfiguration(modeId) method skeleton in src/lib/services/gameModeService.ts
- [x] T047 [US2] Modify createDefaultGameState() to accept optional GameMode parameter in src/lib/utils/defaultGameState.ts
- [x] T048 [US2] Implement mode-specific deck initialization (unlimited for Classic) in src/lib/utils/defaultGameState.ts
- [x] T049 [US2] Call gameStateService.setInfiniteDecks(true) for Classic mode in src/lib/services/gameModeService.ts
- [x] T050 [US2] Integrate mode application into game initialization flow in src/routes/+page.svelte
- [x] T051 [US2] Call gameModeService.applyModeConfiguration() before gameStateService.initialize() in src/routes/+page.svelte
- [x] T052 [US2] Pass mode configuration to createDefaultGameState() in src/lib/services/gameStateService.ts
- [x] T053 [US2] Update GameModeSelection to call setMode() and applyModeConfiguration() on selection in src/lib/components/GameModeSelection.svelte

**Checkpoint**: At this point, Classic mode should initialize correctly with unlimited decks. Shop visibility control comes in later stories.

---

## Phase 5: User Story 3 - Ruthless Game Mode Configuration (Priority: P1)

**Goal**: Initialize Ruthless mode with limited stacked decks, low starting chaos, deck purchase mechanism, and disabled shop/upgrades.

**Independent Test**: Can be fully tested by selecting Ruthless mode and verifying limited decks, low starting chaos, deck purchase mechanism, and disabled shop/upgrades. This delivers value by providing a challenging gameplay variant.

### Tests for User Story 3 (MANDATORY per constitution) ⚠️

- [x] T054 [P] [US3] Add unit test for Ruthless mode configuration in tests/unit/models/GameMode.test.ts
- [x] T055 [P] [US3] Add unit test for purchaseDecks() method in tests/unit/services/purchaseDecks.test.ts
- [x] T056 [P] [US3] Add unit test for insufficient chaos error in purchaseDecks() in tests/unit/services/purchaseDecks.test.ts
- [x] T057 [P] [US3] Add integration test for Ruthless mode initialization in tests/integration/gameModeSelection.test.ts
- [x] T058 [P] [US3] Add E2E test for Ruthless mode limited decks and low chaos in tests/e2e/game-mode-selection.spec.ts
- [x] T059 [P] [US3] Add E2E test for deck purchase in Ruthless mode in tests/e2e/game-mode-selection.spec.ts

### Implementation for User Story 3

- [x] T060 [US3] Implement mode-specific starting chaos initialization in src/lib/utils/defaultGameState.ts
- [x] T061 [US3] Set starting chaos to 25 for Ruthless mode in src/lib/services/gameModeService.ts
- [x] T062 [US3] Set starting decks to 5 for Ruthless mode in src/lib/services/gameModeService.ts
- [x] T063 [US3] Implement purchaseDecks(chaosCost, deckCount) method in src/lib/services/gameStateService.ts
- [x] T064 [US3] Add validation for sufficient chaos in purchaseDecks() in src/lib/services/gameStateService.ts
- [x] T065 [US3] Add validation for Ruthless mode in purchaseDecks() in src/lib/services/gameStateService.ts
- [x] T066 [US3] Update game state (score -= chaosCost, decks += deckCount) in purchaseDecks() in src/lib/services/gameStateService.ts
- [x] T067 [US3] Add deck purchase UI button in InventoryZone or create dedicated purchase component for Ruthless mode
- [x] T068 [US3] Wire deck purchase button to purchaseDecks() method

**Checkpoint**: At this point, Ruthless mode should initialize correctly with limited decks and low chaos, and players can purchase decks with chaos.

---

## Phase 6: User Story 4 - Give me my Dopamine Game Mode Configuration (Priority: P1)

**Goal**: Initialize Give me my Dopamine mode with high starting decks, high starting chaos, increased rarity base, lucky drop level 1, and only improvedRarity/luckyDrop upgrades available.

**Independent Test**: Can be fully tested by selecting Give me my Dopamine mode and verifying high starting decks, high starting chaos, increased rarity base, lucky drop level 1, and only rarity/luck upgrades available. This delivers value by providing an exciting, reward-focused gameplay option.

### Tests for User Story 4 (MANDATORY per constitution) ⚠️

- [x] T069 [P] [US4] Add unit test for Dopamine mode configuration in tests/unit/models/GameMode.test.ts
- [x] T070 [P] [US4] Add unit test for initial upgrade levels (luckyDrop level 1) in tests/unit/services/gameModeService.test.ts
- [x] T071 [P] [US4] Add unit test for customRarityPercentage initialization in tests/unit/services/gameModeService.test.ts
- [x] T072 [P] [US4] Add integration test for Dopamine mode initialization in tests/integration/gameModeSelection.test.ts
- [x] T073 [P] [US4] Add E2E test for Dopamine mode high resources in tests/e2e/game-mode-selection.spec.ts
- [x] T074 [P] [US4] Add E2E test for Dopamine mode upgrade filtering in tests/e2e/game-mode-selection.spec.ts

### Implementation for User Story 4

- [x] T075 [US4] Set starting decks to 75 for Dopamine mode in src/lib/services/gameModeService.ts
- [x] T076 [US4] Set starting chaos to 750 for Dopamine mode in src/lib/services/gameModeService.ts
- [x] T077 [US4] Set customRarityPercentage to 25 for Dopamine mode in src/lib/services/gameModeService.ts
- [x] T078 [US4] Implement initialUpgradeLevels application in createDefaultGameState() in src/lib/utils/defaultGameState.ts
- [x] T079 [US4] Set luckyDrop upgrade to level 1 for Dopamine mode in src/lib/utils/defaultGameState.ts
- [x] T080 [US4] Implement getAllowedUpgrades() method in src/lib/services/gameModeService.ts
- [x] T081 [US4] Implement isUpgradeAllowed(upgradeType) method in src/lib/services/gameModeService.ts
- [x] T082 [US4] Filter upgrades in UpgradeShop component based on allowedUpgrades in src/lib/components/UpgradeShop.svelte
- [x] T083 [US4] Import gameModeService in UpgradeShop.svelte in src/lib/components/UpgradeShop.svelte
- [x] T084 [US4] Add reactive statement to filter availableUpgrades by allowedUpgrades in src/lib/components/UpgradeShop.svelte

**Checkpoint**: At this point, Give me my Dopamine mode should initialize correctly with high resources, increased rarity, lucky drop level 1, and filtered upgrades.

---

## Phase 7: User Story 5 - Stacked Deck Clicker Game Mode Configuration (Priority: P1)

**Goal**: Initialize Stacked Deck Clicker mode with limited decks, zero starting chaos, enabled shop, and all upgrade types available.

**Independent Test**: Can be fully tested by selecting Stacked Deck Clicker mode and verifying limited decks, zero starting chaos, enabled shop, and all upgrade types available. This delivers value by providing the complete gameplay experience.

### Tests for User Story 5 (MANDATORY per constitution) ⚠️

- [x] T085 [P] [US5] Add unit test for Stacked Deck Clicker mode configuration in tests/unit/models/GameMode.test.ts
- [x] T086 [P] [US5] Add integration test for Stacked Deck Clicker mode initialization in tests/integration/gameModeSelection.test.ts
- [x] T087 [P] [US5] Add E2E test for Stacked Deck Clicker mode full shop in tests/e2e/game-mode-selection.spec.ts
- [x] T088 [P] [US5] Add E2E test for Stacked Deck Clicker mode all upgrades available in tests/e2e/game-mode-selection.spec.ts

### Implementation for User Story 5

- [ ] T089 [US5] Set starting decks to 10 for Stacked Deck Clicker mode in src/lib/services/gameModeService.ts
- [ ] T090 [US5] Set starting chaos to 0 for Stacked Deck Clicker mode in src/lib/services/gameModeService.ts
- [ ] T091 [US5] Verify all upgrade types are in allowedUpgrades for Stacked Deck Clicker mode in src/lib/models/GameMode.ts
- [ ] T092 [US5] Implement isShopEnabled() method in src/lib/services/gameModeService.ts
- [ ] T093 [US5] Conditionally render UpgradeStoreZone based on isShopEnabled() in src/lib/components/GameAreaLayout.svelte
- [ ] T094 [US5] Import gameModeService in GameAreaLayout.svelte in src/lib/components/GameAreaLayout.svelte
- [ ] T095 [US5] Add conditional rendering for shop zone (#if gameModeService.isShopEnabled()) in src/lib/components/GameAreaLayout.svelte

**Checkpoint**: At this point, Stacked Deck Clicker mode should initialize correctly with limited decks, zero chaos, enabled shop, and all upgrades available.

---

## Phase 8: User Story 6 - Game Mode Persistence (Priority: P2)

**Goal**: Persist selected game mode across sessions and allow mode changes with state reset.

**Independent Test**: Can be fully tested by selecting a game mode, closing the application, and verifying the mode is remembered on return. This delivers value by improving convenience and user experience.

### Tests for User Story 6 (MANDATORY per constitution) ⚠️

- [x] T096 [P] [US6] Add unit test for mode persistence in localStorage in tests/unit/services/gameModeService.test.ts
- [x] T097 [P] [US6] Add integration test for mode persistence across page reloads in tests/integration/gameModeSelection.test.ts
- [x] T098 [P] [US6] Add integration test for mode change confirmation dialog in tests/integration/gameModeSelection.test.ts
- [x] T099 [P] [US6] Add E2E test for mode persistence in tests/e2e/game-mode-selection.spec.ts
- [x] T100 [P] [US6] Add E2E test for mode change with confirmation in tests/e2e/game-mode-selection.spec.ts

### Implementation for User Story 6

- [x] T101 [US6] Check for saved mode on application load in src/routes/+page.svelte
- [x] T102 [US6] Skip mode selection screen if mode is already saved in src/routes/+page.svelte
- [x] T103 [US6] Load saved mode configuration on application start in src/routes/+page.svelte
- [x] T104 [US6] Add mode change functionality to GameModeSelection component in src/lib/components/GameModeSelection.svelte
- [x] T105 [US6] Add isModeChange prop to GameModeSelection component in src/lib/components/GameModeSelection.svelte
- [x] T106 [US6] Implement confirmation dialog for mode changes in src/lib/components/GameModeSelection.svelte
- [x] T107 [US6] Add showConfirmation state and pendingModeChange state in GameModeSelection.svelte in src/lib/components/GameModeSelection.svelte
- [x] T108 [US6] Clear game state storage before applying new mode in src/lib/components/GameModeSelection.svelte
- [x] T109 [US6] Call storageService.clearAll() on mode change confirmation in src/lib/components/GameModeSelection.svelte
- [x] T110 [US6] Reload page or reinitialize game state after mode change in src/lib/components/GameModeSelection.svelte

**Checkpoint**: At this point, game mode should persist across sessions, and players can change modes with confirmation and state reset.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final polish, error handling, edge cases, and cross-cutting concerns

### Error Handling & Edge Cases

- [x] T111 [P] Add error handling for invalid mode ID in localStorage in src/lib/services/gameModeService.ts
- [x] T112 [P] Add error handling for corrupted mode data in src/lib/services/gameModeService.ts
- [x] T113 [P] Add fallback to default mode (Stacked Deck Clicker) on error in src/lib/services/gameModeService.ts
- [x] T114 [P] Handle localStorage unavailable scenario gracefully in src/lib/services/gameModeService.ts
- [x] T115 [P] Add error messages for mode selection failures in src/lib/components/GameModeSelection.svelte
- [x] T116 [P] Handle page refresh during mode selection in src/lib/components/GameModeSelection.svelte

### Shop Visibility Control

- [x] T117 [P] Hide shop zone for Classic mode in src/lib/components/UpgradeStoreZone.svelte
- [x] T118 [P] Hide shop zone for Ruthless mode in src/lib/components/UpgradeStoreZone.svelte
- [x] T119 [P] Show shop zone for Dopamine mode in src/lib/components/UpgradeStoreZone.svelte
- [x] T120 [P] Show shop zone for Stacked Deck Clicker mode in src/lib/components/UpgradeStoreZone.svelte

### Upgrade Filtering

- [x] T121 [P] Filter upgrades for Classic mode (empty array) in src/lib/components/UpgradeShop.svelte
- [x] T122 [P] Filter upgrades for Ruthless mode (empty array) in src/lib/components/UpgradeShop.svelte
- [x] T123 [P] Filter upgrades for Dopamine mode (only improvedRarity, luckyDrop) in src/lib/components/UpgradeShop.svelte
- [x] T124 [P] Show all upgrades for Stacked Deck Clicker mode in src/lib/components/UpgradeShop.svelte

### Accessibility & UX

- [ ] T125 [P] Ensure WCAG 2.1 Level AA compliance for GameModeSelection component in src/lib/components/GameModeSelection.svelte
- [ ] T126 [P] Add loading state during mode application in src/lib/components/GameModeSelection.svelte
- [ ] T127 [P] Add success feedback after mode selection in src/lib/components/GameModeSelection.svelte
- [ ] T128 [P] Improve mode descriptions clarity in src/lib/models/GameMode.ts

### Performance

- [ ] T129 [P] Optimize mode selection screen render time (<100ms target) in src/lib/components/GameModeSelection.svelte
- [ ] T130 [P] Optimize mode configuration application (<500ms target) in src/lib/services/gameModeService.ts
- [ ] T131 [P] Add performance monitoring for mode initialization in src/lib/services/gameModeService.ts

### Documentation

- [ ] T132 [P] Add JSDoc comments to GameModeService methods in src/lib/services/gameModeService.ts
- [ ] T133 [P] Add JSDoc comments to GameMode type definitions in src/lib/models/GameMode.ts
- [ ] T134 [P] Update README or documentation with game mode information

---

## Dependencies & Execution Order

### Story Completion Order

1. **US1** (P1) - Game Mode Selection Prompt - **MVP** - Must complete first
2. **US2** (P1) - Classic Mode - Can start after US1 checkpoint
3. **US3** (P1) - Ruthless Mode - Can start after US1 checkpoint (parallel with US2)
4. **US4** (P1) - Dopamine Mode - Can start after US1 checkpoint (parallel with US2, US3)
5. **US5** (P1) - Stacked Deck Clicker Mode - Can start after US1 checkpoint (parallel with US2, US3, US4)
6. **US6** (P2) - Mode Persistence - Requires all P1 stories complete

### Parallel Execution Opportunities

**After Phase 2 (Foundation)**:
- US2, US3, US4, US5 can be implemented in parallel (different mode configurations)
- Each mode's tests can be written in parallel

**Within each User Story**:
- Test tasks marked [P] can run in parallel
- Component and service tasks can be worked on in parallel when they don't depend on each other

### MVP Scope

**Minimum Viable Product**: User Story 1 (Game Mode Selection Prompt)
- Players can see and select a game mode
- Mode selection is functional (even if configuration not fully applied)
- Provides immediate value: player choice and control

**Incremental Delivery**:
1. MVP: US1 (selection screen)
2. Add US2 (Classic mode) - simplest configuration
3. Add US5 (Stacked Deck Clicker) - standard mode
4. Add US3 (Ruthless) - adds deck purchase mechanic
5. Add US4 (Dopamine) - adds upgrade filtering
6. Add US6 (Persistence) - polish and convenience

---

## Summary

**Total Tasks**: 134
**Tasks per User Story**:
- Setup: 5 tasks
- Foundational: 12 tasks
- US1: 22 tasks (12 tests + 10 implementation)
- US2: 14 tasks (5 tests + 9 implementation)
- US3: 15 tasks (6 tests + 9 implementation)
- US4: 16 tasks (6 tests + 10 implementation)
- US5: 10 tasks (4 tests + 6 implementation)
- US6: 15 tasks (5 tests + 10 implementation)
- Polish: 25 tasks

**Parallel Opportunities**: High - Mode configurations can be implemented in parallel after foundation

**Independent Test Criteria**:
- Each user story can be tested independently
- Each mode configuration can be verified independently
- Mode selection flow can be tested without full game initialization

**Suggested MVP**: User Story 1 (Game Mode Selection Prompt) - provides immediate value and foundation for all other stories

