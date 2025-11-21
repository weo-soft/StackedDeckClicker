import type { CardDisplayConfig } from '../models/CardDisplayData.js';

/**
 * Escape HTML to prevent XSS attacks
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Parse styling metadata and convert to HTML with CSS classes.
 * Format: <STYLING-METADATA>{TEXT}
 * Example: <uniqueitem>{The Poet's Pen} -> <span class="poe-style-uniqueitem">The Poet's Pen</span>
 * Handles nested tags and preserves newlines by converting them to <br> tags
 * 
 * @param text - Text with PoE styling metadata
 * @returns HTML string with styled spans
 */
export function parseStyledText(text: string): string {
  // First, convert newlines to a temporary marker to preserve them
  const newlineMarker = '___NEWLINE___';
  let result = text.replace(/\n/g, newlineMarker);
  
  // Process tags from innermost to outermost
  // We'll repeatedly find and replace tags that don't contain other tags
  let changed = true;
  let iterations = 0;
  const maxIterations = 100; // Safety limit to prevent infinite loops
  
  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;
    
    // Pattern to match: <tag>{content}
    // We need to find the matching closing brace, handling nested braces
    const tagPattern = /<([^>]+)>\{/g;
    let match: RegExpExecArray | null;
    
    // Find all tag openings and process them from right to left (innermost first)
    const tagMatches: Array<{ start: number; tag: string; contentStart: number; contentEnd: number }> = [];
    
    while ((match = tagPattern.exec(result)) !== null) {
      const tagStart = match.index;
      const tag = match[1];
      const contentStart = match.index + match[0].length;
      
      // Find the matching closing brace by counting brace depth
      let depth = 1;
      let pos = contentStart;
      let contentEnd = -1;
      
      while (pos < result.length && depth > 0) {
        if (result[pos] === '{') {
          depth++;
        } else if (result[pos] === '}') {
          depth--;
          if (depth === 0) {
            contentEnd = pos;
            break;
          }
        }
        pos++;
      }
      
      if (contentEnd !== -1) {
        const content = result.substring(contentStart, contentEnd);
        // Check if content contains unprocessed tags (pattern: <tag>{)
        // We only skip if the content contains unprocessed tags (like <gemitem>{)
        // Already-processed HTML tags (like <span>) are fine
        const hasUnprocessedTags = /<[^/>]+>\{/.test(content);
        if (!hasUnprocessedTags) {
          tagMatches.push({
            start: tagStart,
            tag,
            contentStart,
            contentEnd
          });
        }
      }
    }
    
    // Process matches from right to left (innermost first) to avoid index shifting issues
    tagMatches.reverse().forEach(tagMatch => {
      const content = result.substring(tagMatch.contentStart, tagMatch.contentEnd);
      const cssClass = `poe-style-${tagMatch.tag.replace(/:/g, '-')}`;
      const replacement = `<span class="${cssClass}">${content}</span>`;
      
      // Replace the entire tag including braces at the specific position
      const before = result.substring(0, tagMatch.start);
      const after = result.substring(tagMatch.contentEnd + 1);
      result = before + replacement + after;
      changed = true;
    });
  }
  
  // Convert newline markers to <br> tags BEFORE escaping
  result = result.replace(new RegExp(newlineMarker, 'g'), '<br>');
  
  // Now we need to escape text content but preserve HTML tags (<span> and <br>)
  // Split by HTML tags and escape only the text parts
  const htmlTagRegex = /(<(?:span|br)[^>]*>|<\/span>)/gi;
  const parts = result.split(htmlTagRegex);
  
  let output = '';
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    // Check if this part is an HTML tag
    if (part && (part.startsWith('<span') || part.startsWith('<br') || part === '</span>')) {
      output += part;
    } else if (part) {
      // Escape text content
      output += escapeHtml(part);
    }
  }
  
  return output.trim();
}

/**
 * Format reward text from explicitModifiers with styled text parsing.
 * 
 * @param explicitModifiers - Array of modifier text objects
 * @returns HTML string with styled text
 */
export function formatRewardText(explicitModifiers?: Array<{ text: string }>): string {
  if (!explicitModifiers || explicitModifiers.length === 0) {
    return '';
  }
  const raw = explicitModifiers.map(m => m.text).join('\n');
  return parseStyledText(raw);
}

/**
 * Format flavour text by cleaning wiki/markup tags and normalizing whitespace.
 * 
 * @param flavourText - Raw flavour text from card data
 * @returns Cleaned flavour text
 */
export function formatFlavourText(flavourText?: string): string {
  if (!flavourText) return '';
  
  let text = flavourText;
  // Remove wiki/markup tags like <size:27>, <smaller>, <magicitem>, etc.
  text = text.replace(/<[^>]*>/g, '');
  // Remove surrounding braces often used on wiki examples
  text = text.replace(/^\s*[\{\[\(\"'""']+/, '').replace(/[\}\]\)\"'""']+\s*$/, '');
  // Collapse multiple spaces and normalize whitespace/newlines
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

/**
 * Calculate card display configuration from zone dimensions.
 * 
 * @param zoneWidth - Width of the purple zone in pixels
 * @param zoneHeight - Height of the purple zone in pixels
 * @param baseWidth - Base card width (default: 300px)
 * @returns CardDisplayConfig with calculated dimensions and scale factor
 */
export function calculateCardDisplayConfig(
  zoneWidth: number,
  zoneHeight: number,
  baseWidth: number = 300
): CardDisplayConfig {
  const baseHeight = Math.round(baseWidth * (455 / 300)); // Maintain 455:300 aspect ratio
  const scaleFactor = zoneWidth / baseWidth;

  return {
    baseWidth,
    baseHeight,
    scaleFactor,
    zoneWidth,
    zoneHeight
  };
}

