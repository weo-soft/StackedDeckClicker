# Feature Specification: Game Mode Selection

**Feature Branch**: `012-game-mode`  
**Created**: 2025-01-27  
**Status**: Draft  
**Input**: User description: "create a Game mode Feature. The User should be prompted to select a game mode they want to play, before the actual game/game Area is loaded. For now there are 4 Gamemodes, with more comming later. Game modes mainly differ in the setup/configuration of the game. 1. Classic (unlimited Stacked Decks, no shop, no upgrades) 2. Rutless (limited Stacked Decks, low amount of Chaos in the back at the start, player needs to buy new Stacked Decks for chaos, no Shop, no upgrades) 3. Give me my Dopamin (High amount of starting stacked Decks, high amount of Chaos in the Bank, increased rarity base, lucky drop level 1, only Rarity and luck upgrades available in the Shop) 4. Stacked Deck Clicker (limited Stacked Decks, no Chaos in the bank, enabled shop, all Upgrades purchaseable)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Game Mode Selection Prompt (Priority: P1)

As a player, I want to be prompted to select a game mode before the game loads so that I can choose my preferred gameplay experience.

**Why this priority**: This is the foundation of the feature - without the selection prompt, players cannot choose their game mode. It must appear before any game content loads.

**Independent Test**: Can be fully tested by verifying the game mode selection screen appears before the game area, displays all available game modes, and allows selection. This delivers immediate value by giving players control over their gameplay experience.

**Acceptance Scenarios**:

1. **Given** the application starts, **When** the page loads, **Then** the game mode selection screen appears before the game area is displayed
2. **Given** the game mode selection screen is displayed, **When** I view the screen, **Then** I see all four available game modes (Classic, Ruthless, Give me my Dopamine, Stacked Deck Clicker) with clear descriptions
3. **Given** I have selected a game mode, **When** I confirm my selection, **Then** the game initializes with the selected mode's configuration and the game area loads
4. **Given** I have not selected a game mode, **When** I try to proceed, **Then** I cannot access the game area until a mode is selected

---

### User Story 2 - Classic Game Mode Configuration (Priority: P1)

As a player, I want to play Classic mode with unlimited stacked decks, no shop, and no upgrades so that I can enjoy a simple, unrestricted gameplay experience.

**Why this priority**: Classic mode is one of the four core game modes and must be fully functional for the feature to deliver value. It represents the simplest configuration.

**Independent Test**: Can be fully tested by selecting Classic mode and verifying unlimited decks, disabled shop, and disabled upgrades. This delivers value by providing a straightforward gameplay option.

**Acceptance Scenarios**:

1. **Given** I have selected Classic game mode, **When** the game initializes, **Then** I have unlimited stacked decks available
2. **Given** I am playing Classic mode, **When** I view the game interface, **Then** the upgrade shop is not visible or accessible
3. **Given** I am playing Classic mode, **When** I check my upgrades, **Then** no upgrades are available or active
4. **Given** I am playing Classic mode, **When** I open stacked decks, **Then** my deck count does not decrease

---

### User Story 3 - Ruthless Game Mode Configuration (Priority: P1)

As a player, I want to play Ruthless mode with limited stacked decks, low starting chaos, and the ability to buy decks with chaos so that I can experience a challenging resource management gameplay.

**Why this priority**: Ruthless mode introduces a new mechanic (buying decks with chaos) and represents a different gameplay style. It must be functional for the feature to be complete.

**Independent Test**: Can be fully tested by selecting Ruthless mode and verifying limited decks, low starting chaos, deck purchase mechanism, and disabled shop/upgrades. This delivers value by providing a challenging gameplay variant.

**Acceptance Scenarios**:

1. **Given** I have selected Ruthless game mode, **When** the game initializes, **Then** I start with a limited number of stacked decks (e.g., 5-10 decks)
2. **Given** I have selected Ruthless game mode, **When** the game initializes, **Then** I start with a low amount of chaos (e.g., 10-50 chaos)
3. **Given** I am playing Ruthless mode, **When** I have sufficient chaos, **Then** I can purchase additional stacked decks using chaos
4. **Given** I am playing Ruthless mode, **When** I view the game interface, **Then** the upgrade shop is not visible or accessible
5. **Given** I am playing Ruthless mode, **When** I check my upgrades, **Then** no upgrades are available or active

---

### User Story 4 - Give me my Dopamine Game Mode Configuration (Priority: P1)

As a player, I want to play Give me my Dopamine mode with high starting resources, increased rarity, lucky drop level 1, and limited upgrades so that I can enjoy a rewarding, high-frequency gameplay experience.

**Why this priority**: This mode provides a distinct gameplay experience focused on frequent rewards and excitement. It must be functional for the feature to offer variety.

