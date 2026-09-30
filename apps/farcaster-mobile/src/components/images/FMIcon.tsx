import React, { FC, memo } from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { sizes } from '~/contexts/ThemeProvider';

type FMIconProps = {
  color: string;
  width: number;
  height: number;
  style?: ViewStyle[];
};

const FMIcon: FC<FMIconProps> = memo(({ color, width, height, style }) => {
  return (
    <View style={[style, { marginBottom: -sizes.s1 }]}>
      <Svg width={width} height={height} viewBox="0 0 18 18" fill={color}>
        <Path d="M0 10.5625V4H5.5V5.4H1.5V6.8H5.5V8.2H1.5V10.5625H0Z" />
        <Path d="M6.20938 4H8.49375L10.0651 7.71704H10.1443L11.7156 4H14V10.5625H12.2042V6.76855H12.1514L10.6461 10.5112H9.56331L8.05801 6.74292H8.00519V10.5625H6.20938V4Z" />
      </Svg>
    </View>
  );
});

FMIcon.displayName = 'FMIcon';

export { FMIcon };
