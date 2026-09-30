import { Octicons } from '@expo/vector-icons';
import { AnalyticsEvent } from 'farcaster-analytics';
import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useHaptics } from '~/hooks/useHaptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ScaleAndFadeIn() {
  'worklet';

  const animations = {
    opacity: withTiming(1),
    transform: [{ scale: withTiming(1) }],
  };

  const initialValues = {
    opacity: 0,
    transform: [{ scale: 0.7 }],
  };

  return {
    animations,
    initialValues,
  };
}

export function ScaleAndFadeOut() {
  'worklet';

  const animations = {
    opacity: withTiming(0),
    transform: [{ scale: withTiming(0.7) }],
  };

  const initialValues = {
    opacity: 1,
    transform: [{ scale: 1 }],
  };

  return {
    animations,
    initialValues,
  };
}

type ScrollDownPressableProps = {
  onPress: () => void;
};

const ScrollDownPressable: React.FC<ScrollDownPressableProps> = React.memo(
  ({ onPress }) => {
    const t = useTheme();
    const { trackEvent } = useAnalytics();
    const { triggerImpactAsync } = useHaptics();

    const onScrollDownPress = React.useCallback(() => {
      triggerImpactAsync();

      trackEvent(AnalyticsEvent.ClickScrollDownDirectCasts, {});

      onPress();
    }, [onPress, trackEvent, triggerImpactAsync]);

    const wrappingViewPositions = React.useMemo(() => {
      return { bottom: 64, right: 12 } as ViewStyle;
    }, []);

    const scale = useSharedValue(1);

    const onPressIn = React.useCallback(() => {
      scale.value = withTiming(1.075, { duration: 100 });
    }, [scale]);

    const onPressOut = React.useCallback(() => {
      scale.value = withTiming(1, { duration: 100 });
    }, [scale]);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: scale.value }],
      };
    });

    return (
      <View style={[t.absolute, wrappingViewPositions]}>
        <AnimatedPressable
          style={[
            t.w14,
            t.h14,
            t.roundedFull,
            t.flex,
            t.flexCol,
            t.itemsCenter,
            t.justifyCenter,
            t.relative,
            t.borderHairline,
            t.borderDefault,
            {
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowOffset: { width: 1, height: 1 },
              shadowRadius: 2,
            },
            animatedStyle,
            { backgroundColor: t.dark ? '#342942' : t.colors.bgDefault },
          ]}
          entering={ScaleAndFadeIn}
          exiting={ScaleAndFadeOut}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={onScrollDownPress}
        >
          <Octicons name="chevron-down" style={[t.texts.primary]} size={28} />
        </AnimatedPressable>
      </View>
    );
  },
);

ScrollDownPressable.displayName = 'ScrollDownPressable';

export { ScrollDownPressable };
