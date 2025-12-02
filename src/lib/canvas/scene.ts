import type { CardAnimation } from './cardAnimation.js';
import { createCardAnimation, updateCardAnimation, drawCardObject, drawCardLabel } from './cardAnimation.js';
import type { DivinationCard } from '../models/Card.js';
import type { ZoneLayout } from '../models/ZoneLayout.js';
import { ZoneType } from '../models/ZoneLayout.js';
import { zoneLayoutService } from '../services/zoneLayoutService.js';
import { resolvePath } from '../utils/paths.js';

const MAX_VISIBLE_CARDS = 150;
const CARD_REMOVE_AGE = 35000; // Remove cards after 35 seconds

/**
 * Scene manager for canvas rendering.
 */
export class Scene {
  private cards: CardAnimation[] = [];
  private lastFrameTime: number = 0;
  private customizations: Map<string, boolean> = new Map();
  private backgroundImage: HTMLImageElement | null = null;
  private backgroundImageLoaded: boolean = false;
  private dropMaskImage: HTMLImageElement | null = null;
  private dropMaskCanvas: HTMLCanvasElement | null = null;
  private dropMaskCtx: CanvasRenderingContext2D | null = null;
  private dropMaskLoaded: boolean = false;
  private canvasWidth: number = 0;
  private canvasHeight: number = 0;
  private zoneLayout: ZoneLayout | null = null;
  private zoneBoundaryValidator: ((x: number, y: number) => boolean) | null = null;
  private hoveredCard: CardAnimation | null = null;

