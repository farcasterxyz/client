import {
  AnimatedPressable,
  hitSlopSm,
  Typography,
  useHaptics,
} from 'farcaster-expo';
import React, { FC } from 'react';

import { useTheme } from '~/contexts/ThemeProvider';

interface ComposerTickerTagProps {
  tokenKey: string | undefined;
  onPress: () => void;
  reset: () => void;
}

const ComposerTickerTag: FC<ComposerTickerTagProps> = ({ onPress }) => {
  const t = useTheme();

  const { triggerImpactAsync } = useHaptics();

  return (
    <AnimatedPressable
      hitSlop={hitSlopSm}
      onPress={() => {
        triggerImpactAsync();

        onPress();
      }}
      style={[
        t.flex,
        t.flexRow,
        t.itemsCenter,
        t.pX3,
        t.pY2,
        { borderRadius: 100 },
        t.border,
        t.borderDashed,
        t.borders.secondary,
      ]}
    >
      <Typography label="Medium/S" color="secondary">
        Ticker
      </Typography>
    </AnimatedPressable>
  );
};

ComposerTickerTag.displayName = 'ComposerTickerTag';

export { ComposerTickerTag };
