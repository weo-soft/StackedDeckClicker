import { describe, it, expect, beforeEach, vi } from 'vitest';
import { gameModeService } from '../../src/lib/services/gameModeService.js';
import { gameStateService } from '../../src/lib/services/gameStateService.js';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Game Mode Selection Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Mode selection flow', () => {
    it('should select a mode and persist it', () => {
      gameModeService.setMode('classic');
      
      const savedMode = gameModeService.getCurrentModeId();
      expect(savedMode).toBe('classic');
      expect(localStorage.getItem('gameMode')).toBe('classic');
    });

    it('should load saved mode on service initialization', () => {
      localStorage.setItem('gameMode', 'ruthless');
      
      const modeId = gameModeService.getCurrentModeId();
      expect(modeId).toBe('ruthless');
    });

    it('should apply mode configuration correctly', () => {
      const setInfiniteDecksSpy = vi.spyOn(gameStateService, 'setInfiniteDecks');
      
      gameModeService.applyModeConfiguration('classic');
      expect(setInfiniteDecksSpy).toHaveBeenCalledWith(true);
      
      gameModeService.applyModeConfiguration('ruthless');
      expect(setInfiniteDecksSpy).toHaveBeenCalledWith(false);
      
      setInfiniteDecksSpy.mockRestore();
    });

    it('should get correct mode configuration after selection', () => {
      gameModeService.setMode('dopamine');
      
      const mode = gameModeService.getCurrentMode();
      expect(mode).toBeTruthy();
      expect(mode?.id).toBe('dopamine');
      expect(mode?.startingDecks).toBe(75);
      expect(mode?.startingChaos).toBe(750);
    });
  });

  describe('Mode change flow', () => {
    it('should clear mode and allow new selection', () => {
      gameModeService.setMode('classic');
      expect(gameModeService.getCurrentModeId()).toBe('classic');
      
      gameModeService.clearMode();
      expect(gameModeService.getCurrentModeId()).toBeNull();
      expect(localStorage.getItem('gameMode')).toBeNull();
    });
  });

  describe('Classic mode initialization', () => {
    it('should initialize with unlimited decks', () => {
      const setInfiniteDecksSpy = vi.spyOn(gameStateService, 'setInfiniteDecks');
      
      gameModeService.applyModeConfiguration('classic');
      expect(setInfiniteDecksSpy).toHaveBeenCalledWith(true);
      
      setInfiniteDecksSpy.mockRestore();
    });

    it('should have correct starting conditions', () => {
      gameModeService.setMode('classic');
      const mode = gameModeService.getCurrentMode();
      
      expect(mode?.startingDecks).toBe('unlimited');
      expect(mode?.startingChaos).toBe(0);
      expect(mode?.shopEnabled).toBe(false);
    });
  });

  describe('Ruthless mode initialization', () => {
    it('should initialize with limited decks and low chaos', () => {
      gameModeService.setMode('ruthless');
      const mode = gameModeService.getCurrentMode();
      
      expect(mode?.startingDecks).toBe(5);
      expect(mode?.startingChaos).toBe(25);
      expect(mode?.shopEnabled).toBe(false);
    });
  });

  describe('Dopamine mode initialization', () => {
    it('should initialize with high resources and custom settings', () => {
      gameModeService.setMode('dopamine');
      const mode = gameModeService.getCurrentMode();
      
      expect(mode?.startingDecks).toBe(75);
      expect(mode?.startingChaos).toBe(750);
      expect(mode?.shopEnabled).toBe(true);
      expect(mode?.allowedUpgrades).toEqual(['improvedRarity', 'luckyDrop']);
      expect(mode?.customRarityPercentage).toBe(25);
      expect(mode?.initialUpgradeLevels.get('luckyDrop')).toBe(1);
    });
  });

  describe('Stacked Deck Clicker mode initialization', () => {
    it('should initialize with standard settings and full shop', () => {
      gameModeService.setMode('stacked-deck-clicker');
      const mode = gameModeService.getCurrentMode();
      
      expect(mode?.startingDecks).toBe(10);
      expect(mode?.startingChaos).toBe(0);
      expect(mode?.shopEnabled).toBe(true);
      expect(mode?.allowedUpgrades.length).toBe(6);
    });
  });

  describe('Mode persistence', () => {
    it('should persist mode across service calls', () => {
      gameModeService.setMode('dopamine');
      expect(localStorage.getItem('gameMode')).toBe('dopamine');
      
      // Create new service instance to test loading
      const { gameModeService: newService } = require('../../src/lib/services/gameModeService.js');
      const loadedMode = newService.getCurrentModeId();
      expect(loadedMode).toBe('dopamine');
    });
  });

  describe('Mode change confirmation', () => {
    it('should clear mode before setting new mode', () => {
      gameModeService.setMode('classic');
      expect(gameModeService.getCurrentModeId()).toBe('classic');
      
      gameModeService.setMode('ruthless');
      expect(gameModeService.getCurrentModeId()).toBe('ruthless');
      expect(localStorage.getItem('gameMode')).toBe('ruthless');
    });
  });
});

