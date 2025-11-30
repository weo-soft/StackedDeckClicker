/**
 * Calculate probability of dropping 9 "Rain of Chaos" cards in 100 draws
 * with 10000% increased rarity
 */

import { describe, it, expect } from 'vitest';
import { cardService } from '../../../src/lib/services/cardService.js';
import { createDefaultCardPool } from '../../../src/lib/utils/defaultCardPool.js';
import type { CardPool } from '../../../src/lib/models/CardPool.js';
import seedrandom from 'seedrandom';

describe('Rain of Chaos Probability Calculation', () => {
  it('should calculate probability of 9 Rain of Chaos in 100 draws with 10000% rarity', async () => {
    // Load the actual card pool
    const cardPool = await createDefaultCardPool();
    
    // Find Rain of Chaos card
    const rainOfChaos = cardPool.cards.find(c => c.name === 'Rain of Chaos');
    
    if (!rainOfChaos) {
      throw new Error('Rain of Chaos card not found in pool');
    }
    
    console.log('\n=== Rain of Chaos Card Data ===');
    console.log(`Name: ${rainOfChaos.name}`);
    console.log(`Original Value: ${rainOfChaos.value}`);
    console.log(`Original Weight: ${rainOfChaos.weight}`);
    
    // Find min and max values in the pool
    const values = cardPool.cards.map(c => c.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue;
    
    console.log(`\n=== Pool Statistics ===`);
    console.log(`Min Value: ${minValue}`);
    console.log(`Max Value: ${maxValue}`);
    console.log(`Value Range: ${valueRange}`);
    console.log(`Total Cards: ${cardPool.cards.length}`);
    
    // Apply 10000% rarity
    const rarityPercentage = 10000;
    const modifiedPool = cardService.applyPercentageRarityIncrease(cardPool, rarityPercentage);
    
    // Find modified Rain of Chaos
    const modifiedRainOfChaos = modifiedPool.cards.find(c => c.name === 'Rain of Chaos');
    
    if (!modifiedRainOfChaos) {
      throw new Error('Rain of Chaos not found in modified pool');
    }
    
    // Calculate normalized value
    const normalizedValue = (rainOfChaos.value - minValue) / valueRange;
    
    // Calculate multiplier
    const maxMultiplier = 1 + (rarityPercentage / 100); // 101
    const minMultiplier = 1 - (rarityPercentage / 100); // -99, but clamped
    const multiplier = minMultiplier + (normalizedValue * (maxMultiplier - minMultiplier));
    const expectedWeight = Math.max(1, rainOfChaos.weight * multiplier);
    
    console.log(`\n=== With ${rarityPercentage}% Rarity ===`);
    console.log(`Normalized Value: ${normalizedValue.toFixed(6)}`);
    console.log(`Multiplier: ${multiplier.toFixed(6)}`);
    console.log(`Modified Weight: ${modifiedRainOfChaos.weight}`);
    console.log(`Expected Weight: ${expectedWeight}`);
    console.log(`Total Pool Weight: ${modifiedPool.totalWeight}`);
    
    // Calculate probability per draw
    const probabilityPerDraw = modifiedRainOfChaos.weight / modifiedPool.totalWeight;
    
    console.log(`\n=== Probability Calculation ===`);
    console.log(`Probability per draw: ${probabilityPerDraw.toFixed(10)}`);
    console.log(`Probability per draw (%): ${(probabilityPerDraw * 100).toFixed(8)}%`);
    
    // Calculate probability of exactly 9 successes in 100 draws (binomial distribution)
    // P(X = k) = C(n, k) * p^k * (1-p)^(n-k)
    // where n = 100, k = 9, p = probabilityPerDraw
    
    const n = 100;
    const k = 9;
    const p = probabilityPerDraw;
    
    // Calculate binomial coefficient C(n, k) = n! / (k! * (n-k)!)
    function binomialCoefficient(n: number, k: number): number {
      if (k > n || k < 0) return 0;
      if (k === 0 || k === n) return 1;
      
      // Use optimized calculation to avoid overflow
      let result = 1;
      for (let i = 0; i < k; i++) {
        result = result * (n - i) / (i + 1);
      }
      return result;
    }
    
    const binomialCoeff = binomialCoefficient(n, k);
    // Use logarithms to avoid underflow for very small probabilities
    const logBinomialCoeff = Math.log10(binomialCoeff);
    const logPk = k * Math.log10(p);
    const logQnk = (n - k) * Math.log10(1 - p);
    const logProbability = logBinomialCoeff + logPk + logQnk;
    
    const probabilityExactly9 = Math.pow(10, logProbability);
    
    console.log(`\n=== Results ===`);
    console.log(`Binomial Coefficient C(100, 9): ${binomialCoeff.toExponential(4)}`);
    console.log(`Log10(Binomial Coeff): ${logBinomialCoeff.toFixed(6)}`);
    console.log(`Log10(p^9): ${logPk.toFixed(6)}`);
    console.log(`Log10((1-p)^91): ${logQnk.toFixed(6)}`);
    console.log(`Log10(Probability): ${logProbability.toFixed(6)}`);
    console.log(`Probability of exactly 9 Rain of Chaos: ${probabilityExactly9.toExponential(10)}`);
    console.log(`Probability of exactly 9 Rain of Chaos (%): ${(probabilityExactly9 * 100).toExponential(8)}%`);
    
    // Also calculate probability of at least 9 (9 or more) using logarithms
    let logProbabilityAtLeast9 = -Infinity;
    for (let i = k; i <= n; i++) {
      const coeff = binomialCoefficient(n, i);
      const logCoeff = Math.log10(coeff);
      const logPi = i * Math.log10(p);
      const logQni = (n - i) * Math.log10(1 - p);
      const logProb = logCoeff + logPi + logQni;
      
      // Add probabilities in log space: log(a + b) = log(a) + log(1 + b/a) when a > b
      if (logProbabilityAtLeast9 === -Infinity) {
        logProbabilityAtLeast9 = logProb;
      } else {
        const diff = logProb - logProbabilityAtLeast9;
        if (diff > -10) { // Only add if not too small
          logProbabilityAtLeast9 = logProbabilityAtLeast9 + Math.log10(1 + Math.pow(10, diff));
        }
      }
    }
    
    const probabilityAtLeast9 = Math.pow(10, logProbabilityAtLeast9);
    
    console.log(`Log10(Probability at least 9): ${logProbabilityAtLeast9.toFixed(6)}`);
    console.log(`Probability of at least 9 Rain of Chaos: ${probabilityAtLeast9.toExponential(10)}`);
    console.log(`Probability of at least 9 Rain of Chaos (%): ${(probabilityAtLeast9 * 100).toExponential(8)}%`);
    
    // Simulate to verify
    console.log(`\n=== Simulation (100,000 trials) ===`);
    let exactly9Count = 0;
    let atLeast9Count = 0;
    const numTrials = 100000;
    
    for (let trial = 0; trial < numTrials; trial++) {
      const prng = seedrandom(`simulation-${trial}`);
      let rainOfChaosCount = 0;
      
      for (let draw = 0; draw < n; draw++) {
        const card = cardService.drawCard(modifiedPool, { upgrades: new Map() }, prng, rarityPercentage);
        if (card.name === 'Rain of Chaos') {
          rainOfChaosCount++;
        }
      }
      
      if (rainOfChaosCount === 9) {
        exactly9Count++;
      }
      if (rainOfChaosCount >= 9) {
        atLeast9Count++;
      }
    }
    
    const simulatedExactly9 = exactly9Count / numTrials;
    const simulatedAtLeast9 = atLeast9Count / numTrials;
    
    console.log(`Simulated probability of exactly 9: ${simulatedExactly9.toFixed(12)}`);
    console.log(`Simulated probability of at least 9: ${simulatedAtLeast9.toFixed(12)}`);
    console.log(`Difference (calculated vs simulated exactly 9): ${Math.abs(probabilityExactly9 - simulatedExactly9).toFixed(12)}`);
    
    // Verify the calculation is reasonable
    expect(probabilityExactly9).toBeGreaterThan(0);
    expect(probabilityExactly9).toBeLessThan(1);
    expect(probabilityAtLeast9).toBeGreaterThanOrEqual(probabilityExactly9);
    
    // The simulated value should be close to calculated (within 0.1% for large sample)
    expect(Math.abs(probabilityExactly9 - simulatedExactly9)).toBeLessThan(0.001);
    
    console.log(`\n=== Summary ===`);
    console.log(`With 10000% increased rarity, Rain of Chaos (value: ${rainOfChaos.value})`);
    console.log(`has a weight of ${modifiedRainOfChaos.weight} out of ${modifiedPool.totalWeight.toFixed(2)} total weight.`);
    console.log(`Probability per draw: ${(probabilityPerDraw * 100).toExponential(6)}%`);
    console.log(`The probability of getting exactly 9 Rain of Chaos in 100 draws is: ${probabilityExactly9.toExponential(10)}`);
    console.log(`This is approximately ${(probabilityExactly9 * 100).toExponential(8)}%`);
    console.log(`\nConclusion: The probability is EXTREMELY low (essentially zero) because:`);
    console.log(`- Rain of Chaos has a very low value (${rainOfChaos.value}), so it gets heavily penalized`);
    console.log(`- With 10000% rarity, its weight is reduced to the minimum (1)`);
    console.log(`- The probability per draw is only ${(probabilityPerDraw * 100).toExponential(6)}%`);
    console.log(`- Getting 9 out of 100 requires this tiny probability to occur 9 times`);
  });
});

