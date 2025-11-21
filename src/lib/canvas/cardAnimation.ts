import type { DivinationCard } from '../models/Card.js';
import type { QualityTier } from '../models/types.js';
import type { Scene } from './scene.js';
import { tierService } from '../services/tierService.js';
import type { ColorScheme } from '../models/Tier.js';

// Cache to track if we've logged initialization status
let tierInitLogged = false;

export interface CardAnimation {
  card: DivinationCard;
  x: number;
  y: number;
  vx: number; // velocity x
  vy: number; // velocity y
  rotation: number;
  rotationSpeed: number;
  scale: number;
  alpha: number;
  age: number; // milliseconds since creation
  glowIntensity: number;
  glowColor: string;
  labelAlpha: number; // Separate alpha for label (stays visible longer)
  labelX: number; // Label X position (offset from card)
  labelY: number; // Label Y position (offset from card)
  labelWidth: number; // Label width (cached for collision detection)
  labelHeight: number; // Label height (cached for collision detection)
  targetLabelX: number; // Target X position for smooth movement
  targetLabelY: number; // Target Y position for smooth movement
}

/**
 * Create a new card animation with initial properties.
 * @param popUp If true, card pops up with small random movement. If false, card falls from above.
 */
export function createCardAnimation(
  card: DivinationCard,
  startX: number,
  startY: number,
  popUp: boolean = false
): CardAnimation {
  let vx: number;
  let vy: number;
  let rotationSpeed: number;
  let initialScale: number;
  let initialAlpha: number;

  if (popUp) {
    // No animation - cards appear instantly at full size
    vx = 0; // No movement
    vy = 0; // No movement
    rotationSpeed = 0; // No rotation
    initialScale = 1.0; // Full size immediately
    initialAlpha = 1.0; // Full opacity immediately
  } else {
    // Drop effect: fall from above
    vx = (Math.random() - 0.5) * 2;
    vy = Math.random() * 3 + 2; // Downward velocity
    rotationSpeed = (Math.random() - 0.5) * 0.1;
    initialScale = 1.0;
    initialAlpha = 1.0;
  }

  // Rarity-based glow
  const { glowIntensity, glowColor } = getRarityGlow(card.qualityTier);

  // Initial label position (will be adjusted to avoid overlaps)
  const labelOffsetY = -30; // Start above card
  
  return {
    card,
    x: startX,
    y: startY,
    vx,
    vy,
    rotation: (Math.random() - 0.5) * 0.3,
    rotationSpeed,
    scale: initialScale,
    alpha: initialAlpha,
    age: 0,
    glowIntensity,
    glowColor,
    labelAlpha: initialAlpha,
    labelX: 0, // Will be calculated based on label width
    labelY: labelOffsetY,
    labelWidth: 0, // Will be calculated when drawn
    labelHeight: 26,
    targetLabelX: 0, // Target position for smooth movement
    targetLabelY: labelOffsetY
  };
}

/**
 * Update card animation physics.
 */
