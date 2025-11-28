import type { DivinationCard } from '../models/Card.js';
import type { Tier, TierConfiguration, TierConfigurationState, DefaultTier } from '../models/Tier.js';
import { tierStorageService } from './tierStorageService.js';
import { assignCardToDefaultTier, createDefaultTiers } from '../utils/tierAssignment.js';
import { validateColorScheme, validateLightBeamConfig } from '../utils/colorValidation.js';

/**
 * Service for tier management business logic (assignments, lookups, operations).
 */
export class TierService {
  private state: TierConfigurationState | null = null;
  private initialized = false;

  /**
   * Initialize tier system with default tiers and card assignments.
   * Called once on app startup.
   * @param cards - Array of all cards to assign to default tiers
   */
  async initialize(cards: DivinationCard[]): Promise<void> {
    if (this.initialized) return;

    // Load from storage or create defaults
    let state = await tierStorageService.loadTierConfigurations();

    if (!state) {
      // Create default state
      const defaultTiers = createDefaultTiers();
      const cardAssignments = new Map<string, string>();

      // Assign cards to default tiers
      for (const card of cards) {
        const tierId = assignCardToDefaultTier(card);
        cardAssignments.set(card.name, tierId);
      }

      state = {
        version: 1,
        tiers: defaultTiers,
        cardAssignments,
        savedAt: Date.now()
      };

      // Save defaults
      await tierStorageService.saveTierConfigurations(state);
    } else {
      // Update existing state: ensure default tiers have latest color schemes
      const defaultTiers = createDefaultTiers();
      let updated = false;
      
      // Update default tier configurations if they exist
      for (const [tierId, defaultTier] of defaultTiers) {
        const existingTier = state.tiers.get(tierId);
        if (existingTier && existingTier.type === 'default') {
          // Only update if colors don't match (user might have customized)
          // For now, always update default tiers to ensure latest colors
          existingTier.config.colorScheme = defaultTier.config.colorScheme;
          // Update lightBeam to use new defaults if it's missing or set to old default
          // Only update if lightBeam is missing or matches old default (enabled: false, color: null)
          // This allows users who have explicitly configured beams to keep their settings
          if (!existingTier.config.lightBeam) {
            existingTier.config.lightBeam = defaultTier.config.lightBeam;
            updated = true;
          } else if (
            existingTier.config.lightBeam.enabled === false &&
            existingTier.config.lightBeam.color === null
          ) {
            // Update old default (disabled, no color) to new default (enabled with color)
            existingTier.config.lightBeam = defaultTier.config.lightBeam;
            updated = true;
          }
          existingTier.modifiedAt = Date.now();
          updated = true;
        } else if (!existingTier) {
          // Missing default tier, add it
          state.tiers.set(tierId, defaultTier);
          updated = true;
        }
      }
      
      // Ensure all existing tiers have lightBeam property for backward compatibility
      for (const tier of state.tiers.values()) {
        if (!tier.config.lightBeam) {
          tier.config.lightBeam = { enabled: false, color: null };
          updated = true;
        }
      }
      
      // Ensure all cards are assigned (assign new cards to default tiers)
      for (const card of cards) {
        if (!state.cardAssignments.has(card.name)) {
          const tierId = assignCardToDefaultTier(card);
          state.cardAssignments.set(card.name, tierId);
          updated = true;
        }
      }
      
      // Save if updated
      if (updated) {
        await tierStorageService.saveTierConfigurations(state);
        console.log('[Tier] Updated tier configurations with latest defaults');
      }
    }

    this.state = state;
    this.initialized = true;
  }

  /**
   * Get tier for a specific card.
   * @param cardName - Card name to lookup
   * @returns Tier object or null if card not assigned
   */
  getTierForCard(cardName: string): Tier | null {
    if (!this.state) return null;
    
    const tierId = this.state.cardAssignments.get(cardName);
    if (!tierId) return null;
    
    return this.state.tiers.get(tierId) || null;
  }

