import type { CardAnimation } from '../canvas/cardAnimation.js';
import type { CardDrawResult } from './CardDrawResult.js';

/**
 * Represents a click event on the canvas that may target a card label.
 */
export interface LabelClickEvent {
  /** X coordinate of click in canvas space */
  x: number;
  /** Y coordinate of click in canvas space */
  y: number;
  /** Original mouse event (for additional metadata if needed) */
  originalEvent: MouseEvent;
}

/**
 * Result of hit testing a click position against card labels.
 */
export interface LabelHitTestResult {
  /** The card animation that was hit (null if no label hit) */
  cardAnimation: CardAnimation | null;
  /** Whether a label was successfully hit */
  hit: boolean;
  /** Label bounds that were hit (for debugging/visual feedback) */
  labelBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * State tracking for the currently clicked card displayed in purple zone.
 */
export interface ClickedCardState {
  /** The card draw result for the clicked card */
  cardDrawResult: CardDrawResult | null;
  /** Timestamp when card was clicked */
  clickedAt: number;
  /** Whether this is a user-clicked card (true) or last drawn card (false) */
  isClicked: boolean;
}

/**
 * State tracking for hover detection on card labels.
 */
export interface HoverState {
  /** The card animation currently being hovered (null if none) */
  hoveredCard: CardAnimation | null;
  /** Last hover check timestamp (for debouncing) */
  lastHoverCheck: number;
  /** Whether cursor should show pointer style */
  showPointer: boolean;
}

