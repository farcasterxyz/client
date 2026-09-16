import type { AppThemeName } from './AppThemeNames';
import { convertHexToRGBA } from './utils';

type Neutrals = {
  white: string;
  black: string;
};

type NeutralsPalette = {
  light: Neutrals;
  dark: Neutrals;
};

const neutrals = {
  light: {
    white: '#ffffff',
    black: '#121212',
  },
  dark: {
    white: '#ffffff',
    black: '#101010',
  },
} as const satisfies NeutralsPalette;

type GrayColors = {
  gray0: string;
  gray50: string;
  gray100: string;
  gray150: string;
  gray200: string;
  gray250: string;
  gray300: string;
  gray350: string;
  gray400: string;
  gray450: string;
  gray500: string;
  gray600: string;
  gray700: string;
  gray800: string;
  gray850: string;
  gray900: string;
};

type GrayColorPalette = {
  light: GrayColors;
  dark: GrayColors;
};

const gray = {
  light: {
    gray0: '#ffffff',
    gray50: '#fafafa',
    gray100: '#f9f9f9',
    gray150: '#f5f5f5',
    gray200: '#f2f2f2',
    gray250: '#ECECED',
    gray300: '#E7E7E8',
    gray350: '#a5a5a5',
    gray400: '#a8a8a8',
    gray450: '#acacac',
    gray500: '#6a6a6a',
    gray600: '#383838',
    gray700: '#323232',
    gray800: '#24292e',
    gray850: '#1e1e1e',
    gray900: '#141414',
  },
  dark: {
    gray0: '#ffffff',
    gray50: '#fafafa',
    gray100: '#f9f9f9',
    gray150: '#f5f5f5',
    gray200: '#f2f2f2',
    gray250: '#181818',
    gray300: '#E7E7E8',
    gray350: '#a5a5a5',
    gray400: '#a8a8a8',
    gray450: '#acacac',
    gray500: '#6a6a6a',
    gray600: '#383838',
    gray700: '#323232',
    gray800: '#24292e',
    gray850: '#1e1e1e',
    gray900: '#141414',
  },
} as const satisfies GrayColorPalette;

const violet = {
  light: {
    violet100: '#fbfaff',
    violet200: '#f8f6ff',
    violet300: '#eee9ff',
    violet400: '#ddd4ff',
    violet500: '#7959ff',
    violet600: '#6c4fec',
    violet700: '#5d42d6',
    violet800: '#4a33ad',
    violet900: '#39257f',
    violet1000: '#271955',
  },
  dark: {
    violet100: '#171320',
    violet200: '#1b1429',
    violet300: '#231a36',
    violet400: '#2f204a',
    violet500: '#866aff',
    violet600: '#9a81ff',
    violet700: '#b29eff',
    violet800: '#cabfff',
    violet900: '#e0d8ff',
    violet1000: '#f2f0ff',
  },
} as const;

const red = {
  light: {
    red100: '#fff5f5',
    red200: '#ffe2e0',
    red300: '#ffc7c2',
    red400: '#ffafa3',
    red450: '#FF043C',
    red500: '#f24822',
    red600: '#dc3412',
    red700: '#bd2915',
    red800: '#9f1f18',
    red900: '#771208',
    red1000: '#660e0b',
  },
  dark: {
    red100: '#fee7e7',
    red200: '#fccdca',
    red300: '#fbbcb6',
    red400: '#fca397',
    red450: '#FF043C',
    red500: '#e03e1a',
    red600: '#c4381c',
    red700: '#963323',
    red800: '#7c2622',
    red900: '#54211c',
    red1000: '#311817',
  },
} as const;

const green = {
  light: {
    green100: '#ebffee',
    green200: '#cff7d3',
    green300: '#aff4c6',
    green400: '#85e0a3',
    green450: '#28D02C',
    green500: '#14ae5c',
    green600: '#009951',
    green700: '#008043',
    green800: '#036838',
    green900: '#024626',
    green1000: '#083a23',
  },
  dark: {
    green100: '#ddfde2',
    green200: '#beefc2',
    green300: '#a1e8b9',
    green400: '#79d297',
    green450: '#28D02C',
    green500: '#198f51',
    green600: '#007834',
    green700: '#0a5c35',
    green800: '#0a4c2d',
    green900: '#082618',
    green1000: '#0b1e15',
  },
} as const;

