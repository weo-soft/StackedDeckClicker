# Feature Specification: Light Beam Effect for Dropped Cards

**Feature Branch**: `009-light-beam-effect`  
**Created**: 2025-01-27  
**Status**: Draft  
**Input**: User description: "add a \"Light Beam\" effect to dropped cards."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visual Light Beam Effect on Card Drop (Priority: P1)

When a card is dropped, a light beam effect emits upward from the card's position. The beam is visible immediately when the card appears and provides a visual indicator that enhances the card drop experience. The beam color matches the tier group configuration for that card.

**Why this priority**: This is the core visual effect that provides immediate value. Users can see the light beam effect as soon as cards are dropped, making it the primary feature that must work independently.

**Independent Test**: Can be fully tested by dropping a card and verifying that a light beam effect appears upward from the card's position, using the tier's configured beam color.

**Acceptance Scenarios**:

1. **Given** a card is dropped, **When** the card appears on the canvas, **Then** a light beam effect emits upward from the card's position
2. **Given** a card belongs to a tier group with a configured beam color, **When** the card is dropped, **Then** the light beam uses the tier's configured color
3. **Given** a card belongs to a tier group without a configured beam color, **When** the card is dropped, **Then** the light beam uses a default color or no beam is displayed
4. **Given** multiple cards are dropped in rapid succession, **When** each card appears, **Then** each card displays its own light beam effect based on its tier group configuration

---

### User Story 2 - Configure Light Beam Color per Tier Group (Priority: P1)

When a user opens the Tier Settings, they can configure a light beam color for each tier group. The color configuration is saved and applied to all cards belonging to that tier when they are dropped.

**Why this priority**: This is essential for the feature to be customizable. Without configuration, users cannot personalize the beam colors, which is a core requirement.

**Independent Test**: Can be fully tested by opening Tier Settings, selecting a tier, configuring a beam color, saving, and verifying that dropped cards from that tier use the configured color.

**Acceptance Scenarios**:

1. **Given** the Tier Settings is open, **When** a tier's configuration section is expanded, **Then** a light beam color configuration option is visible
2. **Given** a tier's light beam color option is visible, **When** the user selects a color, **Then** the color selection is saved to the tier's configuration
3. **Given** a tier has a configured beam color, **When** a card from that tier is dropped, **Then** the light beam uses the configured color
4. **Given** a tier's beam color is changed, **When** the configuration is saved, **Then** future cards dropped from that tier use the new color
5. **Given** a tier has no beam color configured, **When** the user views the tier configuration, **Then** the beam color option shows a default or empty state

---

### User Story 3 - Enable/Disable Light Beam Effect per Tier Group (Priority: P2)

When configuring a tier group, users can enable or disable the light beam effect for that tier. When disabled, cards from that tier do not display a light beam when dropped.

**Why this priority**: This provides users with control over the visual effect, allowing them to customize which tiers show beams. While not critical for the core feature, it enhances user experience and customization options.

**Independent Test**: Can be fully tested by configuring a tier to disable the beam effect, saving, and verifying that dropped cards from that tier do not display a light beam.

**Acceptance Scenarios**:

1. **Given** a tier's configuration section is expanded, **When** the user views the light beam configuration, **Then** an enable/disable option is available
2. **Given** a tier's light beam is disabled, **When** a card from that tier is dropped, **Then** no light beam effect is displayed
3. **Given** a tier's light beam is enabled, **When** a card from that tier is dropped, **Then** the light beam effect is displayed using the configured color
4. **Given** a tier's light beam is toggled between enabled and disabled, **When** the configuration is saved, **Then** the setting persists and affects future card drops

---

### Edge Cases

- What happens when a card belongs to a tier that has been deleted or no longer exists?
- How does the system handle rapid card drops (multiple cards per second) with beam effects?
- What happens when a tier's beam color is set to transparent or fully opaque?
- How does the beam effect interact with other visual effects (particle effects, glow borders)?
- What happens when a card is dropped outside the visible canvas area?
- How does the system handle tier configuration changes while cards with beam effects are currently displayed?
- What happens when multiple cards from different tiers are dropped simultaneously?
- How does the beam effect scale with different canvas sizes or zoom levels?
- What happens when a tier has an invalid color configuration (e.g., malformed hex code)?
- How does the system handle performance when 50+ cards with beam effects are displayed simultaneously?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a light beam effect emitting upward from a card's position when the card is dropped
- **FR-002**: System MUST allow users to configure a light beam color for each tier group in Tier Settings
- **FR-003**: System MUST apply the tier's configured beam color to the light beam effect when a card from that tier is dropped
- **FR-004**: System MUST allow users to enable or disable the light beam effect for each tier group
- **FR-005**: System MUST persist light beam configuration (color and enabled state) as part of tier configuration data
- **FR-006**: System MUST display light beam effects for all cards that belong to tiers with beam effects enabled
- **FR-007**: System MUST handle cases where a card's tier has no beam color configured (use default or no beam)
- **FR-008**: System MUST handle cases where a card's tier has been deleted or is invalid (use default or no beam)
- **FR-009**: System MUST render light beam effects without blocking or delaying card drop animations
- **FR-010**: System MUST support color selection for light beam configuration (e.g., color picker, hex input, or predefined palette)
- **FR-011**: System MUST update light beam effects immediately when tier configuration is saved
- **FR-012**: System MUST maintain beam effect performance when multiple cards with beams are displayed simultaneously
- **FR-013**: System MUST render light beams in the correct visual layer (behind card labels, above card objects or as appropriate for visual hierarchy)

### Key Entities *(include if feature involves data)*

