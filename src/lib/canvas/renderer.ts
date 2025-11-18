import { Scene } from './scene.js';
import type { DivinationCard } from '../models/Card.js';
import { performanceMonitor } from '../utils/performance.js';
import type { ZoneLayout } from '../models/ZoneLayout.js';

/**
 * Canvas renderer service for managing HTML5 Canvas rendering and animations.
 */
export class CanvasService {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private scene: Scene | null = null;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private lastTime: number = 0;

  /**
   * Initialize canvas and start render loop.
   * @param canvasElement Canvas element to render to
   * @param width Canvas width
   * @param height Canvas height
   * @param zoneLayout Optional zone layout for zone-aware card dropping
   * @param zoneBoundaryValidator Optional function to validate drop positions within zone boundaries
   */
  initialize(
    canvasElement: HTMLCanvasElement,
    width: number,
    height: number,
    zoneLayout?: ZoneLayout | null,
    zoneBoundaryValidator?: ((x: number, y: number) => boolean) | null
  ): void {
    this.canvas = canvasElement;
    this.canvas.width = width;
    this.canvas.height = height;

    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context not available');
    }
    this.ctx = context;

    this.scene = new Scene();
    this.scene.loadBackgroundImage();
    this.scene.loadDropMask(width, height);
    
    // Set zone layout if provided (allow null values)
    if (zoneLayout !== undefined && zoneBoundaryValidator !== undefined) {
      this.scene.setZoneLayout(zoneLayout, zoneBoundaryValidator);
    } else {
      // Explicitly set to null if not provided
      this.scene.setZoneLayout(null, null);
    }
    
    this.lastTime = performance.now();
  }

  /**
   * Add a card to the scene with drop animation.
   */
  addCard(card: DivinationCard, position?: { x: number; y: number }): void {
    if (!this.scene || !this.canvas) {
      console.warn('Canvas not initialized');
      return;
    }

    this.scene.addCard(card, this.canvas.width, this.canvas.height, position);
  }

  /**
   * Update scene customizations.
   */
  updateCustomizations(customizations: Map<string, boolean>): void {
    if (this.scene) {
      this.scene.updateCustomizations(customizations);
    }
  }

  /**
   * Clear all cards from scene.
   */
  clearCards(): void {
    if (this.scene) {
      this.scene.clearCards();
    }
  }

  /**
   * Start render loop (60fps).
   */
  start(): void {
    if (this.isRunning || !this.ctx || !this.scene) {
      return;
    }

    this.isRunning = true;
    this.lastTime = performance.now();
    this.renderLoop();
  }

  /**
   * Stop render loop.
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Clean up resources.
   */
  destroy(): void {
    this.stop();
    this.canvas = null;
    this.ctx = null;
    this.scene = null;
  }

  /**
   * Main render loop using requestAnimationFrame.
   */
  private renderLoop = (): void => {
    if (!this.isRunning || !this.ctx || !this.scene) {
      return;
    }

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Update scene (pass canvas dimensions for ground collision)
    if (this.canvas) {
      this.scene.update(deltaTime, this.canvas.height, this.canvas.width);
    }

    // Render scene
    this.scene.render(this.ctx);

    // Track FPS
    performanceMonitor.updateCanvasFPS();

    // Continue loop
    this.animationFrameId = requestAnimationFrame(this.renderLoop);
  };
}

// Export singleton instance
export const canvasService = new CanvasService();

