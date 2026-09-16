import * as React from 'react';
import { Path, Rect, Svg } from 'react-native-svg';

export function WalletIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg height={size} width={size} viewBox="0 0 512 512">
      <Rect
        x={48}
        y={144}
        width={416}
        height={288}
        rx={48}
        ry={48}
        fill={'none'}
        stroke={color}
        strokeLinejoin={'round'}
        strokeWidth={32}
      />
      <Path
        d="M411.36,144V114A50,50,0,0,0,352,64.9L88.64,109.85A50,50,0,0,0,48,159v49"
        fill={'none'}
        stroke={color}
        strokeLinejoin={'round'}
        strokeWidth={32}
      />
      <Path fill={color} d="M368,320a32,32,0,1,1,32-32A32,32,0,0,1,368,320Z" />
    </Svg>
  );
}
