import { useIsFocused } from '@react-navigation/native';
import React, { FC, memo } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '~/contexts/ThemeProvider';
import { useAnimationPauseOnBackground } from '~/hooks/useAnimationPauseOnBackground';

const WIDTH = 16;
const SPEED = 300;

type SquareSpinnerValues = {
  cubeX: number;
  cubeY: number;
  topStart: number;
  topEnd: number;
  rightStart: number;
  rightEnd: number;
  bottomStart: number;
  bottomEnd: number;
};

const INITIAL_SPINNER_VALUES: SquareSpinnerValues = {
  cubeX: 0,
  cubeY: 0,
  topStart: 0,
  topEnd: 0,
  rightStart: 0,
  rightEnd: 0,
  bottomStart: 0,
  bottomEnd: 0,
};

const SquareSpinner: FC = memo(() => {
  const t = useTheme();
  const isFocused = useIsFocused();

  const vals = useSharedValue<SquareSpinnerValues>({
    ...INITIAL_SPINNER_VALUES,
  });

  const startAnimation = React.useCallback(() => {
    vals.value = withRepeat(
      withSequence(
        withTiming(
          {
            cubeX: 0,
            cubeY: 0,
            topStart: 0,
            topEnd: 0,
            rightStart: 0,
            rightEnd: 0,
            bottomStart: 2 * WIDTH,
            bottomEnd: 2 * WIDTH,
          },
          { duration: SPEED, easing: Easing.linear },
        ),
        withTiming(
          {
            cubeX: WIDTH,
            cubeY: 0,
            topStart: 0,
            topEnd: 2 * WIDTH,
            rightStart: 0,
            rightEnd: 0,
            bottomStart: 2 * WIDTH,
            bottomEnd: 2 * WIDTH,
          },
          { duration: SPEED, easing: Easing.linear },
        ),
        withTiming(
          {
            cubeX: WIDTH,
            cubeY: WIDTH,
            topStart: 0,
            topEnd: 2 * WIDTH,
            rightStart: 0,
            rightEnd: 2 * WIDTH,
            bottomStart: 2 * WIDTH,
            bottomEnd: 2 * WIDTH,
          },
          { duration: SPEED, easing: Easing.linear },
        ),
        withTiming(
          {
            cubeX: 0,
            cubeY: WIDTH,
            topStart: 0,
            topEnd: 2 * WIDTH,
            rightStart: 0,
            rightEnd: 2 * WIDTH,
            bottomStart: 0,
            bottomEnd: 2 * WIDTH,
          },
          { duration: SPEED, easing: Easing.linear },
        ),
        withTiming(
          {
            cubeX: 0,
            cubeY: 0,
            topStart: 0,
            topEnd: 2 * WIDTH,
            rightStart: 0,
            rightEnd: 2 * WIDTH,
            bottomStart: 0,
            bottomEnd: 2 * WIDTH,
          },
          { duration: SPEED, easing: Easing.linear },
        ),
        withTiming(
          {
            cubeX: WIDTH,
            cubeY: 0,
            topStart: 2 * WIDTH,
            topEnd: 2 * WIDTH,
            rightStart: 0,
            rightEnd: 2 * WIDTH,
            bottomStart: 0,
            bottomEnd: 2 * WIDTH,
          },
          { duration: SPEED, easing: Easing.linear },
        ),
        withTiming(
          {
            cubeX: WIDTH,
            cubeY: WIDTH,
            topStart: 2 * WIDTH,
            topEnd: 2 * WIDTH,
            rightStart: 2 * WIDTH,
            rightEnd: 2 * WIDTH,
            bottomStart: 0,
            bottomEnd: 2 * WIDTH,
          },
          { duration: SPEED, easing: Easing.linear },
        ),
        withTiming(
          {
            cubeX: 0,
            cubeY: WIDTH,
            topStart: 2 * WIDTH,
            topEnd: 2 * WIDTH,
            rightStart: 2 * WIDTH,
            rightEnd: 2 * WIDTH,
            bottomStart: 0,
            bottomEnd: 0,
          },
          { duration: SPEED, easing: Easing.linear },
        ),
      ),
      -1,
      true,
    );
  }, [vals]);

  const stopAnimation = React.useCallback(() => {
    cancelAnimation(vals);
    vals.value = {
      ...INITIAL_SPINNER_VALUES,
    };
  }, [vals]);

  useAnimationPauseOnBackground({
    enabled: isFocused,
    startAnimation,
    stopAnimation,
  });

  const cubeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: vals.value.cubeX },
      { translateY: vals.value.cubeY },
    ],
    width: WIDTH,
    height: WIDTH,
    backgroundColor: t.colors.text.brand,
    position: 'absolute',
  }));

  const topStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: vals.value.topStart }],
    width: vals.value.topEnd - vals.value.topStart,
    height: WIDTH,
    backgroundColor: t.colors.bgFaintOld,
    position: 'absolute',
  }));

  const rightStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: vals.value.rightStart }],
    height: vals.value.rightEnd - vals.value.rightStart,
    width: WIDTH,
    backgroundColor: t.colors.bgFaintOld,
    position: 'absolute',
    left: WIDTH,
  }));

  const bottomStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: vals.value.bottomStart }],
    width: vals.value.bottomEnd - vals.value.bottomStart,
    height: WIDTH,
    backgroundColor: t.colors.bgFaintOld,
    position: 'absolute',
    top: WIDTH,
  }));

  return (
    <View
      style={[
        t.flexNone,
        {
          position: 'relative',

          height: WIDTH * 2,
          width: WIDTH * 2,
        },
      ]}
    >
      <Animated.View style={topStyle}></Animated.View>
      <Animated.View style={rightStyle}></Animated.View>
      <Animated.View style={bottomStyle}></Animated.View>
      <Animated.View style={cubeStyle}></Animated.View>
    </View>
  );
});
SquareSpinner.displayName = 'SquareSpinner';

export { SquareSpinner };
