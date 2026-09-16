import React, { FC } from 'react';
import Svg, { G, Path } from 'react-native-svg';

const BackInTimeIcon: FC<{ color: string; size: number }> = ({
  color,
  size,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <G id="Frame">
        <Path
          id="Vector"
          d="M2.5 10C2.5 11.4834 2.93987 12.9334 3.76398 14.1668C4.58809 15.4001 5.75943 16.3614 7.12987 16.9291C8.50032 17.4968 10.0083 17.6453 11.4632 17.3559C12.918 17.0665 14.2544 16.3522 15.3033 15.3033C16.3522 14.2544 17.0665 12.918 17.3559 11.4632C17.6453 10.0083 17.4968 8.50032 16.9291 7.12987C16.3614 5.75943 15.4001 4.58809 14.1668 3.76398C12.9334 2.93987 11.4834 2.5 10 2.5C7.90329 2.50789 5.89081 3.32602 4.38333 4.78333L2.5 6.66667"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          id="Vector_2"
          d="M2.5 2.5V6.66667H6.66667"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          id="Vector_3"
          d="M10 5.8335V10.0002L13.3333 11.6668"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  );
};
BackInTimeIcon.displayName = 'BackInTimeIcon';

export { BackInTimeIcon };
