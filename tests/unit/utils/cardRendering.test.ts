import { describe, it, expect } from 'vitest';
import { parseStyledText, formatRewardText, formatFlavourText, calculateCardDisplayConfig } from '../../../src/lib/utils/cardRendering.js';

describe('cardRendering utilities', () => {
  describe('parseStyledText', () => {
    it('should parse simple PoE tag', () => {
      const result = parseStyledText('<uniqueitem>{The Poet\'s Pen}');
      expect(result).toContain('poe-style-uniqueitem');
      // HTML escaping converts apostrophe to &#39;
      expect(result).toContain('Poet');
      expect(result).toContain('Pen');
    });

    it('should handle nested tags', () => {
      const result = parseStyledText('<default>{Item Level:} <normal>{100}');
      expect(result).toContain('poe-style-default');
      expect(result).toContain('poe-style-normal');
    });

    it('should preserve newlines as <br> tags', () => {
      const result = parseStyledText('Line 1\nLine 2');
      expect(result).toContain('<br>');
    });

    it('should escape HTML to prevent XSS', () => {
      const result = parseStyledText('<script>alert("xss")</script>');
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('should handle empty string', () => {
      const result = parseStyledText('');
      expect(result).toBe('');
    });

    it('should handle text without tags', () => {
      const result = parseStyledText('Plain text');
      expect(result).toBe('Plain text');
    });
  });

  describe('formatRewardText', () => {
    it('should format explicitModifiers array', () => {
      const modifiers = [
        { text: '<uniqueitem>{The Poet\'s Pen}', optional: false }
      ];
      const result = formatRewardText(modifiers);
      expect(result).toContain('poe-style-uniqueitem');
    });

    it('should handle empty array', () => {
      const result = formatRewardText([]);
      expect(result).toBe('');
    });

    it('should handle undefined', () => {
      const result = formatRewardText(undefined);
      expect(result).toBe('');
    });

    it('should join multiple modifiers with newlines', () => {
      const modifiers = [
        { text: 'First', optional: false },
        { text: 'Second', optional: false }
      ];
      const result = formatRewardText(modifiers);
      expect(result).toContain('<br>');
    });
  });

  describe('formatFlavourText', () => {
    it('should remove wiki markup tags', () => {
      const result = formatFlavourText('<size:27>{Flavour text}');
      expect(result).not.toContain('<size:27>');
      expect(result).toContain('Flavour text');
    });

    it('should remove surrounding braces', () => {
      const result = formatFlavourText('{Flavour text}');
      expect(result).toBe('Flavour text');
    });

    it('should normalize whitespace', () => {
      const result = formatFlavourText('Multiple   spaces');
      expect(result).toBe('Multiple spaces');
    });

    it('should handle undefined', () => {
      const result = formatFlavourText(undefined);
      expect(result).toBe('');
    });

    it('should trim whitespace', () => {
      const result = formatFlavourText('  Text  ');
      expect(result).toBe('Text');
    });
  });

  describe('calculateCardDisplayConfig', () => {
    it('should calculate correct baseHeight from aspect ratio', () => {
      const config = calculateCardDisplayConfig(200, 220, 300);
      expect(config.baseHeight).toBe(455); // 300 * (455/300) = 455
    });

    it('should calculate correct scaleFactor', () => {
      const config = calculateCardDisplayConfig(200, 220, 300);
      expect(config.scaleFactor).toBeCloseTo(200 / 300, 2);
    });

    it('should use default baseWidth of 300', () => {
      const config = calculateCardDisplayConfig(200, 220);
      expect(config.baseWidth).toBe(300);
    });

    it('should preserve zone dimensions', () => {
      const config = calculateCardDisplayConfig(200, 220);
      expect(config.zoneWidth).toBe(200);
      expect(config.zoneHeight).toBe(220);
    });

    it('should handle different zone sizes', () => {
      const config1 = calculateCardDisplayConfig(200, 220);
      const config2 = calculateCardDisplayConfig(400, 440);
      expect(config2.scaleFactor).toBe(config1.scaleFactor * 2);
    });
  });
});

