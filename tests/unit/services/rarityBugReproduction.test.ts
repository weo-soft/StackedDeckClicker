/**
 * Reproduce the bug where Rain of Chaos appears too frequently with 10000% rarity
 */

import { describe, it, expect } from 'vitest';
import { cardService } from '../../../src/lib/services/cardService.js';
import { createDefaultCardPool } from '../../../src/lib/utils/defaultCardPool.js';
import type { CardPool } from '../../../src/lib/models/CardPool.js';
import type { UpgradeCollection } from '../../../src/lib/models/UpgradeCollection.js';
import type { Upgrade } from '../../../src/lib/models/Upgrade.js';
import type { UpgradeType } from '../../../src/lib/models/types.js';
import seedrandom from 'seedrandom';

describe('Rarity Bug Reproduction', () => {
  it('should reproduce the issue where Rain of Chaos appears too frequently', async () => {
    const cardPool = await createDefaultCardPool();
    const rainOfChaos = cardPool.cards.find(c => c.name === 'Rain of Chaos');
    
    if (!rainOfChaos) {
      throw new Error('Rain of Chaos not found');
    }
    
    console.log('\n=== Testing with 10000% rarity ===');
    console.log(`Rain of Chaos - Value: ${rainOfChaos.value}, Original Weight: ${rainOfChaos.weight}`);
    
    // Create upgrades with improvedRarity at level 1
    const upgrades: UpgradeCollection = {
      upgrades: new Map<UpgradeType, Upgrade>()
    };
    upgrades.upgrades.set('improvedRarity', {
      type: 'improvedRarity',
      level: 1,
      baseCost: 500,
      costMultiplier: 2.0
    });
    
    const rarityPercentage = 10000;
    
    // Apply rarity
    const modifiedPool = cardService.applyPercentageRarityIncrease(cardPool, rarityPercentage);
    const modifiedRainOfChaos = modifiedPool.cards.find(c => c.name === 'Rain of Chaos');
    
    console.log(`Modified Weight: ${modifiedRainOfChaos?.weight}`);
    console.log(`Total Pool Weight: ${modifiedPool.totalWeight}`);
    console.log(`Probability per draw: ${((modifiedRainOfChaos?.weight || 0) / modifiedPool.totalWeight * 100).toFixed(8)}%`);
    
    // Simulate 100 draws
    const prng = seedrandom('bug-test');
    let rainOfChaosCount = 0;
    const draws: string[] = [];
    
    for (let i = 0; i < 100; i++) {
      // Test with custom percentage
      const card = cardService.drawCard(cardPool, upgrades, prng, rarityPercentage);
      draws.push(card.name);
      if (card.name === 'Rain of Chaos') {
        rainOfChaosCount++;
      }
    }
    
    console.log(`\n=== Results ===`);
    console.log(`Rain of Chaos count in 100 draws: ${rainOfChaosCount}`);
    console.log(`Expected count (based on probability): ~${((modifiedRainOfChaos?.weight || 0) / modifiedPool.totalWeight * 100).toFixed(2)}`);
    
    // Count all unique cards
    const cardCounts: Record<string, number> = {};
    draws.forEach(name => {
      cardCounts[name] = (cardCounts[name] || 0) + 1;
    });
    
    // Show top 10 most common cards
    const sortedCards = Object.entries(cardCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    console.log(`\nTop 10 cards drawn:`);
    sortedCards.forEach(([name, count]) => {
      const card = cardPool.cards.find(c => c.name === name);
      console.log(`  ${name}: ${count} (value: ${card?.value}, original weight: ${card?.weight})`);
    });
    
    // Check if the issue is that rarity isn't being applied
    if (rainOfChaosCount >= 5) {
      console.log(`\n⚠️ BUG DETECTED: Rain of Chaos appeared ${rainOfChaosCount} times, which is way too many!`);
      console.log(`This suggests the rarity system is not working correctly.`);
      
      // Verify the modified pool was actually used
      console.log(`\n=== Debugging ===`);
      console.log(`Checking if modified pool weights...`);
      
      // Check a few high-value cards to see if their weights increased
      const highValueCards = cardPool.cards
        .filter(c => c.value > 1000)
        .slice(0, 5);
      
      console.log(`\nHigh-value cards (should have increased weights):`);
      highValueCards.forEach(card => {
        const modified = modifiedPool.cards.find(m => m.name === card.name);
        console.log(`  ${card.name}: original=${card.weight}, modified=${modified?.weight}, value=${card.value}`);
      });
      
      // Check a few low-value cards to see if their weights decreased
      const lowValueCards = cardPool.cards
        .filter(c => c.value < 1)
        .slice(0, 5);
      
      console.log(`\nLow-value cards (should have decreased weights):`);
      lowValueCards.forEach(card => {
        const modified = modifiedPool.cards.find(m => m.name === card.name);
        console.log(`  ${card.name}: original=${card.weight}, modified=${modified?.weight}, value=${card.value}`);
      });
    }
    
    // The test should fail if we get too many Rain of Chaos
    // With 10000% rarity, we should get 0 or maybe 1, not 7
    expect(rainOfChaosCount).toBeLessThan(2);
  });
  
  it('should verify rarity is actually being applied in drawCard', async () => {
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
    
    const rarityPercentage = 10000;
    
    // Manually apply rarity to see what the pool should look like
    const expectedModifiedPool = cardService.applyPercentageRarityIncrease(cardPool, rarityPercentage);
    const expectedRainOfChaos = expectedModifiedPool.cards.find(c => c.name === 'Rain of Chaos');
    
    console.log(`\n=== Expected modified pool ===`);
    console.log(`Rain of Chaos weight: ${expectedRainOfChaos?.weight}`);
    console.log(`Total weight: ${expectedModifiedPool.totalWeight}`);
    
    // Now test if drawCard actually uses this
    const prng1 = seedrandom('test1');
    const prng2 = seedrandom('test1'); // Same seed
    
    // Draw using the modified pool directly
    const { selectWeightedCard } = await import('../../../src/lib/utils/weightedRandom.js');
    const directCard = selectWeightedCard(expectedModifiedPool, prng1);
    
    // Draw using drawCard with custom percentage
    const drawCardResult = cardService.drawCard(cardPool, upgrades, prng2, rarityPercentage);
    
    console.log(`\nDirect draw from modified pool: ${directCard.name}`);
    console.log(`Draw via drawCard: ${drawCardResult.name}`);
    
    // They should be the same if rarity is applied correctly
    // But if they're different, it means drawCard isn't using the modified pool
    expect(directCard.name).toBe(drawCardResult.name);
  });
});

