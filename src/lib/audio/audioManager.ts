import { Howl, Howler } from 'howler';
import type { QualityTier } from '../models/types.js';
import { resolvePath } from '../utils/paths.js';

/**
 * Audio service for managing game sound effects using Howler.js.
 */
export class AudioService {
  private sounds: Map<string, Howl> = new Map();
  private volume: number = 0.5;
  private muted: boolean = false;
  private initialized: boolean = false;

  /**
   * Initialize and preload all audio files.
   */
  async preloadAudio(): Promise<void> {
    if (this.initialized) return;

    const soundFiles: Record<string, string> = {
      cardCommon: resolvePath('/sounds/card-common.mp3'),
      cardRare: resolvePath('/sounds/card-rare.mp3'),
      cardEpic: resolvePath('/sounds/card-epic.mp3'),
      cardLegendary: resolvePath('/sounds/card-legendary.mp3'),
      upgrade: resolvePath('/sounds/upgrade.mp3'),
      scoreGain: resolvePath('/sounds/score-gain.mp3')
    };

    const loadPromises: Promise<void>[] = [];

    for (const [key, path] of Object.entries(soundFiles)) {
      const promise = new Promise<void>((resolve, reject) => {
        const howl = new Howl({
          src: [path],
          volume: this.volume,
          onload: () => {
            this.sounds.set(key, howl);
            resolve();
          },
          onloaderror: (_id: number, error: unknown) => {
            console.warn(`Failed to load sound ${key}:`, error);
            // Continue without this sound
            resolve();
          }
        });
      });
      loadPromises.push(promise);
    }

    await Promise.all(loadPromises);
    this.initialized = true;
  }

  /**
   * Play sound for card drop based on quality tier.
   */
  playCardDropSound(qualityTier: QualityTier): void {
    if (this.muted) return;

    let soundKey: string;
    switch (qualityTier) {
      case 'common':
        soundKey = 'cardCommon';
        break;
      case 'rare':
        soundKey = 'cardRare';
        break;
      case 'epic':
        soundKey = 'cardEpic';
        break;
      case 'legendary':
        soundKey = 'cardLegendary';
        break;
      default:
        soundKey = 'cardCommon';
    }

    const sound = this.sounds.get(soundKey);
    if (sound) {
      sound.play();
    }
  }

  /**
   * Play sound for card drop based on tier.
   * Falls back to qualityTier-based sound if tier sound not available.
   * @param tierId - Tier identifier
   * @param qualityTier - Fallback quality tier if tier sound unavailable
   */
  playTierSound(tierId: string, qualityTier: QualityTier): void {
    if (this.muted) return;

    // Try to get tier configuration (dynamic import to avoid circular dependencies)
    // Use void to fire-and-forget the promise
    void import('../services/tierService.js').then(({ tierService }) => {
      const tierConfig = tierService.getTierConfiguration(tierId);
      
      // Check if tier sound is enabled
      if (!tierConfig?.sound.enabled) {
        this.playCardDropSound(qualityTier);
        return;
      }

      // Try to play tier-specific sound
      if (tierConfig.sound.filePath) {
        const soundKey = `tier-${tierId}`;
        const sound = this.sounds.get(soundKey);
        if (sound) {
          const volume = tierConfig.sound.volume ?? 1.0;
          sound.volume(volume * this.volume);
          sound.play();
          return;
        }
      }
      
      // Fallback to qualityTier-based sound
      this.playCardDropSound(qualityTier);
    }).catch(() => {
      // Tier system not available, fall through to qualityTier sound
      this.playCardDropSound(qualityTier);
    });
  }

  /**
   * Preload tier sound files.
   * @param tierIds - Array of tier IDs to preload sounds for
   */
  async preloadTierSounds(tierIds: string[]): Promise<void> {
    const loadPromises: Promise<void>[] = [];

    try {
      const { tierService } = await import('../services/tierService.js');
      
      for (const tierId of tierIds) {
        const tierConfig = tierService.getTierConfiguration(tierId);
        
        if (tierConfig?.sound.filePath) {
          const soundKey = `tier-${tierId}`;
          if (!this.sounds.has(soundKey)) {
            const promise = new Promise<void>((resolve) => {
              const howl = new Howl({
                src: [tierConfig.sound.filePath!],
                volume: (tierConfig.sound.volume ?? 1.0) * this.volume,
                onload: () => {
                  this.sounds.set(soundKey, howl);
                  resolve();
                },
                onloaderror: () => {
                  console.warn(`Failed to load tier sound for ${tierId}`);
                  resolve();
                }
              });
            });
            loadPromises.push(promise);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to preload tier sounds:', error);
    }

    await Promise.all(loadPromises);
  }

  /**
   * Check if tier sound is available.
   * @param tierId - Tier identifier
   * @returns true if sound is loaded and available
   */
  isTierSoundAvailable(tierId: string): boolean {
    return this.sounds.has(`tier-${tierId}`);
  }

  /**
   * Play sound for upgrade purchase.
   */
  playUpgradeSound(): void {
    if (this.muted) return;
    const sound = this.sounds.get('upgrade');
    if (sound) {
      sound.play();
    }
  }

  /**
   * Play sound for score gain.
   */
  playScoreGainSound(): void {
    if (this.muted) return;
    const sound = this.sounds.get('scoreGain');
    if (sound) {
      sound.play();
    }
  }

  /**
   * Set master volume (0.0 to 1.0).
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    Howler.volume(this.volume);
    
    // Update all existing sounds
    for (const sound of this.sounds.values()) {
      sound.volume(this.volume);
    }
  }

  /**
   * Get current volume.
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * Set muted state.
   */
  setMuted(muted: boolean): void {
    this.muted = muted;
    Howler.mute(muted);
  }

  /**
   * Get muted state.
   */
  isMuted(): boolean {
    return this.muted;
  }
}

// Export singleton instance
export const audioService = new AudioService();

