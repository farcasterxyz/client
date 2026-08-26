import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useMemo } from 'react';

import { useTheme } from '~/contexts/ThemeProvider';

const useDefaultStackScreenOptions = (): NativeStackNavigationOptions => {
  const t = useTheme();

  return useMemo(
    () => ({
      headerBackButtonDisplayMode: 'minimal',
      headerBackTitle: '⠀', // U+2800 char to avoid trim() making empty
      headerBackButtonMenuEnabled: false,
      headerShadowVisible: false,
      headerTintColor: t.colors.navHeaderTint,
      gestureEnabled: true,
      animation: 'simple_push',
      animationDuration: 150,
      fullScreenGestureEnabled: true,
    }),
    [t.colors.navHeaderTint],
  );
};

export { useDefaultStackScreenOptions };
