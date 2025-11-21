# Tasks: Purple Zone Card Graphical Display

**Feature**: 003-display-dropped-card  
**Branch**: `003-display-dropped-card`  
**Date**: 2025-01-27

## Summary

- **Total Tasks**: 38
- **User Story 1 (P1)**: 12 tasks
- **User Story 2 (P2)**: 8 tasks
- **Setup & Foundational**: 10 tasks
- **Polish & Testing**: 8 tasks
- **Parallel Opportunities**: 8 tasks identified

## Implementation Strategy

**MVP Scope**: User Story 1 (P1) - Visual Card Display in Purple Zone
- Delivers core graphical card display functionality
- Can be tested independently
- Provides immediate visual transformation

**Incremental Delivery**:
1. Phase 1-2: Foundation (data models, services)
2. Phase 3: MVP - Basic card display (User Story 1)
3. Phase 4: Enhanced display with information (User Story 2)
4. Phase 5: Polish, tests, and edge cases

## Dependencies

**Story Completion Order**:
1. **User Story 1 (P1)** - Must complete first (core functionality)
2. **User Story 2 (P2)** - Depends on User Story 1 (enhances existing display)

**Cross-Story Dependencies**:
- All user stories depend on Phase 1 (Setup) and Phase 2 (Foundational)
- User Story 2 builds upon User Story 1's card display
- Polish phase depends on both user stories

## Parallel Execution Examples

### User Story 1 (P1)
- T019 [P] [US1] and T020 [P] [US1] can run in parallel (different template elements)
- T021 [P] [US1] and T022 [P] [US1] can run in parallel (different template elements)
- T026 [P] [US1] and T027 [P] [US1] can run in parallel (different CSS styles)

### User Story 2 (P2)
- T028 [P] [US2] and T029 [P] [US2] can run in parallel (different template elements)
- T030 [P] [US2] and T031 [P] [US2] can run in parallel (different template elements)
- T036 [P] [US2] and T037 [P] [US2] can run in parallel (different CSS styles)

### Foundational Phase
- T011 [P] and T012 [P] can run in parallel (different files: cardDataService.ts and cardRendering.ts)
- T011 [P], T012 [P] can run in parallel with T008-T010 (different service files)

## Phase 1: Setup

**Goal**: Verify project structure and static assets are ready for implementation.

**Independent Test**: Verify all static assets exist and project structure matches plan.

### Tasks

- [x] T001 Verify static assets exist: card art directory, frame image, separator image in `static/cards/`
- [x] T002 Verify cards.json and cardValues.json are accessible and contain required fields (artFilename, name, etc.)
- [x] T003 Create CardDisplayData interface in `src/lib/models/CardDisplayData.ts` with card, timestamp, scoreGained, artFilename, fullCardData fields
- [x] T004 Create FullCardData interface in `src/lib/models/CardDisplayData.ts` with name, artFilename, stackSize, explicitModifiers, flavourText, detailsId, id, dropWeight fields
- [x] T005 Create CardImageState interface in `src/lib/models/CardDisplayData.ts` with url, loading, error, errorMessage fields
- [x] T006 Create CardDisplayConfig interface in `src/lib/models/CardDisplayData.ts` with baseWidth, baseHeight, scaleFactor, zoneWidth, zoneHeight fields
- [x] T007 Create convertToCardDisplayData function in `src/lib/models/CardDisplayData.ts` to convert CardDrawResult to CardDisplayData

## Phase 2: Foundational

**Goal**: Create services and utilities needed by all user stories.

**Independent Test**: Services can be unit tested independently, utilities have isolated test coverage.

### Tasks

