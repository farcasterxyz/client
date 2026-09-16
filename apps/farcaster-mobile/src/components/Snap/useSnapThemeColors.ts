import { type SnapNativeColors } from '@farcaster/snap/react-native';
import { convertHexToRGBA } from 'farcaster-expo';
import { useMemo } from 'react';

import { useTheme } from '~/contexts/ThemeProvider';

export function useSnapThemeColors() {
  const t = useTheme();

  const appearance: 'light' | 'dark' = t.dark ? 'dark' : 'light';

  const colors: SnapNativeColors = useMemo(
    () => ({
      bg: t.colors.background.default,
      surface: t.colors.background.secondary,
      text: t.colors.text.primary,
      textSecondary: t.colors.text.secondary,
      border: t.colors.border.primary,
      inputBg: t.colors.bgInput,
      muted: t.colors.bgMuted,
      mutedSubtle: t.dark
        ? convertHexToRGBA(t.colors.white, 0.02)
        : convertHexToRGBA(t.colors.black, 0.06),
      mutedHover: t.dark
        ? convertHexToRGBA(t.colors.white, 0.04)
        : convertHexToRGBA(t.colors.black, 0.1),
      mutedSelected: t.dark
        ? convertHexToRGBA(t.colors.white, 0.1)
        : convertHexToRGBA(t.colors.black, 0.18),
    }),
    [t],
  );

  return { appearance, colors };
}