  /**
   * Get tier configuration for a tier ID.
   * @param tierId - Tier identifier
   * @returns TierConfiguration or null if tier not found
   */
  getTierConfiguration(tierId: string): TierConfiguration | null {
    if (!this.state) return null;
    
    const tier = this.state.tiers.get(tierId);
    return tier?.config || null;
  }

  /**
   * Get all tiers (default + custom).
   * @returns Array of Tier objects, ordered by display order
   */
  getAllTiers(): Tier[] {
    if (!this.state) return [];
    
    return Array.from(this.state.tiers.values())
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Get default tiers only (S, A, B, C, D, E, F).
   * @returns Array of default Tier objects
   */
  getDefaultTiers(): Tier[] {
    return this.getAllTiers().filter(t => t.type === 'default');
  }

  /**
   * Get custom tiers only.
   * @returns Array of custom Tier objects
   */
  getCustomTiers(): Tier[] {
    return this.getAllTiers().filter(t => t.type === 'custom');
  }

  /**
   * Move a card from one tier to another.
   * @param cardName - Card name to move
   * @param targetTierId - Target tier ID
   * @throws Error if tier not found
   */
  async moveCardToTier(cardName: string, targetTierId: string): Promise<void> {
    if (!this.state) throw new Error('Tier system not initialized');
    if (!this.state.tiers.has(targetTierId)) {
      throw new Error(`Tier not found: ${targetTierId}`);
    }

    this.state.cardAssignments.set(cardName, targetTierId);
    await this.saveState();
  }

  /**
   * Move multiple cards to a tier.
   * @param cardNames - Array of card names to move
   * @param targetTierId - Target tier ID
   * @throws Error if tier not found
   */
  async moveCardsToTier(cardNames: string[], targetTierId: string): Promise<void> {
    if (!this.state) throw new Error('Tier system not initialized');
    if (!this.state.tiers.has(targetTierId)) {
      throw new Error(`Tier not found: ${targetTierId}`);
    }

    for (const cardName of cardNames) {
      this.state.cardAssignments.set(cardName, targetTierId);
    }
    await this.saveState();
  }

  /**
   * Create a new custom tier.
   * @param name - Tier name (must be unique, 1-50 chars)
   * @returns Created Tier
   * @throws Error if name is invalid or duplicate
   */
  async createCustomTier(name: string): Promise<Tier> {
    if (!this.state) throw new Error('Tier system not initialized');
    
    // Validate name
    const trimmedName = name.trim();
    if (trimmedName.length === 0 || trimmedName.length > 50) {
      throw new Error('Tier name must be 1-50 characters');
    }
    
    // Check for reserved names
    const reservedNames = ['S', 'A', 'B', 'C', 'D', 'E', 'F'];
    if (reservedNames.includes(trimmedName.toUpperCase())) {
      throw new Error('This name is reserved for default tiers');
    }
    
    // Check for duplicates
    const existingTiers = this.getAllTiers();
    if (existingTiers.some(t => t.name.toLowerCase() === trimmedName.toLowerCase())) {
      throw new Error('A tier with this name already exists');
    }
    
    // Generate unique ID
    const tierId = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Get next order (custom tiers start at 7)
    const customTiers = this.getCustomTiers();
    const nextOrder = customTiers.length > 0 
      ? Math.max(...customTiers.map(t => t.order)) + 1
      : 7;
    
    // Create default configuration
    const defaultConfigs = createDefaultTiers();
    const defaultTierC = defaultConfigs.get('C'); // Use tier C as template
    const now = Date.now();
    
    const newTier: Tier = {
      id: tierId,
      name: trimmedName,
      type: 'custom',
      order: nextOrder,
      config: {
        colorScheme: defaultTierC?.config.colorScheme || {
          backgroundColor: '#95E1D3',
          textColor: '#000000',
          borderColor: '#6BC5B8'
        },
        sound: { filePath: null, volume: 1.0, enabled: true },
        enabled: true,
        modifiedAt: now
      },
      createdAt: now,
      modifiedAt: now
    };
    
    this.state.tiers.set(tierId, newTier);
    await this.saveState();
    
    return newTier;
  }

  /**
   * Update tier configuration (colors, sound, enabled state).
   * @param tierId - Tier identifier
   * @param config - Partial tier configuration to update
   * @throws Error if tier not found or configuration is invalid
   */
  async updateTierConfiguration(
    tierId: string,
    config: Partial<TierConfiguration>
  ): Promise<void> {
    if (!this.state) throw new Error('Tier system not initialized');
    
    const tier = this.state.tiers.get(tierId);
    if (!tier) throw new Error(`Tier not found: ${tierId}`);

    // Validate color scheme if provided
    if (config.colorScheme) {
      const validation = validateColorScheme(config.colorScheme);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid color scheme');
      }
    }

    // Validate light beam configuration if provided
    if (config.lightBeam) {
      const beamValidation = validateLightBeamConfig(config.lightBeam);
      if (!beamValidation.isValid) {
        throw new Error(beamValidation.error || 'Invalid beam configuration');
      }
    }

    // Update configuration
    tier.config = {
      ...tier.config,
      ...config,
      modifiedAt: Date.now()
    };
    tier.modifiedAt = Date.now();

    await this.saveState();
  }