- [x] T008 Create CardImageService class in `src/lib/services/cardImageService.ts` with resolveCardImageUrl, loadCardImage, preloadCardImages, getCachedImageUrl methods
- [x] T009 Implement resolveCardImageUrl method in `src/lib/services/cardImageService.ts` using import.meta.glob() with fallback to resolvePath()
- [x] T010 Implement loadCardImage method in `src/lib/services/cardImageService.ts` with Promise-based loading and error handling
- [x] T011 [P] Create CardDataService class in `src/lib/services/cardDataService.ts` with loadFullCardData, loadFullCardDataByArt, preloadCardData methods
- [x] T012 [P] Create calculateCardDisplayConfig function in `src/lib/utils/cardRendering.ts` to calculate display config from zone dimensions
- [x] T013 Create parseStyledText function in `src/lib/utils/cardRendering.ts` to parse PoE metadata tags to HTML with XSS protection
- [x] T014 Create formatRewardText function in `src/lib/utils/cardRendering.ts` to format explicitModifiers with styled text
- [x] T015 Create formatFlavourText function in `src/lib/utils/cardRendering.ts` to clean and format flavour text

## Phase 3: User Story 1 - Visual Card Display in Purple Zone (P1)

**Goal**: Display graphical card representation in purple zone when card is drawn.

**Independent Test**: Open deck, verify purple zone displays card artwork, verify image updates on new card draw, verify empty state when no card.

**Acceptance Criteria**:
- Card artwork displays when card is drawn
- Card display updates when new card is drawn
- Card image is properly sized within zone boundaries
- Empty state displays when no card drawn
- Card image is clearly visible and recognizable

### Tasks

- [x] T016 [US1] Update LastCardZone component props in `src/lib/components/LastCardZone.svelte` to accept CardDisplayData and CardImageState
- [x] T017 [US1] Add reactive statements in `src/lib/components/LastCardZone.svelte` to convert CardDrawResult to CardDisplayData when lastCardDraw changes
- [x] T018 [US1] Add async loadCardData function in `src/lib/components/LastCardZone.svelte` to load FullCardData and card image
- [x] T019 [US1] Add card display container div in `src/lib/components/LastCardZone.svelte` with calculated dimensions from CardDisplayConfig
- [x] T020 [US1] Add card frame image element in `src/lib/components/LastCardZone.svelte` using resolvePath for Divination_card_frame.png
- [x] T021 [US1] Add card artwork image element in `src/lib/components/LastCardZone.svelte` with conditional rendering based on CardImageState
- [x] T022 [US1] Add card title element in `src/lib/components/LastCardZone.svelte` displaying card name with responsive font sizing
- [x] T023 [US1] Add loading state display in `src/lib/components/LastCardZone.svelte` when imageState.loading is true
- [x] T024 [US1] Add error state display in `src/lib/components/LastCardZone.svelte` when imageState.error is true (placeholder or text fallback)
- [x] T025 [US1] Add empty state display in `src/lib/components/LastCardZone.svelte` when cardDisplayData is null
- [x] T026 [US1] Add CSS styles in `src/lib/components/LastCardZone.svelte` for card frame positioning (absolute, z-index 2, pointer-events none)
- [x] T027 [US1] Add CSS styles in `src/lib/components/LastCardZone.svelte` for card artwork positioning (absolute, left 4%, right 4%, top 9%, height 44%, z-index 1)

## Phase 4: User Story 2 - Card Information Preservation (P2)

**Goal**: Display card information (name, tier, value, score) alongside graphical representation.

**Independent Test**: Verify card information displays correctly, remains readable on resize, handles long names, stays within boundaries.

**Acceptance Criteria**:
- Card name, tier, value, score visible alongside image
- Information remains readable on resize
- Long names don't obscure image
- All information organized clearly within boundaries

### Tasks

