import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import { useFonts as useFontsExpo } from 'expo-font';
import {
  AppThemeName,
  FONT_FAMILY_BOLD,
  FONT_FAMILY_LIGHT,
  FONT_FAMILY_MEDIUM,
  FONT_FAMILY_REGULAR,
  FONT_FAMILY_SEMI_BOLD,
  FullScreenLoadingIndicator,
  getTheme,
  HEADING_FONT_FAMILY_BOLD,
  HEADING_FONT_FAMILY_LIGHT,
  HEADING_FONT_FAMILY_MEDIUM,
  HEADING_FONT_FAMILY_REGULAR,
  HEADING_FONT_FAMILY_SEMI_BOLD,
  sizes,
  ThemeContext,
  useTheme,
} from 'farcaster-expo';
import React, { FC, memo, ReactNode, useMemo } from 'react';

import { useAppThemeName } from '~/hooks/useAppThemeName';

type ThemeProviderProps = {
  children: ReactNode;
};

const ThemeProvider: FC<ThemeProviderProps> = memo(({ children }) => {
  DdRum.startAction(RumActionType.CUSTOM, 'load_provider', {
    name: 'ThemeProvider',
  });

  const [loaded] = useFontsExpo({
    [FONT_FAMILY_LIGHT]: require('~/assets/fonts/Inter-Light.ttf'),
    [FONT_FAMILY_REGULAR]: require('~/assets/fonts/Inter-Regular.ttf'),
    [FONT_FAMILY_MEDIUM]: require('~/assets/fonts/Inter-Medium.ttf'),
    [FONT_FAMILY_SEMI_BOLD]: require('~/assets/fonts/Inter-SemiBold.ttf'),
    [FONT_FAMILY_BOLD]: require('~/assets/fonts/Inter-Bold.ttf'),
    // Heading fonts
    [HEADING_FONT_FAMILY_LIGHT]: require('~/assets/fonts/SeasonMix-Light.otf'),
    [HEADING_FONT_FAMILY_REGULAR]: require('~/assets/fonts/SeasonMix-Regular.otf'),
    [HEADING_FONT_FAMILY_MEDIUM]: require('~/assets/fonts/SeasonMix-Medium.otf'),
    [HEADING_FONT_FAMILY_SEMI_BOLD]: require('~/assets/fonts/SeasonMix-SemiBold.otf'),
    [HEADING_FONT_FAMILY_BOLD]: require('~/assets/fonts/SeasonMix-Bold.otf'),
  });

  const { themeName } = useAppThemeName();
  const theme = useMemo(() => getTheme(themeName), [themeName]);

  if (!loaded) {
    return <FullScreenLoadingIndicator debugName="ThemeProvider" />;
  }

  DdRum.stopAction(RumActionType.CUSTOM, 'load_provider', {
    name: 'ThemeProvider',
  });

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
});

ThemeProvider.displayName = 'ThemeProvider';

const ForceThemeProvider: FC<{
  children: ReactNode;
  colorScheme?: AppThemeName;
}> = memo(({ children, colorScheme: colorSchemeOverride }) => {
  const { themeName } = useAppThemeName();
  const theme = useMemo(
    () => getTheme(colorSchemeOverride ?? themeName),
    [colorSchemeOverride, themeName],
  );

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
});

ThemeProvider.displayName = 'ThemeProvider';

export { ForceThemeProvider, sizes, ThemeProvider, useTheme };