  /**
   * Enable or disable a tier.
   * @param tierId - Tier identifier
   * @param enabled - Whether tier should be enabled
   */
  async setTierEnabled(tierId: string, enabled: boolean): Promise<void> {
    await this.updateTierConfiguration(tierId, { enabled });
  }

  /**
   * Check if a tier is enabled.
   * @param tierId - Tier identifier
   * @returns true if tier is enabled, false otherwise
   */
  isTierEnabled(tierId: string): boolean {
    const config = this.getTierConfiguration(tierId);
    return config?.enabled ?? true;
  }

  /**
   * Check if a card should be displayed based on its tier.
   * @param cardName - Card name to check
   * @returns true if card's tier is enabled, false otherwise
   */
  shouldDisplayCard(cardName: string): boolean {
    const tier = this.getTierForCard(cardName);
    if (!tier) return true; // Default to showing if no tier assigned
    return this.isTierEnabled(tier.id);
  }

  /**
   * Get all cards assigned to a tier.
   * @param tierId - Tier identifier
   * @returns Array of card names assigned to tier
   */
  getCardsInTier(tierId: string): string[] {
    if (!this.state) return [];
    
    return Array.from(this.state.cardAssignments.entries())
      .filter(([_, id]) => id === tierId)
      .map(([cardName]) => cardName);
  }

  /**
   * Delete a custom tier (only if no cards assigned).
   * @param tierId - Custom tier identifier
   * @throws Error if tier has cards assigned or is a default tier
   */
  async deleteCustomTier(tierId: string): Promise<void> {
    if (!this.state) throw new Error('Tier system not initialized');
    
    const tier = this.state.tiers.get(tierId);
    if (!tier) throw new Error(`Tier not found: ${tierId}`);
    
    if (tier.type === 'default') {
      throw new Error('Cannot delete default tiers');
    }
    
    const cardsInTier = this.getCardsInTier(tierId);
    if (cardsInTier.length > 0) {
      throw new Error('Cannot delete tier with cards assigned. Please move cards first.');
    }
    
    this.state.tiers.delete(tierId);
    await this.saveState();
  }

  /**
   * Get the current tier configuration state.
   * @returns Current state or null if not initialized
   */
  getState(): TierConfigurationState | null {
    return this.state;
  }

  /**
   * Save current state to storage.
   */
  private async saveState(): Promise<void> {
    if (!this.state) return;
    
    this.state.savedAt = Date.now();
    await tierStorageService.saveTierConfigurations(this.state);
  }
}

export const tierService = new TierService();