const yellow = {
  light: {
    yellow100: '#fffbeb',
    yellow200: '#fff1c2',
    yellow300: '#ffe8a3',
    yellow400: '#ffd966',
    yellow500: '#ffcd29',
    yellow600: '#ffc21a',
    yellow700: '#fab815',
    yellow800: '#eba611',
    yellow900: '#dd940e',
    yellow1000: '#b86200',
  },
  dark: {
    yellow100: '#fdf7dd',
    yellow200: '#fbe8ad',
    yellow300: '#f9df90',
    yellow400: '#f7d15f',
    yellow500: '#f3c11b',
    yellow600: '#f2b50d',
    yellow700: '#e4a711',
    yellow800: '#c58011',
    yellow900: '#925711',
    yellow1000: '#71440f',
  },
} as const;

const paleViolet = {
  light: {
    paleViolet100: '#f1f1f8',
    paleViolet200: '#e7e7f3',
    paleViolet300: '#d4d4ed',
    paleViolet400: '#b3b2dc',
    paleViolet500: '#6a699b',
    paleViolet600: '#595884',
    paleViolet700: '#4e4d75',
    paleViolet800: '#393956',
    paleViolet900: '#29293d',
    paleViolet1000: '#14141f',
  },
  dark: {
    paleViolet100: '#f1f1f8',
    paleViolet200: '#e7e7f3',
    paleViolet300: '#d4d4ed',
    paleViolet400: '#b3b2dc',
    paleViolet500: '#6a699b',
    paleViolet600: '#595884',
    paleViolet700: '#4e4d75',
    paleViolet800: '#393956',
    paleViolet900: '#29293d',
    paleViolet1000: '#14141f',
  },
} as const;

const blue = {
  light: {
    blue100: '#f2f9ff',
    blue200: '#e5f4ff',
    blue300: '#80caff',
    blue400: '#bde3ff',
    blue500: '#0d99ff',
    blue600: '#007be5',
    blue700: '#0768cf',
    blue800: '#034ac1',
    blue900: '#093077',
    blue1000: '#0d193f',
  },
  dark: {
    blue100: '#e2f1fd',
    blue200: '#cfe9fc',
    blue300: '#7cc4f8',
    blue400: '#a8d7fa',
    blue500: '#0c8ce9',
    blue600: '#0a6dc2',
    blue700: '#105cad',
    blue800: '#184591',
    blue900: '#1b335f',
    blue1000: '#161e36',
  },
} as const;

export type BackgroundColors = {
  default: string;
  primary: string;
  secondary: string;
  tertiary: string;
  quaternary: string;
  brand: string;
  brandLight: string;
  brandMedium: string;
  warning: string;
  danger: string;
  dangerLight: string;
  success: string;
  light: string;
  dark: string;
  inverted: string;
  informative: string;
  overlay: string;
  translucent: string;
};

export type BackgroundColorPalette = {
  light: BackgroundColors;
  dark: BackgroundColors;
};

const background: BackgroundColorPalette = {
  light: {
    default: neutrals.light.white,
    primary: neutrals.light.white,
    secondary: gray.light.gray200,
    tertiary: gray.light.gray300,
    quaternary: gray.light.gray50,
    brand: violet.light.violet500,
    brandLight: violet.light.violet200,
    brandMedium: violet.light.violet400,
    danger: red.light.red100,
    dangerLight: red.light.red500,
    warning: yellow.light.yellow100,
    success: green.light.green100,
    light: neutrals.light.white,
    dark: neutrals.light.black,
    inverted: neutrals.light.black,
    informative: blue.light.blue100,
    overlay: '#0000001A',
    translucent: '#F3F3F380',
  },
  dark: {
    default: neutrals.dark.black,
    primary: neutrals.dark.black,
    secondary: gray.dark.gray850,
    tertiary: gray.dark.gray600,
    quaternary: gray.dark.gray50,
    brand: violet.dark.violet500,
    brandLight: violet.dark.violet200,
    brandMedium: violet.dark.violet400,
    danger: red.dark.red1000,
    dangerLight: red.dark.red500,
    warning: yellow.dark.yellow1000,
    success: green.dark.green1000,
    light: neutrals.dark.white,
    dark: neutrals.dark.black,
    inverted: neutrals.dark.white,
    informative: blue.dark.blue1000,
    overlay: '#000000BF',
    translucent: '#0000001A',
  },
} as const satisfies BackgroundColorPalette;

type BorderColors = {
  primary: string;
  secondary: string;
  tertiary: string;
  highlight: string;
  background: string;
  danger: string;
};

type BorderColorPalette = {
  light: BorderColors;
  dark: BorderColors;
};

const border: BorderColorPalette = {
  light: {
    primary: gray.light.gray150,
    secondary: gray.light.gray200,
    tertiary: gray.light.gray300,
    highlight: violet.light.violet400,
    background: neutrals.light.white,
    danger: red.light.red500,
  },
  dark: {
    primary: gray.dark.gray800,
    secondary: gray.dark.gray700,
    tertiary: gray.dark.gray600,
    highlight: violet.dark.violet400,
    background: neutrals.dark.black,
    danger: red.dark.red500,
  },
} as const satisfies BorderColorPalette;

