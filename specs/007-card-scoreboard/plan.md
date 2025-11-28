# Implementation Plan: Card Drop Scoreboard

**Branch**: `007-card-scoreboard` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-card-scoreboard/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement a scoreboard feature that displays cards dropped by the player during the current session. The scoreboard shows drop counts, card values, and total accumulated values per card. It supports sorting by multiple columns (name, drop count, card value, total value) with ASC/DESC order, and integrates with the tier filter system to optionally include/exclude hidden cards. The feature uses existing card drop tracking (cardCollection in GameState) and tier service integration for visibility filtering.

**Phase 0 Complete**: Research decisions documented in research.md  
**Phase 1 Complete**: Data model, contracts, and quickstart guide generated  
**Phase 2 Pending**: Task breakdown (via /speckit.tasks command)

## Technical Context

**Language/Version**: TypeScript 5.3.0, Svelte 4.2.0  
**Primary Dependencies**: SvelteKit 2.0.0, Vite 5.0.0, LocalForage 1.10.0 (for IndexedDB storage)  
**Storage**: IndexedDB via StorageService (existing), in-memory session state  
**Testing**: Vitest 1.0.0, Playwright 1.40.0, @testing-library/svelte 4.0.0  
**Target Platform**: Web browser (static site, deployed via GitHub Pages)  
**Project Type**: Single web application (SvelteKit SPA)  
**Performance Goals**: Scoreboard renders within 1s for 200 cards, sorting completes within 200ms, updates within 500ms on card drops  
**Constraints**: Session-only data (not persisted), must handle 200+ unique cards with 1000+ total drops efficiently, real-time updates required  
**Scale/Scope**: Single-user game, session-based statistics tracking, integrates with existing tier filter and game state systems

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Code Quality**: ✅ Verify code structure, naming conventions, and maintainability approach align with constitution standards.
- Follow existing service layer pattern (scoreboardService.ts similar to tierService.ts, gameStateService.ts)
- TypeScript interfaces for type safety (ScoreboardEntry, ScoreboardState, CardDropEvent, SessionDropHistory)
- Component structure follows Svelte conventions (Scoreboard.svelte similar to TierManagement.svelte)
- Clear separation of concerns: models, services, components, stores
- Reuse existing patterns: gameStateService for card drop tracking, tierService for visibility filtering
- Session state management using reactive Svelte stores (similar to tierStore pattern)

**Testing Standards**: ✅ Confirm test strategy (unit/integration/E2E) and coverage targets (≥80% for critical paths) are defined.
- Unit tests for scoreboard display logic and statistics calculation (TC-001: ≥80% coverage)
- Unit tests for sorting functionality (TC-002)
- Integration tests for tier filter integration (TC-003)
- Integration tests for drop tracking and aggregation (TC-004)
- Integration tests for real-time updates (TC-005)
- E2E tests for scoreboard UI workflows (sorting, filtering, updates)
- Performance tests for large datasets (TC-007: 200+ cards, 1000+ drops)
- Edge case tests (TC-006: empty scoreboard, duplicate cards, tier changes)

**User Experience Consistency**: ✅ Validate UX patterns, accessibility requirements (WCAG 2.1 AA), and design system alignment.
- ARIA labels for scoreboard table and sort controls (UX-003, UX-004)
- Keyboard navigation support for scoreboard interactions (UX-002)
- Consistent with existing table/list UI patterns (UX-008, UX-009, UX-012)
- Visual indicators for sort column and direction (UX-005, UX-016)
- Clear empty state messaging (UX-017)
- Real-time update feedback (UX-013, UX-014, UX-015)
- Consistent toggle/checkbox pattern for "include hidden cards" option (UX-010)

**Performance Requirements**: ✅ Define performance benchmarks (load times <3s, API <500ms, interactive <100ms) and monitoring approach.
- Scoreboard render: <1s for 200 cards (PERF-001, SC-001)
- Sorting: <200ms (PERF-002, SC-003)
- Filtering: <100ms (PERF-003)
- Update on card drop: <500ms (PERF-004, SC-002)
- Statistics calculation: <50ms (PERF-006)
- Tier visibility change update: <500ms (PERF-007, SC-009)
- Handle 200+ cards, 1000+ drops without degradation (PERF-005, PERF-008, SC-007)

## Project Structure

### Documentation (this feature)

```text
specs/007-card-scoreboard/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── components/
│   │   └── Scoreboard.svelte              # NEW: Scoreboard UI component
│   ├── models/
│   │   ├── ScoreboardEntry.ts             # NEW: Scoreboard entry interface
│   │   ├── ScoreboardState.ts             # NEW: Scoreboard state interface
│   │   ├── CardDropEvent.ts               # NEW: Card drop event interface
│   │   └── SessionDropHistory.ts          # NEW: Session drop history interface
│   ├── services/
│   │   └── scoreboardService.ts           # NEW: Scoreboard business logic
│   └── stores/
│       └── scoreboardStore.ts             # NEW: Reactive scoreboard state management
│
tests/
├── unit/
│   ├── services/
│   │   └── scoreboardService.test.ts      # NEW: Unit tests for scoreboard logic
│   └── models/
│       └── scoreboardModels.test.ts       # NEW: Unit tests for data models
├── integration/
│   ├── scoreboardIntegration.test.ts      # NEW: Integration tests for scoreboard
│   └── scoreboardTierFilter.test.ts       # NEW: Integration tests for tier filter integration
└── e2e/
    └── scoreboard.spec.ts                 # NEW: E2E tests for scoreboard UI
```

**Structure Decision**: Single SvelteKit web application. The feature extends the existing architecture with a new scoreboard service, models, and UI component. The scoreboard integrates with existing gameStateService (for card drop tracking via cardCollection) and tierService (for visibility filtering). Session state is managed in-memory using reactive Svelte stores, following the same pattern as tierStore. The Scoreboard component follows the same design patterns as TierManagement.svelte.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
