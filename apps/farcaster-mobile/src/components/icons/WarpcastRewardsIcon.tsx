import * as React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

// The clipPath in the original asset clipped to a 0,0,24,24 rect that exactly
// matched the viewBox (a no-op), and the inner r=9 circle was a redundant
// same-fill overdraw entirely inside the outer r=12 circle. Both were dropped
// without changing the rendered output, leaving Svg + Circle + 2 Path.
const WarpcastRewardsIcon = React.memo(({ size }: { size: number }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={12} fill="#7C65C1" />
      <Path
        fill="#fff"
        d="M12 19.724c.872 0 2.75 2.842 3.57 2.54.82-.303.459-3.706 1.127-4.275.668-.569 3.907.382 4.343-.384.436-.766-1.995-3.138-1.844-4.009.152-.871 3.236-2.256 3.084-3.127-.151-.872-3.516-1.102-3.952-1.868-.436-.767 1.05-3.839.382-4.408-.668-.569-3.392 1.45-4.21 1.147-.82-.303-1.628-3.626-2.5-3.626-.872 0-1.68 3.323-2.5 3.626-.819.302-3.542-1.716-4.21-1.147-.668.569.818 3.641.382 4.408-.436.766-3.801.996-3.952 1.868-.152.871 2.932 2.256 3.084 3.127.151.871-2.28 3.243-1.844 4.01.436.765 3.675-.186 4.343.383.668.569.307 3.971 1.127 4.274.82.303 2.698-2.54 3.57-2.54Z"
      />
      <Path
        fill="#7C65C1"
        d="M9.36 15.6 7.885 9.429h1.809l.762 3.953h.048l.818-3.953h1.765l.84 3.925h.048l.74-3.925h1.81L15.048 15.6h-1.927l-.884-3.596h-.063L11.29 15.6H9.36Z"
      />
    </Svg>
  );
});

WarpcastRewardsIcon.displayName = 'WarpcastRewardsIcon';

export { WarpcastRewardsIcon };