- **Light Beam Configuration**: Represents the light beam settings for a tier group. Key attributes: enabled state (boolean), beam color (hex color code or color identifier), tier identifier reference, last modified timestamp.

- **Light Beam Effect**: Represents the visual beam effect displayed when a card is dropped. Key attributes: card position (x, y coordinates), beam color (from tier configuration), beam height/direction (upward), animation state (start time, duration, fade out), tier identifier reference.

- **Tier Configuration**: Extended entity that includes light beam configuration. Additional attributes: light beam enabled state, light beam color.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can see light beam effects on dropped cards immediately when cards appear (beam visible within 50ms of card drop)
- **SC-002**: Users can configure beam colors for all tier groups through Tier Settings interface (100% of tiers support beam color configuration)
- **SC-003**: Beam effects use the correct tier-configured colors (100% accuracy - all cards from a tier use that tier's configured color)
- **SC-004**: System maintains smooth performance when displaying 20+ simultaneous beam effects (60fps maintained during card drops)
- **SC-005**: Users can enable/disable beam effects per tier group with configuration persisting across sessions (100% persistence rate)
- **SC-006**: Beam color configuration changes apply to new card drops within 1 second of saving tier configuration

## Testing Requirements *(mandatory)*

### Test Coverage Requirements

- **TC-001**: All light beam rendering logic must have unit tests (beam creation, color application, positioning)
- **TC-002**: Tier configuration updates for beam settings must have integration tests
- **TC-003**: Card drop with beam effect must have end-to-end tests
- **TC-004**: Critical user paths (drop card with beam, configure beam color, enable/disable beam) must achieve ≥80% test coverage
- **TC-005**: Tests must verify beam color accuracy matches tier configuration
- **TC-006**: Tests must use isolated test data, no external dependencies
- **TC-007**: Performance tests must verify beam effect rendering maintains 60fps with 20+ simultaneous beams

### Test Scenarios

- [ ] Happy path: Drop a card from a tier with beam enabled and configured color - verify beam appears with correct color
- [ ] Happy path: Configure beam color for a tier, save, drop card from that tier - verify beam uses new color
- [ ] Edge case: Drop card from tier with beam disabled - verify no beam appears
- [ ] Edge case: Drop card from tier with no beam configuration - verify default behavior (no beam or default color)
- [ ] Edge case: Drop multiple cards rapidly from different tiers - verify each beam uses correct tier color
- [ ] Edge case: Change tier beam color while cards with beams are displayed - verify existing beams unchanged, new cards use new color
- [ ] Edge case: Delete tier while cards from that tier are displayed - verify graceful handling of beam effects
- [ ] Performance: Drop 50 cards simultaneously - verify all beams render without performance degradation
- [ ] Accessibility: Verify beam effects do not interfere with screen reader announcements
- [ ] Visual: Verify beam effects are visible but do not obscure card labels or important UI elements

## User Experience Requirements *(mandatory)*

### Accessibility Requirements

- **UX-001**: Feature MUST meet WCAG 2.1 Level AA standards
- **UX-002**: Light beam effects MUST not interfere with screen reader functionality or keyboard navigation
- **UX-003**: Beam color configuration interface MUST be keyboard navigable and screen reader accessible
- **UX-004**: Beam effects MUST have sufficient visual contrast to be distinguishable (when enabled)
- **UX-005**: Color picker or color selection interface MUST support keyboard navigation and screen reader announcements
- **UX-006**: Beam effects MUST not cause visual flashing that could trigger photosensitive reactions (comply with WCAG 2.3.1)

### Consistency Requirements

- **UX-007**: Feature MUST use established design system components and patterns (consistent with existing Tier Settings styling)
- **UX-008**: Beam color configuration interface MUST match the visual style of other tier configuration options
- **UX-009**: Beam effects MUST complement existing visual effects (particle effects, glow borders) without visual conflict
- **UX-010**: Beam effect animation and timing MUST be consistent across all tier groups (same duration, fade behavior)

### User Feedback Requirements

- **UX-011**: Beam color preview MUST be visible in tier configuration interface (show how beam will look)
- **UX-012**: Configuration changes MUST provide visual feedback when saved (success message or immediate preview update)
- **UX-013**: Beam effects MUST be visually distinct enough to be noticeable but not overwhelming
- **UX-014**: Users MUST be able to see beam color changes reflected in new card drops immediately after saving configuration

## Performance Requirements *(mandatory)*

### Performance Benchmarks

- **PERF-001**: Light beam effects must render without adding more than 5ms per beam to frame rendering time
- **PERF-002**: System must maintain 60fps when displaying up to 20 simultaneous beam effects
- **PERF-003**: Beam effect initialization must complete within 16ms (one frame at 60fps) when a card is dropped
- **PERF-004**: Memory usage for beam effects must not exceed 1MB per 50 active beams
- **PERF-005**: Beam effect cleanup (when cards are removed) must complete within 10ms
- **PERF-006**: Tier configuration loading with beam settings must not add more than 50ms to configuration load time

## Assumptions

- Light beam effects will be rendered on the canvas alongside card objects and labels
- Beam effects will emit upward from the card's position (vertical direction)
- Beam color will be configurable via a color picker or similar interface in Tier Settings
- Beam effects will have a finite duration or fade out over time (not permanent)
- Default behavior for tiers without beam configuration will be no beam effect (disabled by default)
- Beam effects will be visible but not obstruct card labels or important UI elements
- Existing tier configuration data structure can be extended to include beam settings
- Beam effects will work alongside existing visual effects (particle effects, glow borders) without conflicts
- Users will typically configure beam colors once per tier and use those settings consistently
- Beam effects will be optional per tier (users can enable/disable for each tier independently)
