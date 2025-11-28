# Implementation Plan: Light Beam Effect for Dropped Cards

**Branch**: `009-light-beam-effect` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-light-beam-effect/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add a configurable light beam effect that emits upward from cards when they are dropped. The beam color is configurable per tier group through Tier Settings, and users can enable/disable the effect for each tier. The beam effect enhances the visual feedback when cards are dropped, providing immediate visual indication that matches the card's tier configuration.

**Technical Approach**: Extend the `TierConfiguration` interface to include light beam settings (enabled state and color). Add beam effect rendering to the `Scene` class render method, drawing beams upward from card positions using canvas gradients. Store beam state in `CardAnimation` interface. Integrate beam color configuration UI into the existing `TierSettings.svelte` component following the same pattern as color scheme and sound configuration.

## Technical Context

**Language/Version**: TypeScript 5.3.0, Svelte 4.2.0  
**Primary Dependencies**: SvelteKit 2.0.0, Vite 5.0.0, Vitest 1.0.0, Canvas API (native browser)  
**Storage**: LocalForage (IndexedDB) via tierStorageService (extends existing tier configuration storage)  
**Testing**: Vitest with @testing-library/svelte, Playwright for E2E  
**Target Platform**: Web browser (modern browsers supporting Canvas API and ES modules)  
**Project Type**: Single web application (SvelteKit SPA)  
**Performance Goals**: 
- Beam effect renders within 5ms per beam (PERF-001)
- Maintain 60fps with 20+ simultaneous beams (PERF-002)
- Beam initialization completes within 16ms (PERF-003)
- Memory usage <1MB per 50 active beams (PERF-004)
- Beam cleanup completes within 10ms (PERF-005)

**Constraints**: 
- Must extend existing tier configuration data structure without breaking changes
- Must maintain backward compatibility with existing tier configurations
- Must meet WCAG 2.1 Level AA accessibility standards
- Must not interfere with existing visual effects (particle effects, glow borders)
- Must render beams in correct z-order (behind labels, above card objects)
- Beam effects must fade out over time (not permanent)

**Scale/Scope**: 
- Support up to 20 simultaneous beam effects
- Handle rapid card drops (multiple cards per second)
- Support all tier groups (default and custom tiers)
- Maintain performance with 50+ cards on canvas

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Code Quality**: ✅ PASS
- Code will follow existing canvas rendering patterns (similar to particle effects and glow borders)
- Beam rendering logic will be isolated in dedicated methods following single responsibility
- Naming conventions align with existing codebase (camelCase for variables, PascalCase for components)
- Existing tier service and store abstractions will be reused
- Data model extensions will maintain backward compatibility

**Testing Standards**: ✅ PASS
- Unit tests for beam rendering logic (color application, positioning, fade logic)
- Unit tests for tier configuration updates (beam settings persistence)
- Integration tests for beam effect display when cards are dropped
- E2E tests for critical user paths (drop card with beam, configure beam color, enable/disable beam)
- Target: ≥80% test coverage for critical paths (spec requirement TC-004)
- Performance tests for beam rendering with 20+ simultaneous beams
- Tests will use isolated test data via existing test utilities

**User Experience Consistency**: ✅ PASS
- Beam color configuration will use established design system patterns from TierSettings component
- Color picker interface will match existing color scheme editor styling
- Beam effects will complement existing visual effects without visual conflict
- WCAG 2.1 Level AA compliance: keyboard navigation, screen reader support, no flashing effects
- Beam preview will be visible in tier configuration interface
- Error messages and success notifications follow existing format

**Performance Requirements**: ✅ PASS
- Performance benchmarks defined in spec (PERF-001 through PERF-006)
- All targets align with constitution requirements:
  - Interactive elements respond within 100ms (beam configuration UI)
  - Rendering maintains 60fps (PERF-002)
  - Beam initialization within 16ms (PERF-003)
- Memory usage constraints defined (PERF-004)
- No performance regressions expected (beam rendering is additive, not replacing existing code)

## Project Structure

### Documentation (this feature)

```text
specs/009-light-beam-effect/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── service-interfaces.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── components/
│   │   └── TierSettings.svelte          # Add beam color configuration UI
│   ├── canvas/
│   │   ├── scene.ts                     # Add beam rendering logic
│   │   └── cardAnimation.ts             # Extend CardAnimation interface with beam state
│   ├── models/
│   │   └── Tier.ts                      # Extend TierConfiguration interface with beam settings
│   ├── services/
│   │   └── tierService.ts               # No changes (handles beam config via existing updateTierConfiguration)
│   └── stores/
│       └── tierStore.ts                 # No changes (beam config included in tier config)

tests/
├── unit/
│   ├── canvas/
│   │   └── lightBeamEffect.test.ts      # New unit tests for beam rendering
│   └── components/
│       └── TierSettings.test.ts         # Extend existing tests for beam config UI
├── integration/
│   └── lightBeamEffect.test.ts          # New integration tests
└── e2e/
    └── light-beam-effect.spec.ts        # New E2E tests
```

**Structure Decision**: Single project structure. The feature extends existing canvas rendering and tier configuration systems. No new services or major architectural changes required - we're adding beam rendering to the existing Scene class and extending the TierConfiguration interface. Tests will be added to existing test directories following established patterns.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations identified. All constitution requirements are met with standard canvas rendering patterns and existing tier configuration abstractions.