  /**
   * Check if a card position overlaps with existing cards.
   */
  private isCardPositionBlocked(x: number, y: number, cardRadius: number = 20): boolean {
    for (const existingCard of this.cards) {
      const dx = existingCard.x - x;
      const dy = existingCard.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < cardRadius * 2) {
        return true; // Position is blocked
      }
    }
    return false;
  }

  /**
   * Check if a label rectangle overlaps with existing labels.
   */
  private isLabelPositionBlocked(
    labelX: number,
    labelY: number,
    labelWidth: number,
    labelHeight: number,
    excludeCard?: CardAnimation
  ): boolean {
    for (const existingCard of this.cards) {
      if (excludeCard && existingCard === excludeCard) continue;
      
      if (existingCard.labelWidth === 0) continue; // Label not yet calculated
      
      const existingLabelX = existingCard.x + existingCard.labelX - existingCard.labelWidth / 2;
      const existingLabelY = existingCard.y + existingCard.labelY;
      
      // Check rectangle overlap
      if (
        labelX < existingLabelX + existingCard.labelWidth &&
        labelX + labelWidth > existingLabelX &&
        labelY < existingLabelY + existingCard.labelHeight &&
        labelY + labelHeight > existingLabelY
      ) {
        return true; // Labels overlap
      }
    }
    return false;
  }

  /**
   * Find a non-overlapping position for a new card.
   * Uses zone boundaries if available, otherwise falls back to drop mask.
   * MUST only return positions within the yellow zone.
   */
  private findNonOverlappingCardPosition(canvasWidth: number, canvasHeight: number): { x: number; y: number } | null {
    const cardRadius = 20; // Card collision radius
    const maxAttempts = 500;
    
    // If zone layout is available, try to get a random position from zone service first
    // This ensures we only get positions within the yellow zone
    if (this.zoneLayout && this.zoneBoundaryValidator) {
      const whiteZone = this.zoneLayout.zones.get(ZoneType.WHITE);
      if (whiteZone) {
        // Try using zone service's random position generator (only returns yellow zone positions)
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          const containerPos = zoneLayoutService.getRandomDropPosition(this.zoneLayout);
          if (containerPos) {
            // Convert container coordinates to canvas coordinates
            const canvasPos = {
              x: containerPos.x - whiteZone.x,
              y: containerPos.y - whiteZone.y
            };
            // Double-check it's valid and not blocked
            if (this.isValidDropPosition(canvasPos.x, canvasPos.y) && 
                !this.isCardPositionBlocked(canvasPos.x, canvasPos.y, cardRadius)) {
              return canvasPos;
            }
          }
        }
      }
    }
    
    // Fallback: random sampling within valid drop area (yellow zone only)
    // This should only be used if zone layout is not available
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = Math.random() * canvasWidth;
      const y = Math.random() * canvasHeight;
      
      // Check if position is in valid drop area (yellow zone) and not blocked by cards
      if (this.isValidDropPosition(x, y) && !this.isCardPositionBlocked(x, y, cardRadius)) {
        // Check if it's inside (not at edges)
        const checkYAbove = y - 10;
        const checkYBelow = y + 10;
        const isAboveValid = checkYAbove < 0 || this.isValidDropPosition(x, checkYAbove);
        const isBelowValid = checkYBelow >= canvasHeight || this.isValidDropPosition(x, checkYBelow);
        
        if (isAboveValid && isBelowValid) {
          return { x, y };
        }
      }
    }
    
    // Final fallback: try any valid position (yellow zone only)
    for (let attempt = 0; attempt < 200; attempt++) {
      const x = Math.random() * canvasWidth;
      const y = Math.random() * canvasHeight;
      
      if (this.isValidDropPosition(x, y) && !this.isCardPositionBlocked(x, y, cardRadius)) {
        return { x, y };
      }
    }
    
    return null;
  }

  /**
   * Adjust label position to avoid overlaps with other labels.
   */
  private adjustLabelPosition(card: CardAnimation, labelWidth: number, labelHeight: number): void {
    const baseOffsetY = -30; // Default position above card
    const spacing = 5; // Minimum spacing between labels
    
    // Try different positions around the card
    const positions = [
      { x: 0, y: baseOffsetY }, // Above
      { x: 0, y: baseOffsetY - labelHeight - spacing }, // Further above
      { x: labelWidth / 2 + spacing, y: baseOffsetY }, // Right
      { x: -(labelWidth / 2 + spacing), y: baseOffsetY }, // Left
      { x: 0, y: baseOffsetY + labelHeight + spacing }, // Below
      { x: labelWidth / 2 + spacing, y: baseOffsetY - labelHeight - spacing }, // Top-right
      { x: -(labelWidth / 2 + spacing), y: baseOffsetY - labelHeight - spacing }, // Top-left
    ];
    
    for (const pos of positions) {
      const labelX = card.x + pos.x - labelWidth / 2;
      const labelY = card.y + pos.y;
      
      if (!this.isLabelPositionBlocked(labelX, labelY, labelWidth, labelHeight, card)) {
        card.labelX = pos.x;
        card.labelY = pos.y;
        return; // Found non-overlapping position
      }
    }
    
    // If all positions overlap, use default and let labels overlap slightly
    card.labelX = 0;
    card.labelY = baseOffsetY;
  }

  /**
   * Reposition existing labels to make room for a new card.
   * Labels smoothly move to new positions to avoid overlap.
   */
  private repositionNearbyLabels(newCard: CardAnimation, labelWidth: number, labelHeight: number): void {
    const proximityRadius = 120; // Distance to check for nearby labels
    
    for (const existingCard of this.cards) {
      if (existingCard === newCard) continue;
      if (existingCard.labelWidth === 0) continue;
      
      // Check if label overlaps or is near the new card's label
      const existingLabelX = existingCard.x + existingCard.labelX - existingCard.labelWidth / 2;
      const existingLabelY = existingCard.y + existingCard.labelY;
      const newLabelX = newCard.x + newCard.labelX - labelWidth / 2;
      const newLabelY = newCard.y + newCard.labelY;
      
      // Check for rectangle overlap
      const overlaps = (
        existingLabelX < newLabelX + labelWidth &&
        existingLabelX + existingCard.labelWidth > newLabelX &&
        existingLabelY < newLabelY + labelHeight &&
        existingLabelY + existingCard.labelHeight > newLabelY
      );
      
      // Check proximity
      const dx = existingLabelX - newLabelX;
      const dy = existingLabelY - newLabelY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (overlaps || distance < proximityRadius) {
        // Store current target position
        const oldTargetX = existingCard.targetLabelX;
        const oldTargetY = existingCard.targetLabelY;
        
        // Find new position and set as target
        this.adjustLabelPosition(existingCard, existingCard.labelWidth, existingCard.labelHeight);
        
        // Update target positions for smooth movement
        existingCard.targetLabelX = existingCard.labelX;
        existingCard.targetLabelY = existingCard.labelY;
        
        // If target changed, label will smoothly move to new position
      }
    }
  }

  /**
   * Add a card to the scene with pop-up animation.
   * Cards appear within the white overlay area bounds and avoid overlapping.
   */
  addCard(card: DivinationCard, canvasWidth: number, canvasHeight: number, position?: { x: number; y: number }): void {
    // Use provided position or find a non-overlapping position
    let startX: number;
    let startY: number;
    
    if (position) {
      // Validate that provided position is within yellow zone (card drop area)
      if (this.isValidDropPosition(position.x, position.y)) {
        startX = position.x;
        startY = position.y;
      } else {
        // Position is outside yellow zone, find a valid position instead
        console.warn('Provided card position is outside yellow zone, finding valid position');
        const validPos = this.findNonOverlappingCardPosition(canvasWidth, canvasHeight);
        if (validPos) {
          startX = validPos.x;
          startY = validPos.y;
        } else {
          // Fallback: use findRandomValidPosition which ensures yellow zone
          const randomPos = this.findRandomValidPosition();
          if (randomPos) {
            startX = randomPos.x;
            startY = randomPos.y;
          } else {
            // Last resort fallback
            startX = canvasWidth * 0.5;
            startY = canvasHeight * 0.5;
          }
        }
      }
    } else {
      // Find a non-overlapping position within the yellow zone (card drop area)
      const validPos = this.findNonOverlappingCardPosition(canvasWidth, canvasHeight);
      if (validPos) {
        startX = validPos.x;
        startY = validPos.y;
      } else {
        // Fallback: use findRandomValidPosition which ensures yellow zone
        const randomPos = this.findRandomValidPosition();
        if (randomPos) {
          startX = randomPos.x;
          startY = randomPos.y;
        } else {
          // Last resort fallback
          startX = canvasWidth * 0.5;
          startY = canvasHeight * 0.5;
        }
      }
    }

    const animation = createCardAnimation(card, startX, startY, true); // true = pop-up mode
    
    // Estimate label dimensions for collision detection
    // We'll use a temporary canvas to measure text
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.font = 'bold 15px Arial';
      const textMetrics = tempCtx.measureText(card.name.toUpperCase());
      const labelWidth = textMetrics.width + 20; // padding * 2
      const labelHeight = 26;
      
      // Adjust label position to avoid overlaps
      this.adjustLabelPosition(animation, labelWidth, labelHeight);
      
      // Set initial target position
      animation.targetLabelX = animation.labelX;
      animation.targetLabelY = animation.labelY;
      
      // Reposition nearby labels to make room
      this.repositionNearbyLabels(animation, labelWidth, labelHeight);
    }
    
    this.cards.push(animation);

    // Remove oldest cards if we exceed the limit
    if (this.cards.length > MAX_VISIBLE_CARDS) {
      // Sort by age and remove oldest
      this.cards.sort((a, b) => b.age - a.age);
      this.cards = this.cards.slice(0, MAX_VISIBLE_CARDS);
    }
  }

  /**
   * Update all card animations.
   */
  update(deltaTime: number, canvasHeight: number = 600, canvasWidth: number = 800): void {
    this.lastFrameTime = deltaTime;

    // Update all cards with mask-based ground collision
    for (const card of this.cards) {
      updateCardAnimation(card, deltaTime, canvasHeight, canvasWidth, this);
    }

    // Remove cards that are too old or fully faded
    this.cards = this.cards.filter(
      (card) => card.age < CARD_REMOVE_AGE && card.alpha > 0
    );
  }

  /**
   * Load background image.
   */
  loadBackgroundImage(): void {
    if (this.backgroundImageLoaded) return;

    const img = new Image();
    img.onload = () => {
      this.backgroundImage = img;
      this.backgroundImageLoaded = true;
    };
    img.onerror = () => {
      console.warn('Failed to load background image, using gradient fallback');
      this.backgroundImageLoaded = true; // Prevent retry loops
    };
    img.src = resolvePath('/images/scene1.jpg');
  }

  /**
   * Load drop mask image and prepare for pixel sampling.
   */
  loadDropMask(canvasWidth: number, canvasHeight: number): void {
    if (this.dropMaskLoaded) return;
    
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    const img = new Image();
    img.onload = () => {
      this.dropMaskImage = img;
      
      // Create a canvas to sample mask pixels
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = canvasWidth;
      maskCanvas.height = canvasHeight;
      const maskCtx = maskCanvas.getContext('2d');
      
      if (!maskCtx) {
        console.warn('Failed to get 2D context for drop mask');
        this.dropMaskLoaded = true;
        return;
      }
      
      // Draw mask image scaled to canvas size
      maskCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
      
      this.dropMaskCanvas = maskCanvas;
      this.dropMaskCtx = maskCtx;
      this.dropMaskLoaded = true;
    };
    img.onerror = () => {
      console.warn('Failed to load drop mask image, using fallback ground level');
      this.dropMaskLoaded = true; // Prevent retry loops
    };
    img.src = resolvePath('/images/scene1_droppable_area.png');
  }

  /**
   * Set zone layout for zone-aware card dropping.
   * @param layout Zone layout to use for boundary validation
   * @param validator Function to validate if a position is within the drop zone
   */
  setZoneLayout(layout: ZoneLayout | null, validator: ((x: number, y: number) => boolean) | null): void {
    this.zoneLayout = layout;
    this.zoneBoundaryValidator = validator;
    
    // Debug: Log zone layout setup
    if (layout) {
      const yellowZone = layout.zones.get(ZoneType.YELLOW);
      const whiteZone = layout.zones.get(ZoneType.WHITE);
      console.log('Zone layout set on scene:', {
        hasYellowZone: !!yellowZone,
        hasWhiteZone: !!whiteZone,
        yellowZone: yellowZone ? { x: yellowZone.x, y: yellowZone.y, width: yellowZone.width, height: yellowZone.height } : null,
        whiteZone: whiteZone ? { x: whiteZone.x, y: whiteZone.y, width: whiteZone.width, height: whiteZone.height } : null
      });
    } else {
      console.log('Zone layout set to null on scene');
    }
  }

  /**
   * Check if a position is within a valid drop area.
   * Uses zone boundaries if available, otherwise falls back to drop mask image.
   * @param x Canvas X coordinate
   * @param y Canvas Y coordinate
   * @returns true if position is valid for dropping cards
   */
  isValidDropPosition(x: number, y: number): boolean {
    // Priority 1: Use zone boundary validator if available
    if (this.zoneBoundaryValidator) {
      return this.zoneBoundaryValidator(x, y);
    }

    // Priority 2: Use drop mask image if loaded
    if (this.dropMaskCtx && this.dropMaskLoaded) {
      // Clamp coordinates to canvas bounds
      const px = Math.floor(Math.max(0, Math.min(x, this.canvasWidth - 1)));
      const py = Math.floor(Math.max(0, Math.min(y, this.canvasHeight - 1)));

      // Sample pixel at position (check if it's white/light)
      const imageData = this.dropMaskCtx.getImageData(px, py, 1, 1);
      const [r, g, b, a] = imageData.data;
      
      // White/light pixels (RGB > 200) indicate valid drop area
      // Also check alpha to ensure pixel is visible
      return a > 128 && (r > 200 || g > 200 || b > 200);
    }

    // Fallback: allow drops in center 80% of canvas
    return x >= this.canvasWidth * 0.1 && x <= this.canvasWidth * 0.9 &&
           y >= this.canvasHeight * 0.1 && y <= this.canvasHeight * 0.9;
  }

  /**
   * Find the ground level at a given X coordinate.
   * This method is kept for compatibility but is no longer the primary ground detection.
   * Cards now land anywhere within the white area, not just at the bottom edge.
   * @param x Canvas X coordinate
   * @returns Ground Y position, or fallback ground level if mask not available
   * @deprecated Cards now use isValidDropPosition to land anywhere in white area
   */
  getGroundLevelAt(x: number): number {
    if (!this.dropMaskCtx || !this.dropMaskLoaded) {
      // Fallback: use 75% of canvas height
      return this.canvasHeight * 0.75;
    }

    // For compatibility, return middle of white area at this X
    // Scan to find any white pixel in this column
    for (let y = 0; y < this.canvasHeight; y++) {
      if (this.isValidDropPosition(x, y)) {
        // Return middle of white area range for this column
        // Find top and bottom of white area
        let topY = y;
        let bottomY = y;
        for (let checkY = y; checkY < this.canvasHeight; checkY++) {
          if (this.isValidDropPosition(x, checkY)) {
            bottomY = checkY;
          } else {
            break;
          }
        }
        // Return middle of white area
        return (topY + bottomY) / 2;
      }
    }

    // No valid ground found, use fallback
    return this.canvasHeight * 0.75;
  }

  /**
   * Find a random valid position within the valid drop area.
   * Uses zone boundaries if available, otherwise falls back to drop mask.
   * Cards pop up within the bounds of the drop area.
   * @returns Random valid position within drop area, or null if no valid area found
   */
  findRandomValidPosition(): { x: number; y: number } | null {
    // Priority 1: Use zone layout service if available (ensures yellow zone only)
    if (this.zoneLayout && this.zoneBoundaryValidator) {
      const whiteZone = this.zoneLayout.zones.get(ZoneType.WHITE);
      if (!whiteZone) {
        console.warn('findRandomValidPosition: whiteZone not found');
        return null;
      }
      
      // Get random position in yellow zone (container coordinates)
      const containerPos = zoneLayoutService.getRandomDropPosition(this.zoneLayout);
      if (!containerPos) {
        console.warn('findRandomValidPosition: getRandomDropPosition returned null');
        return null;
      }
      
      // Convert container coordinates to canvas coordinates
      const canvasPos = {
        x: containerPos.x - whiteZone.x,
        y: containerPos.y - whiteZone.y
      };
      
      // Validate the position is within canvas bounds
      if (canvasPos.x < 0 || canvasPos.x >= this.canvasWidth || 
          canvasPos.y < 0 || canvasPos.y >= this.canvasHeight) {
        console.warn('findRandomValidPosition: converted position out of canvas bounds', {
          canvasPos,
          containerPos,
          whiteZone: { x: whiteZone.x, y: whiteZone.y },
          canvasSize: { width: this.canvasWidth, height: this.canvasHeight }
        });
        return null;
      }
      
      // Double-check it's valid using the validator (should always pass, but verify)
      if (!this.isValidDropPosition(canvasPos.x, canvasPos.y)) {
        console.warn('findRandomValidPosition: position failed validation', canvasPos);
        return null;
      }
      
      return canvasPos;
    }

    // Fallback: If zone layout not available, we shouldn't be dropping cards
    // But for safety, return null rather than using drop mask
    console.warn('findRandomValidPosition: zone layout not available, cannot determine yellow zone');
    return null;
  }

  /**
   * Update active customizations.
   */
  updateCustomizations(customizations: Map<string, boolean>): void {
    this.customizations = new Map(customizations);
  }

  /**
   * Get background colors based on active customizations.
   */
  private getBackgroundColors(): { start: string; end: string } {
    if (this.customizations.get('purpleTheme')) {
      return { start: '#2d1b4e', end: '#4a2c6b' };
    }
    if (this.customizations.get('goldTheme')) {
      return { start: '#3d2f1f', end: '#5d4a2f' };
    }
    // Default dark theme
    return { start: '#1a1a2e', end: '#16213e' };
  }

  /**
   * Render all cards to canvas.
   */
  render(ctx: CanvasRenderingContext2D): void {
    // Clear canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw background image if loaded, otherwise use gradient
    if (this.backgroundImage && this.backgroundImageLoaded) {
      // Draw background image, scaled to cover canvas while maintaining aspect ratio
      const canvasAspect = ctx.canvas.width / ctx.canvas.height;
      const imageAspect = this.backgroundImage.width / this.backgroundImage.height;
      
      let drawWidth = ctx.canvas.width;
      let drawHeight = ctx.canvas.height;
      let drawX = 0;
      let drawY = 0;
      
      if (imageAspect > canvasAspect) {
        // Image is wider - fit to height
        drawHeight = ctx.canvas.height;
        drawWidth = drawHeight * imageAspect;
        drawX = (ctx.canvas.width - drawWidth) / 2;
      } else {
        // Image is taller - fit to width
        drawWidth = ctx.canvas.width;
        drawHeight = drawWidth / imageAspect;
        drawY = (ctx.canvas.height - drawHeight) / 2;
      }
      
      // Apply darkening overlay if customizations require it
      ctx.save();
      ctx.globalAlpha = 0.85; // Slightly darken to make cards more visible
      ctx.drawImage(this.backgroundImage, drawX, drawY, drawWidth, drawHeight);
      ctx.restore();
      
      // Apply theme overlay if customizations are active
      if (this.customizations.get('purpleTheme') || this.customizations.get('goldTheme')) {
        const colors = this.getBackgroundColors();
        const overlay = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
        overlay.addColorStop(0, `${colors.start}40`); // 25% opacity
        overlay.addColorStop(1, `${colors.end}40`);
        ctx.fillStyle = overlay;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      }
    } else {
      // Fallback to gradient background
      const colors = this.getBackgroundColors();
      const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
      gradient.addColorStop(0, colors.start);
      gradient.addColorStop(1, colors.end);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    // Draw yellow zone overlay (card drop area) for visual reference
    this.drawYellowZoneOverlay(ctx);

    // Draw particle effects if enabled
    if (this.customizations.get('particleEffects')) {
      this.drawParticleEffects(ctx);
    }

    // First pass: Draw all card objects (lower z-layer)
    for (const card of this.cards) {
      drawCardObject(ctx, card);
    }

    // Draw light beam effects (between cards and labels)
    this.drawLightBeams(ctx);

    // Second pass: Draw all labels (higher z-layer, always on top)
    for (const card of this.cards) {
      const isHovered = card === this.hoveredCard;
      drawCardLabel(ctx, card, isHovered);
    }

    // Draw glowing border if enabled
    if (this.customizations.get('glowBorder')) {
      this.drawGlowBorder(ctx);
    }
  }

  /**
   * Draw yellow zone overlay to show card drop area boundaries.
   */
  private drawYellowZoneOverlay(ctx: CanvasRenderingContext2D): void {
    if (!this.zoneLayout) {
      console.warn('Yellow zone overlay: zoneLayout is null');
      return;
    }
    
    const whiteZone = this.zoneLayout.zones.get(ZoneType.WHITE);
    if (!whiteZone) {
      console.warn('Yellow zone overlay: whiteZone not found');
      return;
    }
    
    // Get yellow zone in container coordinates
    const yellowZoneContainer = this.zoneLayout.zones.get(ZoneType.YELLOW);
    if (!yellowZoneContainer) {
      console.warn('Yellow zone overlay: yellowZone not found');
      return;
    }
    
    // Convert yellow zone container coordinates to canvas coordinates
    const yellowX = yellowZoneContainer.x - whiteZone.x;
    const yellowY = yellowZoneContainer.y - whiteZone.y;
    const yellowWidth = yellowZoneContainer.width;
    const yellowHeight = yellowZoneContainer.height;
    
    // Validate coordinates
    if (yellowX < 0 || yellowY < 0 || yellowWidth <= 0 || yellowHeight <= 0) {
      console.warn('Yellow zone overlay: invalid coordinates', {
        yellowX,
        yellowY,
        yellowWidth,
        yellowHeight,
        whiteZone: { x: whiteZone.x, y: whiteZone.y, width: whiteZone.width, height: whiteZone.height },
        yellowZoneContainer: { x: yellowZoneContainer.x, y: yellowZoneContainer.y, width: yellowZoneContainer.width, height: yellowZoneContainer.height }
      });
      return;
    }
    
    // Draw semi-transparent yellow overlay (more visible)
    ctx.save();
    ctx.globalAlpha = 0.4; // Increased from 0.3 to 0.4 for better visibility
    ctx.fillStyle = '#ffeb3b'; // Yellow color
    ctx.fillRect(yellowX, yellowY, yellowWidth, yellowHeight);
    
    // Draw yellow border (more visible)
    ctx.globalAlpha = 1.0; // Full opacity for border
    ctx.strokeStyle = '#ffc107'; // Darker yellow for border
    ctx.lineWidth = 4; // Increased from 3 to 4
    ctx.setLineDash([8, 4]); // More visible dashed line
    ctx.strokeRect(yellowX, yellowY, yellowWidth, yellowHeight);
    ctx.setLineDash([]); // Reset line dash
    
    ctx.restore();
  }

  /**
   * Draw particle effects.
   */
  private drawParticleEffects(ctx: CanvasRenderingContext2D): void {
    const time = Date.now() / 1000;
    ctx.save();
    ctx.globalAlpha = 0.3;

    for (let i = 0; i < 20; i++) {
      const x = ((Math.sin(time + i) * 0.5 + 0.5) * ctx.canvas.width) % ctx.canvas.width;
      const y = ((Math.cos(time * 0.7 + i * 0.3) * 0.5 + 0.5) * ctx.canvas.height) % ctx.canvas.height;
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Draw all light beam effects for cards with beams enabled.
   * Beams emit upward from card positions using vertical linear gradients.
   * Beams pulse smoothly with a sine wave animation for a dynamic effect.
   * Beams are rendered between card objects and labels in the z-order.
   * 
   * Volumetric effect: Each beam consists of two layers:
   * - Outer beam: Wider, softer edges, fades to transparent at edges
   * - Core beam: Narrower, brighter, more intense, creates the "volume" effect
   * 
   * Performance: Single pass loop, gradient objects created per beam (reused during beam lifetime).
   * Optimized for 20+ simultaneous beams while maintaining 60fps.
   * 
   * @param ctx - Canvas rendering context
   */
  private drawLightBeams(ctx: CanvasRenderingContext2D): void {
    const beamMaxHeight = this.canvasHeight * 0.65; // 65% of canvas height (extended)
    
    // Outer beam dimensions (wider, softer)
    const outerBeamBaseWidth = 16; // Width at base
    const outerBeamTopWidth = 6; // Width at top
    
    // Core beam dimensions (narrower, brighter)
    const coreBeamBaseWidth = 8; // Width at base
    const coreBeamTopWidth = 2; // Width at top
    
    const pulseSpeed = 0.003; // Pulsing speed (radians per millisecond)
    const pulseMin = 0.6; // Minimum opacity during pulse (60%)
    const pulseMax = 1.0; // Maximum opacity during pulse (100%)

    for (const card of this.cards) {
      if (!card.beamEnabled || !card.beamColor) {
        continue; // Skip cards without beams
      }
      
      // Debug logging removed for performance

      // Calculate pulsing opacity using sine wave
      // Use beamAge to create smooth, continuous pulsing animation
      const pulsePhase = card.beamAge * pulseSpeed;
      const pulseValue = Math.sin(pulsePhase);
      // Map sine wave (-1 to 1) to opacity range (pulseMin to pulseMax)
      const beamOpacity = pulseMin + (pulseMax - pulseMin) * (pulseValue * 0.5 + 0.5);

      // Beam height is constant (no fade reduction)
      const currentBeamHeight = beamMaxHeight;

      // Parse hex color to RGB
      let r: number, g: number, b: number;
      try {
        const hex = card.beamColor.replace('#', '');
        // Handle both 6-digit (#RRGGBB) and 3-digit (#RGB) hex formats
        if (hex.length === 6) {
          r = parseInt(hex.substring(0, 2), 16);
          g = parseInt(hex.substring(2, 4), 16);
          b = parseInt(hex.substring(4, 6), 16);
        } else if (hex.length === 3) {
          // Expand 3-digit hex to 6-digit
          r = parseInt(hex[0] + hex[0], 16);
          g = parseInt(hex[1] + hex[1], 16);
          b = parseInt(hex[2] + hex[2], 16);
        } else {
          // Invalid hex format, use white as fallback
          console.warn(`Invalid beam color format: ${card.beamColor}, using white fallback`);
          r = g = b = 255;
        }
      } catch (error) {
        // Fallback to white if color parsing fails
        console.error(`Error parsing beam color: ${card.beamColor}`, error);
        r = g = b = 255;
      }

      // === LAYER 0: Dome/Light-Scattering Effect at Base ===
      // Creates a radial glow at the base of the beam, simulating light scattering on a surface
      ctx.save();
      const domeRadiusX = 40; // Horizontal radius (wider for dome shape) - increased for visibility
      const domeRadiusY = 18; // Vertical radius (narrower for dome shape) - increased for visibility
      const domeCenterX = card.x;
      const domeCenterY = card.y;
      
      // Dome opacity pulses with the beam - increased for better visibility
      const domeBaseOpacity = beamOpacity * 0.8; // Higher opacity for visibility
      // Brighten dome color significantly for visibility
      const domeR = Math.min(255, r + 40);
      const domeG = Math.min(255, g + 40);
      const domeB = Math.min(255, b + 40);
      
      // Draw elliptical dome using scale transform
      ctx.translate(domeCenterX, domeCenterY);
      ctx.scale(1, domeRadiusY / domeRadiusX); // Scale to create ellipse
      
      // Create radial gradient AFTER transform so it works correctly with the ellipse
      const domeGradient = ctx.createRadialGradient(
        0, 0, 0,                    // Inner circle (center, in transformed space)
        0, 0, domeRadiusX            // Outer circle (edge, in transformed space)
      );
      
      // Radial gradient: bright at center, fades to transparent at edges
      domeGradient.addColorStop(0, `rgba(${domeR}, ${domeG}, ${domeB}, ${domeBaseOpacity})`);
      domeGradient.addColorStop(0.3, `rgba(${domeR}, ${domeG}, ${domeB}, ${domeBaseOpacity * 0.7})`);
      domeGradient.addColorStop(0.6, `rgba(${domeR}, ${domeG}, ${domeB}, ${domeBaseOpacity * 0.4})`);
      domeGradient.addColorStop(1, `rgba(${domeR}, ${domeG}, ${domeB}, 0)`); // Fully transparent at edge
      
      ctx.fillStyle = domeGradient;
      ctx.beginPath();
      ctx.arc(0, 0, domeRadiusX, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // === LAYER 1: Outer Beam (wider, softer edges) ===
      ctx.save();
      const outerGradient = ctx.createLinearGradient(
        card.x, card.y,                    // Start (card position)
        card.x, card.y - currentBeamHeight  // End (top of beam)
      );

      // Outer beam: fades more gradually to edges, lower base opacity
      const outerBaseOpacity = beamOpacity * 0.4; // Softer outer layer
      outerGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${outerBaseOpacity})`);
      outerGradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${outerBaseOpacity * 0.7})`);
      outerGradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${outerBaseOpacity * 0.4})`);
      outerGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`); // Fully transparent at top

      ctx.fillStyle = outerGradient;

      // Draw outer beam (tapered from base to top)
      const outerStartX = card.x - outerBeamBaseWidth / 2;
      const outerEndX = card.x - outerBeamTopWidth / 2;
      const startY = card.y;
      const endY = card.y - currentBeamHeight;

      ctx.beginPath();
      ctx.moveTo(outerStartX, startY);
      ctx.lineTo(outerStartX + outerBeamBaseWidth, startY);
      ctx.lineTo(outerEndX + outerBeamTopWidth, endY);
      ctx.lineTo(outerEndX, endY);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // === LAYER 2: Core Beam (narrower, brighter, more intense) ===
      ctx.save();
      const coreGradient = ctx.createLinearGradient(
        card.x, card.y,                    // Start (card position)
        card.x, card.y - currentBeamHeight  // End (top of beam)
      );

      // Core beam: brighter, more intense, fades to transparent at edges
      // Use higher opacity and brighter color for the core
      const coreBaseOpacity = beamOpacity * 1.0; // Full opacity for maximum brightness
      // Brighten the core color significantly and blend towards white for lighter appearance
      // Blend 60% towards white (255, 255, 255) for a much lighter core
      const blendFactor = 0.6;
      const coreR = Math.min(255, Math.floor(r + (255 - r) * blendFactor));
      const coreG = Math.min(255, Math.floor(g + (255 - g) * blendFactor));
      const coreB = Math.min(255, Math.floor(b + (255 - b) * blendFactor));
      
      coreGradient.addColorStop(0, `rgba(${coreR}, ${coreG}, ${coreB}, ${coreBaseOpacity})`);
      coreGradient.addColorStop(0.4, `rgba(${coreR}, ${coreG}, ${coreB}, ${coreBaseOpacity * 0.8})`);
      coreGradient.addColorStop(0.7, `rgba(${coreR}, ${coreG}, ${coreB}, ${coreBaseOpacity * 0.5})`);
      coreGradient.addColorStop(1, `rgba(${coreR}, ${coreG}, ${coreB}, 0)`); // Fully transparent at top

      ctx.fillStyle = coreGradient;

      // Draw core beam (tapered from base to top, narrower than outer)
      const coreStartX = card.x - coreBeamBaseWidth / 2;
      const coreEndX = card.x - coreBeamTopWidth / 2;

      ctx.beginPath();
      ctx.moveTo(coreStartX, startY);
      ctx.lineTo(coreStartX + coreBeamBaseWidth, startY);
      ctx.lineTo(coreEndX + coreBeamTopWidth, endY);
      ctx.lineTo(coreEndX, endY);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  /**
   * Draw glowing border.
   */
  private drawGlowBorder(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.strokeStyle = '#4caf50';
    ctx.lineWidth = 4;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#4caf50';
    ctx.strokeRect(2, 2, ctx.canvas.width - 4, ctx.canvas.height - 4);
    ctx.restore();
  }

  /**
   * Clear all cards from scene.
   */
  clearCards(): void {
    this.cards = [];
  }

  /**
   * Get current card count.
   */
  getCardCount(): number {
    return this.cards.length;
  }

  /**
   * Get the card animation at a given label position.
   * Performs hit testing against all card labels, returning the topmost match.
   * Handles edge cases including overlapping labels, faded cards, and invalid coordinates.
   * 
   * @param x - X coordinate in canvas space (must be valid number)
   * @param y - Y coordinate in canvas space (must be valid number)
   * @returns CardAnimation if label was hit, null otherwise
   * @throws Does not throw - returns null for invalid inputs
   */
  getCardAtLabelPosition(x: number, y: number): CardAnimation | null {
    // Validate coordinates
    if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) {
      return null;
    }

    if (!this.cards || this.cards.length === 0) {
      return null;
    }

    // Iterate in reverse order (newest first, topmost)
    for (let i = this.cards.length - 1; i >= 0; i--) {
      const animation = this.cards[i];
      
      // Validate animation exists and is valid
      if (!animation || !animation.card) {
        continue;
      }
      
      // Skip if card is too faded or removed
      if (animation.labelAlpha <= 0) {
        continue;
      }

      // Validate label dimensions
      if (!animation.labelWidth || !animation.labelHeight || 
          animation.labelWidth <= 0 || animation.labelHeight <= 0) {
        continue;
      }

      // Calculate absolute label position
      const labelX = animation.x + animation.labelX - animation.labelWidth / 2;
      const labelY = animation.y + animation.labelY;

      // Validate calculated positions
      if (isNaN(labelX) || isNaN(labelY)) {
        continue;
      }

      // Check if point is within label bounds
      if (
        x >= labelX &&
        x <= labelX + animation.labelWidth &&
        y >= labelY &&
        y <= labelY + animation.labelHeight
      ) {
        return animation;
      }
    }

    return null;
  }

  /**
   * Set the hovered card animation for visual feedback.
   * 
   * @param cardAnimation - CardAnimation being hovered, or null to clear hover
   */
  setHoveredCard(cardAnimation: CardAnimation | null): void {
    // Store hovered card for visual feedback during rendering
    // This will be used in the render method to apply hover styles
    (this as any).hoveredCard = cardAnimation;
  }

  /**
   * Get the currently hovered card animation.
   * 
   * @returns CardAnimation if hovering, null otherwise
   */
  getHoveredCard(): CardAnimation | null {
    return (this as any).hoveredCard || null;
  }

  /**
   * Get all visible cards (for keyboard navigation).
   * Returns a copy of the cards array.
   */
  getCards(): CardAnimation[] {
    return [...this.cards];
  }
}

