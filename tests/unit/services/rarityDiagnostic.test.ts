/**
 * Diagnostic test to help identify why rarity isn't working in the actual game
 */

import { describe, it } from 'vitest';
import { cardService } from '../../../src/lib/services/cardService.js';
import { createDefaultCardPool } from '../../../src/lib/utils/defaultCardPool.js';
import type { CardPool } from '../../../src/lib/models/CardPool.js';
import type { UpgradeCollection } from '../../../src/lib/models/UpgradeCollection.js';
import type { Upgrade } from '../../../src/lib/models/Upgrade.js';
import type { UpgradeType } from '../../../src/lib/models/types.js';
import seedrandom from 'seedrandom';

describe('Rarity Diagnostic - Help identify the bug', () => {
  it('should print diagnostic information for debugging', async () => {
    const cardPool = await createDefaultCardPool();
    const rainOfChaos = cardPool.cards.find(c => c.name === 'Rain of Chaos');
    
    if (!rainOfChaos) {
      throw new Error('Rain of Chaos not found');
    }
    
    console.log('\n=== DIAGNOSTIC INFORMATION ===\n');
    
    // Test all possible scenarios
    const scenarios = [
      { upgradeLevel: 0, customPercentage: undefined, description: 'No upgrade, no custom %' },
      { upgradeLevel: 0, customPercentage: 10000, description: 'No upgrade, but custom % = 10000' },
      { upgradeLevel: 1, customPercentage: undefined, description: 'Level 1, no custom % (should use 10%)' },
      { upgradeLevel: 1, customPercentage: 10000, description: 'Level 1, custom % = 10000' },
      { upgradeLevel: 1, customPercentage: 0, description: 'Level 1, custom % = 0' },
    ];
    
    for (const scenario of scenarios) {
      console.log(`\n--- Scenario: ${scenario.description} ---`);
      
      const upgrades: UpgradeCollection = {
        upgrades: new Map<UpgradeType, Upgrade>()
      };
      
      if (scenario.upgradeLevel >= 0) {
        upgrades.upgrades.set('improvedRarity', {
          type: 'improvedRarity',
          level: scenario.upgradeLevel,
          baseCost: 500,
          costMultiplier: 2.0
        });
      }
      
      // Check what rarity percentage will be used
      const rarityUpgrade = upgrades.upgrades.get('improvedRarity');
      const willApplyRarity = (rarityUpgrade && rarityUpgrade.level > 0) || scenario.customPercentage !== undefined;
      const rarityPercentage = scenario.customPercentage ?? (rarityUpgrade ? rarityUpgrade.level * 10 : 0);
      
      console.log(`  Upgrade level: ${scenario.upgradeLevel}`);
      console.log(`  Custom percentage: ${scenario.customPercentage}`);
      console.log(`  Will apply rarity: ${willApplyRarity}`);
      console.log(`  Rarity percentage that will be used: ${rarityPercentage}`);
      
      if (willApplyRarity && rarityPercentage > 0) {
        const modifiedPool = cardService.applyPercentageRarityIncrease(cardPool, rarityPercentage);
        const modifiedRainOfChaos = modifiedPool.cards.find(c => c.name === 'Rain of Chaos');
        const probability = (modifiedRainOfChaos?.weight || 0) / modifiedPool.totalWeight;
        
        console.log(`  Modified Rain of Chaos weight: ${modifiedRainOfChaos?.weight}`);
        console.log(`  Probability per draw: ${(probability * 100).toExponential(6)}%`);
        
        // Simulate 100 draws
        const prng = seedrandom(`diagnostic-${scenario.description}`);
        let count = 0;
        for (let i = 0; i < 100; i++) {
          const card = cardService.drawCard(cardPool, upgrades, prng, scenario.customPercentage);
          if (card.name === 'Rain of Chaos') count++;
        }
        console.log(`  Rain of Chaos in 100 draws: ${count}`);
        
        if (scenario.customPercentage === 10000 && count >= 5) {
          console.log(`  ⚠️ BUG: Got ${count} when should get 0-1!`);
        }
      } else {
        console.log(`  Rarity NOT applied (no upgrade or percentage = 0)`);
        const probability = rainOfChaos.weight / cardPool.totalWeight;
        console.log(`  Original probability: ${(probability * 100).toFixed(4)}%`);
        
        // Simulate 100 draws without rarity
        const prng = seedrandom(`diagnostic-no-rarity-${scenario.description}`);
        let count = 0;
        for (let i = 0; i < 100; i++) {
          const card = cardService.drawCard(cardPool, upgrades, prng, scenario.customPercentage);
          if (card.name === 'Rain of Chaos') count++;
        }
        console.log(`  Rain of Chaos in 100 draws: ${count} (expected ~${(probability * 100).toFixed(1)})`);
      }
    }
    
    console.log('\n=== RECOMMENDATIONS ===');
    console.log('If you got 7 Rain of Chaos with 10000% rarity, check:');
    console.log('1. Is customRarityPercentage actually set to 10000 in gameState?');
    console.log('2. Is the improvedRarity upgrade level > 0?');
    console.log('3. Is customRarityPercentage being saved/loaded correctly?');
    console.log('4. Check browser console for any errors');
    console.log('5. Try refreshing the page after setting the slider');
  });
});

