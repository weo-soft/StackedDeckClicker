import type { CardAnimation } from './cardAnimation.js';
import { createCardAnimation, updateCardAnimation, drawCardObject, drawCardLabel } from './cardAnimation.js';
import type { DivinationCard } from '../models/Card.js';
import type { ZoneLayout } from '../models/ZoneLayout.js';
import { ZoneType } from '../models/ZoneLayout.js';
import { zoneLayoutService } from '../services/zoneLayoutService.js';

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
    img.src = '/images/The_Menagerie_area_screenshot.jpg';
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
    img.src = '/images/scene1_droppable_area.png';
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

    // Second pass: Draw all labels (higher z-layer, always on top)
    for (const card of this.cards) {
      drawCardLabel(ctx, card);
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
}

