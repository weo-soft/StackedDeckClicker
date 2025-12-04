import type { GameMode, GameModeId } from '../models/GameMode.js';
import { GAME_MODES, CLASSIC_MODE, RUTHLESS_MODE, DOPAMINE_MODE, STACKED_DECK_CLICKER_MODE } from '../models/GameMode.js';
import type { UpgradeType } from '../models/types.js';
import { gameStateService } from './gameStateService.js';

const GAME_MODE_STORAGE_KEY = 'gameMode';

/**
 * Service for managing game mode selection and configuration
 */
export class GameModeService {
  private currentModeId: GameModeId | null = null;
  private currentMode: GameMode | null = null;

  /**
   * Get all available game modes
   * @returns Array of all game mode configurations
   */
  getAvailableModes(): GameMode[] {
    return GAME_MODES;
  }

  /**
   * Get the full game mode configuration for a given mode ID
   * @param modeId - Game mode ID to get configuration for
   * @returns Game mode configuration object
   * @throws Error if modeId is invalid
   */
  getModeConfiguration(modeId: GameModeId): GameMode {
    switch (modeId) {
      case 'classic':
        return CLASSIC_MODE;
      case 'ruthless':
        return RUTHLESS_MODE;
      case 'dopamine':
        return DOPAMINE_MODE;
      case 'stacked-deck-clicker':
        return STACKED_DECK_CLICKER_MODE;
      default:
        throw new Error(`Invalid game mode ID: ${modeId}`);
    }
  }

  /**
   * Load game mode ID from localStorage
   * @returns Game mode ID or null if not found
   */
  loadGameMode(): GameModeId | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const savedMode = localStorage.getItem(GAME_MODE_STORAGE_KEY);
      if (!savedMode) {
        return null;
      }

      // Validate mode ID
      if (this.isValidModeId(savedMode)) {
        return savedMode;
      }

      // Invalid mode ID - clear it and log warning
      console.warn(`Invalid game mode ID in storage: ${savedMode}. Clearing.`);
      this.clearGameMode();
      return null;
    } catch (error) {
      // Handle localStorage errors (e.g., quota exceeded, disabled)
      console.warn('Failed to load game mode from localStorage:', error);
      // Return null to allow default behavior (show mode selection)
      return null;
    }
  }

  /**
   * Save game mode ID to localStorage
   * @param modeId - Game mode ID to save
   */
  saveGameMode(modeId: GameModeId): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      // Validate before saving
      if (!this.isValidModeId(modeId)) {
        console.error(`Attempted to save invalid game mode ID: ${modeId}`);
        return;
      }

      localStorage.setItem(GAME_MODE_STORAGE_KEY, modeId);
    } catch (error) {
      // Handle localStorage errors (e.g., quota exceeded, disabled)
      console.warn('Failed to save game mode to localStorage:', error);
      // Don't throw - allow game to continue without persistence
    }
  }

  /**
   * Clear game mode from localStorage
   */
  clearGameMode(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.removeItem(GAME_MODE_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear game mode from localStorage:', error);
    }
  }

  /**
   * Get the currently selected game mode ID from storage
   * Returns null if no mode has been selected
   * @returns Current game mode ID or null
   */
  getCurrentModeId(): GameModeId | null {
    if (this.currentModeId === null) {
      this.currentModeId = this.loadGameMode();
    }
    return this.currentModeId;
  }

  /**
   * Get the currently selected game mode configuration
   * Returns null if no mode is selected
   * @returns Current game mode configuration or null
   */
  getCurrentMode(): GameMode | null {
    const modeId = this.getCurrentModeId();
    if (!modeId) {
      this.currentMode = null;
      return null;
    }

    if (!this.currentMode || this.currentMode.id !== modeId) {
      this.currentMode = this.getModeConfiguration(modeId);
    }

    return this.currentMode;
  }

  /**
   * Set the selected game mode and persist to storage
   * Does NOT apply configuration - use applyModeConfiguration() for that
   * @param modeId - Game mode ID to select
   * @throws Error if modeId is invalid
   */
  setMode(modeId: GameModeId): void {
    if (!this.isValidModeId(modeId)) {
      throw new Error(`Invalid game mode ID: ${modeId}`);
    }

    this.currentModeId = modeId;
    this.currentMode = this.getModeConfiguration(modeId);
    this.saveGameMode(modeId);
  }

  /**
   * Apply game mode configuration to game state initialization
   * This should be called before gameStateService.initialize()
   * @param modeId - Game mode ID to apply
   * @throws Error if modeId is invalid or application fails
   */
  applyModeConfiguration(modeId: GameModeId): void {
    const mode = this.getModeConfiguration(modeId);

    // Set infinite decks for Classic mode
    if (mode.startingDecks === 'unlimited') {
      gameStateService.setInfiniteDecks(true);
    } else {
      gameStateService.setInfiniteDecks(false);
    }

    // Store mode for later use in game state initialization
    this.currentModeId = modeId;
    this.currentMode = mode;
  }

  /**
   * Check if shop is enabled for the current game mode
   * @returns True if shop should be visible, false otherwise
   */
  isShopEnabled(): boolean {
    const mode = this.getCurrentMode();
    return mode?.shopEnabled ?? false;
  }

  /**
   * Get allowed upgrade types for the current game mode
   * @returns Array of allowed upgrade types
   */
  getAllowedUpgrades(): UpgradeType[] {
    const mode = this.getCurrentMode();
    return mode?.allowedUpgrades ?? [];
  }

  /**
   * Check if a specific upgrade type is allowed in the current mode
   * @param upgradeType - Upgrade type to check
   * @returns True if upgrade is allowed, false otherwise
   */
  isUpgradeAllowed(upgradeType: UpgradeType): boolean {
    const allowedUpgrades = this.getAllowedUpgrades();
    return allowedUpgrades.includes(upgradeType);
  }

  /**
   * Validate that a mode ID is valid
   * @param modeId - Mode ID to validate
   * @returns True if valid, false otherwise
   */
  isValidModeId(modeId: string | null): modeId is GameModeId {
    if (!modeId) {
      return false;
    }

    const validModes: GameModeId[] = ['classic', 'ruthless', 'dopamine', 'stacked-deck-clicker'];
    return validModes.includes(modeId as GameModeId);
  }
}

// Export singleton instance
export const gameModeService = new GameModeService();

