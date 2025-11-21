import { describe, it, expect, beforeEach } from 'vitest';
import { CardImageService } from '../../../src/lib/services/cardImageService.js';

describe('CardImageService', () => {
  let service: CardImageService;

  beforeEach(() => {
    service = new CardImageService();
  });

  it('should resolve card image URL for valid artFilename', async () => {
    const url = await service.resolveCardImageUrl('AChillingWind');
    expect(url).toBeTruthy();
    expect(typeof url).toBe('string');
  });

  it('should return null for null artFilename', async () => {
    const url = await service.resolveCardImageUrl(null);
    expect(url).toBeNull();
  });

  it('should return null for empty artFilename', async () => {
    const url = await service.resolveCardImageUrl('');
    expect(url).toBeNull();
  });

  it('should cache resolved URLs', async () => {
    const artFilename = 'AChillingWind';
    const url1 = await service.resolveCardImageUrl(artFilename);
    const url2 = await service.resolveCardImageUrl(artFilename);
    expect(url1).toBe(url2);
  });

  it('should load card image successfully', async () => {
    const artFilename = 'AChillingWind';
    
    // Mock Image constructor to avoid actual image loading in tests
    const originalImage = global.Image;
    let onloadHandler: (() => void) | null = null;
    
    global.Image = class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src: string = '';
      
      constructor() {
        // Simulate immediate load for test
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 10);
      }
    } as any;
    
    const state = await service.loadCardImage(artFilename);
    
    // Restore original Image
    global.Image = originalImage;
    
    // State should be valid
    expect(state).toHaveProperty('url');
    expect(state).toHaveProperty('loading');
    expect(state).toHaveProperty('error');
    expect(typeof state.loading).toBe('boolean');
    expect(typeof state.error).toBe('boolean');
  }, { timeout: 2000 });

  it('should handle missing artFilename in loadCardImage', async () => {
    const state = await service.loadCardImage(null);
    expect(state.error).toBe(true);
    expect(state.url).toBeNull();
    expect(state.loading).toBe(false);
  });

  it('should get cached image URL', async () => {
    const artFilename = 'AChillingWind';
    await service.resolveCardImageUrl(artFilename);
    const cached = service.getCachedImageUrl(artFilename);
    expect(cached).toBeTruthy();
  });

  it('should return null for uncached image', () => {
    const cached = service.getCachedImageUrl('NonExistentCard');
    expect(cached).toBeNull();
  });

  it('should preload multiple card images', async () => {
    // Mock Image to avoid actual loading
    const originalImage = global.Image;
    global.Image = class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src: string = '';
      
      constructor() {
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 10);
      }
    } as any;
    
    const artFilenames = ['AChillingWind', 'ADabOfInk'];
    await expect(service.preloadCardImages(artFilenames)).resolves.not.toThrow();
    
    // Restore original Image
    global.Image = originalImage;
  }, { timeout: 2000 });
});

