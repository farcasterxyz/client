import React, { FC } from 'react';
import { ColorValue } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

interface FrameIconProps {
  size: number;
  color: string;
  fill?: boolean;
  strokeWidth?: 1.75 | 2;
}

// From Lucide, layout-grid, with custom fill ability
const FrameIcon: FC<FrameIconProps> = ({
  size,
  color,
  fill = false,
  strokeWidth = 2,
}) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? color : 'none'}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Rect width="7" height="7" x="3" y="3" rx="1" />
      <Rect width="7" height="7" x="14" y="3" rx="1" />
      <Rect width="7" height="7" x="14" y="14" rx="1" />
      <Rect width="7" height="7" x="3" y="14" rx="1" />
    </Svg>
  );
};
FrameIcon.displayName = 'FrameIcon';

export function SingleFrameIcon({
  size,
  color,
}: {
  size: number;
  color: ColorValue;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 21 20" fill="none">
      <Path
        fill={color}
        fillRule="evenodd"
        d="M.5 2.967a1.3 1.3 0 0 1 1.3-1.3h17.4a1.3 1.3 0 0 1 1.3 1.3v14.067a1.3 1.3 0 0 1-1.3 1.3H1.8a1.3 1.3 0 0 1-1.3-1.3V2.967ZM2 4.2a.7.7 0 0 1 .7-.7h15.6a.7.7 0 0 1 .7.7v7.1a.7.7 0 0 1-.7.7H2.7a.7.7 0 0 1-.7-.7V4.2Zm.7 9.3a.7.7 0 0 0-.7.7v1.6a.7.7 0 0 0 .7.7h15.6a.7.7 0 0 0 .7-.7v-1.6a.7.7 0 0 0-.7-.7H2.7Z"
        clipRule="evenodd"
      />
    </Svg>
  );
}

export { FrameIcon };
