# Implementation Plan: Data Auto-Update System

**Branch**: `005-data-auto-update` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-data-auto-update/spec.md`

## Summary

Implement automatic data fetching and update system for divination card prices and weighting data from https://data.poeatlas.app/. The system will periodically check for updates, cache data efficiently, display version information to players, and allow manual update triggers. Based on proven approaches from example_files/data-fetcher.ts and example_files/AboutOverlay.vue, adapted for SvelteKit architecture.

## Technical Context

**Language/Version**: TypeScript 5.3, Svelte 4.2 + SvelteKit 2.0  
**Primary Dependencies**: Vite 5.0, localforage 1.10.0 (existing), native fetch API  
**Storage**: Browser memory (Map) for runtime cache, IndexedDB via localforage for persistent cache (optional enhancement)  
**Testing**: Vitest (unit/integration), Playwright (E2E)  
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)  
**Project Type**: Single-page web application (SvelteKit)  
**Performance Goals**: 
- Initial data fetch: <3 seconds (PERF-001)
- Background metadata check: <2 seconds (PERF-002)
- Manual update: <10 seconds (PERF-003)
- Cache lookup: <50ms (PERF-005)
- No UI blocking during background updates (PERF-006)
**Constraints**: 
- Must work offline with cached data fallback
- Must handle network failures gracefully
- Must not block application initialization
- Data files expected to be <10MB each
**Scale/Scope**: Single user application, 3 data files (divinationCardDetails.json, divinationCardPrices.json, metadata.json), periodic background checks

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Code Quality**: ✅ 
- Service-based architecture following existing patterns (CardDataService, StorageService)
- TypeScript interfaces for type safety
- Clear separation of concerns (data fetching, caching, UI display)
- Reusable utility functions following existing utils/ patterns

**Testing Standards**: ✅
- Unit tests for data fetching logic (≥80% coverage target)
- Integration tests for update workflow
- E2E tests for manual update trigger user flow
- Mock network responses to avoid external dependencies
- Test cache hit/miss/expiration scenarios

**User Experience Consistency**: ✅
- Follow existing modal/overlay patterns (similar to TierSettings, TierManagement)
- Use existing button styles and loading indicators
- WCAG 2.1 Level AA compliance (keyboard navigation, screen reader announcements)
- Consistent error message formatting
- Loading states for operations >100ms

**Performance Requirements**: ✅
- All benchmarks defined in Technical Context above
- Background updates use requestIdleCallback or setTimeout to avoid blocking
- Cache-first strategy minimizes network requests
- Metadata checks before full file downloads (hash comparison)

## Project Structure

### Documentation (this feature)

```text
specs/005-data-auto-update/
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
│   │   └── DataVersionOverlay.svelte    # NEW: Display data version info and update controls
│   ├── services/
│   │   └── dataUpdateService.ts         # NEW: Data fetching, caching, and update management
│   ├── stores/
│   │   └── dataVersionStore.ts          # NEW: Reactive state for data version info
│   ├── models/
│   │   └── DataVersion.ts                # NEW: TypeScript interfaces for data version info
│   └── utils/
│       └── dataFetcher.ts                # NEW: Core data fetching utility (adapted from example)
│
static/
└── cards/                                 # Existing: Local fallback data files
    ├── cards.json
    └── cardValues.json
```

**Structure Decision**: Single-page web application structure following existing SvelteKit conventions. New service follows existing service patterns (CardDataService, StorageService). Component follows existing modal/overlay patterns. Store follows existing store patterns (gameState, tierStore). Utility adapted from proven example_files/data-fetcher.ts approach.

## Complexity Tracking

> **No violations - all approaches align with constitution and existing patterns**

## Phase Completion Status

### Phase 0: Research ✅ Complete

**Output**: [research.md](./research.md)

All technical decisions documented:
- Data fetching approach (adapted from example_files/data-fetcher.ts)
- Caching strategy (in-memory Map with optional IndexedDB persistence)
- Metadata.json checking pattern (hash comparison before full download)
- Background update scheduling (setInterval with configurable intervals)
- UI component approach (Svelte component adapted from example_files/AboutOverlay.vue)
- Error handling and fallback strategies
- Integration with existing card data loading (CardDataService, defaultCardPool)

**Status**: All NEEDS CLARIFICATION items resolved. Ready for Phase 1.

### Phase 1: Design & Contracts ✅ Complete

**Outputs**:
- [data-model.md](./data-model.md) - Entity definitions for DataFile, MetadataFile, CacheEntry, UpdateStatus
- [contracts/service-interfaces.md](./contracts/service-interfaces.md) - DataUpdateService API contract
- [quickstart.md](./quickstart.md) - Developer setup and integration guide

**Data Model**: Complete entity definitions with TypeScript interfaces, validation rules, and state transitions.

**Service Contracts**: DataUpdateService interface defined with methods for fetching, caching, checking updates, and manual refresh. Error handling and testing requirements specified.

**Quickstart**: Integration instructions for connecting data update system to existing card loading infrastructure.

**Status**: Design artifacts complete. Ready for Phase 2 (task breakdown).

### Phase 2: Task Breakdown

**Status**: Pending - To be completed by `/speckit.tasks` command.

## Constitution Check (Post-Design)

*Re-evaluated after Phase 1 design completion.*

**Code Quality**: ✅ 
- Service interface clearly defined with single responsibility
- TypeScript types ensure type safety
- Follows existing service patterns (CardDataService, StorageService)
- Utility functions are pure and testable

**Testing Standards**: ✅
- Unit test requirements defined for all service methods
- Integration test scenarios cover update workflows
- E2E test scenarios cover user interactions
- Mock strategies defined to avoid external dependencies
- ≥80% coverage target for critical paths

**User Experience Consistency**: ✅
- Component follows existing modal/overlay patterns
- Loading states and error messages follow existing patterns
- Keyboard navigation and screen reader support specified
- Visual design consistent with existing UI components

**Performance Requirements**: ✅
- All benchmarks validated against spec requirements
- Background update strategy prevents UI blocking
- Cache-first approach minimizes network overhead
- Metadata checking reduces unnecessary downloads
