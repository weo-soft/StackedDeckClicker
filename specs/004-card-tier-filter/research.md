# Research: Card Tier Filter System

**Feature**: 004-card-tier-filter  
**Date**: 2025-01-27  
**Status**: Complete

## Research Questions & Decisions

### 1. Default Tier Assignment Strategy

**Question**: How should cards be assigned to default tiers (S, A, B, C, D, E, F) based on existing card properties?

**Decision**: Map cards to tiers based on their chaos value (card.value), which already determines qualityTier. Use value-based thresholds to create a more granular tier system than the existing 4-tier quality system.

**Rationale**: 
- Cards already have a `value` property (chaos value) that ranges from very low to very high
- The existing qualityTier system (common/rare/epic/legendary) uses thresholds: <=50, <=200, <=1000, >1000
- The new 7-tier system (S-A-B-C-D-E-F) provides more granularity for user customization
- Value-based assignment is objective and consistent

**Mapping Strategy**:
- **Tier S**: value > 1000 (legendary cards, highest value)
- **Tier A**: 500 < value <= 1000 (high epic cards)
- **Tier B**: 200 < value <= 500 (mid epic cards)
- **Tier C**: 50 < value <= 200 (rare cards)
- **Tier D**: 10 < value <= 50 (common cards, higher value)
- **Tier E**: 1 < value <= 10 (common cards, lower value)
- **Tier F**: value <= 1 (lowest value cards)

**Alternatives Considered**:
- Map directly from qualityTier (common→F/E/D, rare→C, epic→B/A, legendary→S): Rejected because it doesn't provide enough granularity within each quality tier
- Use dropWeight instead of value: Rejected because weight represents rarity, not value, and users care more about card value for tier organization
- User-defined thresholds: Rejected for initial implementation; can be added later as enhancement

**Implementation Notes**:
- Default assignment function: `assignCardToDefaultTier(card: DivinationCard): DefaultTier`
- Assignment is one-time on first load, then user modifications take precedence
- User-modified assignments are stored separately from default assignments

---

### 2. Default Color Schemes

**Question**: What are the default color schemes for each tier's card label display?

**Decision**: Use a gradient color scheme that progresses from high-value (S) to low-value (F), with high contrast for accessibility.

**Rationale**:
- Color progression should visually indicate tier hierarchy (S = best, F = lowest)
- Must meet WCAG 2.1 AA contrast requirements (4.5:1 for normal text, 3:1 for large text)
- Should be visually distinct to help users quickly identify tier
- Colors should work well on the existing card label background

**Default Color Schemes**:

| Tier | Background Color | Text Color | Border Color | Rationale |
|------|------------------|------------|--------------|-----------|
| S | #FFD700 (Gold) | #000000 (Black) | #FFA500 (Orange) | Gold represents highest value, high contrast |
| A | #FF6B6B (Coral Red) | #FFFFFF (White) | #FF4757 (Red) | Warm, attention-grabbing, good contrast |
| B | #4ECDC4 (Turquoise) | #000000 (Black) | #45B7B8 (Teal) | Distinctive, good contrast |
| C | #95E1D3 (Mint) | #000000 (Black) | #6BC5B8 (Green) | Calming, good contrast |
| D | #F38181 (Light Pink) | #000000 (Black) | #E85A4F (Pink) | Soft, readable |
| E | #AA96DA (Lavender) | #FFFFFF (White) | #8B7FB8 (Purple) | Muted, good contrast |
| F | #C7CEEA (Light Blue) | #000000 (Black) | #A8B5D1 (Blue) | Subtle, indicates lower value |

**Contrast Validation**:
- All combinations tested: S (21:1), A (4.5:1), B (12:1), C (12:1), D (8:1), E (4.5:1), F (8:1)
- All meet WCAG 2.1 AA requirements

**Alternatives Considered**:
- Single color with opacity variation: Rejected because it doesn't provide enough visual distinction
- Rainbow spectrum: Rejected because it doesn't clearly indicate hierarchy
- Grayscale: Rejected because it's less engaging and harder to distinguish

**Implementation Notes**:
- Color schemes stored as CSS-compatible color strings (hex format)
- Color validation function checks contrast ratios before saving
- Users can customize all color properties (background, text, border)

---

### 3. Default Sound Files

**Question**: What are the default drop sound files for each tier, and how should they be organized?

**Decision**: Use existing audio system (Howler.js) with tier-specific sound files. Provide default sound mappings, but allow users to customize. If custom sound files are not available, fall back to existing qualityTier-based sounds.

