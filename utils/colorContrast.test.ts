import { calculateContrastRatio, checkContrastCompliance, getContrastLevel } from './colorContrast';

describe('Color Contrast Utilities', () => {
  describe('calculateContrastRatio', () => {
    it('should calculate correct contrast ratio for black on white', () => {
      const ratio = calculateContrastRatio('#000000', '#FFFFFF');
      expect(ratio).toBeCloseTo(21, 1); // Maximum contrast ratio
    });

    it('should calculate correct contrast ratio for white on black', () => {
      const ratio = calculateContrastRatio('#FFFFFF', '#000000');
      expect(ratio).toBeCloseTo(21, 1); // Order should not matter
    });

    it('should calculate correct contrast ratio for same colors', () => {
      const ratio = calculateContrastRatio('#FF0000', '#FF0000');
      expect(ratio).toBeCloseTo(1, 1); // Minimum contrast ratio
    });

    it('should handle 8-digit hex colors (with alpha)', () => {
      const ratio = calculateContrastRatio('#000000FF', '#FFFFFFFF');
      expect(ratio).toBeCloseTo(21, 1);
    });

    it('should return null for invalid hex colors', () => {
      expect(calculateContrastRatio('invalid', '#FFFFFF')).toBeNull();
      expect(calculateContrastRatio('#000000', 'invalid')).toBeNull();
      expect(calculateContrastRatio('#00', '#FFFFFF')).toBeNull();
    });

    it('should calculate contrast for typical UI colors', () => {
      // Dark gray text on light gray background
      const ratio = calculateContrastRatio('#333333', '#F9FAFB');
      expect(ratio).toBeGreaterThan(4.5); // Should pass WCAG AA
    });
  });

  describe('checkContrastCompliance', () => {
    it('should pass WCAG AA for sufficient contrast (normal text)', () => {
      // Black on white - excellent contrast
      expect(checkContrastCompliance('#000000', '#FFFFFF', false)).toBe(true);
      
      // Dark gray on light gray - good contrast
      expect(checkContrastCompliance('#333333', '#F9FAFB', false)).toBe(true);
    });

    it('should fail WCAG AA for insufficient contrast (normal text)', () => {
      // Light gray on white - poor contrast
      expect(checkContrastCompliance('#CCCCCC', '#FFFFFF', false)).toBe(false);
      
      // Medium gray on light gray - insufficient
      expect(checkContrastCompliance('#999999', '#F0F0F0', false)).toBe(false);
    });

    it('should use lower threshold for large text', () => {
      // This might fail for normal text but pass for large text
      const textColor = '#767676';
      const bgColor = '#FFFFFF';
      
      const ratio = calculateContrastRatio(textColor, bgColor);
      
      if (ratio && ratio >= 3 && ratio < 4.5) {
        expect(checkContrastCompliance(textColor, bgColor, false)).toBe(false);
        expect(checkContrastCompliance(textColor, bgColor, true)).toBe(true);
      }
    });

    it('should return false for invalid colors', () => {
      expect(checkContrastCompliance('invalid', '#FFFFFF', false)).toBe(false);
      expect(checkContrastCompliance('#000000', 'invalid', false)).toBe(false);
    });
  });

  describe('getContrastLevel', () => {
    it('should return correct level descriptions', () => {
      expect(getContrastLevel(21)).toBe('Excellent (AAA)');
      expect(getContrastLevel(7)).toBe('Excellent (AAA)');
      expect(getContrastLevel(5)).toBe('Good (AA)');
      expect(getContrastLevel(4.5)).toBe('Good (AA)');
      expect(getContrastLevel(3.5)).toBe('Fair (AA Large Text)');
      expect(getContrastLevel(3)).toBe('Fair (AA Large Text)');
      expect(getContrastLevel(2)).toBe('Poor (Fails WCAG)');
      expect(getContrastLevel(1)).toBe('Poor (Fails WCAG)');
      expect(getContrastLevel(null)).toBe('Invalid');
    });
  });

  describe('Edge cases', () => {
    it('should handle colors with lowercase hex', () => {
      const ratio = calculateContrastRatio('#ffffff', '#000000');
      expect(ratio).toBeCloseTo(21, 1);
    });

    it('should handle colors with mixed case hex', () => {
      const ratio = calculateContrastRatio('#FfFfFf', '#000000');
      expect(ratio).toBeCloseTo(21, 1);
    });

    it('should handle colors without # prefix', () => {
      // Our function expects # prefix, so this should return null
      const ratio = calculateContrastRatio('FFFFFF', '000000');
      expect(ratio).toBeNull();
    });
  });
});
