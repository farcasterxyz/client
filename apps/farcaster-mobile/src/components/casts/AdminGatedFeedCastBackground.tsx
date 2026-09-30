import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

import { useTheme } from '~/contexts/ThemeProvider';

const STRIPE_SIZE = 16;
const STRIPE_WIDTH = 4;

const AdminGatedFeedCastBackground = memo(() => {
  const t = useTheme();

  const stripeColor = t.dark
    ? 'rgba(255, 255, 255, 0.04)'
    : 'rgba(0, 0, 0, 0.03)';

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <Svg height="100%" width="100%" preserveAspectRatio="none">
        <Defs>
          <Pattern
            id="admin-gated-feed-cast-pattern"
            width={STRIPE_SIZE}
            height={STRIPE_SIZE}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(135)"
          >
            <Rect
              width={STRIPE_WIDTH}
              height={STRIPE_SIZE}
              fill={stripeColor}
            />
          </Pattern>
        </Defs>
        <Rect
          width="100%"
          height="100%"
          fill="url(#admin-gated-feed-cast-pattern)"
        />
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});

AdminGatedFeedCastBackground.displayName = 'AdminGatedFeedCastBackground';

export { AdminGatedFeedCastBackground };
