import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from 'farcaster-expo';
import React from 'react';
import { ColorValue } from 'react-native';

const LIGHT_FAB_COLOR = '#6A3CFF';

function PressableGradient() {
  const t = useTheme();

  const colors: [ColorValue, ColorValue] = React.useMemo(
    () =>
      t.dark
        ? [t.colors.gray850, t.colors.gray900]
        : [LIGHT_FAB_COLOR, LIGHT_FAB_COLOR],
    [t.colors.gray850, t.colors.gray900, t.dark],
  );

  const style = React.useMemo(() => {
    return [t.absolute, t.inset0, { borderRadius: 100 }];
  }, [t.absolute, t.inset0]);

  const start = React.useMemo(() => ({ x: 0, y: 0 }), []);

  const end = React.useMemo(() => ({ x: 0, y: 1 }), []);

  return (
    <LinearGradient colors={colors} style={style} start={start} end={end} />
  );
}

function useFabIconColor() {
  const t = useTheme();
  return t.dark ? t.colors.text.primary : '#ffffff';
}

export { LIGHT_FAB_COLOR, PressableGradient, useFabIconColor };
