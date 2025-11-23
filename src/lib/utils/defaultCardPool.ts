import type { CardPool } from '../models/CardPool.js';
import type { DivinationCard } from '../models/Card.js';
import type { QualityTier } from '../models/types.js';
import { computeCumulativeWeights } from './weightedRandom.js';
import { dataUpdateService } from '../services/dataUpdateService.js';
import { resolvePath } from './paths.js';

/**
 * Interface for card data from cards.json
 */
interface CardData {
  name: string;
  detailsId: string;
  dropWeight: number;
}

/**
 * Interface for card value data from cardValues.json
 */
interface CardValueData {
  detailsId: string;
  chaosValue: number;
}

/**
 * Determine quality tier based on chaos value.
 */
function getQualityTierFromValue(chaosValue: number): QualityTier {
  if (chaosValue <= 50) {
    return 'common';
  } else if (chaosValue <= 200) {
    return 'rare';
  } else if (chaosValue <= 1000) {
    return 'epic';
  } else {
    return 'legendary';
  }
}

/**
 * Creates the card pool by loading cards from JSON files.
 * Loads cards.json and cardValues.json, matching them by detailsId.
 */
export async function createDefaultCardPool(): Promise<CardPool> {
  try {
    // Helper to create local import function
    const createLocalImport = <T>(staticPath: string) => async () => {
      const response = await fetch(resolvePath(staticPath));
      if (!response.ok) {
        throw new Error(`Failed to load ${staticPath}: ${response.statusText}`);
      }
      const data = await response.json() as T;
      return { default: data };
    };

    // Load cards data using data update service
    const cardsData = await dataUpdateService.fetchDataWithFallback<CardData[]>(
      'divinationCardDetails.json',
      createLocalImport('/cards/cards.json')
    );

    // Load card values data using data update service
    const valuesData = await dataUpdateService.fetchDataWithFallback<CardValueData[]>(
      'divinationCardPrices.json',
      createLocalImport('/cards/cardValues.json')
    );

    // Create a map of detailsId -> chaosValue for quick lookup
    const valueMap = new Map<string, number>();
    for (const valueEntry of valuesData) {
      valueMap.set(valueEntry.detailsId, valueEntry.chaosValue);
    }

    // Convert card data to DivinationCard format
    const cards: DivinationCard[] = [];
    for (const cardData of cardsData) {
      // Skip cards without dropWeight (shouldn't happen, but be safe)
      if (!cardData.dropWeight || cardData.dropWeight <= 0) {
        continue;
      }

      // Get chaos value, default to 0 if not found
      const chaosValue = valueMap.get(cardData.detailsId) ?? 0;
      
      // Determine quality tier based on chaos value
      const qualityTier = getQualityTierFromValue(chaosValue);

      cards.push({
        name: cardData.name,
        weight: cardData.dropWeight,
        value: chaosValue,
        qualityTier
      });
    }

    if (cards.length === 0) {
      throw new Error('No valid cards found in cards.json');
    }

    const totalWeight = cards.reduce((sum, card) => sum + card.weight, 0);
    const cumulativeWeights = computeCumulativeWeights(cards);

    return {
      cards,
      totalWeight,
      cumulativeWeights
    };
  } catch (error) {
    console.error('Failed to load card pool from JSON files:', error);
    // Fallback to empty pool - the game should handle this gracefully
    return {
      cards: [],
      totalWeight: 0,
      cumulativeWeights: []
    };
  }
}

