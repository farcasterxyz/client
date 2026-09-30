const prefersDark = '&.dark, .dark &';

const neutrals = {
  light: {
    white: '#ffffff',
    black: '#121212',
  },
  dark: {
    white: '#ffffff',
    black: '#101010',
  },
};

const gray = {
  light: {
    gray0: '#ffffff',
    gray50: '#fafafa',
    gray100: '#f9f9f9',
    gray150: '#f5f5f5',
    gray200: '#f2f2f2',
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
};

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
};

const red = {
  light: {
    red100: '#fff5f5',
    red200: '#ffe2e0',
    red300: '#ffc7c2',
    red400: '#ffafa3',
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
    red500: '#e03e1a',
    red600: '#c4381c',
    red700: '#963323',
    red800: '#7c2622',
    red900: '#54211c',
    red1000: '#311817',
  },
};

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
};

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
};

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
};

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
};

const background = {
  light: {
    default: neutrals.light.white,
    primary: neutrals.light.white,
    secondary: gray.light.gray200,
    tertiary: gray.light.gray300,
    quaternary: gray.light.gray50,
    brand: violet.light.violet500,
    brandLight: violet.light.violet200,
    brandMedium: violet.light.violet400,
    brandDisabled: violet.light.violet700,
    danger: red.light.red100,
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
    brandDisabled: violet.dark.violet200,
    danger: red.dark.red1000,
    warning: yellow.dark.yellow1000,
    success: green.dark.green1000,
    light: neutrals.dark.white,
    dark: neutrals.dark.black,
    inverted: neutrals.dark.black,
    informative: blue.dark.blue1000,
    overlay: '#000000BF',
    translucent: '#0000001A',
  },
};

const border = {
  light: {
    primary: gray.light.gray150,
    secondary: gray.light.gray200,
    tertiary: gray.light.gray300,
    highlight: violet.light.violet900,
    background: neutrals.light.white,
    danger: red.light.red600,
  },
  dark: {
    primary: gray.dark.gray800,
    secondary: gray.dark.gray700,
    tertiary: gray.dark.gray600,
    highlight: violet.dark.violet900,
    background: neutrals.dark.black,
    danger: red.dark.red500,
  },
};

const text = {
  light: {
    primary: neutrals.light.black,
    secondary: gray.light.gray500,
    tertiary: gray.light.gray350,
    quaternary: gray.light.gray450,
    brand: violet.light.violet500,
    brandLight: violet.light.violet200,
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
    brandLight: violet.dark.violet200,
    danger: red.dark.red500,
    warning: yellow.dark.yellow400,
    success: green.dark.green450,
    informative: blue.dark.blue500,
    light: neutrals.dark.white,
    dark: neutrals.dark.black,
    inverted: neutrals.dark.black,
    white: neutrals.dark.white,
  },
};

const bgColor = ({ name, light, dark, lightHover, darkHover }) => ({
  [`.bg-${name}`]: {
    'background-color': light,
    ...(lightHover && {
      '&:hover': {
        backgroundColor: lightHover,
      },
    }),
    [prefersDark]: {
      'background-color': dark,
      ...(darkHover && {
        '&:hover': {
          backgroundColor: darkHover,
        },
      }),
    },
  },
});

const textColor = ({ name, light, dark }) => ({
  [`.text-${name}`]: {
    color: light,
    [prefersDark]: {
      color: dark,
    },
  },
});

const fillColor = ({ name, light, dark }) => ({
  [`.fill-${name}`]: {
    fill: light,
    [prefersDark]: {
      fill: dark,
    },
  },
});

const strokeColor = ({ name, light, dark }) => ({
  [`.stroke-${name}`]: {
    stroke: light,
    [prefersDark]: {
      stroke: dark,
    },
  },
});

const borderColor = ({ name, light, dark }) => ({
  [`.border-${name}`]: {
    'border-color': light,
    [prefersDark]: {
      'border-color': dark,
    },
  },
});

const fromColor = ({ name, light, dark }) => ({
  [`.from-${name}`]: {
    '--tw-gradient-from': light,
    '--tw-gradient-stops': `var(--tw-gradient-from), var(--tw-gradient-to)`,
    [prefersDark]: {
      '--tw-gradient-from': dark,
    },
  },
});

