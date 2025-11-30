import { resolvePath } from '../utils/paths.js';
import type { CardImageState } from '../models/CardDisplayData.js';

/**
 * Service for loading and resolving card artwork images.
 */
export class CardImageService {
  private imageCache = new Map<string, string | null>();
  private preloadedImages = new Set<string>(); // Track which images have been preloaded
  private preloadPromises = new Map<string, Promise<void>>(); // Track ongoing preloads

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
   * Preload a single card image into browser cache.
   * Uses the browser's Image API to actually load and cache the image.
   * 
   * @param artFilename - Artwork filename to preload
   * @returns Promise resolving when image is loaded or failed
   */
  async preloadCardImage(artFilename: string | null): Promise<void> {
    if (!artFilename) return;
    
    // Skip if already preloaded or currently preloading
    if (this.preloadedImages.has(artFilename)) {
      return;
    }
    
    // If already preloading, return the existing promise
    if (this.preloadPromises.has(artFilename)) {
      return this.preloadPromises.get(artFilename)!;
    }

    const url = this.resolveCardImageUrl(artFilename);
    if (!url) {
      return;
    }

    // Create and track preload promise
    const preloadPromise = new Promise<void>((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        this.preloadedImages.add(artFilename);
        this.preloadPromises.delete(artFilename);
        resolve();
      };
      
      img.onerror = () => {
        // Still mark as attempted to avoid retrying immediately
        this.preloadedImages.add(artFilename);
        this.preloadPromises.delete(artFilename);
        resolve(); // Resolve anyway to not block
      };
      
      // Start loading
      img.src = url;
    });

    this.preloadPromises.set(artFilename, preloadPromise);
    return preloadPromise;
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

    // Preload the image if not already preloaded
    await this.preloadCardImage(artFilename);

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
    const loadPromises = artFilenames.map(filename => this.preloadCardImage(filename));
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

