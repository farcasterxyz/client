import React from 'react';
import { Animated, StyleProp, View, ViewStyle } from 'react-native';

import { useTheme } from '~/contexts/ThemeProvider';

type ScreenPanelProps = {
  children: React.ReactNode;
  dangerouslyApplyExtraStyles: StyleProp<ViewStyle>;
  animated: boolean;
};

const ScreenPanel: React.FC<ScreenPanelProps> = React.memo(
  ({ children, dangerouslyApplyExtraStyles, animated }) => {
    const t = useTheme();

    const slidingViewAnimation = React.useRef(new Animated.Value(-10)).current;
    const opacityAnimation = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
      Animated.timing(slidingViewAnimation, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();

      Animated.timing(opacityAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }, [opacityAnimation, slidingViewAnimation]);

    if (animated) {
      return (
        <Animated.View
          style={[
            t.bgDefault,
            t.mX4,
            t.borderDefault,
            t.roundedLg,
            t.borderHairline,
            dangerouslyApplyExtraStyles,
            { opacity: opacityAnimation },
            { transform: [{ translateY: slidingViewAnimation }] },
          ]}
        >
          {children}
        </Animated.View>
      );
    }

    return (
      <View style={[t.bgDefault, dangerouslyApplyExtraStyles]}>{children}</View>
    );
  },
);

ScreenPanel.displayName = 'ScreenPanel';

export { ScreenPanel };