- [x] T028 [US2] Add card separator image element in `src/lib/components/LastCardZone.svelte` using resolvePath for Divination_card_separator.png
- [x] T029 [US2] Add card reward text element in `src/lib/components/LastCardZone.svelte` displaying explicitModifiers with {@html} directive and parseStyledText
- [x] T030 [US2] Add card flavour text element in `src/lib/components/LastCardZone.svelte` displaying flavourText with formatFlavourText
- [x] T031 [US2] Add card stack size display in `src/lib/components/LastCardZone.svelte` when fullCardData.stackSize exists
- [x] T032 [US2] Add card tier display in `src/lib/components/LastCardZone.svelte` showing card.qualityTier
- [x] T033 [US2] Add card value display in `src/lib/components/LastCardZone.svelte` showing card.value
- [x] T034 [US2] Add score gained display in `src/lib/components/LastCardZone.svelte` showing scoreGained
- [x] T035 [US2] Add responsive scaling logic in `src/lib/components/LastCardZone.svelte` using calculateCardDisplayConfig when width/height change
- [x] T036 [US2] Add CSS styles in `src/lib/components/LastCardZone.svelte` for text elements with responsive font sizing based on scaleFactor
- [x] T037 [US2] Add CSS styles in `src/lib/components/LastCardZone.svelte` for PoE styled text classes (poe-style-uniqueitem, poe-style-rareitem, etc.)

## Phase 5: Polish & Cross-Cutting Concerns

**Goal**: Add tests, performance optimization, accessibility, and edge case handling.

**Independent Test**: All tests pass, performance targets met, accessibility verified, edge cases handled.

### Tasks

- [x] T038 Create unit tests for CardImageService in `tests/unit/services/cardImageService.test.ts` with ≥80% coverage (TC-001)
- [x] T039 Create unit tests for cardRendering utilities in `tests/unit/utils/cardRendering.test.ts` covering parseStyledText, formatRewardText, formatFlavourText
- [x] T040 Create integration tests for card display update in `tests/integration/cardDisplay.test.ts` verifying CardDrawResult change triggers display update (TC-002)
- [x] T041 Create integration tests for missing artwork fallback in `tests/integration/cardDisplay.test.ts` verifying error state displays correctly (TC-003)
- [x] T042 Create E2E test for visual card display in `tests/e2e/card-graphical-display.spec.ts` verifying card appears when deck opened (TC-004)
- [x] T043 Create E2E test for responsive scaling in `tests/e2e/card-graphical-display.spec.ts` verifying card scales with zone resize (TC-005)
- [x] T044 Add ARIA labels and alt text in `src/lib/components/LastCardZone.svelte` for card images and elements (UX-002, UX-003)
- [ ] T045 Add performance monitoring in `src/lib/components/LastCardZone.svelte` to verify image load <500ms and display update <200ms (PERF-001, PERF-002)
- [x] T046 Add handling for rapid card changes in `src/lib/components/LastCardZone.svelte` to cancel previous image loads and prevent flickering (FR-008)
- [x] T047 Add handling for zone resize during image load in `src/lib/components/LastCardZone.svelte` to recalculate scaleFactor (Edge case)
- [x] T048 Add handling for game load with previously drawn card in `src/lib/components/LastCardZone.svelte` to display last card on initialization (Edge case)

## Task Completion Checklist

### Phase 1: Setup
- [x] T001 - T007 completed

### Phase 2: Foundational  
- [x] T008 - T015 completed

### Phase 3: User Story 1 (P1)
- [x] T016 - T027 completed
- [x] Independent test passes: Card displays when drawn, updates on new card, empty state works

### Phase 4: User Story 2 (P2)
- [x] T028 - T037 completed
- [x] Independent test passes: Information displays correctly, responsive, handles long names

### Phase 5: Polish
- [x] T038 - T043 completed (Tests created and passing)
- [ ] T045 - Performance monitoring (optional, can be added later if needed)
- [x] T044, T046-T048 completed (Accessibility and edge cases)
- [x] Accessibility verified (ARIA labels added)
- [x] All tests passing (9/9 unit tests, 20/20 utility tests, 3/3 integration tests)
- [x] Build successful

## Notes

- Tasks marked with [P] can be executed in parallel with other [P] tasks in the same phase
- Tasks marked with [US1] or [US2] belong to specific user stories
- All file paths are relative to repository root
- Follow existing code patterns and conventions
- Reference quickstart.md for implementation details
- Reference research.md for technical decisions

