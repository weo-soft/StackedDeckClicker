# Tasks: Stacked Deck Clicker Game

**Input**: Design documents from `/specs/001-stacked-deck-clicker/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Per constitution Principle 2 (Testing Standards), all features MUST include corresponding tests. Test tasks are MANDATORY for critical business logic and user-facing features, with ≥80% coverage target. Tests MUST be written before implementation (TDD approach recommended).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `src/lib/` for SvelteKit source code, `tests/` at repository root
- Paths follow SvelteKit conventions as defined in plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create SvelteKit project structure with Vite configuration
- [x] T002 [P] Install and configure dependencies: SvelteKit, TypeScript, localforge, Howler.js, seedrandom, Vitest, Playwright, @testing-library/svelte
- [x] T003 [P] Configure TypeScript with strict mode in tsconfig.json
- [x] T004 [P] Setup ESLint and Prettier for code quality
- [x] T005 [P] Configure Vitest for unit/integration tests in vitest.config.ts
- [x] T006 [P] Configure Playwright for E2E tests in playwright.config.ts
- [x] T007 [P] Setup GitHub Pages deployment configuration (adapter-static, base path)
- [x] T008 Create directory structure: src/lib/components/, src/lib/services/, src/lib/stores/, src/lib/models/, src/lib/utils/, src/lib/canvas/, src/lib/audio/, src/lib/routes/, static/sounds/, static/images/, tests/unit/, tests/integration/, tests/e2e/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T009 Create base TypeScript type definitions in src/lib/models/types.ts (QualityTier, UpgradeType enums)
- [x] T010 [P] Create DivinationCard model interface in src/lib/models/Card.ts
- [x] T011 [P] Create CardPool model interface in src/lib/models/CardPool.ts
- [x] T012 [P] Create Upgrade model interface in src/lib/models/Upgrade.ts
- [x] T013 [P] Create UpgradeCollection model interface in src/lib/models/UpgradeCollection.ts
- [x] T014 [P] Create GameState model interface in src/lib/models/GameState.ts
- [x] T015 [P] Create CardDrawResult model interface in src/lib/models/CardDrawResult.ts
- [x] T016 [P] Create OfflineProgressionResult model interface in src/lib/models/OfflineProgressionResult.ts
- [x] T017 Create validation utility functions in src/lib/utils/validation.ts (validateGameState, validateCardPool, validateUpgrade)
- [x] T018 [P] Create number formatting utility in src/lib/utils/numberFormat.ts (format large numbers: 1K, 1M, etc.)
- [x] T019 [P] Create weighted random selection utility in src/lib/utils/weightedRandom.ts (CDF algorithm with binary search)
- [x] T020 Create default card pool data with initial card definitions (at least 10 cards with varying weights and tiers)
- [x] T021 Create default game state factory function in src/lib/utils/defaultGameState.ts
- [x] T022 [P] Setup Svelte store structure in src/lib/stores/gameState.ts (writable store for GameState)
- [x] T023 [P] Setup error handling infrastructure (error types, error messages, user-friendly error display)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Manual Deck Opening and Card Collection (Priority: P1) 🎯 MVP

**Goal**: Player can open Stacked Decks one at a time, receive random Divination Cards based on weighted rarity, and accumulate score from card values.

**Independent Test**: Can be fully tested by manually clicking to open decks, verifying cards are drawn with correct weighted probabilities, and confirming score increases by card values. Delivers immediate gameplay value and establishes the core progression currency.

### Tests for User Story 1 (MANDATORY per constitution) ⚠️

> **NOTE: Per constitution Principle 2, tests MUST be written FIRST and ensure they FAIL before implementation. All critical paths require ≥80% coverage.**

- [x] T024 [P] [US1] Unit test for weighted random selection in tests/unit/utils/weightedRandom.test.ts (test CDF algorithm, edge cases, distribution accuracy)
- [x] T025 [P] [US1] Unit test for CardService.drawCard in tests/unit/services/cardService.test.ts (test weighted selection, upgrade effects)
- [x] T026 [P] [US1] Integration test for deck opening workflow in tests/integration/deckOpening.test.ts (test full flow: validate decks > 0, draw card, update score, decrement decks)
- [x] T027 [P] [US1] E2E test for manual deck opening in tests/e2e/deck-opening.spec.ts (test UI interaction, card display, score update)

### Implementation for User Story 1

- [x] T028 [P] [US1] Implement CardService interface in src/lib/services/cardService.ts (drawCard method with weighted random, apply upgrade effects)
- [x] T029 [US1] Implement StorageService interface in src/lib/services/storageService.ts (loadGameState, saveGameState, loadCardPool, saveCardPool using localforge)
- [x] T030 [US1] Implement GameStateService interface in src/lib/services/gameStateService.ts (getGameState, updateGameState, openDeck, initialize methods)
- [x] T031 [US1] Create main game page component in src/lib/routes/+page.svelte (basic layout, deck opening button, score display)
- [x] T032 [US1] Integrate GameStateService with Svelte store in src/lib/stores/gameState.ts (sync service state with reactive store)
- [x] T033 [US1] Add deck opening button handler in src/lib/routes/+page.svelte (call gameStateService.openDeck, handle errors)
- [x] T034 [US1] Add score display component in src/lib/components/ScoreDisplay.svelte (reactive score display with formatting)
- [x] T035 [US1] Add deck count display in src/lib/routes/+page.svelte (show available decks, prevent opening when 0)
- [x] T036 [US1] Add error handling for zero decks scenario (display user-friendly message when attempting to open with no decks)
- [x] T037 [US1] Add game state initialization on page load (load from storage or create default, handle corrupted data)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Player can open decks, see cards drawn, and score accumulates correctly.

---

## Phase 4: User Story 2 - Score-Based Upgrade System (Priority: P2)

**Goal**: Player can spend accumulated score to purchase upgrades that enhance gameplay efficiency (auto-opening, improved rarity, luck, multidraw, deck production, scene customization).

**Independent Test**: Can be fully tested by accumulating score through manual deck opening, purchasing various upgrades, and verifying that upgrade effects are immediately active and measurable. Delivers strategic depth and exponential progression feel.

### Tests for User Story 2 (MANDATORY per constitution) ⚠️

- [x] T038 [P] [US2] Unit test for UpgradeService.calculateUpgradeCost in tests/unit/services/upgradeService.test.ts (test cost calculation with multipliers)
- [x] T039 [P] [US2] Unit test for UpgradeService.calculateUpgradeEffect in tests/unit/services/upgradeService.test.ts (test effect calculation for each upgrade type)
- [x] T040 [P] [US2] Unit test for UpgradeService.canAffordUpgrade in tests/unit/services/upgradeService.test.ts (test affordability checks)
- [x] T041 [P] [US2] Integration test for upgrade purchase workflow in tests/integration/upgradePurchase.test.ts (test purchase flow: check affordability, deduct score, activate upgrade, verify effect)
- [x] T042 [P] [US2] E2E test for upgrade purchase in tests/e2e/upgrades.spec.ts (test UI interaction, purchase button, upgrade activation)

### Implementation for User Story 2

- [x] T043 [P] [US2] Implement UpgradeService interface in src/lib/services/upgradeService.ts (calculateUpgradeCost, calculateUpgradeEffect, canAffordUpgrade, getAvailableUpgrades, calculateAutoOpeningRate, calculateDeckProductionRate)
- [x] T044 [US2] Extend CardService to support upgrade effects in src/lib/services/cardService.ts (applyRarityUpgrade, applyLuckUpgrade methods)
- [x] T045 [US2] Extend GameStateService.purchaseUpgrade in src/lib/services/gameStateService.ts (validate affordability, deduct score, update upgrade level, save state)
- [x] T046 [US2] Create UpgradeShop component in src/lib/components/UpgradeShop.svelte (display available upgrades, costs, effects, purchase buttons)
- [x] T047 [US2] Integrate upgrade shop into main page in src/lib/routes/+page.svelte (add upgrade shop section)
- [x] T048 [US2] Add upgrade effect application to deck opening in src/lib/services/gameStateService.ts (apply rarity/luck upgrades when drawing cards)
- [x] T049 [US2] Implement auto-opening upgrade functionality in src/lib/services/gameStateService.ts (interval-based automatic deck opening when upgrade active)
- [x] T050 [US2] Implement multidraw upgrade functionality in src/lib/services/gameStateService.ts (openMultipleDecks method, batch card drawing)
- [x] T051 [US2] Add upgrade purchase error handling (insufficient score, invalid upgrade type, display user-friendly messages)
- [x] T052 [US2] Add upgrade effect indicators in UI (show active upgrade levels, current effects)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Player can open decks, accumulate score, and purchase upgrades that immediately affect gameplay.

---

## Phase 5: User Story 3 - Idle and Offline Progression (Priority: P3)

**Goal**: Player closes the game and returns later to find that auto-opening has continued in their absence, with decks opened and score accumulated based on elapsed time and upgrade levels.

**Independent Test**: Can be fully tested by enabling auto-opening, closing the game, waiting a known duration, reopening the game, and verifying that the correct number of decks were auto-opened and score accumulated. Delivers the idle game satisfaction of returning to accumulated progress.

### Tests for User Story 3 (MANDATORY per constitution) ⚠️

- [x] T053 [P] [US3] Unit test for OfflineService.calculateOfflineProgression in tests/unit/services/offlineService.test.ts (test elapsed time calculation, deck count calculation, time capping)
- [x] T054 [P] [US3] Unit test for OfflineService.simulateDeckOpening in tests/unit/services/offlineService.test.ts (test deterministic PRNG usage, upgrade effects in simulation)
- [x] T055 [P] [US3] Integration test for offline progression workflow in tests/integration/offlineProgression.test.ts (test full flow: save state, simulate time passage, load state, calculate progression, update state)
- [x] T056 [P] [US3] E2E test for offline progression in tests/e2e/offline-progression.spec.ts (test game close/reopen, offline calculation, summary display)

### Implementation for User Story 3

- [x] T057 [P] [US3] Implement OfflineService interface in src/lib/services/offlineService.ts (calculateOfflineProgression, simulateDeckOpening methods with deterministic PRNG)
- [x] T058 [US3] Extend GameStateService.processOfflineProgression in src/lib/services/gameStateService.ts (calculate elapsed time, call offline service, update game state)
- [x] T059 [US3] Add offline progression calculation on game initialization in src/lib/services/gameStateService.ts (call processOfflineProgression after loading state)
- [x] T060 [US3] Create OfflineProgress component in src/lib/components/OfflineProgress.svelte (display offline progression summary: time elapsed, decks opened, score gained, cards found)
- [x] T061 [US3] Integrate offline progress display into main page in src/lib/routes/+page.svelte (show summary when offline progression detected)
- [x] T062 [US3] Add timestamp tracking to game state saves in src/lib/services/storageService.ts (update lastSessionTimestamp on every save)
- [x] T063 [US3] Implement offline time capping logic in src/lib/services/offlineService.ts (cap to 7 days maximum, set capped flag)
- [x] T064 [US3] Add handling for no auto-opening upgrade scenario in src/lib/services/offlineService.ts (return empty result when no auto-opening active)
- [x] T065 [US3] Add deck production upgrade integration in src/lib/services/offlineService.ts (calculate deck production during offline time)

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently. Player can open decks, purchase upgrades, and receive offline progression when returning to the game.

---

## Phase 6: User Story 4 - Visual Card Drop Effects and Scene (Priority: P4)

**Goal**: When a card is opened, it visually appears in a customizable scene with appropriate visual and audio feedback based on the card's rarity and value tier.

**Independent Test**: Can be fully tested by opening decks and verifying that cards appear visually in the scene, appropriate sounds play based on card tier, and rare cards are visually distinguished. Delivers immediate sensory satisfaction that reinforces the core loop.

### Tests for User Story 4 (MANDATORY per constitution) ⚠️

- [x] T066 [P] [US4] Unit test for CanvasService.addCard in tests/unit/canvas/canvasService.test.ts (test card addition, animation initialization)
- [x] T067 [P] [US4] Unit test for AudioService.playCardDropSound in tests/unit/audio/audioService.test.ts (test sound playback by quality tier)
- [x] T068 [P] [US4] Integration test for visual/audio feedback in tests/integration/visualFeedback.test.ts (test card drop triggers both visual and audio)
- [x] T069 [P] [US4] E2E test for card drop effects in tests/e2e/card-effects.spec.ts (test visual appearance, audio playback, rarity highlighting)

### Implementation for User Story 4

- [x] T070 [P] [US4] Implement AudioService interface in src/lib/audio/audioManager.ts (playCardDropSound, playUpgradeSound, playScoreGainSound, setVolume, setMuted, preloadAudio using Howler.js)
- [x] T071 [P] [US4] Create audio files structure in static/sounds/ (common card sound, rare card sound, epic card sound, legendary card sound, upgrade sound, score gain sound)
- [x] T072 [US4] Implement CanvasService interface in src/lib/canvas/renderer.ts (initialize, addCard, updateCustomizations, clearCards, start, stop, destroy methods)
- [x] T073 [US4] Implement card animation system in src/lib/canvas/cardAnimation.ts (drop animation, fade effects, rarity-based visual effects: glow, highlight)
- [x] T074 [US4] Implement scene rendering in src/lib/canvas/scene.ts (background rendering, card positioning, viewport management, object pooling for performance)
- [x] T075 [US4] Create GameCanvas component in src/lib/components/GameCanvas.svelte (canvas element, lifecycle management with onMount/onDestroy)
- [x] T076 [US4] Integrate canvas into main page in src/lib/routes/+page.svelte (add GameCanvas component, pass card draw events)
- [x] T077 [US4] Connect card drawing to canvas in src/lib/services/gameStateService.ts (emit card draw events, trigger canvas.addCard)
- [x] T078 [US4] Connect card drawing to audio in src/lib/services/gameStateService.ts (call audioService.playCardDropSound with quality tier)
- [x] T079 [US4] Implement performance optimizations in src/lib/canvas/renderer.ts (requestAnimationFrame loop, object pooling, viewport culling, dirty rectangle updates)
- [x] T080 [US4] Add card limit management in src/lib/canvas/scene.ts (limit visible cards to 100-150, fade out/remove oldest cards)
- [x] T081 [US4] Add rarity-based visual effects in src/lib/canvas/cardAnimation.ts (enhanced glow for rare cards, special animations for epic/legendary)

**Checkpoint**: At this point, User Stories 1-4 should all work. Player can open decks, see visual card drops with animations, hear audio feedback, and rare cards are visually distinguished.

---

## Phase 7: User Story 5 - Scene Customization (Priority: P5)

**Goal**: Player can spend score to customize the visual scene (loot table, shrine, or room) with cosmetic upgrades that personalize the experience without affecting gameplay mechanics.

**Independent Test**: Can be fully tested by purchasing scene customization options and verifying that visual changes are applied and persist across game sessions. Delivers personalization and extended progression goals.

### Tests for User Story 5 (MANDATORY per constitution) ⚠️

- [x] T082 [P] [US5] Unit test for customization purchase in tests/unit/services/gameStateService.test.ts (test purchaseCustomization method, state update, persistence)
- [x] T083 [P] [US5] Integration test for customization persistence in tests/integration/customization.test.ts (test purchase, save, reload, verify restoration)
- [x] T084 [P] [US5] E2E test for scene customization in tests/e2e/customization.spec.ts (test purchase UI, visual changes, persistence)

### Implementation for User Story 5

- [x] T085 [P] [US5] Extend GameStateService.purchaseCustomization in src/lib/services/gameStateService.ts (validate affordability, deduct score, activate customization, save state)
- [x] T086 [US5] Create customization data structure (define available customizations with IDs, costs, visual descriptions)
- [x] T087 [US5] Extend CanvasService.updateCustomizations in src/lib/canvas/renderer.ts (apply visual customizations to scene background/elements)
- [x] T088 [US5] Create customization shop UI component in src/lib/components/CustomizationShop.svelte (display available customizations, costs, previews, purchase buttons)
- [x] T089 [US5] Integrate customization shop into main page in src/lib/routes/+page.svelte (add customization shop section)
- [x] T090 [US5] Load and apply customizations on game initialization in src/lib/services/gameStateService.ts (restore active customizations from saved state)
- [x] T091 [US5] Add customization preview functionality in src/lib/components/CustomizationShop.svelte (show preview of customization before purchase)

**Checkpoint**: At this point, all user stories should be complete. Player can open decks, purchase upgrades, receive offline progression, see visual/audio effects, and customize the scene.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T092 [P] Add loading states for game initialization in src/lib/routes/+page.svelte (show loading indicator during state load, offline calculation)
- [x] T093 [P] Add keyboard accessibility in src/lib/components/UpgradeShop.svelte (keyboard navigation, Enter/Space activation)
- [x] T094 [P] Add keyboard accessibility in src/lib/routes/+page.svelte (keyboard shortcuts for deck opening, focus management)
- [x] T095 [P] Add screen reader support in src/lib/components/ScoreDisplay.svelte (ARIA live regions for score updates)
- [x] T096 [P] Add screen reader support in src/lib/components/GameCanvas.svelte (ARIA labels, descriptions for canvas content)
- [ ] T097 [P] Verify WCAG 2.1 AA color contrast ratios across all UI components
- [x] T098 [P] Add error boundary component for graceful error handling in src/lib/components/ErrorBoundary.svelte
- [x] T099 [P] Add storage quota exceeded error handling in src/lib/services/storageService.ts (catch quota errors, show user-friendly message)
- [x] T100 [P] Add corrupted data recovery in src/lib/services/storageService.ts (validate loaded data, attempt recovery, fallback to defaults)
- [x] T101 [P] Implement debounced auto-save in src/lib/services/storageService.ts (save 500ms after last state change, save immediately on critical events)
- [x] T102 [P] Add performance monitoring in src/lib/utils/performance.ts (track load times, interaction response times, canvas FPS)
- [ ] T103 [P] Add unit tests to achieve ≥80% coverage in tests/unit/ (fill coverage gaps for all services, utils, models)
- [ ] T104 [P] Performance testing and validation against constitution benchmarks (verify <3s load, <100ms interactions, 60fps canvas, <100MB memory)
- [ ] T105 [P] Accessibility testing (WCAG 2.1 AA compliance audit, screen reader testing, keyboard navigation testing)
- [x] T106 [P] Add responsive design for mobile devices in src/lib/routes/+page.svelte (mobile-friendly layout, touch interactions)
- [ ] T107 [P] Code cleanup and refactoring (remove dead code, improve naming, add JSDoc comments)
- [ ] T108 [P] Documentation updates (README.md with setup instructions, API documentation for services)
- [ ] T109 Run quickstart.md validation (verify all setup steps work, update if needed)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4 → P5)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 for deck opening functionality
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Depends on US1 (deck opening) and US2 (auto-opening upgrade)
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - Depends on US1 (card drawing events)
- **User Story 5 (P5)**: Can start after Foundational (Phase 2) - Depends on US2 (score spending) and US4 (canvas scene)

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD approach)
- Models before services (if new models needed)
- Services before UI components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002-T008)
- All Foundational model tasks marked [P] can run in parallel (T010-T016)
- All test tasks for a user story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members (after foundational phase)
- Polish tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task T024: "Unit test for weighted random selection in tests/unit/utils/weightedRandom.test.ts"
Task T025: "Unit test for CardService.drawCard in tests/unit/services/cardService.test.ts"
Task T026: "Integration test for deck opening workflow in tests/integration/deckOpening.test.ts"
Task T027: "E2E test for manual deck opening in tests/e2e/deck-opening.spec.ts"

# Launch model creation tasks together (if needed):
Task T010: "Create DivinationCard model interface in src/lib/models/Card.ts"
Task T011: "Create CardPool model interface in src/lib/models/CardPool.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (deck opening)
   - Developer B: User Story 2 (upgrades) - can start after US1 core is done
   - Developer C: User Story 4 (visual/audio) - can start in parallel with US1
3. After US1-2 complete:
   - Developer A: User Story 3 (offline progression)
   - Developer B: User Story 5 (customization)
   - Developer C: Polish tasks
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD approach)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All services must be testable in isolation with mocked dependencies
- Use deterministic random seeds (seedrandom) in tests for reproducibility
- Performance: Monitor canvas FPS, memory usage, interaction response times
- Accessibility: Test with screen readers, keyboard-only navigation, verify WCAG 2.1 AA compliance

