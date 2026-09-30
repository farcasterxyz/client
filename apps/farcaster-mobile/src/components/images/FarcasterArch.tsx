import React, { FC, memo } from 'react';
import Svg, { Path } from 'react-native-svg';

type FarcasterArchIcon = {
  width: number;
  height: number;
  variant?: 'purple' | 'white';
};

const FarcasterArchIcon: FC<FarcasterArchIcon> = memo(
  ({ width, height, variant = 'purple' }) => {
    const fill = variant === 'purple' ? '#6A3CFF' : '#FFFFFF';

    return (
      <Svg width={width} height={height} viewBox="0 0 600 526" fill="none">
        <Path
          d="M600 0V71.0256H528.863V141.991H550.658V142.015H600V526H480.842L480.769 525.649L419.967 238.396C414.17 211.014 398.999 186.239 377.253 168.619C355.506 151 328.113 141.301 300.122 141.301H299.884C271.893 141.301 244.5 151 222.753 168.619C201.007 186.239 185.836 211.023 180.039 238.396L119.167 526H0V142.006H49.3425V141.991H71.1343V71.0256H0V0H600Z"
          fill={fill}
        />
      </Svg>
    );
  },
);
FarcasterArchIcon.displayName = 'FarcasterArchIcon';

export { FarcasterArchIcon };
