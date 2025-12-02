# Research: Lucky Drop Feature

**Created**: 2025-01-27  
**Purpose**: Resolve technical unknowns and establish best practices for implementation

## Upgrade Type Migration Strategy

**Decision**: Rename 'luck' upgrade type to 'luckyDrop' in UpgradeType enum and migrate existing game states.

**Rationale**: 
- The existing "luck" upgrade already implements the exact functionality required for "lucky drop" (multi-roll selection with best-of-N)
- Renaming provides clearer, more descriptive naming that aligns with feature specification
- Migration ensures backward compatibility for existing players who have purchased luck upgrades
- TypeScript enum modification is straightforward and type-safe

**Alternatives Considered**:
- Keep 'luck' name: Rejected because spec explicitly calls for "lucky drop" feature name
- Create new 'luckyDrop' alongside 'luck': Rejected because spec states lucky drop replaces luck upgrade
- Deprecate 'luck' gradually: Rejected because spec requires immediate replacement

**Best Practices**:
- Migration should occur at game state load time (storageService or gameStateService initialization)
- Check for existence of 'luck' upgrade in saved game state
- If 'luck' exists, create 'luckyDrop' with same level and remove 'luck'
- Migration should be idempotent (safe to run multiple times)
- Log migration events for debugging

## Backward Compatibility Strategy

**Decision**: Implement migration logic in game state loading/initialization to convert existing 'luck' upgrades to 'luckyDrop'.

**Rationale**:
- Existing players may have saved game states with 'luck' upgrade levels
- Migration must preserve player progress (upgrade levels, costs, multipliers)
- One-time migration at load time is simplest and most reliable approach
- No data loss for players who invested in luck upgrade

**Implementation Approach**:
- Add migration function in `storageService.ts` or `gameStateService.ts`
- Migration runs when loading game state from IndexedDB
- Check for `upgrades.upgrades.get('luck')` existence
- If found, copy level to new 'luckyDrop' upgrade and remove 'luck'
- Migration runs before game state is used by other services

**Alternatives Considered**:
- Version-based migration system: Overkill for single upgrade rename
- Manual migration script: Not applicable for client-side game
- Dual support (both luck and luckyDrop): Rejected per spec requirement

## Code Modification Strategy

**Decision**: Update all references to 'luck' upgrade type to 'luckyDrop' while maintaining existing implementation logic.

**Rationale**:
- The `applyLuckUpgrade` method in `cardService.ts` already implements the required multi-roll selection
- Only naming changes are needed (method rename, type references)
- Logic remains identical (level 1 = 2 rolls, level 2 = 3 rolls, select highest value)
- Minimizes risk of introducing bugs

**Files Requiring Updates**:
1. `src/lib/models/types.ts`: UpgradeType enum ('luck' → 'luckyDrop')
2. `src/lib/services/cardService.ts`: Method rename (`applyLuckUpgrade` → `applyLuckyDropUpgrade`), update upgrade.get('luck') to get('luckyDrop')
3. `src/lib/services/upgradeService.ts`: Switch case update ('luck' → 'luckyDrop' in calculateUpgradeEffect and getEffectDescription)
4. `src/lib/utils/defaultGameState.ts`: UpgradeTypes array and cost functions ('luck' → 'luckyDrop')
5. Test files: Update all references to 'luck' upgrade in tests

**Best Practices**:
- Use IDE refactoring tools for type-safe renaming where possible
- Update method names to match new upgrade type name
- Maintain existing logic and behavior (no functional changes)
- Update comments and documentation to reflect new naming

## Testing Strategy for Migration

**Decision**: Create dedicated migration tests to verify luck → luckyDrop conversion preserves upgrade levels and game state integrity.

**Rationale**:
- Migration is critical path that must work correctly for existing players
- Tests ensure no data loss during migration
- Tests verify migration is idempotent (safe to run multiple times)
- Tests cover edge cases (level 0, high levels, missing upgrade)

**Test Scenarios**:
- Migrate game state with luck level 1 → luckyDrop level 1
- Migrate game state with luck level 5 → luckyDrop level 5
- Migrate game state with luck level 0 → luckyDrop level 0 (no-op or initialization)
- Migrate game state without luck upgrade (no migration needed)
- Run migration twice (idempotency check)
- Verify other upgrades unaffected by migration

**Implementation**:
- Create `tests/integration/upgradeMigration.test.ts`
- Test migration function in isolation
- Test full game state load with migration
- Verify upgrade costs and multipliers preserved

## Integration with Existing Systems

**Decision**: No changes required to downstream systems (scoreboard, card display, tier filtering) - lucky drop-selected cards are treated identically to standard draws.

**Rationale**:
- Card drawing service returns `DivinationCard` interface (unchanged)
- `CardDrawResult` interface unchanged (card, timestamp, scoreGained)
- Downstream systems operate on card objects, not on how cards were selected
- Spec requirement: "lucky drop-selected cards are treated identically to standard single-roll cards"

**Verification**:
- Existing integration tests should continue to pass
- No changes needed to scoreboardService, card display components, tier filtering
- Card selection method is internal to cardService

## Performance Considerations

**Decision**: No performance optimizations needed - existing implementation already meets performance requirements.

**Rationale**:
- Current `applyLuckUpgrade` implementation is already efficient (O(N) where N = number of rolls)
- Multi-roll selection uses existing `selectWeightedCard` function (O(log n) per roll)
- Performance requirements (50ms per deck opening) are already met
- No additional overhead from rename

**Verification**:
- Existing performance tests should continue to pass
- No performance regression expected from naming changes
- Migration logic runs once at load time (negligible impact)

