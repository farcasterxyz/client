import React from 'react';
import Svg, { Rect } from 'react-native-svg';

const ClankerReactionIcon = React.memo(
  ({ color, size = 16 }: { color: string; size?: number }) => {
    return (
      <Svg width={size} height={size} viewBox="0 0 42 42" fill="none">
        <Rect
          x="12.5517"
          y="39.5294"
          width="6.03448"
          height="11.1176"
          transform="rotate(180 12.5517 39.5294)"
          fill={color}
        />
        <Rect
          width="6.03448"
          height="23.4706"
          transform="matrix(1 0 0 -1 17.3793 39.5294)"
          fill={color}
        />
        <Rect
          width="6.03448"
          height="37.0588"
          transform="matrix(1 0 0 -1 29.4483 39.5294)"
          fill={color}
        />
      </Svg>
    );
  },
);

ClankerReactionIcon.displayName = 'ClankerReactionIcon';

export { ClankerReactionIcon };
