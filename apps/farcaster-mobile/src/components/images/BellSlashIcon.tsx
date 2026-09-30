import React, { FC } from 'react';
import Svg, { Path } from 'react-native-svg';

interface BellSlashIconProps {
  size: number;
  color: string;
}

// From Lucide, bell-off
const BellSlashIcon: FC<BellSlashIconProps> = ({ size, color }) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M10.268 21a2 2 0 0 0 3.464 0" />
      <Path d="M17 17H4a1 1 0 0 1-.74-1.673C4.59 13.956 6 12.499 6 8a6 6 0 0 1 .258-1.742" />
      <Path d="m2 2 20 20" />
      <Path d="M8.668 3.01A6 6 0 0 1 18 8c0 2.687.77 4.653 1.707 6.05" />
    </Svg>
  );
};
BellSlashIcon.displayName = 'BellIcon';

export { BellSlashIcon };
