# Implementation Plan: Stacked Deck Clicker Game

**Branch**: `001-stacked-deck-clicker` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-stacked-deck-clicker/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a browser-based incremental/idle game where players open Stacked Decks to collect Divination Cards with weighted rarity, accumulate score, and purchase upgrades for exponential progression. The game uses SvelteKit for the framework, HTML5 Canvas for rendering/animations, IndexedDB (via localforge) for persistence, Howler.js for audio, and seedrandom for deterministic PRNG. All gameplay runs client-side with no backend, deployed to GitHub Pages.

## Technical Context

**Language/Version**: TypeScript/JavaScript (ES2020+), SvelteKit (latest stable)  
**Primary Dependencies**: SvelteKit, HTML5 Canvas API, localforge (IndexedDB wrapper), Howler.js (audio), seedrandom (PRNG), Vite (build tool)  
**Storage**: IndexedDB via localforge for game state persistence (score, upgrades, decks, customizations, last session timestamp)  
**Testing**: Vitest (unit/integration), Playwright (E2E), @testing-library/svelte (component testing)  
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge - latest 2 versions), desktop and mobile responsive  
**Project Type**: Single-page web application (SPA)  
**Performance Goals**: 60fps canvas rendering with 100+ visible cards, <100ms interaction response, <3s initial load, <1s offline calculation for 7 days  
**Constraints**: Client-side only (no backend), <100MB memory usage, must handle large numbers (score overflow), offline-capable, GitHub Pages deployment (static hosting)  
**Scale/Scope**: Single-player game, unlimited play sessions, handle millions of score values, support 1000+ card draws per session

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Code Quality**: ✅ SvelteKit provides component-based architecture with clear separation of concerns. TypeScript ensures type safety and maintainability. Code structure will follow SvelteKit conventions with reusable components, services, and utilities. Naming conventions will follow JavaScript/TypeScript standards.

**Testing Standards**: ✅ Test strategy defined: Vitest for unit/integration tests, Playwright for E2E tests, @testing-library/svelte for component tests. Coverage target: ≥80% for critical paths (card drawing logic, score calculation, upgrade system, offline progression, state persistence). Tests will use deterministic random seeds via seedrandom for reproducibility.

**User Experience Consistency**: ✅ UX patterns will follow SvelteKit component patterns with consistent styling. Accessibility: WCAG 2.1 Level AA compliance required (keyboard navigation, screen reader support, color contrast, text alternatives). Design system will be established in Phase 1 with consistent spacing, typography, and component usage.

**Performance Requirements**: ✅ Benchmarks defined: <3s initial load, <100ms interaction response, <500ms save operations, 60fps canvas rendering, <1s offline calculation for 7 days, <100MB memory usage. Performance monitoring via browser DevTools and manual testing. Canvas rendering optimized for 100+ visible cards.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
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
│   ├── components/          # Svelte components (UI)
│   │   ├── GameCanvas.svelte
│   │   ├── CardDisplay.svelte
│   │   ├── UpgradeShop.svelte
│   │   ├── ScoreDisplay.svelte
│   │   └── OfflineProgress.svelte
│   ├── stores/              # Svelte stores (state management)
│   │   ├── gameState.ts
│   │   └── upgrades.ts
│   ├── services/            # Business logic services
│   │   ├── cardService.ts   # Card drawing, weighted RNG
│   │   ├── upgradeService.ts # Upgrade calculations
│   │   ├── offlineService.ts # Offline progression
│   │   └── storageService.ts # IndexedDB persistence
│   ├── models/              # Data models/types
│   │   ├── Card.ts
│   │   ├── Upgrade.ts
│   │   └── GameState.ts
│   ├── utils/               # Utility functions
│   │   ├── weightedRandom.ts
│   │   ├── numberFormat.ts
│   │   └── validation.ts
│   ├── canvas/              # Canvas rendering/animation
│   │   ├── renderer.ts
│   │   ├── cardAnimation.ts
│   │   └── scene.ts
│   ├── audio/               # Audio management
│   │   └── audioManager.ts
│   └── routes/              # SvelteKit routes
│       └── +page.svelte     # Main game page
├── static/                  # Static assets
│   ├── sounds/              # Audio files
│   └── images/              # Card artwork (optional)
└── app.html                 # HTML template

tests/
├── unit/                    # Unit tests (Vitest)
│   ├── services/
│   ├── utils/
│   └── models/
├── integration/             # Integration tests (Vitest)
│   ├── cardService.test.ts
│   ├── upgradeService.test.ts
│   └── offlineService.test.ts
└── e2e/                     # End-to-end tests (Playwright)
    ├── deck-opening.spec.ts
    ├── upgrades.spec.ts
    └── offline-progression.spec.ts
```

**Structure Decision**: Single-page web application structure following SvelteKit conventions. Components in `lib/components/`, business logic in `lib/services/`, state management via Svelte stores, canvas rendering in `lib/canvas/`, and comprehensive test coverage across unit/integration/E2E layers.

## Phase Completion Status

### Phase 0: Research ✅ Complete

**Output**: [research.md](./research.md)

All technical decisions documented:
- SvelteKit framework patterns
- HTML5 Canvas optimization strategies
- IndexedDB/localforge persistence patterns
- Howler.js audio management
- seedrandom PRNG usage
- Vite build configuration for GitHub Pages
- Weighted random selection algorithm
- Offline progression calculation
- Large number handling

**Status**: All NEEDS CLARIFICATION items resolved. Ready for Phase 1.

### Phase 1: Design & Contracts ✅ Complete

**Outputs**:
- [data-model.md](./data-model.md) - Entity definitions, relationships, validation rules
- [contracts/service-interfaces.md](./contracts/service-interfaces.md) - Service API contracts
- [quickstart.md](./quickstart.md) - Developer setup guide

**Data Model**: Complete entity definitions for DivinationCard, CardPool, Upgrade, GameState, and related entities with full TypeScript interfaces and validation rules.

**Service Contracts**: All service interfaces defined (CardService, UpgradeService, OfflineService, StorageService, GameStateService, AudioService, CanvasService) with error handling and testing requirements.

**Quickstart**: Complete setup instructions for development environment.

**Status**: Design artifacts complete. Ready for Phase 2 (task breakdown).

### Phase 2: Task Breakdown

**Status**: Pending - To be completed by `/speckit.tasks` command.

## Constitution Check (Post-Design)

*Re-evaluated after Phase 1 design completion.*

**Code Quality**: ✅ Architecture follows SvelteKit best practices with clear separation of concerns. Service interfaces ensure testability and maintainability.

**Testing Standards**: ✅ All services designed with testability in mind. Interfaces support dependency injection for mocking. Test strategy covers unit, integration, and E2E levels.

**User Experience Consistency**: ✅ Design supports WCAG 2.1 AA compliance. Service interfaces enable consistent UI patterns. Canvas and audio services provide unified feedback mechanisms.

**Performance Requirements**: ✅ Design includes performance optimizations (object pooling, viewport culling, debounced saves). Service interfaces support efficient state management. Canvas rendering optimized for 60fps.

**All gates pass** ✅
