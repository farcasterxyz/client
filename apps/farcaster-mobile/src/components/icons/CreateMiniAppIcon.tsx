import React, { memo } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

const CreateMiniAppIcon = memo(
  ({ size, color }: { size: number; color: string }) => {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Top-left square */}
        <Rect x={2} y={2} width={9} height={9} rx={2} fill={color} />
        {/* Top-right square */}
        <Rect x={13} y={2} width={9} height={9} rx={2} fill={color} />
        {/* Bottom-left square */}
        <Rect x={2} y={13} width={9} height={9} rx={2} fill={color} />
        {/* Plus sign (bottom-right) */}
        <Path
          d="M17.5 14.5V20.5M14.5 17.5H20.5"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </Svg>
    );
  },
);

CreateMiniAppIcon.displayName = 'CreateMiniAppIcon';

export { CreateMiniAppIcon };
