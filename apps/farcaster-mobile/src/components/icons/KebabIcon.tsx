import React, { FC, memo } from 'react';
import Svg, { Path } from 'react-native-svg';

const KebabIcon: FC<{ size: number; color: string }> = memo(
  ({ size, color }) => {
    return (
      <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <Path
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.333}
          d="M8 8.666a.667.667 0 1 0 0-1.333.667.667 0 0 0 0 1.333ZM12.667 8.666a.667.667 0 1 0 0-1.333.667.667 0 0 0 0 1.333ZM3.333 8.666a.667.667 0 1 0 0-1.333.667.667 0 0 0 0 1.333Z"
        />
      </Svg>
    );
  },
);
KebabIcon.displayName = 'KebabIcon';

export { KebabIcon };
