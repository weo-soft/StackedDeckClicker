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
  private clickCallback: ((cardAnimation: import('./cardAnimation.js').CardAnimation) => void) | null = null;
  private hoverDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private lastHoverCheck: number = 0;
  private hoveredCard: import('./cardAnimation.js').CardAnimation | null = null;

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
    if (this.hoverDebounceTimer) {
      clearTimeout(this.hoverDebounceTimer);
      this.hoverDebounceTimer = null;
    }
    this.canvas = null;
    this.ctx = null;
    this.scene = null;
    this.clickCallback = null;
    this.hoveredCard = null;
  }

  /**
   * Handle click event on canvas.
   * Performs label hit testing and emits result via callback.
   * Validates coordinates and handles errors gracefully.
   * 
   * @param x - Click X coordinate in canvas space (must be within canvas bounds)
   * @param y - Click Y coordinate in canvas space (must be within canvas bounds)
   * @param event - Original mouse event
   * @returns CardAnimation if label was clicked, null otherwise
   * @throws Does not throw - returns null for invalid inputs, logs errors
   */
  handleClick(x: number, y: number, event: MouseEvent): import('./cardAnimation.js').CardAnimation | null {
    if (!this.scene || !this.canvas) {
      return null;
    }

    // Validate coordinates
    if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) {
      return null;
    }

    if (x < 0 || x > this.canvas.width || y < 0 || y > this.canvas.height) {
      return null;
    }

    // Get card at position (handles edge cases internally)
    const cardAnimation = this.scene.getCardAtLabelPosition(x, y);
    
    // Validate card still exists before calling callback
    if (cardAnimation && this.clickCallback) {
      try {
        this.clickCallback(cardAnimation);
      } catch (error) {
        console.error('Error in click callback:', error);
        // Don't throw - continue gracefully
      }
    }

    return cardAnimation;
  }

  /**
   * Handle mouse move event on canvas for hover detection.
   * Updates hover state and cursor style with 50ms debouncing for performance.
   * 
   * @param x - Mouse X coordinate in canvas space
   * @param y - Mouse Y coordinate in canvas space
   * @param event - Original mouse event
   * @throws Does not throw - handles errors gracefully
   */
  handleMouseMove(x: number, y: number, event: MouseEvent): void {
    if (!this.scene || !this.canvas) {
      return;
    }

    // Debounce hover checks (50ms)
    if (this.hoverDebounceTimer) {
      clearTimeout(this.hoverDebounceTimer);
    }

    this.hoverDebounceTimer = setTimeout(() => {
      const cardAnimation = this.scene?.getCardAtLabelPosition(x, y) || null;
      
      if (cardAnimation !== this.hoveredCard) {
        this.hoveredCard = cardAnimation;
        this.scene?.setHoveredCard(cardAnimation);
        this.updateCursorStyle();
      }

      this.lastHoverCheck = Date.now();
    }, 50);
  }

  /**
   * Handle mouse leave event on canvas.
   * Clears hover state and resets cursor.
   */
  handleMouseLeave(): void {
    if (this.hoverDebounceTimer) {
      clearTimeout(this.hoverDebounceTimer);
      this.hoverDebounceTimer = null;
    }

    this.hoveredCard = null;
    this.scene?.setHoveredCard(null);
    this.updateCursorStyle();
  }

  /**
   * Set callback for click events.
   * Called when a label is successfully clicked.
   * 
   * @param callback - Function called with CardAnimation when label is clicked
   */
  setClickCallback(callback: ((cardAnimation: import('./cardAnimation.js').CardAnimation) => void) | null): void {
    this.clickCallback = callback;
  }

  /**
   * Update canvas cursor style based on hover state.
   */
  private updateCursorStyle(): void {
    if (this.canvas) {
      this.canvas.style.cursor = this.hoveredCard ? 'pointer' : 'default';
    }
  }

  /**
   * Get all visible cards (for keyboard navigation).
   * 
   * @returns Array of CardAnimation objects
   */
  getCards(): import('./cardAnimation.js').CardAnimation[] {
    return this.scene?.getCards() || [];
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

