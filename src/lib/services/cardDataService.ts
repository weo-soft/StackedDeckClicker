import type { FullCardData } from '../models/CardDisplayData.js';
import { dataUpdateService } from './dataUpdateService.js';
import { resolvePath } from '../utils/paths.js';

let cardsDataCache: FullCardData[] | null = null;

/**
 * Service for loading extended card data from cards.json.
 */
export class CardDataService {
  /**
   * Load all cards data from cards.json.
   * 
   * @returns Promise resolving to array of FullCardData
   */
  async loadCardsData(): Promise<FullCardData[]> {
    if (cardsDataCache) {
      return cardsDataCache;
    }

    try {
      // Helper to create local import function
      const createLocalImport = async () => {
        const response = await fetch(resolvePath('/cards/cards.json'));
        if (!response.ok) {
          throw new Error(`Failed to load cards.json: ${response.statusText}`);
        }
        const data = await response.json() as FullCardData[];
        return { default: data };
      };

      const data = await dataUpdateService.fetchDataWithFallback<FullCardData[]>(
        'divinationCardDetails.json',
        createLocalImport
      );
      cardsDataCache = data;
      return cardsDataCache;
    } catch (error) {
      console.error('Failed to load cards data:', error);
      return [];
    }
  }

  /**
   * Load full card data from cards.json by card name.
   * 
   * @param cardName - Card name to lookup
   * @returns Promise resolving to FullCardData or null if not found
   */
  async loadFullCardData(cardName: string): Promise<FullCardData | null> {
    const cards = await this.loadCardsData();
    return cards.find(card => card.name === cardName) || null;
  }

  /**
   * Load full card data by artFilename.
   * 
   * @param artFilename - Artwork filename to lookup
   * @returns Promise resolving to FullCardData or null if not found
   */
  async loadFullCardDataByArt(artFilename: string): Promise<FullCardData | null> {
    const cards = await this.loadCardsData();
    return cards.find(card => card.artFilename === artFilename) || null;
  }

  /**
   * Preload full card data for multiple cards.
   * 
   * @param cardNames - Array of card names to load
   * @returns Promise resolving when all data is loaded
   */
  async preloadCardData(cardNames: string[]): Promise<void> {
    // Load all cards data (cached after first load)
    await this.loadCardsData();
    // Individual lookups will use the cache
  }
}

export const cardDataService = new CardDataService();

