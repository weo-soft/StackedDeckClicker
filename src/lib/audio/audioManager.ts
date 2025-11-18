import { Howl, Howler } from 'howler';
import type { QualityTier } from '../models/types.js';

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
      cardCommon: '/sounds/card-common.mp3',
      cardRare: '/sounds/card-rare.mp3',
      cardEpic: '/sounds/card-epic.mp3',
      cardLegendary: '/sounds/card-legendary.mp3',
      upgrade: '/sounds/upgrade.mp3',
      scoreGain: '/sounds/score-gain.mp3'
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

