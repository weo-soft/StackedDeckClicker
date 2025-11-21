# Implementation Plan: Purple Zone Card Graphical Display

**Branch**: `003-display-dropped-card` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-display-dropped-card/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Update the purple zone (LastCardZone component) to display a graphical representation of the last drawn card using the provided card artwork files, frame, and separator images. The implementation will adapt the Vue-based DivinationCard component reference to Svelte, rendering cards with their artwork, frame overlay, separator, and styled text content (title, rewards, flavor text) while preserving existing card information display (name, tier, value, score).

## Technical Context

**Language/Version**: TypeScript 5.3, Svelte 4.2  
**Primary Dependencies**: SvelteKit 2.0, Vite 5.0  
**Storage**: Static files in `/static/cards/` directory (card art images, frame, separator)  
**Testing**: Vitest 1.0, Playwright 1.40, @testing-library/svelte 4.0  
**Target Platform**: Web browser (static site via SvelteKit adapter-static)  
**Project Type**: Web application (SvelteKit single-page application)  
**Performance Goals**: Card image load <500ms, display update <200ms, maintain 60fps rendering  
**Constraints**: Purple zone dimensions (200x220px base), must handle missing artwork gracefully, preserve existing functionality  
**Scale/Scope**: 450+ card art files, responsive to zone resizing, fallback handling for missing assets

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Code Quality**: ✅ Verify code structure, naming conventions, and maintainability approach align with constitution standards.
- Component structure follows Svelte conventions
- TypeScript interfaces for type safety
- Service layer separation maintained
- Existing code patterns (paths.ts, component structure) will be followed

**Testing Standards**: ✅ Confirm test strategy (unit/integration/E2E) and coverage targets (≥80% for critical paths) are defined.
- Unit tests for card image loading logic (TC-001: ≥80% coverage)
- Integration tests for card display updates (TC-002)
- E2E tests for visual regression (TC-004)
- Performance tests for load/update times (TC-006)

**User Experience Consistency**: ✅ Validate UX patterns, accessibility requirements (WCAG 2.1 AA), and design system alignment.
- ARIA labels for card images (UX-002)
- Keyboard navigation support (UX-003)
- Color contrast ratios maintained (UX-004)
- Consistent with existing zone styling patterns (UX-006, UX-007)

**Performance Requirements**: ✅ Define performance benchmarks (load times <3s, API <500ms, interactive <100ms) and monitoring approach.
- Card image load: <500ms (PERF-001)
- Display update: <200ms (PERF-002)
- Scaling calculations: <50ms (PERF-004)
- Maintain 60fps rendering (PERF-005)

## Project Structure

### Documentation (this feature)

```text
specs/003-display-dropped-card/
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
│   │   └── LastCardZone.svelte          # Component to update with card rendering
│   ├── models/
│   │   ├── Card.ts                      # DivinationCard interface (existing)
│   │   ├── CardDrawResult.ts           # CardDrawResult interface (existing)
│   │   └── CardDisplayData.ts          # NEW: Extended card data for display
│   ├── services/
│   │   └── cardImageService.ts         # NEW: Service for loading card images
│   └── utils/
│       └── cardRendering.ts            # NEW: Utilities for card rendering logic
│
static/
└── cards/
    ├── cardArt/                         # 450+ card art PNG files
    ├── Divination_card_frame.png        # Frame overlay image
    ├── Divination_card_separator.png   # Separator image
    ├── cards.json                       # Card data with artFilename
    └── cardValues.json                  # Card value data

tests/
├── unit/
│   └── services/
│       └── cardImageService.test.ts     # NEW: Unit tests for image loading
├── integration/
│   └── cardDisplay.test.ts             # NEW: Integration tests for card display
└── e2e/
    └── card-graphical-display.spec.ts  # NEW: E2E tests for visual display
```

**Structure Decision**: Single SvelteKit web application. The feature extends the existing LastCardZone component with new card rendering capabilities. New services and utilities will be added to support image loading and rendering logic, following the existing project structure patterns.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | No violations | All requirements align with existing architecture |
