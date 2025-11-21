import { resolvePath } from '../utils/paths.js';
import type { CardImageState } from '../models/CardDisplayData.js';

/**
 * Service for loading and resolving card artwork images.
 */
export class CardImageService {
  private imageCache = new Map<string, string | null>();

  /**
   * Resolve card artwork image URL from artFilename.
   * Uses runtime path resolution which works correctly with SvelteKit's static file serving.
   * 
   * @param artFilename - Artwork filename (e.g., "AChillingWind")
   * @returns Resolved image URL or null if not found
   */
  resolveCardImageUrl(artFilename: string | null): string | null {
    if (!artFilename) return null;
    
    // Check cache first
    if (this.imageCache.has(artFilename)) {
      return this.imageCache.get(artFilename) || null;
    }

    // Use runtime path resolution (static files are served from root in SvelteKit)
    // Files in static/ are served at /, so /cards/cardArt/ is correct
    const expectedFilename = `${artFilename}.png`;
    const url = resolvePath(`/cards/cardArt/${expectedFilename}`);

    // Cache result
    this.imageCache.set(artFilename, url);
    return url;
  }

  /**
   * Load card image and return loading state.
   * Handles image loading, error states, and caching.
   * 
   * @param artFilename - Artwork filename
   * @returns Promise resolving to CardImageState
   */
  async loadCardImage(artFilename: string | null): Promise<CardImageState> {
    const url = this.resolveCardImageUrl(artFilename);
    
    if (!url) {
      return {
        url: null,
        loading: false,
        error: true,
        errorMessage: `Artwork not found: ${artFilename}`
      };
    }

    // Note: We don't preload images here anymore - the browser handles it natively
    // This method is kept for API compatibility but is no longer used
    return Promise.resolve({
      url,
      loading: false,
      error: false
    });
  }

  /**
   * Preload card images for better performance.
   * Can be called with array of likely cards to preload.
   * 
   * @param artFilenames - Array of artwork filenames to preload
   * @returns Promise resolving when all images are loaded or failed
   */
  async preloadCardImages(artFilenames: string[]): Promise<void> {
    const loadPromises = artFilenames.map(filename => this.loadCardImage(filename));
    await Promise.allSettled(loadPromises);
  }

  /**
   * Get cached image URL if available.
   * 
   * @param artFilename - Artwork filename
   * @returns Cached URL or null
   */
  getCachedImageUrl(artFilename: string | null): string | null {
    if (!artFilename) return null;
    return this.imageCache.get(artFilename) || null;
  }
}

export const cardImageService = new CardImageService();

