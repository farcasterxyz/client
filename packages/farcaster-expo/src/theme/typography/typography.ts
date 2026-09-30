import { FontFamily } from './fontFamilies';
import { FontSize } from './fontSizes';
import { LetterSpacing } from './letterSpacing';
import { LineHeight } from './lineHeights';

// Note: These labels will be removed in the future
export type TypographyLabelDeprecated =
  // Medium
  | 'Medium/XS'
  | 'Medium/S'
  | 'Medium/Base'
  | 'Medium/L'

  // Regular
  | 'Regular/Base'

  // Semibold
  | 'Semibold/S'
  | 'Semibold/Base'
  | 'Semibold/L'
  | 'Semibold/XL'
  | 'Semibold/2XL'
  | 'Semibold/4XL';

export type TypographyLabel =
  | TypographyLabelDeprecated
  // Heading
  | 'Heading/Display'
  | 'Heading/ExtraLarge'
  | 'Heading/Large'
  | 'Heading/Medium'
  | 'Heading/Small'
  // Body
  | 'Body/ExtraLarge'
  | 'Body/ExtraLarge/Strong'
  | 'Body/Large'
  | 'Body/Large/Strong'
  | 'Body/Medium'
  | 'Body/Medium/Strong'
  | 'Body/Small'
  | 'Body/Small/Strong'
  | 'Body/ExtraSmall'
  | 'Body/ExtraSmall/Strong';

export const typography: {
  [key in TypographyLabel]: {
    fontSize: FontSize;
    lineHeight?: LineHeight;
    letterSpacing?: LetterSpacing;
    fontFamily?: FontFamily;
  };
} = {
  // Heading
  'Heading/Display': {
    fontFamily: 'FONT_FAMILY_MEDIUM',
    fontSize: '$32',
    letterSpacing: '-1.44',
    lineHeight: '$40',
  },
  'Heading/ExtraLarge': {
    fontFamily: 'HEADING_FONT_FAMILY_SEMI_BOLD',
    fontSize: '$24',
    letterSpacing: '−0.408',
    lineHeight: '$32',
  },
  'Heading/Large': {
    fontFamily: 'HEADING_FONT_FAMILY_SEMI_BOLD',
    fontSize: '$20',
    // letterSpacing: '-0.34',
    lineHeight: '$32',
  },
  'Heading/Medium': {
    fontFamily: 'HEADING_FONT_FAMILY_SEMI_BOLD',
    fontSize: '$16',
    letterSpacing: '-0.075',
    lineHeight: '$25',
  },
  'Heading/Small': {
    fontFamily: 'HEADING_FONT_FAMILY_SEMI_BOLD',
    fontSize: '$14',
    letterSpacing: '-0.07',
    lineHeight: '$22',
  },

  // Body
  'Body/ExtraLarge': {
    fontFamily: 'INTER_REGULAR',
    fontSize: '$20',
    letterSpacing: '-0.0375',
    lineHeight: '$28',
  },
  'Body/ExtraLarge/Strong': {
    fontFamily: 'INTER_550',
    fontSize: '$15',
    letterSpacing: '-0.0375',
    lineHeight: '$22',
  },
  'Body/Large': {
    fontFamily: 'INTER_REGULAR',
    fontSize: '$15',
    letterSpacing: '-0.0375',
    lineHeight: '$22',
  },
  'Body/Large/Strong': {
    fontFamily: 'INTER_550',
    fontSize: '$15',
    letterSpacing: '-0.0375',
    lineHeight: '$22',
  },
  'Body/Medium': {
    fontFamily: 'INTER_REGULAR',
    fontSize: '$14',
    letterSpacing: '0.07',
    lineHeight: '$16',
  },
  'Body/Medium/Strong': {
    fontFamily: 'INTER_550',
    fontSize: '$14',
    letterSpacing: '0.07',
    lineHeight: '$16',
  },
  'Body/Small': {
    fontFamily: 'INTER_REGULAR',
    fontSize: '$13',
    letterSpacing: '0.065',
    lineHeight: '$14',
  },
  'Body/Small/Strong': {
    fontFamily: 'INTER_550',
    fontSize: '$13',
    letterSpacing: '0.065',
    lineHeight: '$14',
  },
  'Body/ExtraSmall': {
    fontFamily: 'INTER_REGULAR',
    fontSize: '$12',
    letterSpacing: '0.06',
    lineHeight: '$14',
  },
  'Body/ExtraSmall/Strong': {
    fontFamily: 'INTER_550',
    fontSize: '$12',
    letterSpacing: '0.06',
    lineHeight: '$14',
  },

  /** @deprecated */
  'Medium/XS': {
    fontSize: 'XS',
    lineHeight: 'XS',
    letterSpacing: 'Normal',
    fontFamily: 'FONT_FAMILY_MEDIUM',
  },
  'Medium/S': {
    fontSize: 'sm',
    lineHeight: 'sm',
    letterSpacing: '-0.25',
    fontFamily: 'FONT_FAMILY_MEDIUM',
  },
  'Medium/Base': {
    fontSize: 'B',
    lineHeight: 'S',
    letterSpacing: '-0.25',
    fontFamily: 'FONT_FAMILY_MEDIUM',
  },
  'Medium/L': {
    fontSize: 'L',
    lineHeight: 'B',
    letterSpacing: '-0.25',
    fontFamily: 'FONT_FAMILY_MEDIUM',
  },
  'Regular/Base': {
    fontSize: 'B',
    lineHeight: 'base',
    letterSpacing: 'sm',
    fontFamily: 'FONT_FAMILY_REGULAR',
  },
  'Semibold/S': {
    fontSize: 'S',
    lineHeight: 'sm',
    letterSpacing: '-0.25',
    fontFamily: 'FONT_FAMILY_SEMI_BOLD',
  },
  'Semibold/Base': {
    fontSize: 'B',
    lineHeight: 'base',
    letterSpacing: '-0.25',
    fontFamily: 'FONT_FAMILY_SEMI_BOLD',
  },
  'Semibold/L': {
    fontSize: 'L',
    lineHeight: 'B',
    letterSpacing: '-0.25',
    fontFamily: 'FONT_FAMILY_SEMI_BOLD',
  },
  'Semibold/XL': {
    fontSize: 'xl',
    lineHeight: 'xl',
    letterSpacing: 'Normal',
    fontFamily: 'FONT_FAMILY_SEMI_BOLD',
  },
  'Semibold/2XL': {
    fontSize: '2xl',
    lineHeight: '2xl',
    letterSpacing: 'Normal',
    fontFamily: 'FONT_FAMILY_SEMI_BOLD',
  },
  'Semibold/4XL': {
    fontSize: '4XL',
    lineHeight: '4XL',
    letterSpacing: 'Normal',
    fontFamily: 'FONT_FAMILY_SEMI_BOLD',
  },
} as const;
