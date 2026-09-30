import React, { memo } from 'react';
import Svg, { Path } from 'react-native-svg';

const BlockedSiteIcon = memo(
  ({ size, color }: { size: number; color: string }) => {
    return (
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Path
          d="M32 6L42 16"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M4.00001 24H44C44 27.9556 42.827 31.8224 40.6294 35.1114C38.4318 38.4004 35.3082 40.9638 31.6537 42.4776C27.9992 43.9913 23.9778 44.3874 20.0982 43.6157C16.2186 42.844 12.6549 40.9392 9.85787 38.1421C7.06082 35.3451 5.15601 31.7814 4.3843 27.9018C3.6126 24.0222 4.00867 20.0009 5.52242 16.3463C7.03617 12.6918 9.59962 9.56824 12.8886 7.37061C16.1776 5.17298 20.0444 4 24 4C18.8645 9.39231 16 16.5535 16 24C16 31.4465 18.8645 38.6077 24 44C29.1355 38.6077 32 31.4465 32 24"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M42 6L32 16"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  },
);

BlockedSiteIcon.displayName = 'BlockedSiteIcon';

export { BlockedSiteIcon };
