import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

export function WalletIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M11.333 9.336h.007M4.667 4.667h8A1.333 1.333 0 0 1 14 6v6.667A1.334 1.334 0 0 1 12.667 14H3.333A1.334 1.334 0 0 1 2 12.667V3.333A1.333 1.333 0 0 1 3.333 2h9.334"
      />
    </Svg>
  );
}
