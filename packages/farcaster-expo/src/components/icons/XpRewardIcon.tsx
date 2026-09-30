import * as React from 'react';
import { Path, Svg } from 'react-native-svg';

export function XpRewardIcon({
  size,
  outlineColor,
  color,
  foregroundColor = 'white',
  bold = false,
}: {
  size: number;
  outlineColor?: string;
  color?: string;
  foregroundColor?: string;
  bold?: boolean;
}) {
  const strokeWidth = bold ? 1.5 : 1;
  return (
    <Svg height={size} width={size} viewBox="0 0 24 25" fill={color}>
      <Path
        d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
        fill={color}
        stroke={outlineColor ?? color}
        strokeWidth={strokeWidth}
      />

      <Path
        d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"
        stroke={foregroundColor}
        strokeWidth={strokeWidth}
      />
      <Path d="M12 18V6" stroke={foregroundColor} strokeWidth={strokeWidth} />
    </Svg>
  );
}
