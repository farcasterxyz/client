import * as React from 'react';
import { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export const AlertIcon = ({
  size = 24,
  color,
}: {
  size?: number;
  color: ColorValue;
}) => (
  <Svg width={size} height={size} viewBox="0 0 46 46" fill={color}>
    <Path
      d="M22.9998 7.1875C22.2217 7.1875 21.5102 7.84875 21.5623 8.625L22.281 28.0312C22.281 28.2219 22.3567 28.4047 22.4915 28.5395C22.6263 28.6743 22.8091 28.75 22.9998 28.75C23.1904 28.75 23.3732 28.6743 23.508 28.5395C23.6428 28.4047 23.7185 28.2219 23.7185 28.0312L24.4373 8.625C24.4894 7.84875 23.7778 7.1875 22.9998 7.1875Z"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M23 38.8125C23.7939 38.8125 24.4375 38.1689 24.4375 37.375C24.4375 36.5811 23.7939 35.9375 23 35.9375C22.2061 35.9375 21.5625 36.5811 21.5625 37.375C21.5625 38.1689 22.2061 38.8125 23 38.8125Z"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
