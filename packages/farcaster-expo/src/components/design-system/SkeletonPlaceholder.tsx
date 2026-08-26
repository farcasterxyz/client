import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../../contexts';
import { useSafeFocusEffect } from '../../hooks/useSafeFocusEffect';
import { TextSize } from './Text';

type SkeletonVariant = 'normal' | 'darker';

const SKELETON_VARIANTS = {
  normal: {
    light: ['#F3F3F3', '#FAFAFA'],
    dark: ['#1E1E1E', '#1B1B1B'],
  },
  darker: {
    light: ['#EBEBEB', '#F2F2F2'],
    dark: ['#1A1520', '#161219'],
  },
} as const;

const getGradientColors = (isDark: boolean, variant: SkeletonVariant) => {
  return SKELETON_VARIANTS[variant][isDark ? 'dark' : 'light'];
};

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export function SkeletonPlaceholder({
  style,
  variant = 'normal',
}: {
  style: StyleProp<ViewStyle>;
  variant?: SkeletonVariant;
}) {
  const t = useTheme();
  const colors = getGradientColors(t.dark, variant);
  const translateX = useSharedValue(-100);

  // Unfocused tab screens stay mounted, so an ungated shimmer keeps writing
  // props on the UI thread every frame, app-wide, for as long as it exists.
  useSafeFocusEffect(
    React.useCallback(() => {
      translateX.value = withRepeat(
        withTiming(100, {
          duration: 2000,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        }),
        -1, // infinite
        false,
      );

      return () => {
        cancelAnimation(translateX);
        translateX.value = -100;
      };
    }, [translateX]),
  );

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[style, { overflow: 'hidden' }]}>
      <LinearGradient
        colors={colors}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <AnimatedLinearGradient
        colors={[
          'transparent',
          t.dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
          'transparent',
        ]}
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '200%',
          },
          shimmerStyle,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
    </Animated.View>
  );
}

export function TextPlaceholder({
  size = 'base',
  width,
  style,
  variant = 'normal',
}: {
  width: number;
  size?: TextSize;
  style?: StyleProp<ViewStyle>;
  variant?: SkeletonVariant;
}) {
  const t = useTheme();
  const internalStyles = useMemo<StyleProp<ViewStyle>>(() => {
    return {
      borderRadius: 16,
      width,
      height: t.lineHeights[size],
    };
  }, [size, width, t.lineHeights]);

  return (
    <SkeletonPlaceholder style={[style, internalStyles]} variant={variant} />
  );
}
