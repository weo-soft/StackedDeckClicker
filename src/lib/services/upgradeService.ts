import type { Upgrade } from '../models/Upgrade.js';
import type { UpgradeCollection } from '../models/UpgradeCollection.js';
import type { UpgradeType } from '../models/types.js';

export interface UpgradeInfo {
  type: UpgradeType;
  level: number;
  cost: number;
  effect: number;
  effectDescription: string;
}

/**
 * Service for handling upgrade calculations, costs, and effects.
 */
export class UpgradeService {
  /**
   * Calculate the cost to purchase the next level of an upgrade.
   */
  calculateUpgradeCost(upgrade: Upgrade): number {
    return upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.level);
  }

  /**
   * Calculate the current effect value of an upgrade based on its level.
   */
  calculateUpgradeEffect(upgrade: Upgrade): number {
    if (upgrade.level === 0) return 0;

    switch (upgrade.type) {
      case 'autoOpening':
        return this.calculateAutoOpeningRate(upgrade.level);
      case 'improvedRarity':
        return upgrade.level; // Level directly represents rarity bonus
      case 'luck':
        return upgrade.level; // Level represents number of extra draws
      case 'multidraw':
        // Level 1 = 10, Level 2 = 50, Level 3 = 100
        if (upgrade.level === 1) return 10;
        if (upgrade.level === 2) return 50;
        if (upgrade.level >= 3) return 100;
        return 0;
      case 'deckProduction':
        return this.calculateDeckProductionRate(upgrade.level);
      case 'sceneCustomization':
        return upgrade.level; // Level represents customization unlocked
      default:
        return 0;
    }
  }

  /**
   * Check if player can afford an upgrade.
   */
  canAffordUpgrade(upgrade: Upgrade, currentScore: number): boolean {
    const cost = this.calculateUpgradeCost(upgrade);
    return currentScore >= cost;
  }

  /**
   * Get all available upgrades with their current costs and effects.
   */
  getAvailableUpgrades(upgrades: UpgradeCollection): UpgradeInfo[] {
    const upgradeInfos: UpgradeInfo[] = [];
    
    for (const [type, upgrade] of upgrades.upgrades) {
      const cost = this.calculateUpgradeCost(upgrade);
      const effect = this.calculateUpgradeEffect(upgrade);
      const description = this.getEffectDescription(type, effect);
      
      upgradeInfos.push({
        type,
        level: upgrade.level,
        cost,
        effect,
        effectDescription: description
      });
    }
    
    return upgradeInfos;
  }

  /**
   * Calculate auto-opening rate (decks per second) based on upgrade level.
   */
  calculateAutoOpeningRate(autoOpeningLevel: number): number {
    if (autoOpeningLevel === 0) return 0;
    // Level 1 = 0.1 decks/sec, Level 2 = 0.2, Level 3 = 0.5, etc.
    return 0.1 * autoOpeningLevel;
  }

  /**
   * Calculate deck production rate (decks per second) based on upgrade level.
   */
  calculateDeckProductionRate(productionLevel: number): number {
    if (productionLevel === 0) return 0;
    // Level 1 = 0.05 decks/sec, Level 2 = 0.1, Level 3 = 0.2, etc.
    return 0.05 * productionLevel;
  }

  /**
   * Get human-readable description of upgrade effect.
   */
  getEffectDescription(type: UpgradeType, effect: number): string {
    switch (type) {
      case 'autoOpening':
        return `${effect.toFixed(1)} decks/second`;
      case 'improvedRarity':
        return `+${effect * 10}% rare card chance`;
      case 'luck':
        return `Best of ${effect + 1} draws`;
      case 'multidraw':
        return `Open ${effect} decks at once`;
      case 'deckProduction':
        return `${effect.toFixed(2)} decks/second`;
      case 'sceneCustomization':
        return `${effect} customization(s) unlocked`;
      default:
        return 'No effect';
    }
  }
}

// Export singleton instance
export const upgradeService = new UpgradeService();

