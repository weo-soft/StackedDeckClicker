import { describe, it, expect } from 'vitest';
import { 
  CLASSIC_MODE, 
  RUTHLESS_MODE, 
  DOPAMINE_MODE, 
  STACKED_DECK_CLICKER_MODE,
  GAME_MODES 
} from '../../../src/lib/models/GameMode.js';

describe('GameMode Configurations', () => {
  describe('Classic Mode', () => {
    it('should have correct configuration', () => {
      expect(CLASSIC_MODE.id).toBe('classic');
      expect(CLASSIC_MODE.name).toBe('Classic');
      expect(CLASSIC_MODE.startingDecks).toBe('unlimited');
      expect(CLASSIC_MODE.startingChaos).toBe(0);
      expect(CLASSIC_MODE.shopEnabled).toBe(false);
      expect(CLASSIC_MODE.allowedUpgrades).toEqual([]);
      expect(CLASSIC_MODE.initialUpgradeLevels.size).toBe(0);
    });
  });

  describe('Ruthless Mode', () => {
    it('should have correct configuration', () => {
      expect(RUTHLESS_MODE.id).toBe('ruthless');
      expect(RUTHLESS_MODE.name).toBe('Ruthless');
      expect(RUTHLESS_MODE.startingDecks).toBe(5);
      expect(RUTHLESS_MODE.startingChaos).toBe(25);
      expect(RUTHLESS_MODE.shopEnabled).toBe(false);
      expect(RUTHLESS_MODE.allowedUpgrades).toEqual([]);
    });
  });

  describe('Dopamine Mode', () => {
    it('should have correct configuration', () => {
      expect(DOPAMINE_MODE.id).toBe('dopamine');
      expect(DOPAMINE_MODE.name).toBe('Give me my Dopamine');
      expect(DOPAMINE_MODE.startingDecks).toBe(75);
      expect(DOPAMINE_MODE.startingChaos).toBe(750);
      expect(DOPAMINE_MODE.shopEnabled).toBe(true);
      expect(DOPAMINE_MODE.allowedUpgrades).toEqual(['improvedRarity', 'luckyDrop']);
      expect(DOPAMINE_MODE.initialUpgradeLevels.get('luckyDrop')).toBe(1);
      expect(DOPAMINE_MODE.customRarityPercentage).toBe(25);
    });
  });

  describe('Stacked Deck Clicker Mode', () => {
    it('should have correct configuration', () => {
      expect(STACKED_DECK_CLICKER_MODE.id).toBe('stacked-deck-clicker');
      expect(STACKED_DECK_CLICKER_MODE.name).toBe('Stacked Deck Clicker');
      expect(STACKED_DECK_CLICKER_MODE.startingDecks).toBe(10);
      expect(STACKED_DECK_CLICKER_MODE.startingChaos).toBe(0);
      expect(STACKED_DECK_CLICKER_MODE.shopEnabled).toBe(true);
      expect(STACKED_DECK_CLICKER_MODE.allowedUpgrades.length).toBe(6);
      expect(STACKED_DECK_CLICKER_MODE.allowedUpgrades).toContain('autoOpening');
      expect(STACKED_DECK_CLICKER_MODE.allowedUpgrades).toContain('improvedRarity');
      expect(STACKED_DECK_CLICKER_MODE.allowedUpgrades).toContain('luckyDrop');
    });
  });

  describe('GAME_MODES array', () => {
    it('should contain all four modes', () => {
      expect(GAME_MODES).toHaveLength(4);
      expect(GAME_MODES.map(m => m.id)).toEqual([
        'classic',
        'ruthless',
        'dopamine',
        'stacked-deck-clicker'
      ]);
    });
  });

  describe('Dopamine Mode', () => {
    it('should have correct configuration', () => {
      expect(DOPAMINE_MODE.id).toBe('dopamine');
      expect(DOPAMINE_MODE.name).toBe('Give me my Dopamine');
      expect(DOPAMINE_MODE.startingDecks).toBe(75);
      expect(DOPAMINE_MODE.startingChaos).toBe(750);
      expect(DOPAMINE_MODE.shopEnabled).toBe(true);
      expect(DOPAMINE_MODE.allowedUpgrades).toEqual(['improvedRarity', 'luckyDrop']);
      expect(DOPAMINE_MODE.initialUpgradeLevels.get('luckyDrop')).toBe(1);
      expect(DOPAMINE_MODE.customRarityPercentage).toBe(25);
    });
  });

  describe('Stacked Deck Clicker Mode', () => {
    it('should have correct configuration', () => {
      expect(STACKED_DECK_CLICKER_MODE.id).toBe('stacked-deck-clicker');
      expect(STACKED_DECK_CLICKER_MODE.name).toBe('Stacked Deck Clicker');
      expect(STACKED_DECK_CLICKER_MODE.startingDecks).toBe(10);
      expect(STACKED_DECK_CLICKER_MODE.startingChaos).toBe(0);
      expect(STACKED_DECK_CLICKER_MODE.shopEnabled).toBe(true);
      expect(STACKED_DECK_CLICKER_MODE.allowedUpgrades.length).toBe(6);
      expect(STACKED_DECK_CLICKER_MODE.allowedUpgrades).toContain('autoOpening');
      expect(STACKED_DECK_CLICKER_MODE.allowedUpgrades).toContain('improvedRarity');
      expect(STACKED_DECK_CLICKER_MODE.allowedUpgrades).toContain('luckyDrop');
      expect(STACKED_DECK_CLICKER_MODE.allowedUpgrades).toContain('multidraw');
      expect(STACKED_DECK_CLICKER_MODE.allowedUpgrades).toContain('deckProduction');
      expect(STACKED_DECK_CLICKER_MODE.allowedUpgrades).toContain('sceneCustomization');
    });
  });
});