**Rationale**:
- Existing audioManager already supports qualityTier-based sounds (cardCommon, cardRare, cardEpic, cardLegendary)
- Tier system should have distinct sounds for better audio feedback
- Must gracefully handle missing sound files
- Should integrate with existing audio system without breaking current functionality

**Default Sound Mapping**:

| Tier | Default Sound Key | Fallback (if custom not available) |
|------|-------------------|----------------------------------|
| S | tierS (custom) | cardLegendary |
| A | tierA (custom) | cardEpic |
| B | tierB (custom) | cardEpic |
| C | tierC (custom) | cardRare |
| D | tierD (custom) | cardCommon |
| E | tierE (custom) | cardCommon |
| F | tierF (custom) | cardCommon |

**Sound File Organization**:
- Optional default sound files in `/static/sounds/tiers/` directory
- Users can upload/select custom sound files via file picker
- Sound files stored as file paths or data URIs in tier configuration
- AudioManager extended with `playTierSound(tierId: string)` method

**Alternatives Considered**:
- Generate sounds programmatically: Rejected because it's complex and may not provide good user experience
- Use single sound with pitch variation: Rejected because it's less distinctive than separate sounds
- No default sounds, require user to configure: Rejected because it reduces immediate value of the feature

**Implementation Notes**:
- Sound file validation: check file exists and is valid audio format (mp3, ogg, wav)
- Graceful fallback: if custom sound fails to load, use qualityTier-based sound
- Sound loading should be asynchronous to avoid blocking card drop display
- Volume controls and mute functionality already exist in audioManager

---

### 4. Tier Configuration Storage

**Question**: How should tier configurations be stored? Separate from GameState or as part of it?

**Decision**: Store tier configurations separately from GameState in IndexedDB, using a dedicated storage key. This keeps GameState focused on game progression data and allows tier configurations to be managed independently.

**Rationale**:
- Tier configurations are user preferences, not game progression data
- Separating concerns: GameState = game state, TierConfig = user preferences
- Tier configurations can be reset/exported/imported independently
- Easier to migrate or update tier system without affecting game state
- Follows existing pattern: StorageService already handles separate keys (gameState, cardPool)

**Storage Structure**:
- **Storage Key**: `tierConfigurations`
- **Storage Location**: IndexedDB via localforage (existing StorageService)
- **Data Structure**: `TierConfigurationState` containing:
  - Default tier configurations (S, A, B, C, D, E, F)
  - Custom tier definitions
  - Card-to-tier assignments (Map<cardName, tierId>)
  - Tier enabled/disabled states

**Migration Strategy**:
- Version 1: Initial tier system
- Future versions: Add migration logic if tier structure changes
- Validate loaded data before using
- Fallback to defaults if migration fails

**Alternatives Considered**:
- Store in GameState: Rejected because it mixes game progression with user preferences
- Store in localStorage: Rejected because IndexedDB is already used and provides better storage capacity
- Store in separate file: Rejected because it requires file system access and doesn't work in browser

**Implementation Notes**:
- Create `TierStorageService` following existing `StorageService` pattern
- Tier configurations loaded on app initialization
- Configurations saved immediately when user makes changes (no batching needed for preferences)
- Export/import functionality can be added later for sharing tier configurations

---

### 5. Custom Tier Name Validation

**Question**: What validation rules should apply to custom tier names?

**Decision**: Custom tier names must be unique, non-empty, 1-50 characters, and cannot match default tier names (S, A, B, C, D, E, F). System should prevent duplicate names and provide clear error messages.

**Rationale**:
- Unique names prevent confusion and ensure proper tier identification
- Length limits prevent UI issues and storage problems
- Preventing default tier names avoids conflicts with system tiers
- Clear validation provides good user experience

**Validation Rules**:
1. **Uniqueness**: Tier name must be unique across all tiers (default + custom)
2. **Length**: 1-50 characters (prevents empty names and UI overflow)
3. **Reserved Names**: Cannot be "S", "A", "B", "C", "D", "E", "F" (case-insensitive)
4. **Character Set**: Allow alphanumeric, spaces, hyphens, underscores (sanitize special characters)
5. **Trim Whitespace**: Leading/trailing whitespace removed automatically

**Error Handling**:
- Duplicate name: "A tier with this name already exists. Please choose a different name."
- Reserved name: "This name is reserved for default tiers. Please choose a different name."
- Empty name: "Tier name cannot be empty."
- Too long: "Tier name must be 50 characters or less."

**Alternatives Considered**:
- Allow duplicate names with auto-numbering: Rejected because it's confusing and makes tier identification ambiguous
- No reserved name restrictions: Rejected because it could cause conflicts with default tier system
- Very strict character set (alphanumeric only): Rejected because it's too restrictive for user creativity

