import * as React from 'react';
import { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export const ControlsIcon = ({
  size,
  color,
}: {
  size: number;
  color: ColorValue;
}) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <Path
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M14 2.667H9.333M6.667 2.667H2M14 8H8M5.333 8H2M14 13.333h-3.333M8 13.333H2M9.333 1.333V4M5.333 6.667v2.666M10.667 12v2.667"
    />
  </Svg>
);