export function updateCardAnimation(
  animation: CardAnimation,
  deltaTime: number,
  canvasHeight: number,
  canvasWidth: number,
  scene: Scene,
  gravity: number = 0.2,
  friction: number = 0.97,
  airResistance: number = 0.99
): void {
  // Check if card is within the white floor area
  const cardHeight = 30; // Height of card object (reduced to half)
  const cardCenterY = animation.y;
  const isInWhiteArea = scene.isValidDropPosition(animation.x, cardCenterY);
  
  // For pop-up cards: they appear within white area and settle with minimal movement
  // For falling cards: they need to land inside white area
  
  // Check if card is "inside" the white area (not at the edges)
  const checkYAbove = cardCenterY - 10;
  const checkYBelow = cardCenterY + 10;
  const isAboveWhite = checkYAbove < 0 || scene.isValidDropPosition(animation.x, checkYAbove);
  const isBelowWhite = checkYBelow >= canvasHeight || scene.isValidDropPosition(animation.x, checkYBelow);
  const isInsideWhiteArea = isInWhiteArea && isAboveWhite && isBelowWhite;
  
  // Card is settled if it's inside white area and velocity is low
  const isSettled = isInsideWhiteArea && Math.abs(animation.vx) < 0.1 && Math.abs(animation.vy) < 0.1;
  
  // Apply physics based on whether card is in white area
  if (!isInWhiteArea) {
    // Card is outside white area - apply gravity to pull it back
    if (animation.vy < 5) {
      animation.vy += gravity * (deltaTime / 16.67);
    }
  } else if (isInsideWhiteArea) {
    // Card is inside white area - apply friction to settle
    animation.vx *= friction;
    animation.vy *= friction;
    
    // Stop rotation when settled
    if (isSettled) {
      animation.rotationSpeed *= 0.95;
    }
  } else {
    // Card is at edge - apply friction
    animation.vx *= friction;
    animation.vy *= friction;
  }
  
  // No pop-up animation - cards appear at full size and opacity immediately

  // Apply air resistance when moving
  if (Math.abs(animation.vx) > 0.01 || Math.abs(animation.vy) > 0.01) {
    animation.vx *= airResistance;
    animation.vy *= airResistance;
  }

  // Update position
  const newX = animation.x + animation.vx * (deltaTime / 16.67);
  const newY = animation.y + animation.vy * (deltaTime / 16.67);

  // Update position - keep cards within white area bounds
  const newXInWhite = scene.isValidDropPosition(newX, animation.y);
  const newYInWhite = scene.isValidDropPosition(animation.x, newY);
  
  if (newXInWhite || Math.abs(animation.vx) < 0.05) {
    animation.x = newX;
  } else {
    // Bounce off white area boundaries (gentle)
    animation.vx *= -0.3;
  }
  
  if (newYInWhite || Math.abs(animation.vy) < 0.05) {
    animation.y = newY;
  } else {
    // Bounce off white area boundaries (gentle)
    animation.vy *= -0.3;
  }

  // Smoothly move label towards target position (for repositioning)
  const labelMoveSpeed = 0.15; // Smooth interpolation speed
  const labelDx = animation.targetLabelX - animation.labelX;
  const labelDy = animation.targetLabelY - animation.labelY;
  
  if (Math.abs(labelDx) > 0.1 || Math.abs(labelDy) > 0.1) {
    animation.labelX += labelDx * labelMoveSpeed;
    animation.labelY += labelDy * labelMoveSpeed;
  } else {
    // Snap to target when close
    animation.labelX = animation.targetLabelX;
    animation.labelY = animation.targetLabelY;
  }

  // Update rotation (slows down as card settles)
  if (isSettled || Math.abs(animation.vy) < 0.3) {
    animation.rotationSpeed *= 0.95; // Slow rotation when settling
  }
  animation.rotation += animation.rotationSpeed * (deltaTime / 16.67);

  // Update age
  animation.age += deltaTime;

  // Fade out card object after 30 seconds, but keep label visible longer
  if (animation.age > 30000) {
    const fadeStart = 30000;
    const fadeDuration = 5000; // 5 second fade
    const fadeProgress = (animation.age - fadeStart) / fadeDuration;
    animation.alpha = Math.max(0, 1 - fadeProgress);
    // Label fades slower - starts fading at 40 seconds
    if (animation.age > 40000) {
      const labelFadeStart = 40000;
      const labelFadeDuration = 10000; // 10 second fade for label
      const labelFadeProgress = (animation.age - labelFadeStart) / labelFadeDuration;
      animation.labelAlpha = Math.max(0, 1 - labelFadeProgress);
    }
  }

  // Cards settle on the ground - no bouncing, just natural physics
  // Cards will naturally slow down due to friction and come to rest
}

/**
 * Get glow properties based on rarity.
 */
function getRarityGlow(qualityTier: QualityTier): { glowIntensity: number; glowColor: string } {
  switch (qualityTier) {
    case 'common':
      return { glowIntensity: 0, glowColor: '#ffffff' };
    case 'rare':
      return { glowIntensity: 0.3, glowColor: '#4a9eff' };
    case 'epic':
      return { glowIntensity: 0.5, glowColor: '#9d4edd' };
    case 'legendary':
      return { glowIntensity: 0.8, glowColor: '#ffd700' };
    default:
      return { glowIntensity: 0, glowColor: '#ffffff' };
  }
}

/**
 * Draw just the card object (without label).
 * Used for layered rendering to ensure labels are always on top.
 */
export function drawCardObject(
  ctx: CanvasRenderingContext2D,
  animation: CardAnimation,
  cardWidth: number = 20,
  cardHeight: number = 30
): void {
  ctx.save();

  // Draw card object in background (smaller, more subtle)
  ctx.translate(animation.x, animation.y);
  ctx.rotate(animation.rotation);
  ctx.scale(animation.scale, animation.scale);

  // Draw subtle glow for rare cards
  if (animation.glowIntensity > 0) {
    const glowRadius = cardWidth * 0.8;
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
    gradient.addColorStop(0, `${animation.glowColor}${Math.floor(animation.glowIntensity * 0.3 * 255).toString(16).padStart(2, '0')}`);
    gradient.addColorStop(1, `${animation.glowColor}00`);
    
    ctx.globalAlpha = animation.alpha * 0.3;
    ctx.fillStyle = gradient;
    ctx.fillRect(-glowRadius, -glowRadius, glowRadius * 2, glowRadius * 2);
  }

  // Draw small card object (brown/tan card on ground)
  ctx.globalAlpha = animation.alpha * 0.95; // More solid appearance
  ctx.fillStyle = '#8b7355'; // Brown/tan card color
  ctx.strokeStyle = '#6b5a45';
  ctx.lineWidth = 1;
  ctx.fillRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight);
  ctx.strokeRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight);

  ctx.restore();
}

/**
 * Draw a card on canvas with animation effects.
 * Cards are drawn as small background objects, with prominent blue labels showing names.
 * @deprecated Use drawCardObject and drawCardLabel separately for proper z-ordering
 */