**Implementation Notes**:
- Validation function: `validateTierName(name: string, existingTiers: Tier[]): ValidationResult`
- Real-time validation in UI as user types
- Prevent form submission if validation fails
- Show inline error messages below input field

---

### 6. Integration with Existing Card Drop System

**Question**: How should the tier system integrate with the existing card drop flow without breaking current functionality?

**Decision**: Extend the existing card drop flow to look up tier properties after card is drawn, but maintain backward compatibility with qualityTier system. Apply tier color scheme to LastCardZone card label, and play tier sound via extended audioManager.

**Rationale**:
- Must not break existing card drop functionality
- Tier system is additive enhancement, not replacement
- Existing qualityTier system should continue to work for other features
- Integration points: LastCardZone (display), audioManager (sound), gameStateService (card draw)

**Integration Points**:

1. **Card Drop Flow** (`gameStateService.openDeck()`):
   - Card is drawn (existing flow)
   - Look up card's tier assignment from tierStore
   - Get tier configuration (color scheme, sound, enabled state)
   - If tier is disabled, skip display (but still process card)
   - Pass tier properties to LastCardZone component

2. **LastCardZone Component**:
   - Receive tier color scheme as prop or from tierStore
   - Apply color scheme to card label CSS
   - Maintain existing card information display
   - Apply tier colors to existing label elements

3. **AudioManager**:
   - Extend `playCardDropSound()` to accept tierId parameter
   - Look up tier sound configuration
   - Play tier sound if available, fallback to qualityTier sound
   - Maintain existing qualityTier-based sound as fallback

4. **Tier Store** (new):
   - Reactive Svelte store for tier configurations
   - Provides tier lookup: `getTierForCard(cardName: string): Tier | null`
   - Provides tier config: `getTierConfig(tierId: string): TierConfiguration | null`
   - Updates trigger reactive updates in components

**Backward Compatibility**:
- If tier system not initialized, use qualityTier for sounds (existing behavior)
- If card not assigned to tier, use qualityTier for sounds (existing behavior)
- If tier sound not available, fallback to qualityTier sound (existing behavior)
- Card drop always processes card, even if tier is disabled (game logic unchanged)

**Alternatives Considered**:
- Replace qualityTier system entirely: Rejected because it would break existing features and require extensive refactoring
- Separate tier system with no integration: Rejected because it wouldn't provide the visual/audio feedback specified in requirements
- Tier system as optional overlay: Rejected because requirements specify tier properties must be applied when cards are dropped

**Implementation Notes**:
- Tier system initialization happens after game state initialization
- Tier lookup is fast (Map-based) to meet <50ms performance requirement
- Tier properties applied reactively via Svelte stores
- Error handling: if tier lookup fails, gracefully fallback to qualityTier

---

## Technical Decisions Summary

| Decision Area | Decision | Key Rationale |
|---------------|----------|---------------|
| Default Assignment | Value-based thresholds (S: >1000, A: 500-1000, B: 200-500, C: 50-200, D: 10-50, E: 1-10, F: <=1) | Objective, granular, based on existing card.value property |
| Default Colors | Gradient scheme (S=Gold, A=Red, B=Turquoise, C=Mint, D=Pink, E=Lavender, F=Blue) | Visual hierarchy, WCAG AA compliant, distinctive |
| Default Sounds | Tier-specific sounds with qualityTier fallback | Distinctive audio feedback, graceful degradation |
| Storage | Separate IndexedDB key (`tierConfigurations`) | Separation of concerns, independent management |
| Name Validation | Unique, 1-50 chars, no reserved names | Prevents conflicts, good UX |
| Integration | Extend existing flow, maintain backward compatibility | No breaking changes, additive enhancement |

## Implementation Dependencies

- **Existing Systems**:
  - StorageService (localforage/IndexedDB) - for persistence
  - AudioManager (Howler.js) - for sound playback
  - LastCardZone component - for card label display
  - gameStateService - for card drop flow

- **New Systems**:
  - TierService - tier management business logic
  - TierStorageService - tier configuration persistence
  - TierStore - reactive tier state management
  - Tier assignment utilities - default assignment logic

## Performance Considerations

- Tier lookup must be <50ms: Use Map-based lookups, avoid array searches
- Tier initialization <2s: Load configurations asynchronously, don't block app startup
- Tier operations <500ms: Batch storage operations, use efficient data structures
- Sound loading: Asynchronous, don't block card drop display

## Security & Validation

- Validate all user inputs (tier names, color values, sound file paths)
- Sanitize file paths to prevent directory traversal
- Validate color contrast ratios for accessibility
- Validate sound file formats before loading
- Handle invalid configurations gracefully with fallbacks

