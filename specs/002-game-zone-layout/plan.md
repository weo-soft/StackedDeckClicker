# Implementation Plan: Game Area Zone Layout

**Branch**: `002-game-zone-layout` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-game-zone-layout/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Rework the game area layout from a single scene with overlay to a zone-based layout with five distinct functional zones: White (Ambient Scene), Yellow (Card Drop Area - logical), Blue (Upgrade Store), Orange (State Information), and Green (Inventory). This creates an ARPG-like integrated experience where all game controls are seamlessly organized into the game area rather than separate UI panels. The implementation will reorganize existing components (GameCanvas, UpgradeShop, deck opening) into a unified zone-based layout while preserving all existing functionality.

## Technical Context

**Language/Version**: TypeScript 5.3.0, Svelte 4.2.0  
**Primary Dependencies**: SvelteKit 2.0.0, Vite 5.0.0, Canvas API (native browser)  
**Storage**: LocalForage (IndexedDB/localStorage) for game state persistence  
**Testing**: Vitest 1.0.0 (unit/integration), Playwright 1.40.0 (E2E), @testing-library/svelte 4.0.0  
**Target Platform**: Modern web browsers (ES2020+), static site deployment  
**Project Type**: Single web application (SvelteKit)  
**Performance Goals**: 60fps canvas rendering, <100ms interaction response, <1s zone layout render  
**Constraints**: Client-side only (no backend), <100MB memory usage, responsive design for mobile/desktop  
**Scale/Scope**: Single-player browser game, ~10 zones/components, ~5-10 upgrade types

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Code Quality**: ✅ PASS
- Existing codebase follows TypeScript strict mode with clear component separation
- Zone layout will be implemented as reusable Svelte components with single responsibilities
- Zone boundary logic will be isolated in utility modules
- Code structure maintains existing patterns (components/, services/, models/)

**Testing Standards**: ✅ PASS
- Test strategy defined: unit tests for zone layout logic (≥80% coverage), integration tests for zone interactions, E2E tests for user workflows
- Existing test infrastructure (Vitest, Playwright) will be used
- Test coverage targets: ≥80% for zone layout and boundary detection logic
- Test scenarios defined in spec (TC-001 through TC-008)

**User Experience Consistency**: ✅ PASS
- UX patterns: Zone layout follows reference image proportions, consistent interaction patterns
- Accessibility: WCAG 2.1 Level AA compliance required, ARIA labels for zones, keyboard navigation
- Design system: Zones will use existing component styling patterns, maintain visual consistency
- Responsive design: Zones adapt to screen sizes while maintaining proportions

**Performance Requirements**: ✅ PASS
- Performance benchmarks defined: <1s zone layout render, <100ms interactions, <200ms content updates, 60fps rendering
- Monitoring approach: Browser DevTools performance profiling, frame rate monitoring
- Performance targets align with constitution (<3s load, <100ms interactive, <500ms API)

## Project Structure

### Documentation (this feature)

```text
specs/002-game-zone-layout/
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
│   │   ├── GameCanvas.svelte          # Existing - will be adapted for white zone
│   │   ├── UpgradeShop.svelte         # Existing - will be adapted for blue zone
│   │   ├── GameAreaLayout.svelte      # NEW - main zone container component
│   │   ├── AmbientSceneZone.svelte    # NEW - white zone wrapper
│   │   ├── UpgradeStoreZone.svelte    # NEW - blue zone wrapper
│   │   ├── StateInfoZone.svelte       # NEW - orange zone
│   │   └── InventoryZone.svelte       # NEW - green zone
│   ├── canvas/
│   │   ├── scene.ts                   # Existing - will be adapted for zone boundaries
│   │   ├── renderer.ts                # Existing - will be adapted
│   │   └── cardAnimation.ts           # Existing - unchanged
│   ├── services/
│   │   ├── gameStateService.ts        # Existing - unchanged
│   │   ├── upgradeService.ts          # Existing - unchanged
│   │   └── zoneLayoutService.ts       # NEW - zone layout calculations and boundaries
│   ├── models/
│   │   ├── GameState.ts               # Existing - unchanged
│   │   └── ZoneLayout.ts              # NEW - zone layout model
│   └── utils/
│       └── zoneBoundaries.ts          # NEW - zone boundary detection utilities
│
└── routes/
    └── +page.svelte                   # Existing - will use GameAreaLayout component

tests/
├── unit/
│   ├── services/
│   │   └── zoneLayoutService.test.ts  # NEW - zone layout logic tests
│   └── utils/
│       └── zoneBoundaries.test.ts     # NEW - boundary detection tests
├── integration/
│   └── zoneLayout.test.ts             # NEW - zone interaction tests
└── e2e/
    └── zone-layout.spec.ts            # NEW - zone layout E2E tests
```

**Structure Decision**: Single SvelteKit web application. New zone components will be added to `src/lib/components/`, zone layout logic in `src/lib/services/zoneLayoutService.ts`, and zone models in `src/lib/models/ZoneLayout.ts`. Existing components (GameCanvas, UpgradeShop) will be wrapped/adapted for zone integration rather than rewritten.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations - all constitution requirements are met.