type TextColors = {
  primary: string;
  secondary: string;
  tertiary: string;
  quaternary: string;
  brand: string;
  danger: string;
  warning: string;
  success: string;
  informative: string;
  light: string;
  dark: string;
  inverted: string;
  white: string;
};

type TextColorPalette = {
  light: TextColors;
  dark: TextColors;
};

const text: TextColorPalette = {
  light: {
    primary: neutrals.light.black,
    secondary: gray.light.gray500,
    tertiary: gray.light.gray350,
    quaternary: gray.light.gray450,
    brand: violet.light.violet500,
    danger: red.light.red600,
    warning: yellow.light.yellow1000,
    success: green.light.green450,
    informative: blue.light.blue500,
    light: neutrals.light.white,
    dark: neutrals.light.black,
    inverted: neutrals.light.white,
    white: neutrals.light.white,
  },
  dark: {
    primary: neutrals.dark.white,
    secondary: gray.dark.gray350,
    tertiary: gray.dark.gray500,
    quaternary: gray.dark.gray600,
    brand: violet.dark.violet500,
    danger: red.dark.red500,
    warning: yellow.dark.yellow400,
    success: green.dark.green450,
    informative: blue.dark.blue500,
    light: neutrals.dark.white,
    dark: neutrals.dark.black,
    inverted: neutrals.dark.black,
    white: neutrals.dark.white,
  },
} as const satisfies TextColorPalette;

export const getColors = (theme: 'light' | 'dark') => {
  return {
    ...neutrals[theme],
    ...gray[theme],
    ...violet[theme],
    ...red[theme],
    ...green[theme],
    ...yellow[theme],
    ...paleViolet[theme],
    ...blue[theme],
    background: background[theme],
    border: border[theme],
    text: text[theme],
  } as const;
};

// Supporting color migration from v1 to v2
// Can remove this once we've migrated to v2

type ColorSet = ReturnType<typeof getColors> & {
  bgCastActionErrorLight: string;
  vanillaIce: string;
  bgLightRedLight: string;
  copperfield: string;
  chestnutRose: string;
  crimson: string;
  jon: string;
  bgLightRedDark: string;
  bgCastActionErrorDark: string;
  bgLightGreenLight: string;
  apple: string;
  actionGreen: string;
  christi: string;
  bgLightGreenDark: string;
  bgLightYellowLight: string;
  bgLightYellowDark: string;
  bgLightBlueLight: string;
  bgLightPurpleLight: string;
  bgDirectCastEmbedLight: string;
  bgSelfDirectCastLight: string;
  feedActionPurpleMuted: string;
  heliotrope: string;
  textSelfDirectCastTimestampDark: string;
  textDirectCastReplyUsernameDark: string;
  textDirectCastUsernameDark: string;
  venusViolet: string;
  blueMarguerite: string;
  feedActionPurple: string;
  textDirectCastUsernameLight: string;
  purpleDark: string;
  studio: string;
  minsk: string;
  purpleDarker: string;
  bgSelfDirectCastDark: string;
  bgSelfDirectCastReplyDark: string;
  bgDirectCastEmbedDark: string;
  bgDirectCastDark: string;
  bgRecommendationDark: string;
  bgLightBlueDark: string;
  bgFaintLight: string;
  borderCastHighlightLight: string;
  concrete: string;
  gallery: string;
  bgHighlightGrayLight: string;
  threadLineLight: string;
  mischka: string;
  iron: string;
  bgPromptHandleLight: string;
  actionQuaternaryLight: string;
  regentGray: string;
  textMutedDark: string;
  textFaintDark: string;
  feedMutedLight: string;
  bgToastElevated: string;
  bgHighlightGrayDark: string;
  mortar: string;
  borderFaintDark: string;
  blackCurrant: string;
  darkElevated: string;
  bleachedCedar: string;
  steelGray: string;
  vibrantCedar: string;
  bgNewLightGrayDark: string;
  bgSwapDark: string;
  bgFaintDark: string;
  borderCastHighlightDark: string;
  cinder: string;
  elevated: string;

  // Actions
  actionPrimary: string;
  actionSecondary: string;
  actionQuaternary: string;
  actionRed: string;

  // Borders
  borderActionPrimary: string;
  borderActionDestructive: string;
  borderDefault: string;
  borderDesignSystemDefault: string;
  borderSelectionHighlight: string;
  borderHighlight: string;
  borderFaint: string;
  borderCastHighlightFollow: string;

  // Backgrounds
  bgDefault: string;
  bgHover: string;
  bgLightPurple: string;
  bgLightGreen: string;
  bgLightRed: string;
  bgLightYellow: string;
  bgLightBlue: string;
  bgNewLightGray: string;
  bgNewLightGrayActive: string;
  bgActionDestructive: string;
  bgAction: string;
  bgActionMuted: string;
  bgActionLight: string;
  bgCastHighlight: string;
  bgActionFrameTx: string;
  bgFrameTxLight: string;
  bgCastActionError: string;
  bgButtonInverted: string;
  bgDefaultDark: string;
  bgCodeSnippet: string;
  bgDanger: string;
  bgSuccess: string;
  bgFaint: string;
  bgFaintOld: string;
  bgInput: string;
  bgInputElevated: string;
  bgNotification: string;
  bgFrameActionsUnderneath: string;
  bgFrameAction: string;
  bgPillActive: string;
  bgPillHighlight: string;
  bgPillTabHighlight: string;
  bgPillDanger: string;
  bgTransparent: string;
  bgMuted: string;
  bgRecommendation: string;
  bgIconUnderlay: string;
  bgPromptHandle: string;
  bgErrorBubble: string;
  bgSwap: string;
  tabViewActiveTint: string;
  bgElevated: string;
  bgButtonPress: string;
  bgInformative: string;

  // Direct Casts
  directCasts: {
    bgImagePreview: string;
    bgHighlight: string;
    bg: string;
    bgEmbed: string;
    bgSelfReply: string;
    bgReply: string;
    bgSelf: string;
    bgSelfEmbed: string;
    bgHighlightGray: string;
    textSelfTimestamp: string;
    textTimestamp: string;
    textSelf: string;
    textSelfReplyUsername: string;
    textReplyUsername: string;
    textUsername: string;
    textLink: string;
  };

  // Feed
  feed: {
    mutedIcon: string;
    muted: string;
    actionPurpleMuted: string;
    actionPurple: string;
    threadLine: string;
  };

  // UI
  loadingIndicator: string;
  navHeaderTint: string;
  selection: string;
  // Gradients
  gradients: {
    primaryCard: readonly [string, string];
  };
};

