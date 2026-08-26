import {
  type AppThemeName,
  darkSavedThemeNamesSet,
  DEFAULT_SAVED_THEME,
  lightSavedThemeNamesSet,
  type SavedThemeName,
  SUPPORTED_THEME_NAMES,
  systemSavedThemeNamesSet,
} from 'farcaster-expo';
import { useCallback, useEffect, useMemo } from 'react';
import { Appearance, ColorSchemeName, useColorScheme } from 'react-native';
import { useMMKVString } from 'react-native-mmkv';
const USER_SAVED_THEME_KEY = 'userSavedTheme';

export const useUserSavedTheme = () => {
  const [savedTheme = DEFAULT_SAVED_THEME, setSavedTheme] =
    useMMKVString(USER_SAVED_THEME_KEY);
  const setTheme = useCallback(
    (theme: SavedThemeName) => {
      setSavedTheme(theme);
    },
    [setSavedTheme],
  );

  const safeTheme: SavedThemeName | null = useMemo(() => {
    if (SUPPORTED_THEME_NAMES.has(savedTheme as AppThemeName)) {
      return savedTheme as SavedThemeName;
    }
    return DEFAULT_SAVED_THEME;
  }, [savedTheme]);

  return {
    theme: safeTheme,
    setTheme,
  };
};

function getAppThemeName({
  colorScheme,
  savedTheme,
}: {
  colorScheme: ColorSchemeName;
  savedTheme: SavedThemeName | null;
}): AppThemeName {
  if (savedTheme === 'system') {
    return colorScheme === 'unspecified' ? 'dark' : colorScheme;
  }
  if (savedTheme) {
    return savedTheme;
  }
  return 'dark';
}

export const useAppThemeName = () => {
  const colorScheme = useColorScheme();
  const { theme: savedTheme, setTheme } = useUserSavedTheme();
  const currentSavedTheme = SUPPORTED_THEME_NAMES.has(savedTheme)
    ? savedTheme
    : DEFAULT_SAVED_THEME;

  useEffect(() => {
    // We will set the color scheme of the app here
    // Appearance color scheme sets the keyboard, status bar, launch screen after loading
    // If we want to add more color schemes we don't want to have to manually change everything,
    // the Appearance API should handle most of it, we should only be setting the saved theme and going with that
    if (systemSavedThemeNamesSet.has(currentSavedTheme)) {
      Appearance.setColorScheme('unspecified');
    }
    if (lightSavedThemeNamesSet.has(currentSavedTheme)) {
      Appearance.setColorScheme('light');
    }
    if (darkSavedThemeNamesSet.has(currentSavedTheme)) {
      Appearance.setColorScheme('dark');
    }
  }, [currentSavedTheme]);

  const themeName = getAppThemeName({
    colorScheme,
    savedTheme: currentSavedTheme,
  });
  return { themeName, setTheme };
};
