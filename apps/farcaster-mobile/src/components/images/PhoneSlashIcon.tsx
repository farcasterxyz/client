import React, { FC, memo } from 'react';
import Svg, { Path } from 'react-native-svg';

type PhoneSlashIconProps = {
  color: string;
  size: number;
};

// From Lucide font
const PhoneSlashIcon: FC<PhoneSlashIconProps> = memo(({ color, size }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M5.83073 1.66602H14.1641C15.0845 1.66602 15.8307 2.41221 15.8307 3.33268V11.499M4.16406 4.49902V16.666C4.16406 17.5865 4.91025 18.3327 5.83073 18.3327H14.1641C15.0845 18.3327 15.8307 17.5865 15.8307 16.666V16.199"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M1.66406 1.66797L18.3307 18.3346"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
});
PhoneSlashIcon.displayName = 'PhoneSlashIcon';

export { PhoneSlashIcon };
