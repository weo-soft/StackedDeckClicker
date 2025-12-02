import type { GameState } from '../models/GameState.js';
import type { UpgradeCollection } from '../models/UpgradeCollection.js';
import type { UpgradeType } from '../models/types.js';
import type { Upgrade } from '../models/Upgrade.js';

/**
 * Creates a default game state for new players.
 */
export function createDefaultGameState(): GameState {
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
    upgrades.upgrades.set(type, {
      type,
      level: 0,
      baseCost: getBaseCost(type),
      costMultiplier: getCostMultiplier(type)
    });
  }

  return {
    score: 0,
    decks: 10, // Start with 10 decks
    lastSessionTimestamp: Date.now(),
    upgrades,
    customizations: new Map<string, boolean>(),
    cardCollection: new Map<string, number>()
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

