import { TextStyle, ViewStyle } from 'react-native';

import { type AppThemeName, lightSavedThemeNamesSet } from './AppThemeNames';
import { borderRadiuses } from './borderRadiuses';
import { getColorSet } from './colors';
import { iconSizes } from './iconSizes';
import { tw } from './tailwind';
import {
  fontFamilies,
  fontSizes,
  letterSpacing,
  lineHeights,
} from './typography';

export * from './AppThemeNames';
export * from './sizes';
export * from './typography';
export * from './utils';

export const FONT_FAMILY_BOLD = 'farcaster-bold';
export const FONT_FAMILY_SEMI_BOLD = 'farcaster-semi-bold';
export const FONT_FAMILY_MEDIUM = 'farcaster-medium';
export const FONT_FAMILY_REGULAR = 'farcaster-regular';
export const FONT_FAMILY_LIGHT = 'farcaster-light';

export const HEADING_FONT_FAMILY_BOLD = 'farcaster-heading-bold';
export const HEADING_FONT_FAMILY_SEMI_BOLD = 'farcaster-heading-semi-bold';
export const HEADING_FONT_FAMILY_MEDIUM = 'farcaster-heading-medium';
export const HEADING_FONT_FAMILY_REGULAR = 'farcaster-heading-regular';
export const HEADING_FONT_FAMILY_LIGHT = 'farcaster-heading-light';

export const BORDER_WIDTH_HAIRLINE = 0.35;

const textColor = (color: string): TextStyle & ViewStyle => ({ color });

const borderColor = (borderColor: string): TextStyle & ViewStyle => ({
  borderColor,
});

const backgroundColor = (backgroundColor: string): TextStyle & ViewStyle => ({
  backgroundColor,
});

