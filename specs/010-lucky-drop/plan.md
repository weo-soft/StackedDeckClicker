# Implementation Plan: Lucky Drop Feature

**Branch**: `010-lucky-drop` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-lucky-drop/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Replace the existing "luck" upgrade with "lucky drop" upgrade that performs multi-roll card selection (level 1 = 2 rolls, level 2 = 3 rolls, etc.) and selects the card with the highest value. The feature requires renaming the upgrade type, updating all references, migrating existing luck upgrade levels to lucky drop levels, and ensuring seamless integration with existing card drawing, scoring, and display systems. Implementation follows existing upgrade system patterns using TypeScript/SvelteKit.

## Technical Context

**Language/Version**: TypeScript 5.3.0, JavaScript (ES2020+)  
**Primary Dependencies**: SvelteKit 2.0.0, Svelte 4.2.0, Vite 5.0.0, localforage 1.10.0 (IndexedDB), seedrandom 3.0.5 (PRNG)  
**Storage**: IndexedDB via localforage for game state persistence (upgrade levels, score, decks)  
**Testing**: Vitest 1.0.0 (unit/integration), @testing-library/svelte 4.0.0 (component testing), Playwright 1.40.0 (E2E)  
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge - latest 2 versions), desktop and mobile responsive  
**Project Type**: Single-page web application (SPA)  
**Performance Goals**: Lucky drop multi-roll selection completes within 50ms per deck opening, upgrade purchase/leveling within 100ms, no performance degradation in multidraw operations  
**Constraints**: Client-side only (no backend), must maintain backward compatibility with existing game state, migration must preserve existing luck upgrade levels, must not break existing card drawing/scoring/display systems  
**Scale/Scope**: Single upgrade type modification, affects card drawing service, upgrade service, game state initialization, and UI components. Must handle migration for existing players with luck upgrade levels.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Code Quality**: ✅ PASS
- Follows existing TypeScript/SvelteKit patterns and conventions
- Reuses existing upgrade system architecture (UpgradeType enum, UpgradeCollection, UpgradeService)
- Maintains single responsibility: cardService handles card drawing logic, upgradeService handles upgrade calculations
- Clear naming: "luckyDrop" upgrade type replaces "luck" with consistent naming convention
- Code structure aligns with existing service pattern (cardService, upgradeService)

**Testing Standards**: ✅ PASS
- Unit tests required for lucky drop multi-roll selection logic (≥80% coverage per TC-001)
- Integration tests required for upgrade purchase/leveling and migration (TC-002, TC-009, TC-010)
- Integration tests required for downstream system compatibility (TC-004)
- Test strategy defined: unit (cardService logic), integration (upgrade system, migration), E2E (user workflows)
- All test scenarios documented in spec (TC-001 through TC-010)

**User Experience Consistency**: ✅ PASS
- Lucky drop upgrade follows existing upgrade UI patterns (UpgradeShop component)
- Upgrade description format consistent with other upgrades ("Best of N draws" pattern)
- No visual changes to card display (lucky drop-selected cards display identically to standard draws)
- Accessibility requirements defined (WCAG 2.1 Level AA, keyboard navigation, screen readers)
- Design system alignment maintained (uses existing upgrade shop component)

**Performance Requirements**: ✅ PASS
- Performance benchmarks defined: 50ms for multi-roll selection (PERF-001), 100ms for upgrade purchase (PERF-002)
- Performance requirements align with constitution (<100ms interactive response)
- Multidraw performance maintained (PERF-003)
- Offline progression performance maintained (PERF-004, within 10% of standard time)
- High-level performance validated (level 50+ without degradation, PERF-005)

## Constitution Check (Post-Design)

*Re-evaluated after Phase 1 design completion.*

**Code Quality**: ✅ PASS
- Design maintains existing service architecture patterns
- Migration logic is isolated and testable
- Naming conventions consistent with existing codebase
- No new complexity introduced (rename/migration only)
- Code structure follows single responsibility principle

**Testing Standards**: ✅ PASS
- Test strategy defined: unit (cardService, upgradeService), integration (migration, upgrade system), E2E (user workflows)
- Migration tests specified to ensure backward compatibility
- Test coverage targets maintained (≥80% for critical paths)
- All test scenarios documented in spec and quickstart guide

**User Experience Consistency**: ✅ PASS
- No UI changes required (uses existing upgrade shop component)
- Upgrade description format consistent ("Best of N draws")
- No visual changes to card display (transparent to users)
- Accessibility requirements maintained (WCAG 2.1 Level AA)

**Performance Requirements**: ✅ PASS
- No performance impact expected (rename only, no logic changes)
- Existing performance benchmarks maintained
- Migration runs once at load time (negligible impact)
- Multi-roll selection performance unchanged (same algorithm)

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
│   ├── models/
│   │   ├── types.ts                    # Update: Replace 'luck' with 'luckyDrop' in UpgradeType
│   │   ├── Upgrade.ts                  # No changes (generic upgrade model)
│   │   └── UpgradeCollection.ts        # No changes (generic collection)
│   ├── services/
│   │   ├── cardService.ts             # Update: Rename applyLuckUpgrade to applyLuckyDropUpgrade, update references
│   │   └── upgradeService.ts           # Update: Replace 'luck' case with 'luckyDrop' in calculateUpgradeEffect and getEffectDescription
│   └── utils/
│       └── defaultGameState.ts        # Update: Replace 'luck' with 'luckyDrop' in upgradeTypes array and cost functions
│
tests/
├── unit/
│   └── services/
│       ├── cardService.test.ts         # Update: Update existing luck tests to luckyDrop
│       └── upgradeService.test.ts      # Update: Update existing luck tests to luckyDrop
└── integration/
    └── upgradeMigration.test.ts        # New: Test migration from luck to luckyDrop
```

**Structure Decision**: Single project structure (SPA). Changes are localized to:
- `src/lib/models/types.ts`: UpgradeType enum modification
- `src/lib/services/cardService.ts`: Method rename and logic update (already implements multi-roll selection)
- `src/lib/services/upgradeService.ts`: Upgrade effect calculation and description updates
- `src/lib/utils/defaultGameState.ts`: Default upgrade initialization updates
- Tests: Update existing tests and add migration tests

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
