# Implementation Plan: Card Label Click to View Details

**Branch**: `006-card-details-click` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-card-details-click/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Enable users to click on card labels in the yellow zone (canvas-rendered labels) to display that card's full details in the purple zone (LastCardZone component). The implementation will add click detection to the canvas, identify which card label was clicked (handling overlapping labels), and update the LastCardZone to display the clicked card's details instead of only the last drawn card. Visual feedback (cursor changes, hover effects) will indicate clickable labels.

## Technical Context

**Language/Version**: TypeScript 5.3, Svelte 4.2  
**Primary Dependencies**: SvelteKit 2.0, Vite 5.0, HTML5 Canvas API  
**Storage**: N/A (in-memory card state, static card data files)  
**Testing**: Vitest 1.0, Playwright 1.40, @testing-library/svelte 4.0  
**Target Platform**: Web browser (static site via SvelteKit adapter-static)  
**Project Type**: Web application (SvelteKit single-page application)  
**Performance Goals**: Click detection <50ms, purple zone update <200ms, visual feedback <50ms, handle 5 clicks/second  
**Constraints**: Canvas-based rendering, label positions calculated dynamically, must handle overlapping labels, maintain 60fps during interactions  
**Scale/Scope**: Up to 150 visible cards with labels, click detection on canvas element, integration with existing LastCardZone component

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Code Quality**: ✅ Verify code structure, naming conventions, and maintainability approach align with constitution standards.
- Service layer pattern for click detection logic
- TypeScript interfaces for click events and card identification
- Component structure follows Svelte conventions
- Existing code patterns (canvas service, component structure) will be followed
- Clear separation of concerns: click detection, card identification, state management

**Testing Standards**: ✅ Confirm test strategy (unit/integration/E2E) and coverage targets (≥80% for critical paths) are defined.
- Unit tests for click detection logic (TC-001: ≥80% coverage)
- Unit tests for card identification from coordinates (TC-002: comprehensive coverage)
- Integration tests for purple zone updates (TC-003)
- E2E tests for click interactions and visual feedback (TC-004)
- Performance tests for click detection and update times (TC-007)

**User Experience Consistency**: ✅ Validate UX patterns, accessibility requirements (WCAG 2.1 AA), and design system alignment.
- Keyboard accessibility for card labels (UX-002)
- ARIA labels/roles for clickable labels (UX-003)
- Visual feedback perceivable without color-only cues (UX-004)
- Minimum click target size 44x44px (UX-005)
- Screen reader announcements (UX-006)
- Consistent with existing interactive element patterns (UX-007, UX-008)

**Performance Requirements**: ✅ Define performance benchmarks (load times <3s, API <500ms, interactive <100ms) and monitoring approach.
- Click detection: <50ms (PERF-002)
- Purple zone update: <200ms (PERF-001)
- Visual feedback: <50ms (PERF-003)
- Handle 5 clicks/second without degradation (PERF-004)
- No performance impact on animations (PERF-005)
- Total click-to-display: <500ms (PERF-007)

## Project Structure

### Documentation (this feature)

```text
specs/006-card-details-click/
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
│   │   ├── GameCanvas.svelte          # Component to update with click handlers
│   │   └── LastCardZone.svelte        # Component to update to accept clicked cards
│   ├── canvas/
│   │   ├── renderer.ts                 # CanvasService to extend with click detection
│   │   ├── scene.ts                    # Scene class to extend with label hit testing
│   │   └── cardAnimation.ts           # CardAnimation interface (existing, may extend)
│   ├── models/
│   │   └── CardDrawResult.ts          # Existing model (may extend for clicked cards)
│   ├── services/
│   │   └── [no new services needed, extend existing]
│   └── utils/
│       └── [no new utilities needed]
│
tests/
├── unit/
│   └── canvas/
│       └── clickDetection.test.ts     # NEW: Unit tests for click detection
├── integration/
│   └── cardLabelClick.test.ts         # NEW: Integration tests for click flow
└── e2e/
    └── card-label-click.spec.ts       # NEW: E2E tests for user interactions
```

**Structure Decision**: Single SvelteKit web application. The feature extends existing canvas rendering system (CanvasService, Scene) with click detection capabilities and updates the LastCardZone component to accept clicked cards. No new services needed - functionality will be added to existing canvas rendering system.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations - all constitution checks pass. Implementation follows existing patterns and extends existing systems without introducing unnecessary complexity.
