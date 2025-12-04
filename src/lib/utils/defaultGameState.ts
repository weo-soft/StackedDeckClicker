import type { GameState } from '../models/GameState.js';
import type { UpgradeCollection } from '../models/UpgradeCollection.js';
import type { UpgradeType } from '../models/types.js';
import type { Upgrade } from '../models/Upgrade.js';
import type { GameMode } from '../models/GameMode.js';

/**
 * Creates a default game state for new players.
 * @param mode - Optional game mode configuration to apply
 */
export function createDefaultGameState(mode?: GameMode): GameState {
  const upgrades: UpgradeCollection = {
    upgrades: new Map<UpgradeType, Upgrade>()
  };

  // Initialize all upgrade types at level 0
  const upgradeTypes: UpgradeType[] = [
    'autoOpening',
    'improvedRarity',
    'luckyDrop',
    'multidraw',
    'deckProduction',
    'sceneCustomization'
  ];

  for (const type of upgradeTypes) {
    // Check if mode has initial level for this upgrade
    const initialLevel = mode?.initialUpgradeLevels.get(type) ?? 0;
    
    upgrades.upgrades.set(type, {
      type,
      level: initialLevel,
      baseCost: getBaseCost(type),
      costMultiplier: getCostMultiplier(type)
    });
  }

  // Determine starting decks based on mode
  let startingDecks: number;
  if (mode?.startingDecks === 'unlimited') {
    // For unlimited mode, set a high number (will be handled by infiniteDecksEnabled flag)
    startingDecks = 999999;
  } else {
    startingDecks = mode?.startingDecks ?? 10;
  }

  // Determine starting chaos/score based on mode
  const startingChaos = mode?.startingChaos ?? 0;

  return {
    score: startingChaos,
    decks: startingDecks,
    lastSessionTimestamp: Date.now(),
    upgrades,
    customizations: new Map<string, boolean>(),
    cardCollection: new Map<string, number>(),
    customRarityPercentage: mode?.customRarityPercentage
  };
}

function getBaseCost(type: UpgradeType): number {
  const costs: Record<UpgradeType, number> = {
    autoOpening: 100,
    improvedRarity: 500,
    luckyDrop: 250,
    multidraw: 1000,
    deckProduction: 200,
    sceneCustomization: 50
  };
  return costs[type] || 100;
}

function getCostMultiplier(type: UpgradeType): number {
  const multipliers: Record<UpgradeType, number> = {
    autoOpening: 1.5,
    improvedRarity: 2.0,
    luckyDrop: 1.75,
    multidraw: 2.5,
    deckProduction: 1.6,
    sceneCustomization: 1.3
  };
  return multipliers[type] || 1.5;
}