const COLORS_V1 = {
  bgCastActionErrorLight: '#fdf6f6',
  vanillaIce: '#F6DFDC',
  bgLightRedLight: '#F7D0D7',
  copperfield: '#dd7d75',
  chestnutRose: '#d45d52',
  crimson: '#d51338',
  jon: '#3D1F29',
  bgLightRedDark: '#3D1124',
  bgCastActionErrorDark: '#322235',

  bgLightGreenLight: '#EEFFEF',
  apple: '#43b748',
  actionGreen: '#0CC957',
  christi: '#2F855A',
  bgLightGreenDark: '#1D2825',

  bgLightYellowLight: '#FCF7E6',
  bgLightYellowDark: '#3F2F1B',

  bgLightBlueLight: '#EDF0FF',
  bgLightPurpleLight: '#F0EDFF',
  bgDirectCastEmbedLight: '#D4CFF3',
  bgSelfDirectCastLight: '#E7E3FA',
  feedActionPurpleMuted: '#E2D8F4',
  heliotrope: '#c848ff',
  textSelfDirectCastTimestampDark: '#BAB5E1',
  textDirectCastReplyUsernameDark: '#BF99F8',
  textDirectCastUsernameDark: '#BD98F7',
  venusViolet: '#7C65C1',
  blueMarguerite: '#8565CB',
  feedActionPurple: '#8A63D2',
  textDirectCastUsernameLight: '#6957AC',
  purpleDark: '#6944BA',
  studio: '#6847ba',
  minsk: '#422e8c',
  purpleDarker: '#502BA1',
  bgSelfDirectCastDark: '#6D3AA0',
  bgSelfDirectCastReplyDark: '#5D3188',
  bgDirectCastEmbedDark: '#322C49',
  bgDirectCastDark: '#29223C',
  bgRecommendationDark: '#2C2240',
  bgLightBlueDark: '#1E2A4C',
  bgButtonPress: '#6B46C1',

  bgFaintLight: '#F7F7F7',
  borderCastHighlightLight: '#F5F4FF',
  concrete: '#f3f3f3',
  gallery: '#efefef',
  bgHighlightGrayLight: '#e2e2e2',
  threadLineLight: '#e1e8ed',
  mischka: '#d1d5db',
  iron: '#cfd0d2',
  bgPromptHandleLight: '#d9d9d9',
  actionQuaternaryLight: '#F0EEF7',
  regentGray: '#8B99A4',
  textMutedDark: '#9FA3AF',
  textFaintDark: '#7C8293',
  feedMutedLight: '#576472',
  bgToastElevated: '#546473',
  bgHighlightGrayDark: '#49414C',
  mortar: '#4c3a4e',
  borderFaintDark: '#3f3042',
  blackCurrant: '#322A3C',
  darkElevated: '#342942',
  bleachedCedar: '#2A2432',
  steelGray: '#2a223c',
  vibrantCedar: '#292034',
  bgNewLightGrayDark: '#231C2A',
  bgSwapDark: '#231C2A',
  bgFaintDark: '#201A28',
  borderCastHighlightDark: '#1F182C',
  cinder: '#17101f',
};