**Independent Test**: Can be fully tested by selecting Give me my Dopamine mode and verifying high starting decks, high starting chaos, increased rarity base, lucky drop level 1, and only rarity/luck upgrades available. This delivers value by providing an exciting, reward-focused gameplay option.

**Acceptance Scenarios**:

1. **Given** I have selected Give me my Dopamine game mode, **When** the game initializes, **Then** I start with a high number of stacked decks (e.g., 50-100 decks)
2. **Given** I have selected Give me my Dopamine game mode, **When** the game initializes, **Then** I start with a high amount of chaos (e.g., 500-1000 chaos)
3. **Given** I have selected Give me my Dopamine game mode, **When** the game initializes, **Then** my base rarity percentage is increased (e.g., 20-30% instead of default)
4. **Given** I have selected Give me my Dopamine game mode, **When** the game initializes, **Then** my lucky drop upgrade is at level 1
5. **Given** I am playing Give me my Dopamine mode, **When** I view the upgrade shop, **Then** only improvedRarity and luckyDrop upgrades are available for purchase
6. **Given** I am playing Give me my Dopamine mode, **When** I check other upgrade types, **Then** autoOpening, multidraw, deckProduction, and sceneCustomization upgrades are not available

---

### User Story 5 - Stacked Deck Clicker Game Mode Configuration (Priority: P1)

As a player, I want to play Stacked Deck Clicker mode with limited decks, no starting chaos, enabled shop, and all upgrades available so that I can experience the full progression gameplay.

**Why this priority**: This mode represents the "standard" gameplay experience with full features enabled. It must be functional as it likely represents the baseline game experience.

**Independent Test**: Can be fully tested by selecting Stacked Deck Clicker mode and verifying limited decks, zero starting chaos, enabled shop, and all upgrade types available. This delivers value by providing the complete gameplay experience.

**Acceptance Scenarios**:

1. **Given** I have selected Stacked Deck Clicker game mode, **When** the game initializes, **Then** I start with a limited number of stacked decks (e.g., 10 decks)
2. **Given** I have selected Stacked Deck Clicker game mode, **When** the game initializes, **Then** I start with zero chaos
3. **Given** I am playing Stacked Deck Clicker mode, **When** I view the game interface, **Then** the upgrade shop is visible and accessible
4. **Given** I am playing Stacked Deck Clicker mode, **When** I view the upgrade shop, **Then** all upgrade types are available for purchase (autoOpening, improvedRarity, luckyDrop, multidraw, deckProduction, sceneCustomization)

---

### User Story 6 - Game Mode Persistence (Priority: P2)

As a player, I want my selected game mode to persist across sessions so that I don't have to reselect it every time I return to the game.

**Why this priority**: While important for user experience, this can be implemented after core mode selection functionality. The game can initially require reselection on each visit.

**Independent Test**: Can be fully tested by selecting a game mode, closing the application, and verifying the mode is remembered on return. This delivers value by improving convenience and user experience.

**Acceptance Scenarios**:

1. **Given** I have selected a game mode and played the game, **When** I close and reopen the application, **Then** the game loads directly into my previously selected mode without showing the selection screen
2. **Given** I want to change my game mode, **When** I access game settings or a mode selection option, **Then** I can change my game mode, which will reset my game state and apply the new mode's configuration

---

### Edge Cases

- What happens when a player selects a game mode but the page is refreshed before confirmation?
- How does the system handle game mode selection if localStorage is disabled or unavailable?
- What happens if a player tries to change game mode mid-session?
- How does the system handle invalid or corrupted game mode data in storage?
- What happens when a new game mode is added in a future update - do existing players need to reselect?
- How does the system handle game mode selection on first-time visit vs returning players?
- What happens if the game mode selection screen is displayed but the user navigates away?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a game mode selection screen before loading the game area
- **FR-002**: System MUST display all four available game modes (Classic, Ruthless, Give me my Dopamine, Stacked Deck Clicker) with clear names and descriptions
- **FR-003**: System MUST prevent access to the game area until a game mode is selected
- **FR-004**: System MUST initialize Classic mode with unlimited stacked decks, disabled shop, and disabled upgrades
- **FR-005**: System MUST initialize Ruthless mode with limited stacked decks, low starting chaos, and disabled shop/upgrades
- **FR-006**: System MUST provide a mechanism for players to purchase stacked decks using chaos in Ruthless mode
- **FR-007**: System MUST initialize Give me my Dopamine mode with high starting decks, high starting chaos, increased rarity base, lucky drop level 1, and only improvedRarity/luckyDrop upgrades available
- **FR-008**: System MUST initialize Stacked Deck Clicker mode with limited decks, zero starting chaos, enabled shop, and all upgrade types available
- **FR-009**: System MUST apply the selected game mode's configuration to game state initialization (decks, chaos/score, upgrades, shop availability, rarity settings)
- **FR-010**: System MUST persist the selected game mode across sessions, and changing game mode resets game state to apply new mode configuration
- **FR-011**: System MUST allow players to change game mode, which resets game state and applies new mode configuration
- **FR-012**: System MUST ensure game mode configuration is applied before any game mechanics become active
- **FR-013**: System MUST handle game mode selection errors gracefully with user-friendly error messages

