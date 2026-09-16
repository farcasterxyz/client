import * as React from 'react';
import Svg, { ClipPath, Defs, G, Path } from 'react-native-svg';

export function WalletConnectionIcon({
  size,
  color,
}: {
  size: number;
  color: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <G
        clipPath="url(#clip0_2591_9282)"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Path
          d="M8 14.665A6.667 6.667 0 108 1.332a6.667 6.667 0 000 13.333z"
          strokeWidth={1.5}
        />
        <Path
          d="M8 8.665a.667.667 0 100-1.333.667.667 0 000 1.333z"
          stroke={color}
          strokeWidth={2}
        />
      </G>
      <Defs>
        <ClipPath id="clip0_2591_9282">
          <Path fill="#fff" d="M0 0H16V16H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  );
}
