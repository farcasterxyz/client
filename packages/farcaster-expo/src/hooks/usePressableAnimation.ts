import { useCallback, useMemo } from 'react';
import {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../contexts';

export type PressableAnimationOptions = Partial<{
  enabled: boolean | undefined;
  scale: boolean | undefined;
  color: 'lightGray' | 'transparent' | undefined;
}>;

const PRESS_IN_SPEED = 100;
const PRESS_OUT_SPEED = 150;

export const usePressableAnimation = (
  options: PressableAnimationOptions = {},
) => {
  const enabled = options.enabled ?? true;
  const scale = options.scale ?? true;
  const color = options.color;

  const t = useTheme();
  const shadeColors = useMemo(() => {
    switch (color) {
      case 'lightGray':
        return [t.colors.bgNewLightGray, t.colors.bgNewLightGrayActive] as [
          string,
          string,
        ];
      case 'transparent':
        return [t.colors.bgDefault, t.colors.bgNewLightGray];
    }
  }, [
    color,
    t.colors.bgDefault,
    t.colors.bgNewLightGray,
    t.colors.bgNewLightGrayActive,
  ]);

  const pressedSV = useSharedValue(0);
  const scaleSV = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = shadeColors?.length
      ? interpolateColor(
          pressedSV.value,
          [0, 1],
          [shadeColors[0], shadeColors[1]],
        )
      : undefined;

    const transform = scale ? [{ scale: scaleSV.value }] : undefined;

    return {
      transform,
      ...(backgroundColor !== undefined ? { backgroundColor } : {}),
    };
  });

  const onPressIn = useCallback(() => {
    if (!enabled) {
      return;
    }

    if (scale) {
      scaleSV.value = withTiming(0.97, {
        duration: PRESS_IN_SPEED,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }

    if (color) {
      pressedSV.value = withTiming(1, { duration: PRESS_IN_SPEED });
    }
  }, [color, enabled, pressedSV, scale, scaleSV]);

  const onPressOut = useCallback(() => {
    if (!enabled) {
      return;
    }

    if (scale) {
      scaleSV.value = withTiming(1, {
        duration: PRESS_OUT_SPEED,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }

    if (color) {
      pressedSV.value = withTiming(0, { duration: PRESS_OUT_SPEED });
    }
  }, [color, enabled, pressedSV, scale, scaleSV]);

  const pressHandlers = useMemo(() => {
    return {
      onPressIn,
      onPressOut,
    };
  }, [onPressIn, onPressOut]);

  return {
    animatedStyle,
    pressHandlers,
  };
};