export const getTheme = (scheme: AppThemeName) => {
  const dark = !lightSavedThemeNamesSet.has(scheme);
  const colors = getColorSet(scheme ?? 'dark');

  return {
    ...tw,

    // Misc
    dark,
    colors,
    scheme: scheme || 'dark',

    // New theme data
    backgrounds: {
      default: backgroundColor(colors.background.default),
      primary: backgroundColor(colors.background.primary),
      secondary: backgroundColor(colors.background.secondary),
      tertiary: backgroundColor(colors.background.tertiary),
      quaternary: backgroundColor(colors.background.quaternary),
      brand: backgroundColor(colors.background.brand),
      brandLight: backgroundColor(colors.background.brandLight),
      warning: backgroundColor(colors.background.warning),
      danger: backgroundColor(colors.background.danger),
      dangerLight: backgroundColor(colors.background.dangerLight),
      light: backgroundColor(colors.background.light),
      dark: backgroundColor(colors.background.dark),
      inverted: backgroundColor(colors.background.inverted),
      informative: backgroundColor(colors.background.informative),
      overlay: backgroundColor(colors.background.overlay),
      translucent: backgroundColor(colors.background.translucent),
      success: backgroundColor(colors.background.success),
    },
    borders: {
      primary: borderColor(colors.border.primary),
      secondary: borderColor(colors.border.secondary),
      tertiary: borderColor(colors.border.tertiary),
      highlight: borderColor(colors.border.highlight),
      background: borderColor(colors.border.background),
      danger: borderColor(colors.border.danger),
    },
    texts: {
      primary: textColor(colors.text.primary),
      secondary: textColor(colors.text.secondary),
      tertiary: textColor(colors.text.tertiary),
      quaternary: textColor(colors.text.quaternary),
      brand: textColor(colors.text.brand),
      danger: textColor(colors.text.danger),
      warning: textColor(colors.text.warning),
      success: textColor(colors.text.success),
      informative: textColor(colors.text.informative),
      light: textColor(colors.text.light),
      dark: textColor(colors.text.dark),
      inverted: textColor(colors.text.inverted),
    },

    // Icon Sizes
    iconSizes,

    // Fonts
    fontSizes,
    fontFamilies,
    letterSpacing,
    lineHeights,
    fontLight: {
      fontFamily: fontFamilies.FONT_FAMILY_LIGHT,
    } as TextStyle,
    fontNormal: {
      fontFamily: fontFamilies.FONT_FAMILY_REGULAR,
    } as TextStyle,
    fontMedium: {
      fontFamily: fontFamilies.FONT_FAMILY_MEDIUM,
    } as TextStyle,
    fontSemibold: {
      fontFamily: fontFamilies.FONT_FAMILY_SEMI_BOLD,
    } as TextStyle,
    fontBold: {
      fontFamily: fontFamilies.FONT_FAMILY_BOLD,
    } as TextStyle,

    // Borders
    borderRadiuses,

    borderLHairline: { borderLeftWidth: BORDER_WIDTH_HAIRLINE } as ViewStyle &
      TextStyle,
    borderRHairline: { borderRightWidth: BORDER_WIDTH_HAIRLINE } as ViewStyle &
      TextStyle,
    borderBHairline: { borderBottomWidth: BORDER_WIDTH_HAIRLINE } as ViewStyle &
      TextStyle,
    borderHairline: { borderWidth: BORDER_WIDTH_HAIRLINE } as ViewStyle &
      TextStyle,
    borderTHairline: { borderTopWidth: BORDER_WIDTH_HAIRLINE } as ViewStyle &
      TextStyle,

    // Border Colors
    borderDefault: borderColor(colors.borderDefault),
    borderDesignSystemDefault: borderColor(colors.borderDesignSystemDefault),
    borderActive: borderColor(colors.border.primary),
    borderSelectionHighlight: borderColor(colors.borderSelectionHighlight),
    borderMuted: borderColor(colors.border.secondary),
    borderBackground: borderColor(colors.bgDefault),
    borderFeedAction: borderColor(colors.feed.actionPurple),
    borderActionPrimary: borderColor(colors.borderActionPrimary),
    borderActionSecondary: borderColor(colors.actionSecondary),
    borderActionDestructive: borderColor(colors.borderActionDestructive),
    borderCastHighlightFollow: borderColor(colors.borderCastHighlightFollow),
    borderTabViewActive: borderColor(colors.tabViewActiveTint),
    borderFaint: borderColor(colors.borderFaint),

    // Background Colors
    bgActionPrimary: backgroundColor(colors.actionPrimary),
    bgActionSecondary: backgroundColor(colors.actionSecondary),
    bgActionDestructive: backgroundColor(colors.bgActionDestructive),
    bgActionQuaternary: backgroundColor(colors.actionQuaternary),
    bgHover: backgroundColor(colors.bgHover),
    bgInformative: backgroundColor(colors.bgInformative),
    bgAction: backgroundColor(colors.bgAction),
    bgActionMuted: backgroundColor(colors.bgActionMuted),
    bgActionLight: backgroundColor(colors.bgActionLight),
    bgCastHighlight: backgroundColor(colors.bgCastHighlight),
    bgActionFrameTx: backgroundColor(colors.bgActionFrameTx),
    bgFrameTxLight: backgroundColor(colors.bgFrameTxLight),
    bgCastActionError: backgroundColor(colors.bgCastActionError),
    bgDefault: backgroundColor(colors.bgDefault),
    bgDefaultDark: backgroundColor(colors.bgDefaultDark),
    bgCodeSnippet: backgroundColor(colors.bgCodeSnippet),
    bgDanger: backgroundColor(colors.bgDanger),
    bgWarn: backgroundColor(colors.bgLightYellow),
    bgSuccess: backgroundColor(colors.bgSuccess),
    bgFaint: backgroundColor(colors.bgFaint),
    actionSecondary: backgroundColor(colors.actionSecondary),
    bgFaintOld: backgroundColor(colors.bgFaintOld),
    bgInput: backgroundColor(colors.bgInput),
    bgInputElevated: backgroundColor(colors.bgInputElevated),
    bgFrameActionsUnderneath: backgroundColor(colors.bgFrameActionsUnderneath),
    bgFrameAction: backgroundColor(colors.bgFrameAction),
    bgNotification: backgroundColor(colors.bgNotification),
    bgPill: backgroundColor(colors.bgDefault),
    bgPillActive: backgroundColor(colors.bgPillActive),
    bgPillHighlight: backgroundColor(colors.bgPillHighlight),
    bgPillDanger: backgroundColor(colors.bgPillDanger),
    bgButtonInverted: backgroundColor(colors.bgButtonInverted),
    bgMuted: backgroundColor(colors.bgMuted),
    bgIconUnderlay: backgroundColor(colors.bgIconUnderlay),
    bgPromptHandle: backgroundColor(colors.bgPromptHandle),
    bgErrorBubble: backgroundColor(colors.bgErrorBubble),
    bgSwap: backgroundColor(colors.bgSwap),
    bgLightGray: backgroundColor(colors.bgNewLightGray),
    bgLightGrayActive: backgroundColor(colors.bgNewLightGrayActive),
    bgElevated: backgroundColor(colors.bgElevated),
    bgRecommendation: backgroundColor(colors.bgRecommendation),
    bgLightPurple: backgroundColor(colors.bgLightPurple),
    bgLightGreen: backgroundColor(colors.bgLightGreen),

    // Direct Casts
    directCasts: {
      textSelfTimestamp: textColor(colors.directCasts.textSelfTimestamp),
      textUsername: textColor(colors.directCasts.textUsername),
      textSelfReplyUsername: textColor(
        colors.directCasts.textSelfReplyUsername,
      ),
      textLink: textColor(colors.directCasts.textLink),
      textReplyUsername: textColor(colors.directCasts.textReplyUsername),
      textTimestamp: textColor(colors.directCasts.textTimestamp),
      textSelf: textColor(colors.directCasts.textSelf),
      bgImagePreview: backgroundColor(colors.directCasts.bgImagePreview),
      bgHighlight: backgroundColor(colors.directCasts.bgHighlight),
      bg: backgroundColor(colors.directCasts.bg),
      bgEmbed: backgroundColor(colors.directCasts.bgEmbed),
      bgSelfReply: backgroundColor(colors.directCasts.bgSelfReply),
      bgReply: backgroundColor(colors.directCasts.bgReply),
      bgSelf: backgroundColor(colors.directCasts.bgSelf),
      bgSelfEmbed: backgroundColor(colors.directCasts.bgSelfEmbed),
      bgHighlightGray: backgroundColor(colors.directCasts.bgHighlightGray),
    },
  };
};
