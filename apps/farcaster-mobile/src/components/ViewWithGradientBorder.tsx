import { LinearGradient } from 'expo-linear-gradient';
import React, { FC } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { easeGradient } from 'react-native-easing-gradient';

import { useTheme } from '~/contexts/ThemeProvider';

interface ViewWithGradientBorderProps {
  outerStyle?: StyleProp<ViewStyle>;
  innerStyle?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

const ViewWithGradientBorder: FC<ViewWithGradientBorderProps> = ({
  outerStyle,
  innerStyle,
  children,
}) => {
  const t = useTheme();

  const { colors, locations } = easeGradient({
    colorStops: {
      0: {
        color: '#DEAEEB',
      },
      0.44: {
        color: '#6944BA',
      },
      1: {
        color: '#ACB0ED',
      },
    },
  });

  return (
    <LinearGradient
      colors={colors as unknown as [string, string, ...string[]]}
      locations={locations as unknown as [number, number, ...number[]]}
      style={[{ borderRadius: 12, padding: 2 }, outerStyle]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      <View style={[t.bgDefault, { borderRadius: 10 }, innerStyle]}>
        {children}
      </View>
    </LinearGradient>
  );
};

ViewWithGradientBorder.displayName = 'ViewWithGradientBorder';

export { ViewWithGradientBorder };
