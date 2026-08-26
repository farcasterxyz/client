import * as React from 'react';
import { ColorValue } from 'react-native';
import Svg, { ClipPath, Defs, G, Path } from 'react-native-svg';

export const BellCheckFillIcon = ({
  size,
  color,
}: {
  size: number;
  color: ColorValue;
}) => (
  <Svg width={size} height={size} fill="none" viewBox="0 0 16 16">
    <G clipPath="url(#a)">
      <Path
        fill={color}
        fillRule="evenodd"
        d="M9.323 15.5a2 2 0 0 1-3.308-1.25c-.017-.137.097-.25.235-.25h3.5c.138 0 .252.113.235.25a2 2 0 0 1-.662 1.25ZM4.464 1.464A5 5 0 0 0 3 5v2.947c0 .05-.015.098-.042.139L1.255 10.64A1.516 1.516 0 0 0 2.518 13h10.964a1.52 1.52 0 0 0 1.263-2.359l-1.703-2.555A.252.252 0 0 1 13 7.947V5a5 5 0 0 0-8.536-3.536Zm6.281 4.667a.625.625 0 0 0-.99-.762L7.553 8.23l-.432-.393-.467-.425-.233-.213a.625.625 0 1 0-.842.925l.234.212.467.425.934.85a.625.625 0 0 0 .916-.08l2.615-3.4Z"
        clipRule="evenodd"
      />
    </G>
    <Defs>
      <ClipPath id="a">
        <Path fill="#fff" d="M0 0h16v16H0z" />
      </ClipPath>
    </Defs>
  </Svg>
);
