import type { DivinationCard } from './Card.js';
import type { CardDrawResult } from './CardDrawResult.js';

/**
 * Extended card information from cards.json that includes display text and metadata.
 */
export interface FullCardData {
  /** Card name */
  name: string;
  /** Artwork filename */
  artFilename: string;
  /** Stack size (how many cards in a stack) */
  stackSize?: number;
  /** Explicit modifiers/rewards text with PoE styling */
  explicitModifiers?: Array<{
    text: string;
    optional: boolean;
  }>;
  /** Flavor text */
  flavourText?: string;
  /** Card details ID (for matching with cardValues.json) */
  detailsId: string;
  /** Card ID */
  id: string;
  /** Drop weight for probability calculation */
  dropWeight: number;
}

/**
 * State tracking for card image loading and display.
 */
export interface CardImageState {
  /** Image URL (resolved path) */
  url: string | null;
  /** Whether image is currently loading */
  loading: boolean;
  /** Whether image failed to load */
  error: boolean;
  /** Error message if load failed */
  errorMessage?: string;
}

/**
 * Configuration for card display rendering, including sizing and positioning.
 */
export interface CardDisplayConfig {
  /** Base card width in pixels */
  baseWidth: number;
  /** Base card height in pixels (calculated from aspect ratio) */
  baseHeight: number;
  /** Scale factor based on zone dimensions */
  scaleFactor: number;
  /** Zone width */
  zoneWidth: number;
  /** Zone height */
  zoneHeight: number;
}

/**
 * Extended card data structure that includes display-specific information needed for rendering the graphical card representation.
 */
export interface CardDisplayData {
  /** Base card information from CardDrawResult */
  card: DivinationCard;
  /** Timestamp when card was drawn */
  timestamp: number;
  /** Score gained from this card */
  scoreGained: number;
  /** Artwork filename for loading card image */
  artFilename: string | null;
  /** Full card data from cards.json (if available) */
  fullCardData?: FullCardData;
}

/**
 * Convert CardDrawResult to CardDisplayData.
 * 
 * @param cardDraw - The card draw result to convert
 * @param fullCardData - Optional extended card data from cards.json
 * @returns CardDisplayData with display-specific information
 */
export function convertToCardDisplayData(
  cardDraw: CardDrawResult,
  fullCardData?: FullCardData
): CardDisplayData {
  return {
    card: cardDraw.card,
    timestamp: cardDraw.timestamp,
    scoreGained: cardDraw.scoreGained,
    artFilename: fullCardData?.artFilename || null,
    fullCardData: fullCardData
  };
}

