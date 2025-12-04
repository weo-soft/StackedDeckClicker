# Implementation Plan: Game Mode Selection

**Branch**: `012-game-mode` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-game-mode/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Create a game mode selection feature that prompts users to choose from four game modes (Classic, Ruthless, Give me my Dopamine, Stacked Deck Clicker) before the game area loads. Each game mode configures different starting conditions (decks, chaos, upgrades, shop availability, rarity settings) and gameplay mechanics. The selected mode persists across sessions and can be changed, which resets game state.

## Technical Context

**Language/Version**: TypeScript 5.3.0, Svelte 4.2.0  
**Primary Dependencies**: SvelteKit 2.0, Vite 5.0, @testing-library/svelte 4.0  
**Storage**: LocalForage (existing game state storage), localStorage for game mode persistence  
**Testing**: Vitest 1.0, Playwright 1.40, @testing-library/svelte  
**Target Platform**: Web browser (modern browsers supporting ES modules)  
**Project Type**: Web application (SvelteKit single-page application)  
**Performance Goals**: Selection screen appears <1s, mode initialization <3s, configuration application <500ms  
**Constraints**: WCAG 2.1 Level AA accessibility, responsive design, memory <10MB for selection screen  
**Scale/Scope**: Single application feature, affects game initialization flow, game state service, and multiple components

**Key Technical Decisions** (resolved in research.md):
- ✅ Unlimited decks: Use existing `infiniteDecksEnabled` flag mechanism
- ✅ Deck purchase: Add `purchaseDecks(chaosCost, deckCount)` method to `gameStateService`
- ✅ Upgrade filtering: Filter at component level in `UpgradeShop.svelte` based on mode
- ✅ Mode storage: Use separate localStorage key `'gameMode'` (string)
- ✅ Mode change: Show confirmation dialog, then reset state and apply new mode

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Code Quality**: ✅ Verify code structure, naming conventions, and maintainability approach align with constitution standards.
- Game mode selection component will follow existing Svelte component patterns
- Game mode configuration will be defined as a service or utility module
- Consistent naming with existing components (e.g., DataVersionOverlay.svelte pattern for modal)
- Game mode service will follow existing service patterns (gameStateService, upgradeService)

**Testing Standards**: ✅ Confirm test strategy (unit/integration/E2E) and coverage targets (≥80% for critical paths) are defined.
- Unit tests for GameModeSelection component (selection, keyboard navigation)
- Unit tests for game mode configuration service (mode initialization, state application)
- Integration tests for game mode selection flow and state initialization
- E2E tests for complete user workflows (select mode, verify configuration, change mode)
- Target: ≥80% coverage for critical paths (mode selection, configuration application, persistence)

**User Experience Consistency**: ✅ Validate UX patterns, accessibility requirements (WCAG 2.1 AA), and design system alignment.
- Follow existing modal-overlay pattern (see +page.svelte modals, DataVersionOverlay)
- Keyboard navigation: Tab, Enter, Escape, Arrow keys
- ARIA labels and roles consistent with existing modals
- Design system: Use existing modal styling patterns
- Game mode descriptions must be clear and informative

**Performance Requirements**: ✅ Define performance benchmarks (load times <3s, API <500ms, interactive <100ms) and monitoring approach.
- Selection screen appearance: <1s (PERF-001)
- Mode selection and initialization: <3s (PERF-002)
- Configuration application: <500ms (PERF-003)
- No frame rate drops (PERF-004)
- Memory usage: <10MB for selection screen (PERF-005)

## Project Structure

### Documentation (this feature)

```text
specs/012-game-mode/
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
│   │   ├── GameModeSelection.svelte     # New: Game mode selection screen component
│   │   ├── UpgradeShop.svelte           # Modify: Filter upgrades based on game mode
│   │   └── UpgradeStoreZone.svelte       # Modify: Conditionally show/hide based on game mode
│   ├── services/
│   │   ├── gameModeService.ts           # New: Game mode configuration and management service
│   │   ├── gameStateService.ts          # Modify: Integrate game mode initialization
│   │   └── upgradeService.ts             # Modify: Filter upgrades based on game mode
│   ├── models/
│   │   └── GameMode.ts                  # New: Game mode type definitions and configurations
│   ├── utils/
│   │   └── defaultGameState.ts          # Modify: Accept game mode parameter for initialization
│   └── stores/
│       └── gameModeStore.ts             # New: Store for current game mode (optional)
│
routes/
└── +page.svelte                          # Modify: Show game mode selection before game area, integrate mode initialization

tests/
├── unit/
│   ├── components/
│   │   └── GameModeSelection.test.ts     # New: Unit tests for GameModeSelection component
│   ├── services/
│   │   └── gameModeService.test.ts      # New: Unit tests for game mode service
│   └── models/
│       └── GameMode.test.ts              # New: Unit tests for game mode configurations
├── integration/
│   └── gameModeSelection.test.ts         # New: Integration tests for mode selection flow
└── e2e/
    └── game-mode-selection.spec.ts       # New: E2E tests for game mode workflows
```

**Structure Decision**: Single SvelteKit web application. New GameModeSelection component will be added to `src/lib/components/`, following the pattern of existing overlay components. Game mode configuration will be managed through a new service (`gameModeService.ts`) that integrates with existing `gameStateService.ts`. Game mode selection will be displayed before game initialization in `+page.svelte`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

## Phase Completion Status

### Phase 0: Research ✅ Complete
- **research.md**: Generated with decisions on unlimited decks (use existing infiniteDecksEnabled), deck purchase mechanism (new purchaseDecks method), upgrade filtering (component-level), mode storage (separate localStorage key), and mode change handling (confirmation dialog)

### Phase 1: Design & Contracts ✅ Complete
- **data-model.md**: Generated with GameMode, GameModeSelection entities, mode configurations, data flow, storage schema, and validation rules
- **contracts/service-interfaces.md**: Generated with GameModeService interface, GameStateService extensions, UpgradeService extensions, component contracts, and integration contracts
- **quickstart.md**: Generated with overview, architecture, development workflow, testing guide, common tasks, and troubleshooting

### Phase 2: Tasks
- **Status**: Pending - Use `/speckit.tasks` command to generate tasks.md

## Notes

- Game mode selection must occur before game state initialization
- Changing game mode will reset all game state (score, decks, upgrades, collection)
- Game mode persistence uses localStorage (separate from game state storage)
- Future game modes can be added by extending the GameMode type and configuration