export const getColorSetV1 = (scheme: 'dark' | 'light'): ColorSet => {
  const dark = scheme === 'dark';

  const colors = COLORS_V1;
  const v2 = getColors(scheme);

  const textLight = v2.white;
  const textDark = v2.black;
  const textMuted = dark ? colors.textMutedDark : colors.bgToastElevated;

  const bgDark = colors.cinder;
  const bgLight = v2.white;
  const bgDefault = dark ? bgDark : bgLight;
  const bgHover = dark ? colors.mortar : colors.gallery;
  const bgLightPurple = dark
    ? colors.bgDirectCastEmbedDark
    : colors.bgLightPurpleLight;
  const bgLightGreen = dark
    ? colors.bgLightGreenDark
    : colors.bgLightGreenLight;
  const bgLightRed = dark ? colors.bgLightRedDark : colors.bgLightRedLight;
  const bgLightYellow = dark
    ? colors.bgLightYellowDark
    : colors.bgLightYellowLight;
  const bgLightBlue = dark ? colors.bgLightBlueDark : colors.bgLightBlueLight;
  const bgNewLightGray = dark
    ? colors.bgNewLightGrayDark
    : v2.background.secondary;
  const bgNewLightGrayActive = dark ? colors.darkElevated : colors.concrete;
  const bgInformative = v2.background.informative;

  const actionPrimary = colors.venusViolet;
  const actionSecondary = dark ? colors.darkElevated : colors.concrete;
  const actionQuaternary = dark
    ? colors.bgDirectCastEmbedDark
    : colors.actionQuaternaryLight;
  const actionRed = colors.crimson;

  const elevated = dark ? colors.darkElevated : colors.concrete;

  return {
    ...v2,
    ...colors,
    elevated,

    // Actions
    actionPrimary,
    actionSecondary,
    actionQuaternary,
    actionRed,

    // Borders
    borderActionPrimary: colors.venusViolet,
    borderActionDestructive: colors.crimson,
    borderDefault: dark ? colors.mortar : colors.iron,
    borderDesignSystemDefault: dark ? colors.mortar : colors.gallery,
    borderSelectionHighlight: colors.minsk,
    borderHighlight: colors.blueMarguerite,
    borderFaint: dark ? colors.borderFaintDark : colors.gallery,
    borderCastHighlightFollow: dark
      ? colors.borderCastHighlightDark
      : colors.borderCastHighlightLight,

    // Backgrounds
    bgDefault,
    bgHover,
    bgLightPurple,
    bgLightGreen,
    bgLightRed,
    bgLightYellow,
    bgLightBlue,
    bgNewLightGray,
    bgNewLightGrayActive,
    bgInformative,
    bgActionDestructive: colors.crimson,
    bgAction: colors.venusViolet,
    bgActionMuted: convertHexToRGBA(v2.background.default, 0),
    bgActionLight: convertHexToRGBA(colors.purpleDark, 0.45),
    bgCastHighlight: dark
      ? colors.borderCastHighlightDark
      : colors.borderCastHighlightLight,
    bgActionFrameTx: colors.feedActionPurple,
    bgFrameTxLight: convertHexToRGBA(colors.feedActionPurple, 0.15),
    bgCastActionError: dark
      ? colors.bgCastActionErrorDark
      : colors.bgCastActionErrorLight,
    bgButtonInverted: dark
      ? colors.steelGray
      : convertHexToRGBA(colors.concrete, 0.5),
    bgDefaultDark: bgDark,
    bgCodeSnippet: dark ? convertHexToRGBA(v2.black, 0.5) : colors.gallery,
    bgDanger: colors.chestnutRose,
    bgSuccess: colors.christi,
    bgFaint: dark ? colors.bgFaintDark : colors.bgFaintLight,
    bgFaintOld: dark ? colors.steelGray : colors.gallery,
    bgInput: dark ? colors.cinder : v2.white,
    bgInputElevated: dark ? colors.bleachedCedar : colors.gallery,
    bgNotification: colors.crimson,
    bgFrameActionsUnderneath: dark ? colors.bleachedCedar : colors.concrete,
    bgFrameAction: dark ? convertHexToRGBA(v2.white, 0.1) : v2.white,
    bgPillActive: dark
      ? convertHexToRGBA(colors.regentGray, 0.2)
      : colors.concrete,
    bgPillHighlight: dark
      ? convertHexToRGBA(colors.purpleDark, 0.4)
      : convertHexToRGBA(colors.purpleDark, 0.15),
    bgPillTabHighlight: dark
      ? convertHexToRGBA(v2.white, 0.1)
      : convertHexToRGBA(v2.black, 0.07),
    bgPillDanger: dark
      ? convertHexToRGBA(colors.chestnutRose, 0.4)
      : convertHexToRGBA(colors.chestnutRose, 0.15),
    bgTransparent: convertHexToRGBA(bgDefault, 0),
    bgMuted: dark ? colors.blackCurrant : colors.gallery,
    bgRecommendation: dark
      ? convertHexToRGBA(colors.bgRecommendationDark, 1)
      : convertHexToRGBA(v2.gray150, 1),
    bgIconUnderlay: dark
      ? convertHexToRGBA(v2.white, 0.2)
      : convertHexToRGBA(colors.minsk, 0.2),
    bgPromptHandle: dark
      ? convertHexToRGBA(v2.white, 0.2)
      : colors.bgPromptHandleLight,
    bgErrorBubble: dark ? colors.jon : colors.vanillaIce,
    bgSwap: dark ? colors.bgSwapDark : v2.gray100,
    tabViewActiveTint: dark ? v2.white : colors.studio,
    bgElevated: elevated,
    bgButtonPress: colors.bgButtonPress,

    // Direct Casts
    directCasts: {
      bgImagePreview: convertHexToRGBA(v2.black, 0.5),
      bgHighlight: dark
        ? convertHexToRGBA(v2.white, 0.1)
        : convertHexToRGBA(v2.black, 0.5),
      bg: dark ? colors.bgDirectCastDark : v2.gray150,
      bgEmbed: dark
        ? colors.bgDirectCastEmbedDark
        : colors.bgDirectCastEmbedLight,
      bgSelfReply: dark
        ? colors.bgSelfDirectCastReplyDark
        : colors.bgDirectCastEmbedLight,
      bgReply: dark
        ? colors.bgDirectCastEmbedDark
        : colors.bgDirectCastEmbedLight,
      bgSelf: dark ? colors.bgSelfDirectCastDark : colors.bgSelfDirectCastLight,
      bgSelfEmbed: dark
        ? colors.bgSelfDirectCastReplyDark
        : colors.bgDirectCastEmbedLight,
      bgHighlightGray: dark
        ? colors.bgHighlightGrayDark
        : colors.bgHighlightGrayLight,
      textSelfTimestamp: dark
        ? colors.textSelfDirectCastTimestampDark
        : colors.venusViolet,
      textTimestamp: textMuted,
      textSelf: textLight,
      textSelfReplyUsername: dark
        ? v2.white
        : colors.textDirectCastUsernameLight,
      textReplyUsername: dark
        ? colors.textDirectCastReplyUsernameDark
        : colors.textDirectCastUsernameLight,
      textUsername: dark
        ? colors.textDirectCastUsernameDark
        : colors.textDirectCastUsernameLight,
      textLink: dark ? v2.white : colors.venusViolet,
    },

    // Feed
    feed: {
      mutedIcon: colors.textMutedDark,
      muted: dark ? colors.textMutedDark : colors.feedMutedLight,
      actionPurpleMuted: colors.feedActionPurpleMuted,
      actionPurple: colors.feedActionPurple,
      threadLine: dark ? colors.mortar : colors.threadLineLight,
    },

    // UI
    loadingIndicator: dark ? colors.mischka : colors.studio,
    navHeaderTint: dark ? textLight : textDark,
    selection: colors.studio,
    gradients: {
      primaryCard: dark
        ? ['#627EEA26', '#DC1FFF14']
        : ['#627EEA14', '#DC1FFF03'],
    },
  };
};

