/**
 * Color contrast utility functions for WCAG compliance
 * Implements WCAG 2.1 contrast ratio calculations
 */

/**
 * Convert hex color to RGB values
 * @param hex - Hex color string (e.g., "#RRGGBB" or "#RRGGBBAA")
 * @returns RGB values as [r, g, b] where each value is 0-255
 */
function hexToRgb(hex: string): [number, number, number] | null {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  
  // Handle 6-digit hex (RGB)
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return [r, g, b];
  }
  
  // Handle 8-digit hex (RGBA) - ignore alpha channel for contrast
  if (cleanHex.length === 8) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return [r, g, b];
  }
  
  return null;
}

/**
 * Calculate relative luminance of a color
 * Formula from WCAG 2.1: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @returns Relative luminance (0-1)
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  // Convert to 0-1 range
  const [rs, gs, bs] = [r / 255, g / 255, b / 255];
  
  // Apply gamma correction
  const gammaCorrect = (val: number) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  };
  
  const rLinear = gammaCorrect(rs);
  const gLinear = gammaCorrect(gs);
  const bLinear = gammaCorrect(bs);
  
  // Calculate luminance using WCAG formula
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calculate contrast ratio between two colors
 * Formula from WCAG 2.1: https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 * @param color1 - First color in hex format
 * @param color2 - Second color in hex format
 * @returns Contrast ratio (1-21) or null if invalid colors
 */
export function calculateContrastRatio(color1: string, color2: string): number | null {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) {
    return null;
  }
  
  const l1 = getRelativeLuminance(rgb1[0], rgb1[1], rgb1[2]);
  const l2 = getRelativeLuminance(rgb2[0], rgb2[1], rgb2[2]);
  
  // Ensure lighter color is in numerator
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  // Calculate contrast ratio
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standard
 * WCAG AA requires 4.5:1 for normal text, 3:1 for large text
 * @param textColor - Text color in hex format
 * @param backgroundColor - Background color in hex format
 * @param isLargeText - Whether text is large (>= 18pt or >= 14pt bold)
 * @returns true if contrast is sufficient, false otherwise
 */
export function checkContrastCompliance(
  textColor: string,
  backgroundColor: string,
  isLargeText: boolean = false
): boolean {
  const ratio = calculateContrastRatio(textColor, backgroundColor);
  
  if (ratio === null) {
    return false;
  }
  
  // WCAG AA standards
  const requiredRatio = isLargeText ? 3.0 : 4.5;
  
  return ratio >= requiredRatio;
}

/**
 * Get contrast level description
 * @param ratio - Contrast ratio
 * @returns Description of contrast level
 */
export function getContrastLevel(ratio: number | null): string {
  if (ratio === null) {
    return 'Invalid';
  }
  
  if (ratio >= 7) {
    return 'Excellent (AAA)';
  } else if (ratio >= 4.5) {
    return 'Good (AA)';
  } else if (ratio >= 3) {
    return 'Fair (AA Large Text)';
  } else {
    return 'Poor (Fails WCAG)';
  }
}
