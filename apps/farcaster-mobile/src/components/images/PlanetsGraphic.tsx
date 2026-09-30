import React, { FC, useMemo } from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '~/contexts/ThemeProvider';

interface PlanetsGraphicProps {
  style?: ViewStyle;
}

const PlanetsGraphic: FC<PlanetsGraphicProps> = ({ style }) => {
  const t = useTheme();

  const color = useMemo(() => (t.dark ? '#87828F' : '#F0EFF5'), [t.dark]);

  return (
    <View style={[t.wFull, style, { aspectRatio: 369 / 343 }]}>
      <Svg width="100%" height="100%" viewBox="0 0 369 343" fill="none">
        <Circle
          cx="184.989"
          cy="171.501"
          r="70.3343"
          stroke={color}
          strokeWidth="1.92697"
        />
        <Circle
          cx="184.988"
          cy="171.498"
          r="120.435"
          stroke={color}
          strokeWidth="1.92697"
        />
        <Circle
          cx="184.989"
          cy="171.5"
          r="170.537"
          stroke={color}
          strokeWidth="1.92697"
        />
        <Circle cx="303.497" cy="49.137" r="16.3792" fill={color} />
        <Circle cx="106.947" cy="81.8968" r="16.3792" fill={color} />
        <Circle cx="286.154" cy="309.28" r="16.3792" fill={color} />
        <Circle cx="211.003" cy="241.834" r="16.3792" fill={color} />
        <Circle cx="35.6492" cy="247.616" r="16.3792" fill={color} />
      </Svg>
    </View>
  );
};
PlanetsGraphic.displayName = 'PlanetsGraphic';

export { PlanetsGraphic };
