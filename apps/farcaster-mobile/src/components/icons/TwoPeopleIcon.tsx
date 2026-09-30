import * as React from 'react';
import { ColorValue } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

export const TwoPeopleIcon = ({
  size,
  color,
}: {
  size: number;
  color: ColorValue;
}) => (
  <Svg width={size} height={size} fill="none" viewBox="0 0 11 11">
    <G stroke={color} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M8.25 9.625a3.667 3.667 0 0 0-7.333 0" />
      <Path d="M4.583 5.958a2.292 2.292 0 1 0 0-4.583 2.292 2.292 0 0 0 0 4.583ZM10.083 9.167c0-1.545-.916-2.98-1.833-3.667a2.292 2.292 0 0 0-.206-3.804" />
    </G>
  </Svg>
);