const toColor = ({ name, light, dark }) => ({
  [`.to-${name}`]: {
    '--tw-gradient-to': light,
    '--tw-gradient-stops': `var(--tw-gradient-from), var(--tw-gradient-to)`,
    [prefersDark]: {
      '--tw-gradient-to': dark,
    },
  },
});

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    // Be careful updating the config here!
    // You probably want to just "extend:" the config below and not override
    // whole default Tailwind utility classes config.
    fontFamily: {
      sans: ['Inter'],
      seasonMix: ['SeasonMix', 'sans-serif'],
    },
    letterSpacing: {
      tightest: '-.075em',
      tighter: '-.05em',
      tight: '-.025em',
      normal: '-0.09px',
      wide: '.025em',
      wider: '.05em',
      widest: '.25em',
    },
    screens: {
      sm: '640px',
      md: '768px',
      // This is really for increasing the available content for users as much as possible.
      // Inspired by other social sites where they are able to show more before cutting to md
      // sizing right away.
      mdlg: '1002px',
      lg: '1024px',
      xl: '1280px',
      dcxl: '1400px',
      '2xl': '1536px',
    },
    extend: {
      aspectRatio: {
        opengraph: '1.91 / 1',
      },
      fontSize: {
        md: '0.933rem',
      },
      keyframes: {
        contentShow: {
          from: {
            opacity: '0',
            transform: 'translate(-50%, -48%) scale(0.96)',
          },
          to: {
            opacity: '1',
            transform: 'translate(-50%, -50%) scale(1)',
          },
        },
        frameActionDialogShow: {
          from: {
            opacity: '0',
            transform: 'translate(0px, 16px) scale(0.96)',
          },
          to: {
            opacity: '1',
            transform: 'translate(0px, 0px) scale(1)',
          },
        },
        overlayShow: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'content-show': 'contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        'frame-action-content-show':
          'frameActionDialogShow 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        'overlay-show': 'overlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
      colors: {
        ['action-green']: {
          light: text.light.success,
          dark: text.dark.success,
        },
        ['action-blue']: {
          light: text.light.informative,
          dark: text.dark.informative,
        },
        ['action-red']: {
          light: text.light.danger,
          dark: text.dark.danger,
        },
        ['action-purple']: {
          light: text.light.brand,
          dark: text.dark.brand,
        },
        ['action-brown']: '#b78a6a',
        ['action-yellow']: {
          light: text.light.warning,
          dark: text.dark.warning,
        },
        ['light-app-background']: {
          light: background.light.default,
          dark: background.dark.light,
        },
        ['dark-app-background']: {
          light: background.light.dark,
          dark: background.dark.default,
        },
        app: {
          light: background.light.default,
          dark: background.dark.default,
        },
        muted: {
          light: background.light.tertiary,
          dark: background.dark.tertiary,
        },
        ['border-gray']: {
          light: '#d0d1d259',
          dark: '#4c3a4ec0',
        },
        // Map shadcn semantic tokens to your existing system
        background: {
          DEFAULT: 'var(--bg-app)',
        },
        foreground: {
          DEFAULT: 'var(--text-default)',
        },
        card: {
          DEFAULT: 'var(--bg-app)',
          foreground: 'var(--text-default)',
        },
        popover: {
          DEFAULT: 'var(--bg-app)',
          foreground: 'var(--text-default)',
        },
        primary: {
          DEFAULT: 'var(--bg-action-primary)',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: 'var(--bg-action-secondary)',
          foreground: 'var(--text-default)',
        },
        muted: {
          DEFAULT: 'var(--bg-muted)',
          foreground: 'var(--text-muted)',
        },
        accent: {
          DEFAULT: 'var(--bg-elevated)',
          foreground: 'var(--text-default)',
        },
        destructive: {
          DEFAULT: 'var(--bg-action-danger)',
          foreground: '#ffffff',
        },
        border: 'var(--border-default)',
        input: 'var(--border-default)',
        ring: 'var(--bg-action-primary)',
      },
    },
  },
  plugins: [
    addVariablesForColors,
    ({ addUtilities }) => {
      addUtilities({
        '.fade-in': {
          animation: 'fadeInAnimation ease 150ms',
        },

        '.fade-in-slower': {
          animation: 'fadeInAnimation ease-in 300ms',
        },

        // Hover z-index: to be used sparingly to get some prefetching or link clicks
        '.subtle-hover-z': {
          zIndex: 5,
        },

        // Text break-all
        '.break-gracefully': {
          overflowWrap: 'anywhere',
        },

        '.w-inherit': {
          width: 'inherit',
        },

        // Tailwind v4 changed bare `border*` / `divide*` utilities to default to
        // currentColor. The app historically treated those classes as subtle
        // structural separators, so we restore that meaning here and reserve
        // explicit color utilities for intentional overrides.
        '.border': {
          'border-color': border.light.primary,
          [prefersDark]: {
            'border-color': border.dark.primary,
          },
        },
        '.border-x': {
          'border-color': border.light.primary,
          [prefersDark]: {
            'border-color': border.dark.primary,
          },
        },
        '.border-y': {
          'border-color': border.light.primary,
          [prefersDark]: {
            'border-color': border.dark.primary,
          },
        },
        '.border-t': {
          'border-color': border.light.primary,
          [prefersDark]: {
            'border-color': border.dark.primary,
          },
        },
        '.border-r': {
          'border-color': border.light.primary,
          [prefersDark]: {
            'border-color': border.dark.primary,
          },
        },
        '.border-b': {
          'border-color': border.light.primary,
          [prefersDark]: {
            'border-color': border.dark.primary,
          },
        },
        '.border-l': {
          'border-color': border.light.primary,
          [prefersDark]: {
            'border-color': border.dark.primary,
          },
        },
        '.divide-x > :not([hidden]) ~ :not([hidden])': {
          'border-color': border.light.primary,
          [prefersDark]: {
            'border-color': border.dark.primary,
          },
        },
        '.divide-y > :not([hidden]) ~ :not([hidden])': {
          'border-color': border.light.primary,
          [prefersDark]: {
            'border-color': border.dark.primary,
          },
        },

        // Background colors
        // New design system
        ...bgColor({
          name: 'primary',
          light: background.light.primary,
          dark: background.dark.primary,
        }),
        ...bgColor({
          name: 'secondary',
          light: background.light.secondary,
          dark: background.dark.secondary,
        }),
        ...bgColor({
          name: 'surface-secondary',
          light: background.light.secondary,
          dark: background.dark.secondary,
        }),
        ...bgColor({
          name: 'tertiary',
          light: background.light.tertiary,
          dark: background.dark.tertiary,
        }),
        ...bgColor({
          name: 'quaternary',
          light: background.light.quaternary,
          dark: background.dark.quaternary,
        }),
        ...bgColor({
          name: 'brand',
          light: background.light.brand,
          dark: background.dark.brand,
        }),
        ...bgColor({
          name: 'brand-light',
          light: background.light.brandLight,
          dark: background.dark.brandLight,
        }),
        ...bgColor({
          name: 'brand-medium',
          light: background.light.brandMedium,
          dark: background.dark.brandMedium,
        }),
        ...bgColor({
          name: 'warning',
          light: background.light.warning,
          dark: background.dark.warning,
        }),
        ...bgColor({
          name: 'informative',
          light: background.light.informative,
          dark: background.dark.informative,
        }),
        ...bgColor({
          name: 'danger',
          light: background.light.danger,
          dark: background.dark.danger,
        }),
        ...bgColor({
          name: 'success',
          light: background.light.success,
          dark: background.dark.success,
        }),
        ...bgColor({
          name: 'light',
          light: background.light.light,
          dark: background.dark.light,
        }),
        ...bgColor({
          name: 'dark',
          light: background.light.dark,
          dark: background.dark.dark,
        }),
        ...bgColor({
          name: 'inverted',
          light: background.light.inverted,
          dark: background.dark.inverted,
        }),
        ...bgColor({
          name: 'action-primary',
          light: text.light.brand,
          dark: text.dark.brand,
          lightHover: violet.light.violet700,
          darkHover: violet.dark.violet300,
        }),
        ...bgColor({
          name: 'action-primary-disabled',
          // 50% opactity of action on background color
          light: background.light.brandDisabled,
          dark: background.dark.brandDisabled,
        }),
        ...bgColor({
          name: 'action-tertiary',
          light: background.light.tertiary,
          dark: background.dark.tertiary,
        }),
        ...bgColor({
          name: 'action-tertiary-hover',
          light: border.light.tertiary,
          dark: border.dark.tertiary,
        }),
        ...bgColor({
          name: 'elevated-nohover',
          light: '#f3f3f3',
          dark: '#342942',
        }),
        ...bgColor({
          name: 'elevated',
          light: '#f3f3f3',
          dark: '#342942',
          lightHover: '#e0e0e0',
          darkHover: '#4a3a5b',
        }),
        ...bgColor({
          name: 'hover',
          light: '#EFEFEF',
          dark: '#4c3a4e',
        }),
        ...bgColor({
          name: 'notification-purple',
          // These used to be action-purple/30
          light: text.light.brand,
          dark: text.dark.brand,
        }),
        ...bgColor({
          name: 'notification-blue',
          // These used to be action-blue/30
          light: background.light.informative,
          dark: background.dark.informative,
        }),
        ...bgColor({
          name: 'notification-brown',
          // These used to be action-brown/30
          light: text.light.brown,
          dark: text.dark.brown,
        }),
        ...bgColor({
          name: 'notification-red',
          // These used to be action-red/30
          light: background.light.danger,
          dark: background.dark.danger,
        }),
        ...bgColor({
          name: 'notification-green',
          // These used to be action-green/30
          light: background.light.success,
          dark: background.dark.success,
        }),
        ...bgColor({
          name: 'light-purple',
          light: background.light.brandLight,
          dark: background.dark.brandLight,
        }),
        ...bgColor({
          name: 'swap',
          light: background.light.secondary,
          dark: background.dark.secondary,
        }),
        // End new design system
        ...bgColor({
          name: 'app',
          light: background.light.default,
          dark: background.dark.default,
        }),
        ...bgColor({
          name: 'light',
          light: background.light.light,
          dark: background.dark.light,
        }),
        ...bgColor({
          name: 'faint',
          light: border.light.tertiary,
          dark: border.dark.tertiary,
        }),
        ...bgColor({
          name: 'muted',
          light: text.light.secondary,
          dark: text.dark.secondary,
        }),
        ...bgColor({
          name: 'overlay',
          light: '#00000066',
          dark: '#00000099',
        }),
        ...bgColor({
          name: 'overlay-medium',
          light: '#d1d5db66',
          dark: '#7C65C166',
        }),
        ...bgColor({
          name: 'overlay-faint',
          light: '#00000004',
          dark: '#ffffff04',
        }),
        ...bgColor({
          name: 'overlay-light',
          light: '#00000009',
          dark: '#ffffff09',
        }),
        ...bgColor({
          name: 'highlight-gray',
          light: '#e2e2e2',
          dark: '#524C55',
        }),
        ...bgColor({
          name: 'overlay-semi-medium',
          light: '#edeef1',
          dark: '#241b33',
        }),
        ...bgColor({
          name: 'overlay-heavy',
          light: '#0f1419bf',
          dark: '#0f1419bf',
        }),
        ...bgColor({
          name: 'overlay-strong',
          light: '#ffffffe6',
          dark: '#1f162ae6',
        }),
        ...bgColor({
          name: 'action',
          light: background.light.brand,
          dark: background.dark.brand,
          lightHover: background.light.brandLight,
          darkHover: background.dark.brandLight,
        }),
        ...bgColor({
          name: 'action-muted',
          light: background.light.default,
          dark: background.dark.default,
          lightHover: border.light.tertiary,
          darkHover: border.dark.tertiary,
        }),
        ...bgColor({
          name: 'action-inverted',
          light: '#d1d5db66',
          dark: '#7C65C166',
          lightHover: '#d0d1d2d0',
          darkHover: '#7C65C1b0',
        }),
        ...bgColor({
          name: 'action-secondary',
          light: background.light.secondary,
          dark: background.dark.secondary,
          lightHover: border.light.tertiary,
          darkHover: border.dark.tertiary,
        }),
        ...bgColor({
          name: 'action-danger',
          light: text.light.danger,
          dark: text.dark.danger,
          lightHover: red.light.red700,
          darkHover: red.dark.red700,
        }),
        ...bgColor({
          name: 'input',
          light: background.light.default,
          dark: background.dark.default,
        }),
        ...bgColor({
          name: 'dc-input',
          light: background.light.secondary,
          dark: background.dark.secondary,
        }),
        ...bgColor({
          name: 'highlight',
          light: background.light.brand,
          dark: background.dark.brand,
        }),
        ...bgColor({
          name: 'active-badge',
          light: background.light.brand,
          dark: background.dark.brand,
        }),
        ...bgColor({
          name: 'toggle-inactive',
          light: '#d0d1d259',
          dark: '#4c3a4ec0',
        }),
        ...bgColor({
          name: 'cast-action-toast',
          light: '#ffffff',
          dark: '#292034',
        }),
        ...bgColor({
          name: 'cast-action-error-toast',
          light: '#fdf6f6',
          dark: '#322235',
        }),
        ...bgColor({
          name: 'pill-active',
          light: background.light.tertiary,
          dark: background.dark.brandLight,
        }),
        ...bgColor({
          name: 'pill-inactive',
          light: background.light.secondary,
          dark: background.dark.secondary,
        }),
        // Border colors
        // New design system
        ...borderColor({
          name: 'action-primary-active',
          light: '#0000004D',
          dark: '#FFFFFF4D',
        }),
        ...borderColor({
          name: 'action-tertiary',
          light: border.light.tertiary,
          dark: border.dark.tertiary,
        }),
        ...borderColor({
          name: 'action-tertiary-hover',
          light: '#E4E5E5',
          dark: '#49384B',
        }),
        ...borderColor({
          name: 'action-tertiary-active',
          light: '#B2B2B2',
          dark: '#5D5862',
        }),
        // End new design system
        ...borderColor({
          name: 'primary',
          light: border.light.primary,
          dark: border.dark.primary,
        }),
        ...borderColor({
          name: 'secondary',
          light: border.light.secondary,
          dark: border.dark.secondary,
        }),
        ...borderColor({
          name: 'surface-secondary',
          light: border.light.secondary,
          dark: border.dark.secondary,
        }),
        ...borderColor({
          name: 'tertiary',
          light: border.light.tertiary,
          dark: border.dark.tertiary,
        }),
        // Use primary instead
        ...borderColor({
          name: 'default',
          light: border.light.primary,
          dark: border.dark.primary,
        }),
        ...borderColor({
          name: 'highlight',
          light: border.light.highlight,
          dark: border.dark.highlight,
        }),
        ...borderColor({
          name: 'faint',
          light: border.light.tertiary,
          dark: border.dark.tertiary,
        }),
        ...borderColor({
          name: 'verified',
          light: border.light.highlight,
          dark: border.dark.highlight,
        }),
        ...borderColor({
          name: 'focused-search',
          light: border.light.highlight,
          dark: border.dark.highlight,
        }),
        ...borderColor({
          name: 'app',
          light: border.light.primary,
          dark: border.dark.primary,
        }),
        ...borderColor({
          name: 'muted',
          light: border.light.secondary,
          dark: border.dark.secondary,
        }),
        ...borderColor({
          name: 'danger',
          light: border.light.danger,
          dark: border.dark.danger,
        }),
        ...borderColor({
          name: 'brand-light',
          light: background.light.brandLight,
          dark: background.dark.brandLight,
        }),
        // Text colors
        // New design system
        ...textColor({
          name: 'primary',
          light: text.light.primary,
          dark: text.dark.primary,
        }),
        ...textColor({
          name: 'secondary',
          light: text.light.secondary,
          dark: text.dark.secondary,
        }),
        ...textColor({
          name: 'tertiary',
          light: text.light.tertiary,
          dark: text.dark.tertiary,
        }),
        ...textColor({
          name: 'quaternary',
          light: text.light.quaternary,
          dark: text.dark.quaternary,
        }),
        ...textColor({
          name: 'brand',
          light: text.light.brand,
          dark: text.dark.brand,
        }),
        ...textColor({
          name: 'brand-light',
          light: text.light.brandLight,
          dark: text.dark.brandLight,
        }),
        ...textColor({
          name: 'brand-medium',
          light: text.light.brandMedium,
          dark: text.dark.brandMedium,
        }),
        ...textColor({
          name: 'warning',
          light: text.light.warning,
          dark: text.dark.warning,
        }),
        ...textColor({
          name: 'danger',
          light: text.light.danger,
          dark: text.dark.danger,
        }),
        ...textColor({
          name: 'success',
          light: text.light.success,
          dark: text.dark.success,
        }),
        ...textColor({
          name: 'informative',
          light: text.light.informative,
          dark: text.dark.informative,
        }),
        ...textColor({
          name: 'action-primary-disabled',
          light: '#DED9EF',
          dark: '#6A6180',
        }),
        ...textColor({
          name: 'action-tertiary-disabled',
          // 50% opacity
          light: '#00000077',
          dark: '#ffffff77',
        }),
        // End new design system
        ...textColor({
          name: 'default',
          light: text.light.primary,
          dark: text.dark.primary,
        }),
        ...textColor({
          name: 'inverted',
          light: text.light.inverted,
          dark: text.dark.inverted,
        }),
        ...textColor({
          name: 'light',
          light: text.light.light,
          dark: text.dark.light,
        }),
        ...textColor({
          name: 'dark',
          light: text.light.dark,
          dark: text.dark.dark,
        }),
        ...textColor({
          name: 'muted',
          light: text.light.secondary,
          dark: text.dark.secondary,
        }),
        ...textColor({
          name: 'faint',
          light: text.light.tertiary,
          dark: text.dark.tertiary,
        }),
        ...textColor({
          name: 'link',
          light: text.light.brand,
          dark: text.dark.brand,
        }),
        ...textColor({
          name: 'warning',
          light: text.light.warning,
          dark: text.dark.warning,
        }),
        ...textColor({
          name: 'success',
          light: text.light.success,
          dark: text.dark.success,
        }),
        ...textColor({
          name: 'informative',
          light: text.light.informative,
          dark: text.dark.informative,
        }),
        ...textColor({
          name: 'verified',
          light: text.light.brandLight,
          dark: text.dark.brandLight,
        }),
        ...textColor({
          name: 'focused-search-icon',
          light: '#8565CB',
          dark: '#8565CB',
        }),
        ...textColor({
          name: 'active-badge',
          light: text.light.inverted,
          dark: text.dark.inverted,
        }),
        ...textColor({
          name: 'degen-hat-band',
          light: text.light.inverted,
          dark: text.dark.inverted,
        }),
        ...textColor({
          name: 'pill-active',
          light: text.light.brand,
          dark: text.dark.white,
        }),
        ...textColor({
          name: 'pill-inactive',
          light: text.light.secondary,
          dark: text.dark.secondary,
        }),
        ...textColor({
          name: 'action-purple',
          light: text.light.brand,
          dark: text.dark.brand,
        }),
        // Direct casts styles
        ...bgColor({
          name: 'unread-direct-cast',
          light: `${background.light.tertiary}80`,
          dark: `${background.dark.tertiary}80`,
        }),
        ...bgColor({
          name: 'direct-cast',
          light: background.light.secondary,
          dark: background.dark.secondary,
        }),
        ...bgColor({
          name: 'self-direct-cast',
          light: background.light.brandLight,
          dark: background.dark.brandLight,
        }),
        ...bgColor({
          name: 'direct-cast-embed',
          light: background.light.secondary,
          dark: background.dark.secondary,
        }),
        ...bgColor({
          name: 'self-direct-cast-embed',
          light: background.light.secondary,
          dark: background.dark.secondary,
        }),
        ...bgColor({
          name: 'direct-cast-channel-tag',
          light: '#E9E7F9',
          dark: '#473962',
        }),
        ...bgColor({
          name: 'self-reply-direct-cast',
          light: background.light.brandMedium,
          dark: background.dark.brandMedium,
        }),
        ...bgColor({
          name: 'reply-direct-cast',
          light: background.light.brandMedium,
          dark: background.dark.brandMedium,
        }),
        ...bgColor({
          name: 'reply-direct-cast-left-wrapper',
          light: '#7C65C1',
          dark: '#8F7BCC',
        }),
        ...textColor({
          name: 'self-direct-casts-timestamp',
          light: '#7C65C1',
          dark: text.dark.brand,
        }),
        ...textColor({
          name: 'direct-casts-timestamp',
          light: '#546473',
          dark: text.dark.brand,
        }),
        ...textColor({
          name: 'direct-casts-link',
          light: text.light.brand,
          dark: text.dark.light,
        }),
        ...textColor({
          name: 'direct-casts-username',
          light: text.light.brand,
          dark: text.dark.brand,
        }),
        ...fillColor({
          name: 'self-direct-casts-checkmark',
          light: text.light.brand,
          dark: text.dark.brand,
        }),
        ...strokeColor({
          name: 'self-direct-casts-checkmark',
          light: text.light.brand,
          dark: text.dark.brand,
        }),
        ...fillColor({
          name: 'inbox-direct-casts-checkmark',
          light: '#9FA3AF',
          dark: text.dark.brand,
        }),
        ...strokeColor({
          name: 'inbox-direct-casts-checkmark',
          light: '#9FA3AF',
          dark: text.dark.brand,
        }),
        // Charts
        ...strokeColor({
          name: 'border',
          light: '#d0d1d259',
          dark: '#4c3a4ec0',
        }),
        ...strokeColor({
          name: 'starter-pack-icon',
          light: text.light.primary,
          dark: text.dark.primary,
        }),
        // Icons
        ...fillColor({
          name: 'farcaster-pro-badge',
          light: background.light.brand,
          dark: background.dark.brand,
        }),
        ...fillColor({
          name: 'brand',
          light: text.light.brand,
          dark: text.dark.brand,
        }),
        ...fillColor({
          name: 'brand-light',
          light: text.light.brandLight,
          dark: text.dark.brandLight,
        }),
        ...fillColor({
          name: 'brand-medium',
          light: text.light.brandMedium,
          dark: text.dark.brandMedium,
        }),
        ...fillColor({
          name: 'secondary',
          light: text.light.secondary,
          dark: text.dark.secondary,
        }),
        ...fillColor({
          name: 'tertiary',
          light: text.light.tertiary,
          dark: text.dark.tertiary,
        }),
        ...fillColor({
          name: 'informative',
          light: text.light.informative,
          dark: text.dark.informative,
        }),
        ...fillColor({
          name: 'danger',
          light: text.light.danger,
          dark: text.dark.danger,
        }),
        ...fillColor({
          name: 'warning',
          light: text.light.warning,
          dark: text.dark.warning,
        }),
        ...fillColor({
          name: 'success',
          light: text.light.success,
          dark: text.dark.success,
        }),
        ...fromColor({
          name: 'brand-light',
          light: background.light.brandLight,
          dark: background.dark.brandLight,
        }),
        ...fromColor({
          name: 'primary',
          light: background.light.default,
          dark: background.dark.default,
        }),
        ...toColor({
          name: 'brand-light',
          light: background.light.brandLight,
          dark: background.dark.brandLight,
        }),
        ...toColor({
          name: 'primary',
          light: background.light.default,
          dark: background.dark.default,
        }),
      });
    },
  ],
};

function addVariablesForColors({ addBase, theme }) {
  let allColors = flattenThemeColors(theme('colors'));
  let newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val]),
  );

  addBase({
    ':root': newVars,
  });
}

function flattenThemeColors(colors, prefix = '') {
  const flattened = {};

  for (const [key, value] of Object.entries(colors ?? {})) {
    const colorKey =
      key === 'DEFAULT' ? prefix : [prefix, key].filter(Boolean).join('-');

    if (typeof value === 'string') {
      if (colorKey) {
        flattened[colorKey] = value;
      }
      continue;
    }

    if (value && typeof value === 'object') {
      Object.assign(flattened, flattenThemeColors(value, colorKey));
    }
  }

  return flattened;
}