export const getColorSetV2 = (scheme: 'dark' | 'light'): ColorSet => {
  const v2 = getColors(scheme);
  const dark = scheme === 'dark';

  const colors = {
    // Red shades
    bgCastActionErrorLight: v2.red100,
    vanillaIce: v2.red200,
    bgLightRedLight: v2.red300,
    copperfield: v2.red400,
    chestnutRose: v2.red600,
    crimson: v2.red600,
    jon: v2.red1000,
    bgLightRedDark: v2.red1000,
    bgCastActionErrorDark: v2.red1000,

    // Green shades
    bgLightGreenLight: v2.green100,
    apple: v2.green500,
    actionGreen: v2.green500,
    christi: v2.green600,
    bgLightGreenDark: v2.green1000,

    // Yellow shades
    bgLightYellowLight: v2.yellow100,
    bgLightYellowDark: v2.yellow1000,

    // Blue/Purple shades
    bgLightBlueLight: v2.blue100,
    bgLightPurpleLight: v2.violet100,
    bgDirectCastEmbedLight: v2.violet200,
    bgSelfDirectCastLight: v2.violet100,
    feedActionPurpleMuted: v2.violet200,
    heliotrope: v2.violet600,
    textSelfDirectCastTimestampDark: v2.violet800,
    textDirectCastReplyUsernameDark: v2.violet700,
    textDirectCastUsernameDark: v2.violet700,
    venusViolet: v2.text.brand,
    blueMarguerite: v2.violet500,
    feedActionPurple: v2.violet300,
    textDirectCastUsernameLight: v2.violet700,
    purpleDark: v2.violet600,
    studio: v2.violet600,
    minsk: v2.violet800,
    purpleDarker: v2.violet900,
    bgSelfDirectCastDark: v2.violet600,
    bgSelfDirectCastReplyDark: v2.violet700,
    bgDirectCastEmbedDark: v2.violet400,
    bgDirectCastDark: v2.violet300,
    bgRecommendationDark: v2.violet300,
    bgLightBlueDark: v2.blue1000,

    // Gray shades
    bgFaintLight: v2.gray50,
    borderCastHighlightLight: v2.violet100,
    concrete: v2.gray200,
    gallery: v2.gray150,
    bgHighlightGrayLight: v2.gray200,
    threadLineLight: v2.gray200,
    mischka: v2.gray300,
    iron: v2.gray350,
    bgPromptHandleLight: v2.gray300,
    actionQuaternaryLight: v2.violet100,
    regentGray: v2.text.quaternary,
    textMutedDark: v2.text.secondary,
    textFaintDark: v2.text.tertiary,
    feedMutedLight: v2.gray500,
    bgToastElevated: v2.gray500,
    bgHighlightGrayDark: v2.gray600,
    mortar: v2.gray700,
    borderFaintDark: v2.gray700,
    blackCurrant: v2.gray700,
    darkElevated: v2.gray700,
    bleachedCedar: v2.gray800,
    steelGray: v2.gray800,
    vibrantCedar: v2.gray850,
    bgNewLightGrayDark: v2.gray850,
    bgSwapDark: v2.gray850,
    bgFaintDark: v2.gray900,
    borderCastHighlightDark: v2.gray900,
    cinder: v2.background.default,
  };

  return {
    ...v2,
    ...colors,
    elevated: v2.background.secondary,

    // Actions
    actionPrimary: v2.background.brand,
    actionSecondary: v2.background.tertiary,
    actionQuaternary: v2.background.quaternary,
    actionRed: v2.red500,

    // Borders
    borderActionPrimary: v2.violet500,
    borderActionDestructive: v2.red500,
    borderDefault: v2.border.primary,
    borderDesignSystemDefault: v2.border.primary,
    borderSelectionHighlight: v2.border.highlight,
    borderHighlight: v2.border.highlight,
    borderFaint: v2.border.secondary,
    borderCastHighlightFollow: v2.border.highlight,

    // Backgrounds
    bgDefault: v2.background.default,
    bgHover: v2.background.secondary,
    bgLightPurple: v2.background.brandLight,
    bgLightGreen: v2.green100,
    bgLightRed: v2.red100,
    bgLightYellow: v2.yellow100,
    bgLightBlue: v2.blue100,
    bgNewLightGray: v2.background.secondary,
    bgNewLightGrayActive: v2.background.tertiary,
    bgInformative: v2.background.informative,
    bgActionDestructive: v2.red500,
    bgAction: v2.background.brand,
    bgActionMuted: convertHexToRGBA(v2.background.default, 0),
    bgActionLight: v2.background.brandLight,
    bgCastHighlight: v2.background.secondary,
    bgActionFrameTx: v2.background.brandLight,
    bgFrameTxLight: v2.background.brandLight,
    bgCastActionError: v2.red1000,
    bgButtonInverted: v2.background.secondary,
    bgDefaultDark: v2.background.dark,
    bgCodeSnippet: v2.background.secondary,
    bgDanger: v2.red500,
    bgSuccess: v2.green500,
    bgFaint: v2.background.tertiary,
    bgFaintOld: v2.background.tertiary,
    bgInput: v2.background.default,
    bgInputElevated: v2.background.secondary,
    bgNotification: v2.red600,
    bgFrameActionsUnderneath: v2.background.secondary,
    bgFrameAction: v2.background.secondary,
    bgPillActive: v2.background.brandLight,
    bgPillHighlight: v2.background.brandLight,
    bgPillTabHighlight: v2.background.brandLight,
    bgPillDanger: v2.red500,
    bgTransparent: convertHexToRGBA(v2.background.default, 0),
    bgMuted: v2.background.secondary,
    bgRecommendation: v2.background.secondary,
    bgIconUnderlay: v2.background.secondary,
    bgPromptHandle: v2.gray300,
    bgErrorBubble: v2.red1000,
    bgSwap: v2.background.secondary,
    tabViewActiveTint: dark ? v2.white : v2.background.brand,
    bgElevated: v2.background.secondary,
    bgButtonPress: v2.violet600,

    // Direct Casts
    directCasts: {
      bgImagePreview: convertHexToRGBA(v2.black, 0.5),
      bgHighlight: v2.background.tertiary,
      bg: v2.background.secondary,
      bgEmbed: v2.background.brandLight,
      bgSelfReply: v2.violet400,
      bgReply: v2.violet400,
      bgSelf: v2.background.brandLight,
      bgSelfEmbed: v2.background.brandLight,
      bgHighlightGray: v2.gray400,
      textSelfTimestamp: v2.violet800,
      textTimestamp: v2.text.secondary,
      textSelf: v2.text.light,
      textSelfReplyUsername: v2.text.primary,
      textReplyUsername: v2.violet700,
      textUsername: v2.violet700,
      textLink: v2.text.brand,
    },

    // Feed
    feed: {
      mutedIcon: v2.text.tertiary,
      muted: v2.text.secondary,
      actionPurpleMuted: v2.violet500,
      actionPurple: v2.violet100,
      threadLine: v2.border.tertiary,
    },

    // UI
    loadingIndicator: v2.violet500,
    navHeaderTint: v2.text.primary,
    selection: v2.violet600,

    gradients: {
      primaryCard: dark
        ? ['#627EEA26', '#DC1FFF14']
        : ['#627EEA14', '#DC1FFF03'],
    },
  };
};

