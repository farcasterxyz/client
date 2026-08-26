import React, { FC } from 'react';
import Svg, { Path } from 'react-native-svg';

const LightbulbIcon: FC<{ color: string; size: number }> = ({
  color,
  size,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M12.5 11.6666C12.6667 10.8333 13.0833 10.25 13.75 9.58329C14.5833 8.83329 15 7.74996 15 6.66663C15 5.34054 14.4732 4.06877 13.5355 3.13109C12.5979 2.19341 11.3261 1.66663 10 1.66663C8.67392 1.66663 7.40215 2.19341 6.46447 3.13109C5.52678 4.06877 5 5.34054 5 6.66663C5 7.49996 5.16667 8.49996 6.25 9.58329C6.83333 10.1666 7.33333 10.8333 7.5 11.6666"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7.5 14.6666H12.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.33325 17.6666H11.6666"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
LightbulbIcon.displayName = 'LightbulbIcon';

export { LightbulbIcon };
