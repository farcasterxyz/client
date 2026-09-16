import * as React from 'react';
import { ColorValue } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

export function SquareAddIcon({
  size,
  color,
}: {
  size: number;
  color: ColorValue;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      stroke={color}
      strokeWidth={2}
    >
      <Rect width={18} height={18} x={3} y={3} rx={2} />
      <Path d="M8 12h8M12 8v8" />
    </Svg>
  );
}
