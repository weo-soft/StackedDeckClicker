import { describe, it, expect, beforeEach } from 'vitest';
import { upgradeService } from '../../../src/lib/services/upgradeService.js';
import type { Upgrade } from '../../../src/lib/models/Upgrade.js';
import type { UpgradeType } from '../../../src/lib/models/types.js';

describe('UpgradeService', () => {
  let upgrade: Upgrade;

  beforeEach(() => {
    upgrade = {
      type: 'autoOpening',
      level: 0,
      baseCost: 100,
      costMultiplier: 1.5
    };
  });

  describe('calculateUpgradeCost', () => {
    it('should calculate cost for level 0 upgrade', () => {
      const cost = upgradeService.calculateUpgradeCost(upgrade);
      expect(cost).toBe(100); // baseCost
    });

    it('should calculate cost for level 1 upgrade', () => {
      upgrade.level = 1;
      const cost = upgradeService.calculateUpgradeCost(upgrade);
      expect(cost).toBe(150); // 100 * 1.5
    });

    it('should calculate cost for level 2 upgrade', () => {
      upgrade.level = 2;
      const cost = upgradeService.calculateUpgradeCost(upgrade);
      expect(cost).toBe(225); // 100 * 1.5^2
    });

    it('should handle different cost multipliers', () => {
      upgrade.costMultiplier = 2.0;
      upgrade.level = 2;
      const cost = upgradeService.calculateUpgradeCost(upgrade);
      expect(cost).toBe(400); // 100 * 2^2
    });
  });

  describe('calculateUpgradeEffect', () => {
    it('should calculate auto-opening rate', () => {
      upgrade.type = 'autoOpening';
      upgrade.level = 1;
      const effect = upgradeService.calculateUpgradeEffect(upgrade);
      expect(effect).toBeGreaterThan(0);
    });

    it('should calculate deck production rate', () => {
      upgrade.type = 'deckProduction';
      upgrade.level = 1;
      const effect = upgradeService.calculateUpgradeEffect(upgrade);
      expect(effect).toBeGreaterThan(0);
    });

    it('should return 0 for level 0 upgrades', () => {
      upgrade.level = 0;
      const effect = upgradeService.calculateUpgradeEffect(upgrade);
      expect(effect).toBe(0);
    });
  });

  describe('canAffordUpgrade', () => {
    it('should return true when score is sufficient', () => {
      const canAfford = upgradeService.canAffordUpgrade(upgrade, 200);
      expect(canAfford).toBe(true);
    });

    it('should return false when score is insufficient', () => {
      const canAfford = upgradeService.canAffordUpgrade(upgrade, 50);
      expect(canAfford).toBe(false);
    });

    it('should return true when score exactly equals cost', () => {
      const canAfford = upgradeService.canAffordUpgrade(upgrade, 100);
      expect(canAfford).toBe(true);
    });
  });
});