### Key Entities *(include if feature involves data)*

- **Game Mode**: A configuration preset that defines starting conditions (decks, chaos, upgrades, shop availability, rarity settings) and available features
- **Game Mode Selection**: The player's choice of game mode, stored and applied during game initialization
- **Mode Configuration**: The set of rules and starting values that define how a specific game mode behaves

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Game mode selection screen appears within 1 second of application load
- **SC-002**: Players can select a game mode and begin playing within 5 seconds of application start
- **SC-003**: 100% of game mode configurations are correctly applied to game state on initialization
- **SC-004**: Game mode selection persists across sessions for 95% of users (accounting for storage limitations)
- **SC-005**: Players can successfully change game mode and have new configuration applied within 2 seconds
- **SC-006**: All four game modes initialize with correct starting conditions (decks, chaos, upgrades, shop state) 100% of the time

## Testing Requirements *(mandatory)*

### Test Coverage Requirements

- **TC-001**: All game mode selection interactions must have unit tests
- **TC-002**: Each game mode configuration must have integration tests verifying correct initialization
- **TC-003**: Critical user paths (selecting mode, initializing game, changing mode) must achieve ≥80% test coverage
- **TC-004**: Tests must verify game mode persistence across sessions
- **TC-005**: Tests must use isolated test data and mock game state services
- **TC-006**: Tests must verify shop visibility and upgrade availability for each mode

### Test Scenarios

- [ ] Happy path: Select Classic mode, verify unlimited decks and disabled shop
- [ ] Happy path: Select Ruthless mode, verify limited decks, low chaos, deck purchase mechanism
- [ ] Happy path: Select Give me my Dopamine mode, verify high resources, increased rarity, limited upgrades
- [ ] Happy path: Select Stacked Deck Clicker mode, verify limited decks, zero chaos, full shop
- [ ] Edge case: Refresh page during mode selection
- [ ] Edge case: Change game mode mid-session
- [ ] Edge case: localStorage unavailable or disabled
- [ ] Edge case: Invalid game mode data in storage
- [ ] Persistence: Select mode, close app, reopen and verify mode remembered
- [ ] Configuration: Verify each mode's starting conditions match specification

## User Experience Requirements *(mandatory)*

### Accessibility Requirements

- **UX-001**: Feature MUST meet WCAG 2.1 Level AA standards
- **UX-002**: Game mode selection screen must be fully keyboard navigable (Tab, Enter, Arrow keys)
- **UX-003**: All game mode options must have appropriate ARIA labels and roles
- **UX-004**: Color contrast ratios for game mode selection screen must meet WCAG standards
- **UX-005**: Screen readers must announce available game modes and selection state

### Consistency Requirements

- **UX-006**: Feature MUST use established design system components and patterns
- **UX-007**: Game mode selection screen styling must be consistent with existing application UI
- **UX-008**: Game mode descriptions must follow consistent format and tone
- **UX-009**: Error messages related to game mode selection must follow standard format

### User Feedback Requirements

- **UX-010**: Game mode selection must provide clear visual feedback when a mode is selected
- **UX-011**: Game initialization after mode selection must show loading state
- **UX-012**: Game mode descriptions must clearly explain what each mode offers
- **UX-013**: Confirmation of game mode selection must be clear and unambiguous

## Performance Requirements *(mandatory)*

### Performance Benchmarks

- **PERF-001**: Game mode selection screen must appear within 1 second of application load
- **PERF-002**: Game mode selection and game initialization must complete within 3 seconds of mode selection
- **PERF-003**: Game mode configuration application must complete within 500ms
- **PERF-004**: Game mode selection screen must not cause frame rate drops or UI lag
- **PERF-005**: Memory usage for game mode selection screen must not exceed 10MB

## Assumptions

- Game mode selection will be a one-time choice per session, with option to change in settings
- Changing game mode will reset the player's current game state (score, decks, upgrades, collection)
- Game mode persistence will use browser localStorage
- All four game modes will be available from the initial release
- Future game modes can be added without breaking existing mode functionality
- "Chaos" refers to the player's score/currency (chaos orbs)
- "Buying stacked decks with chaos" in Ruthless mode requires implementing a new purchase mechanism
- "Increased rarity base" in Give me my Dopamine mode means setting a higher customRarityPercentage value
- "Lucky drop level 1" means the luckyDrop upgrade starts at level 1 instead of level 0
- Shop visibility can be controlled by showing/hiding the UpgradeShop component
- Upgrade availability can be controlled by filtering which upgrades are shown in the shop

