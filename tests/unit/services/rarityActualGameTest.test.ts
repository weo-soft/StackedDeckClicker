/**
 * Test to reproduce the actual game scenario where user got 7 Rain of Chaos
 * This tests various edge cases that might cause the bug
 */

import { describe, it, expect } from 'vitest';
import { cardService } from '../../../src/lib/services/cardService.js';
import { createDefaultCardPool } from '../../../src/lib/utils/defaultCardPool.js';
import type { CardPool } from '../../../src/lib/models/CardPool.js';
import type { UpgradeCollection } from '../../../src/lib/models/UpgradeCollection.js';
import type { Upgrade } from '../../../src/lib/models/Upgrade.js';
import type { UpgradeType } from '../../../src/lib/models/types.js';
import seedrandom from 'seedrandom';

describe('Actual Game Scenario - Rain of Chaos Bug', () => {
  it('should test scenario: upgrade level 0 but customRarityPercentage set to 10000', async () => {
    const cardPool = await createDefaultCardPool();
    const rainOfChaos = cardPool.cards.find(c => c.name === 'Rain of Chaos');
    
    if (!rainOfChaos) {
      throw new Error('Rain of Chaos not found');
    }
    
    // Scenario: User has slider set to 10000, but upgrade might be level 0
    const upgrades: UpgradeCollection = {
      upgrades: new Map<UpgradeType, Upgrade>()
    };
    
    // Test with upgrade level 0 (not purchased)
    upgrades.upgrades.set('improvedRarity', {
      type: 'improvedRarity',
      level: 0,  // NOT PURCHASED
      baseCost: 500,
      costMultiplier: 2.0
    });
    
    const customRarityPercentage = 10000;
    
    console.log('\n=== Testing with upgrade level 0 but customRarityPercentage = 10000 ===');
    
    // Check if rarity is applied
    const prng = seedrandom('bug-scenario-1');
    const card = cardService.drawCard(cardPool, upgrades, prng, customRarityPercentage);
    
    console.log(`First card drawn: ${card.name} (value: ${card.value})`);
    
    // Draw 100 cards
    let rainOfChaosCount = 0;
    const prng2 = seedrandom('bug-scenario-2');
    
    for (let i = 0; i < 100; i++) {
      const drawnCard = cardService.drawCard(cardPool, upgrades, prng2, customRarityPercentage);
      if (drawnCard.name === 'Rain of Chaos') {
        rainOfChaosCount++;
      }
    }
    
    console.log(`Rain of Chaos count: ${rainOfChaosCount}`);
    
    // If we get many Rain of Chaos, it means rarity isn't being applied
    if (rainOfChaosCount > 2) {
      console.log(`\n⚠️ BUG CONFIRMED: Got ${rainOfChaosCount} Rain of Chaos when we should get 0-1`);
      console.log(`This suggests rarity is NOT being applied when upgrade level is 0`);
    }
    
    // With 10000% rarity, we should get 0 or maybe 1
    expect(rainOfChaosCount).toBeLessThan(2);
  });
  
  it('should test scenario: customRarityPercentage is 0 (falsy check)', async () => {
    const cardPool = await createDefaultCardPool();
    
    const upgrades: UpgradeCollection = {
      upgrades: new Map<UpgradeType, Upgrade>()
    };
    upgrades.upgrades.set('improvedRarity', {
      type: 'improvedRarity',
      level: 1,
      baseCost: 500,
      costMultiplier: 2.0
    });
    
    // Test with customRarityPercentage = 0 (should this disable rarity or use level-based?)
    const customRarityPercentage = 0;
    
    console.log('\n=== Testing with customRarityPercentage = 0 ===');
    
    const prng = seedrandom('zero-test');
    let rainOfChaosCount = 0;
    
    for (let i = 0; i < 100; i++) {
      const card = cardService.drawCard(cardPool, upgrades, prng, customRarityPercentage);
      if (card.name === 'Rain of Chaos') {
        rainOfChaosCount++;
      }
    }
    
    console.log(`Rain of Chaos count with 0%: ${rainOfChaosCount}`);
    console.log(`(Should be higher than with 10000% since no rarity penalty)`);
  });
  
  it('should test scenario: customRarityPercentage is undefined', async () => {
    const cardPool = await createDefaultCardPool();
    
    const upgrades: UpgradeCollection = {
      upgrades: new Map<UpgradeType, Upgrade>()
    };
    upgrades.upgrades.set('improvedRarity', {
      type: 'improvedRarity',
      level: 1,  // Level 1 = 10% rarity
      baseCost: 500,
      costMultiplier: 2.0
    });
    
    // Test with customRarityPercentage = undefined (should use level-based 10%)
    console.log('\n=== Testing with customRarityPercentage = undefined (should use 10%) ===');
    
    const prng = seedrandom('undefined-test');
    let rainOfChaosCount = 0;
    
    for (let i = 0; i < 100; i++) {
      const card = cardService.drawCard(cardPool, upgrades, prng, undefined);
      if (card.name === 'Rain of Chaos') {
        rainOfChaosCount++;
      }
    }
    
    console.log(`Rain of Chaos count with 10% (level 1): ${rainOfChaosCount}`);
    console.log(`(Should be higher than with 10000% since only 10% penalty)`);
  });
  
  it('should verify the actual bug: check if rarity is applied when it should be', async () => {
    const cardPool = await createDefaultCardPool();
    const rainOfChaos = cardPool.cards.find(c => c.name === 'Rain of Chaos');
    
    if (!rainOfChaos) {
      throw new Error('Rain of Chaos not found');
    }
    
    console.log('\n=== Comprehensive Bug Check ===');
    console.log(`Original Rain of Chaos weight: ${rainOfChaos.weight}`);
    console.log(`Original Rain of Chaos value: ${rainOfChaos.value}`);
    
    // Test 1: With 10000% and upgrade level 1
    const upgrades1: UpgradeCollection = {
      upgrades: new Map<UpgradeType, Upgrade>()
    };
    upgrades1.upgrades.set('improvedRarity', {
      type: 'improvedRarity',
      level: 1,
      baseCost: 500,
      costMultiplier: 2.0
    });
    
    const modifiedPool1 = cardService.applyPercentageRarityIncrease(cardPool, 10000);
    const modifiedRainOfChaos1 = modifiedPool1.cards.find(c => c.name === 'Rain of Chaos');
    console.log(`\nWith 10000% rarity (manual):`);
    console.log(`  Modified weight: ${modifiedRainOfChaos1?.weight}`);
    console.log(`  Probability: ${((modifiedRainOfChaos1?.weight || 0) / modifiedPool1.totalWeight * 100).toFixed(8)}%`);
    
    // Test 2: Draw cards and see what happens
    const prng = seedrandom('comprehensive-test');
    let rainOfChaosCount = 0;
    const draws: string[] = [];
    
    for (let i = 0; i < 100; i++) {
      const card = cardService.drawCard(cardPool, upgrades1, prng, 10000);
      draws.push(card.name);
      if (card.name === 'Rain of Chaos') {
        rainOfChaosCount++;
      }
    }
    
    console.log(`\nActual draws with 10000% via drawCard:`);
    console.log(`  Rain of Chaos count: ${rainOfChaosCount}`);
    
    // Count distribution
    const cardCounts: Record<string, number> = {};
    draws.forEach(name => {
      cardCounts[name] = (cardCounts[name] || 0) + 1;
    });
    
    const rainOfChaosActual = cardCounts['Rain of Chaos'] || 0;
    console.log(`  Rain of Chaos from distribution: ${rainOfChaosActual}`);
    
    // If we're getting 7, something is very wrong
    if (rainOfChaosCount >= 5) {
      console.log(`\n🚨 BUG DETECTED: Getting ${rainOfChaosCount} Rain of Chaos!`);
      console.log(`Expected: 0-1`);
      console.log(`This means rarity is NOT being applied correctly!`);
    }
    
    expect(rainOfChaosCount).toBeLessThan(2);
  });
});

