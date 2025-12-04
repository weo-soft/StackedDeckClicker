import { describe, it, expect, beforeEach, vi } from 'vitest';
import { gameModeService } from '../../../src/lib/services/gameModeService.js';
import type { GameModeId } from '../../../src/lib/models/GameMode.js';
import { CLASSIC_MODE, RUTHLESS_MODE, DOPAMINE_MODE, STACKED_DECK_CLICKER_MODE } from '../../../src/lib/models/GameMode.js';

describe('GameModeService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
    // Reset service state
    (gameModeService as any).currentModeId = null;
    (gameModeService as any).currentMode = null;
  });

  describe('getAvailableModes', () => {
    it('should return all four game modes', () => {
      const modes = gameModeService.getAvailableModes();
      expect(modes).toHaveLength(4);
      expect(modes.map(m => m.id)).toEqual([
        'classic',
        'ruthless',
        'dopamine',
        'stacked-deck-clicker'
      ]);
    });
  });

  describe('getModeConfiguration', () => {
    it('should return Classic mode configuration', () => {
      const config = gameModeService.getModeConfiguration('classic');
      expect(config).toEqual(CLASSIC_MODE);
      expect(config.startingDecks).toBe('unlimited');
      expect(config.shopEnabled).toBe(false);
    });

    it('should return Ruthless mode configuration', () => {
      const config = gameModeService.getModeConfiguration('ruthless');
      expect(config).toEqual(RUTHLESS_MODE);
      expect(config.startingDecks).toBe(5);
      expect(config.startingChaos).toBe(25);
    });

    it('should return Dopamine mode configuration', () => {
      const config = gameModeService.getModeConfiguration('dopamine');
      expect(config).toEqual(DOPAMINE_MODE);
      expect(config.startingDecks).toBe(75);
      expect(config.startingChaos).toBe(750);
      expect(config.allowedUpgrades).toEqual(['improvedRarity', 'luckyDrop']);
    });

    it('should return Stacked Deck Clicker mode configuration', () => {
      const config = gameModeService.getModeConfiguration('stacked-deck-clicker');
      expect(config).toEqual(STACKED_DECK_CLICKER_MODE);
      expect(config.startingDecks).toBe(10);
      expect(config.startingChaos).toBe(0);
      expect(config.shopEnabled).toBe(true);
    });

    it('should throw error for invalid mode ID', () => {
      expect(() => {
        gameModeService.getModeConfiguration('invalid' as GameModeId);
      }).toThrow('Invalid game mode ID: invalid');
    });
  });

  describe('localStorage persistence', () => {
    it('should save and load game mode', () => {
      gameModeService.setMode('classic');
      expect(localStorage.getItem('gameMode')).toBe('classic');

      const loaded = gameModeService.getCurrentModeId();
      expect(loaded).toBe('classic');
    });

    it('should return null when no mode is saved', () => {
      const modeId = gameModeService.getCurrentModeId();
      expect(modeId).toBeNull();
    });

    it('should clear game mode from localStorage', () => {
      gameModeService.setMode('ruthless');
      expect(localStorage.getItem('gameMode')).toBe('ruthless');

      gameModeService.clearGameMode();
      expect(localStorage.getItem('gameMode')).toBeNull();
      expect(gameModeService.getCurrentModeId()).toBeNull();
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage.setItem to throw error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw, just log warning
      expect(() => {
        gameModeService.setMode('classic');
      }).not.toThrow();

      localStorage.setItem = originalSetItem;
    });
  });

  describe('getCurrentMode', () => {
    it('should return null when no mode is selected', () => {
      const mode = gameModeService.getCurrentMode();
      expect(mode).toBeNull();
    });

    it('should return current mode configuration', () => {
      gameModeService.setMode('dopamine');
      const mode = gameModeService.getCurrentMode();
      expect(mode).toEqual(DOPAMINE_MODE);
    });
  });

  describe('isValidModeId', () => {
    it('should return true for valid mode IDs', () => {
      expect(gameModeService.isValidModeId('classic')).toBe(true);
      expect(gameModeService.isValidModeId('ruthless')).toBe(true);
      expect(gameModeService.isValidModeId('dopamine')).toBe(true);
      expect(gameModeService.isValidModeId('stacked-deck-clicker')).toBe(true);
    });

    it('should return false for invalid mode IDs', () => {
      expect(gameModeService.isValidModeId('invalid')).toBe(false);
      expect(gameModeService.isValidModeId('')).toBe(false);
      expect(gameModeService.isValidModeId(null)).toBe(false);
    });
  });

  describe('invalid mode ID handling', () => {
    it('should clear invalid mode ID from localStorage', () => {
      // Set invalid mode directly in localStorage
      localStorage.setItem('gameMode', 'invalid-mode');
      
      // Getting current mode should clear invalid value
      const modeId = gameModeService.getCurrentModeId();
      expect(modeId).toBeNull();
      expect(localStorage.getItem('gameMode')).toBeNull();
    });
  });

  describe('isShopEnabled', () => {
    it('should return false when no mode is selected', () => {
      expect(gameModeService.isShopEnabled()).toBe(false);
    });

    it('should return false for Classic mode', () => {
      gameModeService.setMode('classic');
      expect(gameModeService.isShopEnabled()).toBe(false);
    });

    it('should return false for Ruthless mode', () => {
      gameModeService.setMode('ruthless');
      expect(gameModeService.isShopEnabled()).toBe(false);
    });

    it('should return true for Dopamine mode', () => {
      gameModeService.setMode('dopamine');
      expect(gameModeService.isShopEnabled()).toBe(true);
    });

    it('should return true for Stacked Deck Clicker mode', () => {
      gameModeService.setMode('stacked-deck-clicker');
      expect(gameModeService.isShopEnabled()).toBe(true);
    });
  });

  describe('getAllowedUpgrades', () => {
    it('should return empty array for Classic mode', () => {
      gameModeService.setMode('classic');
      expect(gameModeService.getAllowedUpgrades()).toEqual([]);
    });

    it('should return empty array for Ruthless mode', () => {
      gameModeService.setMode('ruthless');
      expect(gameModeService.getAllowedUpgrades()).toEqual([]);
    });

    it('should return only improvedRarity and luckyDrop for Dopamine mode', () => {
      gameModeService.setMode('dopamine');
      const allowed = gameModeService.getAllowedUpgrades();
      expect(allowed).toEqual(['improvedRarity', 'luckyDrop']);
    });

    it('should return all upgrade types for Stacked Deck Clicker mode', () => {
      gameModeService.setMode('stacked-deck-clicker');
      const allowed = gameModeService.getAllowedUpgrades();
      expect(allowed).toContain('autoOpening');
      expect(allowed).toContain('improvedRarity');
      expect(allowed).toContain('luckyDrop');
      expect(allowed).toContain('multidraw');
      expect(allowed).toContain('deckProduction');
      expect(allowed).toContain('sceneCustomization');
    });
  });

  describe('isUpgradeAllowed', () => {
    it('should return false for all upgrades in Classic mode', () => {
      gameModeService.setMode('classic');
      expect(gameModeService.isUpgradeAllowed('autoOpening')).toBe(false);
      expect(gameModeService.isUpgradeAllowed('improvedRarity')).toBe(false);
    });

    it('should return true only for improvedRarity and luckyDrop in Dopamine mode', () => {
      gameModeService.setMode('dopamine');
      expect(gameModeService.isUpgradeAllowed('improvedRarity')).toBe(true);
      expect(gameModeService.isUpgradeAllowed('luckyDrop')).toBe(true);
      expect(gameModeService.isUpgradeAllowed('autoOpening')).toBe(false);
      expect(gameModeService.isUpgradeAllowed('multidraw')).toBe(false);
    });
  });

  describe('applyModeConfiguration', () => {
    it('should set infinite decks for Classic mode', () => {
      const setInfiniteDecksSpy = vi.spyOn(gameStateService, 'setInfiniteDecks');
      
      gameModeService.applyModeConfiguration('classic');
      expect(setInfiniteDecksSpy).toHaveBeenCalledWith(true);
      
      setInfiniteDecksSpy.mockRestore();
    });

    it('should disable infinite decks for non-Classic modes', () => {
      const setInfiniteDecksSpy = vi.spyOn(gameStateService, 'setInfiniteDecks');
      
      gameModeService.applyModeConfiguration('ruthless');
      expect(setInfiniteDecksSpy).toHaveBeenCalledWith(false);
      
      setInfiniteDecksSpy.mockRestore();
    });
  });

  describe('initial upgrade levels', () => {
    it('should return correct initial upgrade levels for Dopamine mode', () => {
      const mode = gameModeService.getModeConfiguration('dopamine');
      expect(mode.initialUpgradeLevels.get('luckyDrop')).toBe(1);
      expect(mode.initialUpgradeLevels.get('autoOpening')).toBeUndefined();
    });
  });

  describe('customRarityPercentage', () => {
    it('should return correct custom rarity percentage for Dopamine mode', () => {
      const mode = gameModeService.getModeConfiguration('dopamine');
      expect(mode.customRarityPercentage).toBe(25);
    });

    it('should return undefined for modes without custom rarity', () => {
      const classicMode = gameModeService.getModeConfiguration('classic');
      expect(classicMode.customRarityPercentage).toBeUndefined();
    });
  });
});

