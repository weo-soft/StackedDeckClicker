# Implementation Plan: Card Tier Filter System

**Branch**: `004-card-tier-filter` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-card-tier-filter/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement a tier-based filtering system that allows users to organize Divination Cards into groups (tiers) with customizable drop sounds and color schemes. The system provides seven default tiers (S, A, B, C, D, E, F) with automatic card assignments based on card value, and allows users to create custom tiers, move cards between tiers, and enable/disable tiers for display filtering. Tier configurations (sounds, colors, assignments, enabled states) are persisted to IndexedDB via localforage, and tier properties are applied when cards are dropped in the LastCardZone component.

## Technical Context

**Language/Version**: TypeScript 5.3, Svelte 4.2  
**Primary Dependencies**: SvelteKit 2.0, Vite 5.0, localforage 1.10.0, Howler.js 2.2.4  
**Storage**: IndexedDB via localforage (existing StorageService pattern)  
**Testing**: Vitest 1.0, Playwright 1.40, @testing-library/svelte 4.0  
**Target Platform**: Web browser (static site via SvelteKit adapter-static)  
**Project Type**: Web application (SvelteKit single-page application)  
**Performance Goals**: Tier system initialization <2s, tier property lookup <50ms, card movement <1s, tier operations <500ms  
**Constraints**: Must integrate with existing card drop system (gameStateService, LastCardZone), preserve existing audio system (audioManager), maintain backward compatibility with existing qualityTier system  
**Scale/Scope**: 450+ cards, 7 default tiers + up to 20 custom tiers, tier configurations persisted per user

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Code Quality**: ✅ Verify code structure, naming conventions, and maintainability approach align with constitution standards.
- Follow existing service layer pattern (tierService.ts, tierStorageService.ts)
- TypeScript interfaces for type safety (Tier, TierConfiguration, CardTierAssignment)
- Component structure follows Svelte conventions (TierSettings.svelte, TierManagement.svelte)
- Existing code patterns (storageService, audioManager) will be extended, not replaced
- Clear separation of concerns: models, services, components, stores

**Testing Standards**: ✅ Confirm test strategy (unit/integration/E2E) and coverage targets (≥80% for critical paths) are defined.
- Unit tests for tier assignment logic (TC-001: ≥80% coverage)
- Unit tests for tier property application (TC-002)
- Integration tests for card movement between tiers (TC-003)
- Integration tests for tier enable/disable functionality (TC-004)
- E2E tests for tier management UI workflows (TC-005)
- Performance tests for tier operations (TC-008)
- Error handling tests for invalid sound files and color configurations (TC-007)

**User Experience Consistency**: ✅ Validate UX patterns, accessibility requirements (WCAG 2.1 AA), and design system alignment.
- ARIA labels for tier management interfaces (UX-004)
- Keyboard navigation support for tier settings (UX-003)
- Color contrast ratios validated (UX-002: 4.5:1 normal, 3:1 large text)
- Consistent with existing settings UI patterns (UX-007, UX-008)
- Visual feedback for tier property changes (UX-012, UX-013)
- Clear error messages for invalid configurations (UX-015)

**Performance Requirements**: ✅ Define performance benchmarks (load times <3s, API <500ms, interactive <100ms) and monitoring approach.
- Tier system initialization: <2s (PERF-001, SC-001)
- Tier property lookup: <50ms (PERF-002, SC-002)
- Card movement: <1s (PERF-003, SC-003)
- Tier configuration changes: <500ms (PERF-004, SC-004)
- Custom tier creation: <1s (PERF-005, SC-006)
- Tier enable/disable: <100ms (PERF-006, SC-005)
- Support 20+ custom tiers without degradation (PERF-008, SC-010)

## Project Structure

### Documentation (this feature)

```text
specs/004-card-tier-filter/
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
│   │   ├── LastCardZone.svelte          # UPDATE: Apply tier color scheme to card label
│   │   ├── TierSettings.svelte          # NEW: Tier management UI component
│   │   └── TierManagement.svelte       # NEW: Card assignment and tier configuration UI
│   ├── models/
│   │   ├── Tier.ts                      # NEW: Tier interface and types
│   │   ├── TierConfiguration.ts         # NEW: Tier configuration interface
│   │   └── CardTierAssignment.ts        # NEW: Card-to-tier assignment interface
│   ├── services/
│   │   ├── tierService.ts               # NEW: Tier management business logic
│   │   ├── tierStorageService.ts        # NEW: Tier configuration persistence
│   │   └── audioManager.ts             # UPDATE: Extend to support tier-based sounds
│   ├── stores/
│   │   └── tierStore.ts                 # NEW: Reactive tier state management
│   └── utils/
│       ├── tierAssignment.ts           # NEW: Default tier assignment logic
│       └── colorValidation.ts           # NEW: Color scheme accessibility validation
│
static/
└── sounds/
    └── tiers/                            # NEW: Default tier sound files (optional)
        ├── tier-s.mp3
        ├── tier-a.mp3
        ├── tier-b.mp3
        ├── tier-c.mp3
        ├── tier-d.mp3
        ├── tier-e.mp3
        └── tier-f.mp3

tests/
├── unit/
│   ├── services/
│   │   ├── tierService.test.ts          # NEW: Unit tests for tier logic
│   │   └── tierStorageService.test.ts   # NEW: Unit tests for persistence
│   └── utils/
│       ├── tierAssignment.test.ts       # NEW: Unit tests for default assignments
│       └── colorValidation.test.ts      # NEW: Unit tests for color validation
├── integration/
│   ├── tierManagement.test.ts           # NEW: Integration tests for tier operations
│   └── cardTierAssignment.test.ts       # NEW: Integration tests for card movement
└── e2e/
    └── tier-filter-system.spec.ts       # NEW: E2E tests for tier management UI
```

**Structure Decision**: Single SvelteKit web application. The feature extends the existing architecture with new tier management services, models, and UI components. Tier configurations are persisted using the existing StorageService pattern (localforage/IndexedDB). The audio system (audioManager) is extended to support tier-based sounds, and the LastCardZone component is updated to apply tier color schemes to card labels.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