export function drawCard(
  ctx: CanvasRenderingContext2D,
  animation: CardAnimation,
  cardWidth: number = 20,
  cardHeight: number = 30
): void {
  drawCardObject(ctx, animation, cardWidth, cardHeight);
  drawCardLabel(ctx, animation);
}

/**
 * Get label style from tier system, with fallback to value-based style.
 */
function getLabelStyle(card: DivinationCard): {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  borderWidth: number;
  opacity: number;
} {
  // Try to get tier color scheme
  try {
    // Check if tier service has state (is initialized)
    const tierState = tierService.getState();
    if (!tierState) {
      if (!tierInitLogged) {
        console.warn('[Tier] Tier service not initialized yet. Labels will use fallback colors until tier system loads.');
        tierInitLogged = true;
      }
    } else {
      const tier = tierService.getTierForCard(card.name);
      if (tier && tier.config && tier.config.colorScheme) {
        const colorScheme = tier.config.colorScheme;
        // Only log first few cards to avoid console spam
        if (!tierInitLogged) {
          console.log(`[Tier] Tier system active! Card "${card.name}" -> Tier "${tier.id}"`, {
            bg: colorScheme.backgroundColor,
            text: colorScheme.textColor,
            border: colorScheme.borderColor,
            borderWidth: colorScheme.borderWidth
          });
          tierInitLogged = true;
        }
        return {
          backgroundColor: colorScheme.backgroundColor,
          textColor: colorScheme.textColor,
          borderColor: colorScheme.borderColor,
          borderWidth: colorScheme.borderWidth || 2,
          opacity: 0.95
        };
      } else {
        if (!tierInitLogged) {
          console.warn(`[Tier] Card "${card.name}" has no tier assignment. Tier:`, tier);
          tierInitLogged = true;
        }
      }
    }
  } catch (error) {
    // Tier system not available, fall through to default
    if (!tierInitLogged) {
      console.warn(`[Tier] Lookup failed, using default label style:`, error);
      tierInitLogged = true;
    }
  }

  // Fallback to value-based style (original behavior)
  const cardValue = card.value;
  if (cardValue <= 50) {
    // The Dragon (lowest) - solid black background, light blue text and border
    return {
      backgroundColor: '#000000',
      textColor: '#60a5fa',
      borderColor: '#60a5fa',
      borderWidth: 1,
      opacity: 0.95
    };
  } else if (cardValue <= 200) {
    // The Trial - cyan background, black text
    return {
      backgroundColor: '#00ffff',
      textColor: '#000000',
      borderColor: '#000000',
      borderWidth: 1,
      opacity: 0.95
    };
  } else if (cardValue <= 1000) {
    // The Patient - cyan background, black text (same as Trial)
    return {
      backgroundColor: '#00ffff',
      textColor: '#000000',
      borderColor: '#000000',
      borderWidth: 1,
      opacity: 0.95
    };
  } else {
    // The Fortunate (highest) - royal blue background, white text
    return {
      backgroundColor: '#4169e1',
      textColor: '#ffffff',
      borderColor: '#000000',
      borderWidth: 1,
      opacity: 0.95
    };
  }
}

/**
 * Draw a prominent label showing the card name.
 * Style varies based on card value tier.
 * Exported for use in layered rendering.
 */
export function drawCardLabel(
  ctx: CanvasRenderingContext2D,
  animation: CardAnimation
): void {
  ctx.save();

  const labelPadding = 10;
  const labelHeight = 26;
  const fontSize = 15;
  
  // Measure text to determine label width
  ctx.font = `bold ${fontSize}px Arial`;
  const textMetrics = ctx.measureText(animation.card.name.toUpperCase());
  const labelWidth = textMetrics.width + labelPadding * 2;
  
  // Cache label dimensions for collision detection
  animation.labelWidth = labelWidth;
  animation.labelHeight = labelHeight;

  // Position label using stored offsets (adjusted to avoid overlaps)
  const labelX = animation.x + animation.labelX - labelWidth / 2;
  const labelY = animation.y + animation.labelY;

  // Get label style from tier system (with fallback)
  const style = getLabelStyle(animation.card);

  // Draw label background
  ctx.globalAlpha = animation.labelAlpha * style.opacity;
  ctx.fillStyle = style.backgroundColor;
  
  // Draw rectangle (no rounded corners)
  ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
  
  // Only draw border if borderWidth > 0
  if (style.borderWidth > 0) {
    ctx.strokeStyle = style.borderColor;
    ctx.lineWidth = style.borderWidth;
    ctx.strokeRect(labelX, labelY, labelWidth, labelHeight);
  }

  // Draw card name text
  ctx.globalAlpha = animation.labelAlpha;
  ctx.fillStyle = style.textColor;
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    animation.card.name.toUpperCase(),
    labelX + labelWidth / 2,
    labelY + labelHeight / 2
  );

  ctx.restore();
}

/**
 * Draw a rounded rectangle path.
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

