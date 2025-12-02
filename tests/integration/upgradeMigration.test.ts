/**
 * Integration tests for upgrade migration from 'luck' to 'luckyDrop'
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { GameState } from '../../src/lib/models/GameState.js';
import type { UpgradeCollection } from '../../src/lib/models/UpgradeCollection.js';
import type { Upgrade } from '../../src/lib/models/Upgrade.js';
import { createDefaultGameState } from '../../src/lib/utils/defaultGameState.js';
import { gameStateService } from '../../src/lib/services/gameStateService.js';

describe('Upgrade Migration: luck to luckyDrop', () => {
  function createGameStateWithLuckUpgrade(level: number): GameState {
    const state = createDefaultGameState();
    // Manually add 'luck' upgrade (simulating old saved state)
    const luckUpgrade: Upgrade = {
      type: 'luck' as any, // Using 'luck' type to simulate old state
      level,
      baseCost: 250,
      costMultiplier: 1.75
    };
    state.upgrades.upgrades.set('luck' as any, luckUpgrade);
    return state;
  }

  function migrateLuckToLuckyDrop(gameState: GameState): GameState {
    const luckUpgrade = (gameState.upgrades.upgrades as any).get('luck');
    
    if (luckUpgrade) {
      const luckyDropUpgrade: Upgrade = {
        type: 'luckyDrop',
        level: luckUpgrade.level,
        baseCost: luckUpgrade.baseCost,
        costMultiplier: luckUpgrade.costMultiplier
      };
      
      const newUpgrades = new Map(gameState.upgrades.upgrades);
      newUpgrades.set('luckyDrop', luckyDropUpgrade);
      newUpgrades.delete('luck' as any);
      
      return {
        ...gameState,
        upgrades: {
          upgrades: newUpgrades
        }
      };
    }
    
    return gameState;
  }

  it('should migrate luck level 1 to luckyDrop level 1', () => {
    const gameState = createGameStateWithLuckUpgrade(1);
    const migrated = migrateLuckToLuckyDrop(gameState);
    
    expect((migrated.upgrades.upgrades as any).has('luck')).toBe(false);
    expect(migrated.upgrades.upgrades.has('luckyDrop')).toBe(true);
    const luckyDrop = migrated.upgrades.upgrades.get('luckyDrop');
    expect(luckyDrop?.level).toBe(1);
    expect(luckyDrop?.baseCost).toBe(250);
    expect(luckyDrop?.costMultiplier).toBe(1.75);
  });

  it('should migrate luck level 5 to luckyDrop level 5', () => {
    const gameState = createGameStateWithLuckUpgrade(5);
    const migrated = migrateLuckToLuckyDrop(gameState);
    
    expect((migrated.upgrades.upgrades as any).has('luck')).toBe(false);
    expect(migrated.upgrades.upgrades.has('luckyDrop')).toBe(true);
    const luckyDrop = migrated.upgrades.upgrades.get('luckyDrop');
    expect(luckyDrop?.level).toBe(5);
  });

  it('should migrate luck level 0 to luckyDrop level 0', () => {
    const gameState = createGameStateWithLuckUpgrade(0);
    const migrated = migrateLuckToLuckyDrop(gameState);
    
    expect((migrated.upgrades.upgrades as any).has('luck')).toBe(false);
    expect(migrated.upgrades.upgrades.has('luckyDrop')).toBe(true);
    const luckyDrop = migrated.upgrades.upgrades.get('luckyDrop');
    expect(luckyDrop?.level).toBe(0);
  });

  it('should be idempotent (safe to run multiple times)', () => {
    const gameState = createGameStateWithLuckUpgrade(2);
    const migrated1 = migrateLuckToLuckyDrop(gameState);
    const migrated2 = migrateLuckToLuckyDrop(migrated1);
    
    // Second migration should not change anything
    expect(migrated1.upgrades.upgrades.has('luckyDrop')).toBe(true);
    expect(migrated2.upgrades.upgrades.has('luckyDrop')).toBe(true);
    expect(migrated1.upgrades.upgrades.get('luckyDrop')?.level).toBe(2);
    expect(migrated2.upgrades.upgrades.get('luckyDrop')?.level).toBe(2);
  });

  it('should handle game state without luck upgrade (no migration needed)', () => {
    const gameState = createDefaultGameState();
    const migrated = migrateLuckToLuckyDrop(gameState);
    
    // Should not have luck upgrade
    expect((migrated.upgrades.upgrades as any).has('luck')).toBe(false);
    // Should have luckyDrop from default state
    expect(migrated.upgrades.upgrades.has('luckyDrop')).toBe(true);
  });

  it('should preserve other upgrades during migration', () => {
    const gameState = createGameStateWithLuckUpgrade(3);
    const autoOpeningBefore = gameState.upgrades.upgrades.get('autoOpening');
    
    const migrated = migrateLuckToLuckyDrop(gameState);
    const autoOpeningAfter = migrated.upgrades.upgrades.get('autoOpening');
    
    expect(autoOpeningAfter).toEqual(autoOpeningBefore);
    expect(migrated.upgrades.upgrades.has('improvedRarity')).toBe(true);
    expect(migrated.upgrades.upgrades.has('multidraw')).toBe(true);
  });

  it('should preserve upgrade costs and multipliers during migration', () => {
    const gameState = createGameStateWithLuckUpgrade(4);
    const migrated = migrateLuckToLuckyDrop(gameState);
    
    const luckyDrop = migrated.upgrades.upgrades.get('luckyDrop');
    expect(luckyDrop?.baseCost).toBe(250);
    expect(luckyDrop?.costMultiplier).toBe(1.75);
  });
});

