import type { ColorScheme, ValidationResult } from '../models/Tier.js';

/**
 * Calculate contrast ratio between two colors using WCAG formula.
 * @param color1 - First color in hex format (#RRGGBB)
 * @param color2 - Second color in hex format (#RRGGBB)
 * @returns Contrast ratio (>= 1.0)
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 1.0;
  
  const l1 = getLuminance(rgb1);
  const l2 = getLuminance(rgb2);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Validate color scheme meets WCAG 2.1 AA requirements.
 * @param colors - Color scheme to validate
 * @returns Validation result with contrast ratio and error message if invalid
 */
export function validateColorScheme(colors: ColorScheme): ValidationResult {
  // Validate hex format
  if (!isValidHexColor(colors.backgroundColor) ||
      !isValidHexColor(colors.textColor) ||
      !isValidHexColor(colors.borderColor)) {
    return {
      isValid: false,
      error: 'All colors must be valid hex format (#RRGGBB)'
    };
  }
  
  // Calculate contrast ratio
  const contrastRatio = calculateContrastRatio(
    colors.backgroundColor,
    colors.textColor
  );
  
  // Check WCAG AA requirements (4.5:1 for normal text, 3:1 for large text)
  // Using normal text requirement (4.5:1) as default
  const minContrast = 4.5;
  const isValid = contrastRatio >= minContrast;
  
  return {
    isValid,
    contrastRatio,
    error: isValid ? undefined : `Contrast ratio ${contrastRatio.toFixed(2)} is below WCAG AA requirement (4.5:1)`
  };
}

/**
 * Convert hex color string to RGB object.
 * @param hex - Hex color string (#RRGGBB or #RGB)
 * @returns RGB object or null if invalid
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  const hexClean = hex.replace('#', '');
  
  // Handle both #RRGGBB and #RGB formats
  let r: string, g: string, b: string;
  
  if (hexClean.length === 3) {
    // #RGB format - expand to #RRGGBB
    r = hexClean[0] + hexClean[0];
    g = hexClean[1] + hexClean[1];
    b = hexClean[2] + hexClean[2];
  } else if (hexClean.length === 6) {
    // #RRGGBB format
    r = hexClean.substring(0, 2);
    g = hexClean.substring(2, 4);
    b = hexClean.substring(4, 6);
  } else {
    return null;
  }
  
  return {
    r: parseInt(r, 16),
    g: parseInt(g, 16),
    b: parseInt(b, 16)
  };
}

/**
 * Calculate relative luminance of an RGB color (WCAG formula).
 * @param rgb - RGB color object
 * @returns Luminance value (0.0 to 1.0)
 */
function getLuminance(rgb: { r: number; g: number; b: number }): number {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Validate hex color format.
 * @param hex - Color string to validate
 * @returns true if valid hex color format
 */
function isValidHexColor(hex: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}

