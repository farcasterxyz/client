export const fontFamilies = {
  /* 700 */
  FONT_FAMILY_BOLD: 'farcaster-bold',
  /* 600 */
  FONT_FAMILY_SEMI_BOLD: 'farcaster-semi-bold',
  /* 500 */
  FONT_FAMILY_MEDIUM: 'farcaster-medium',
  /* 400 */
  FONT_FAMILY_REGULAR: 'farcaster-regular',
  /* 300 */
  FONT_FAMILY_LIGHT: 'farcaster-light',

  // Inter
  // Note - 550 is 600 and 450 is 500
  INTER_550: 'farcaster-semi-bold',
  INTER_450: 'farcaster-medium',
  INTER_REGULAR: 'farcaster-regular',

  // SeasonMix
  SEASON_MIX_BOLD: 'farcaster-heading-bold',
  SEASON_MIX_SEMI_BOLD: 'farcaster-heading-semi-bold',
  SEASON_MIX_MEDIUM: 'farcaster-heading-medium',
  SEASON_MIX_REGULAR: 'farcaster-heading-regular',
  SEASON_MIX_LIGHT: 'farcaster-heading-light',
  HEADING_FONT_FAMILY_BOLD: 'farcaster-heading-bold',
  HEADING_FONT_FAMILY_SEMI_BOLD: 'farcaster-heading-semi-bold',
  HEADING_FONT_FAMILY_MEDIUM: 'farcaster-heading-medium',
  HEADING_FONT_FAMILY_REGULAR: 'farcaster-heading-regular',
  HEADING_FONT_FAMILY_LIGHT: 'farcaster-heading-light',
};

export type FontFamily = keyof typeof fontFamilies;
