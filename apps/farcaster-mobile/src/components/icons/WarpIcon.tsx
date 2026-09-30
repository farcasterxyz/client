import * as React from 'react';
import { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// The clipPath clipped to a 0,0,16,16 rect that exactly matched the viewBox
// (a no-op) and neither path's stroke extended outside it, so the clip group
// and its defs were dropped without changing the rendered output. The runtime
// `color` prop is preserved on both paths.
const WarpIcon = React.memo(
  ({ size, color }: { size: number; color: ColorValue }) => {
    return (
      <Svg width={size} height={size} fill="none" viewBox="0 0 16 16">
        <Path
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M1.8 6.867a1.607 1.607 0 0 0 0 2.273l5.06 5.06a1.607 1.607 0 0 0 2.273 0l5.06-5.06a1.606 1.606 0 0 0 0-2.273l-5.06-5.06a1.607 1.607 0 0 0-2.273 0L1.8 6.867Z"
        />
        <Path
          fill={color}
          d="M8.612 14.549c-.195.08-.404.122-.615.122V1.335a1.607 1.607 0 0 1 1.136.472l5.06 5.06a1.605 1.605 0 0 1 0 2.273l-5.06 5.06c-.149.15-.326.268-.521.349Z"
        />
      </Svg>
    );
  },
);

WarpIcon.displayName = 'WarpIcon';

export { WarpIcon };