export const getHolidayColorSetV2 = (scheme: 'dark' | 'light'): ColorSet => {
  const v2 = getColors(scheme);
  const base = getColorSetV2(scheme);
  const dark = scheme === 'dark';

  // Grinchy yellowish green + strong red accent
  const grinchGreen = dark ? v2.green450 : v2.green450;
  const grinchGreenLight = dark ? v2.green900 : v2.green100;
  const grinchGreenMedium = dark ? v2.green500 : v2.green600;

  const holidayRed = dark ? v2.red500 : v2.red500;
  const holidayRedStrong = dark ? v2.red700 : v2.red700;

  return {
    // start from normal v2 holiday base
    ...base,

    // core palettes
    background: {
      ...base.background,
      // "Grinch green" brand surfaces
      brand: grinchGreen,
      brandLight: grinchGreenLight,
      brandMedium: grinchGreenMedium,
    },

    text: {
      ...base.text,
      // brand text uses the grinch green
      brand: grinchGreen,
    },

    border: {
      ...base.border,
      // use red for focus/brand accents (no more orange/gold)
      highlight: holidayRedStrong,
    },
    borderActionPrimary: grinchGreen,

    // generic action surfaces (buttons, pills, etc.)
    actionPrimary: grinchGreen,
    actionSecondary: grinchGreenLight,
    actionQuaternary: dark ? v2.gray850 : v2.gray200,

    bgAction: grinchGreen,
    bgActionLight: grinchGreenLight,
    bgActionFrameTx: grinchGreenLight,
    bgFrameAction: v2.background.secondary,

    bgPillActive: grinchGreen,
    // red glow instead of orange/yellow
    bgPillHighlight: convertHexToRGBA(holidayRed, dark ? 0.45 : 0.22),
    bgPillTabHighlight: grinchGreenLight,
    bgPillDanger: holidayRedStrong,

    // "snowy" + candy-cane accent
    loadingIndicator: holidayRedStrong,
    selection: convertHexToRGBA(grinchGreen, dark ? 0.6 : 0.33),

    // feed actions now use green + red instead of purple + orange
    feed: {
      ...base.feed,
      actionPurple: grinchGreen,
      actionPurpleMuted: holidayRed,
    },

    directCasts: {
      ...base.directCasts,
      // festive bubbles: green base with red-tinted self reply
      bgSelfReply: convertHexToRGBA(holidayRed, dark ? 0.55 : 0.16),
      bgSelf: grinchGreenLight,
      bgSelfEmbed: convertHexToRGBA(grinchGreen, dark ? 0.45 : 0.16),
    },

    gradients: {
      primaryCard: [holidayRed, grinchGreen],
    },
  };
};

export const getColorSet = (scheme: AppThemeName) => {
  if (scheme === 'holiday-light') {
    return getHolidayColorSetV2('light');
  }
  if (scheme === 'holiday-dark') {
    return getHolidayColorSetV2('dark');
  }
  return getColorSetV2(scheme);
};
