import * as React from 'react';
import { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export const PersonXIcon = ({
  size,
  color,
}: {
  size: number;
  color: ColorValue;
}) => (
  <Svg width={size} height={size} fill="none" viewBox="0 0 20 20">
    <Path
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M1.667 17.5a6.666 6.666 0 0 1 9.894-5.833"
    />
    <Path
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M8.333 10.833a4.167 4.167 0 1 0 0-8.333 4.167 4.167 0 0 0 0 8.333ZM14.167 14.167l4.166 4.166M18.333 14.167l-4.166 4.166"
    />
  </Svg>
);
