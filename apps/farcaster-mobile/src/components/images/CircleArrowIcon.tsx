import * as React from 'react';
import { ColorValue } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

export const CircleArrowIcon = ({
  size,
  color,
}: {
  size: number;
  color: ColorValue;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 25" fill="none">
    <G fill={color}>
      <Path d="M12 2.83a9.5 9.5 0 1 0 0 19 .75.75 0 1 1 0 1.5c-6.075 0-11-4.926-11-11 0-6.076 4.925-11 11-11s11 4.924 11 11a.75.75 0 1 1-1.5 0 9.5 9.5 0 0 0-9.5-9.5Z" />
      <Path d="m22.898 17.81-3.728 3.313a.308.308 0 0 1-.513-.23V18.33h-4.25a.75.75 0 1 1 0-1.5h4.25v-2.564a.307.307 0 0 1 .513-.23l3.727 3.314a.307.307 0 0 1 .076.356.304.304 0 0 1-.075.104Z" />
    </G>
  </Svg>
);
