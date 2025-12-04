import type { UpgradeType } from './types.js';

/**
 * Game mode identifier type
 */
export type GameModeId = 'classic' | 'ruthless' | 'dopamine' | 'stacked-deck-clicker';

/**
 * Game mode configuration preset that defines starting conditions and available features
 */
export interface GameMode {
  /** Unique identifier for the game mode */
  id: GameModeId;
  /** Display name for the game mode */
  name: string;
  /** User-facing description of the game mode */
  description: string;
  /** Starting number of decks (or 'unlimited' for Classic mode) */
  startingDecks: number | 'unlimited';
  /** Starting chaos/score value */
  startingChaos: number;
  /** Whether the upgrade shop is available */
  shopEnabled: boolean;
  /** List of upgrade types available in this mode */
  allowedUpgrades: UpgradeType[];
  /** Initial levels for specific upgrades (e.g., luckyDrop level 1) */
  initialUpgradeLevels: Map<UpgradeType, number>;
  /** Optional base rarity percentage override (0-100) */
  customRarityPercentage?: number;
}

/**
 * Classic mode configuration
 * Unlimited Stacked Decks, no shop, no upgrades
 */
export const CLASSIC_MODE: GameMode = {
  id: 'classic',
  name: 'Classic',
  description: 'Unlimited Stacked Decks, no shop, no upgrades',
  startingDecks: 'unlimited',
  startingChaos: 0,
  shopEnabled: false,
  allowedUpgrades: [],
  initialUpgradeLevels: new Map(),
  customRarityPercentage: undefined
};

/**
 * Ruthless mode configuration
 * Limited Stacked Decks, low starting chaos, buy decks with chaos, no shop, no upgrades
 */
export const RUTHLESS_MODE: GameMode = {
  id: 'ruthless',
  name: 'Ruthless',
  description: 'Limited Stacked Decks, low starting chaos, buy decks with chaos, no shop, no upgrades',
  startingDecks: 5,
  startingChaos: 25,
  shopEnabled: false,
  allowedUpgrades: [],
  initialUpgradeLevels: new Map(),
  customRarityPercentage: undefined
};

/**
 * Give me my Dopamine mode configuration
 * High starting resources, increased rarity, lucky drop level 1, only Rarity and Luck upgrades
 */
export const DOPAMINE_MODE: GameMode = {
  id: 'dopamine',
  name: 'Give me my Dopamine',
  description: 'High starting resources, increased rarity, lucky drop level 1, only Rarity and Luck upgrades',
  startingDecks: 75,
  startingChaos: 750,
  shopEnabled: true,
  allowedUpgrades: ['improvedRarity', 'luckyDrop'],
  initialUpgradeLevels: new Map([['luckyDrop', 1]]),
  customRarityPercentage: 25
};

/**
 * Stacked Deck Clicker mode configuration
 * Limited decks, no starting chaos, enabled shop, all upgrades available
 */
export const STACKED_DECK_CLICKER_MODE: GameMode = {
  id: 'stacked-deck-clicker',
  name: 'Stacked Deck Clicker',
  description: 'Limited decks, no starting chaos, enabled shop, all upgrades available',
  startingDecks: 10,
  startingChaos: 0,
  shopEnabled: true,
  allowedUpgrades: [
    'autoOpening',
    'improvedRarity',
    'luckyDrop',
    'multidraw',
    'deckProduction',
    'sceneCustomization'
  ],
  initialUpgradeLevels: new Map(),
  customRarityPercentage: undefined
};

/**
 * All available game mode configurations
 */
export const GAME_MODES: GameMode[] = [
  CLASSIC_MODE,
  RUTHLESS_MODE,
  DOPAMINE_MODE,
  STACKED_DECK_CLICKER_MODE
];

