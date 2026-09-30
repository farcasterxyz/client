import * as React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

export function SquareCheckIcon({
  size,
  color,
}: {
  size: number;
  color: string;
}) {
  return (
    <Svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
    >
      <Rect width={18} height={18} x={3} y={3} rx={2} />
      <Path d="m9 12 2 2 4-4" />
    </Svg>
  );
}
