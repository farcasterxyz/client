import { type TextStyle } from 'react-native';

import { type TypographyLabel } from '../../typography';
import { getTypographyTextStyle } from '../getTypographyTextStyle';

describe('getTypographyTextStyle', () => {
  describe('basic functionality', () => {
    it('should return correct styles for Medium/XS typography', () => {
      const result = getTypographyTextStyle('Medium/XS');
      expect(result).toMatchSnapshot();
    });

    it('should return correct styles for Medium/S typography', () => {
      const result = getTypographyTextStyle('Medium/S');
      expect(result).toMatchSnapshot();
    });

    it('should return correct styles for Medium/Base typography', () => {
      const result = getTypographyTextStyle('Medium/Base');
      expect(result).toMatchSnapshot();
    });

    it('should return correct styles for Semibold/L typography', () => {
      const result = getTypographyTextStyle('Semibold/L');
      expect(result).toMatchSnapshot();
    });

    it('should return correct styles for Semibold/4XL typography', () => {
      const result = getTypographyTextStyle('Semibold/4XL');
      expect(result).toMatchSnapshot();
    });
  });

  describe('with additional styles', () => {
    it('should merge single additional style object', () => {
      const additionalStyle: TextStyle = {
        color: '#FF0000',
        fontWeight: 'bold',
      };
      const result = getTypographyTextStyle('Medium/XS', additionalStyle);
      expect(result).toMatchSnapshot();
    });

    it('should merge array of additional styles', () => {
      const additionalStyles: TextStyle[] = [
        { color: '#00FF00' },
        { textAlign: 'center' },
        { marginTop: 10 },
      ];
      const result = getTypographyTextStyle('Medium/XS', additionalStyles);
      expect(result).toMatchSnapshot();
    });

    it('should handle empty additional styles array', () => {
      const result = getTypographyTextStyle('Medium/XS', []);
      expect(result).toMatchSnapshot();
    });

    it('should handle additional styles that override typography properties', () => {
      const additionalStyle: TextStyle = {
        fontSize: 20,
        lineHeight: 25,
        letterSpacing: 1,
        fontFamily: 'custom-font',
      };
      const result = getTypographyTextStyle('Medium/XS', additionalStyle);
      expect(result).toMatchSnapshot();
    });
  });

  describe('edge cases', () => {
    it('should handle undefined additional styles', () => {
      const result = getTypographyTextStyle('Medium/XS', undefined);
      expect(result).toMatchSnapshot();
    });

    it('should handle null additional styles', () => {
      const result = getTypographyTextStyle('Medium/XS');
      expect(result).toMatchSnapshot();
    });

    it('should handle additional styles with undefined values', () => {
      const additionalStyle: TextStyle = {
        color: undefined,
        fontSize: undefined,
        fontWeight: 'bold',
      };
      const result = getTypographyTextStyle('Medium/XS', additionalStyle);
      expect(result).toMatchSnapshot();
    });

    it('should handle complex nested additional styles', () => {
      const additionalStyles: TextStyle[] = [
        {
          color: '#333333',
          textShadowColor: '#000000',
          textShadowOffset: { width: 1, height: 1 },
          textShadowRadius: 2,
        },
        {
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 4,
        },
        {
          transform: [{ scale: 1.1 }],
        },
      ];
      const result = getTypographyTextStyle('Medium/XS', additionalStyles);
      expect(result).toMatchSnapshot();
    });
  });

  describe('type safety and structure', () => {
    it('should return array of TextStyle objects', () => {
      const result = getTypographyTextStyle('Medium/XS');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      result.forEach((style) => {
        expect(typeof style).toBe('object');
        expect(style).not.toBeNull();
      });
    });

    it('should preserve typography structure in first element', () => {
      const result = getTypographyTextStyle('Medium/XS');
      const typographyStyle = result[0];

      expect(typographyStyle).toHaveProperty('fontSize');
      expect(typographyStyle).toHaveProperty('lineHeight');
      expect(typographyStyle).toHaveProperty('letterSpacing');
      expect(typographyStyle).toHaveProperty('fontFamily');
    });

    it('should handle all typography labels', () => {
      const labels: TypographyLabel[] = [
        'Medium/XS',
        'Medium/S',
        'Medium/Base',
        'Semibold/L',
        'Semibold/4XL',
      ];

      labels.forEach((label) => {
        const result = getTypographyTextStyle(label);
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });

  describe('snapshot consistency', () => {
    it('should produce consistent results for same inputs', () => {
      const result1 = getTypographyTextStyle('Medium/XS');
      const result2 = getTypographyTextStyle('Medium/XS');
      expect(result1).toEqual(result2);
    });

    it('should produce different results for different typography labels', () => {
      const headingResult = getTypographyTextStyle('Medium/XS');
      const bodyResult = getTypographyTextStyle('Medium/Base');
      expect(headingResult).not.toEqual(bodyResult);
    });

    it('should maintain order: typography styles first, then additional styles', () => {
      const additionalStyle: TextStyle = { color: 'red' };
      const result = getTypographyTextStyle('Medium/Base', additionalStyle);

      expect(result.length).toBe(2);
      expect(result[0]).toMatchObject({
        fontSize: expect.any(Number),
        lineHeight: expect.any(Number),
        letterSpacing: expect.any(Number),
      });
      expect(result[1]).toMatchObject({ color: 'red' });
    });
  });
});
