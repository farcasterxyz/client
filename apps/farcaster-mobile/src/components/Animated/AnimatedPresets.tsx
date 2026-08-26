import React, { memo } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  FadeInUp,
  FadeOut,
  FadeOutDown,
  FadeOutLeft,
  FadeOutRight,
  FadeOutUp,
} from 'react-native-reanimated';

export const AnimatedPresets = {
  fadeIn: {
    entering: FadeIn,
    exiting: FadeOut,
  },
  fadeInDown: {
    entering: FadeInDown,
    exiting: FadeOutDown,
  },
  fadeInUp: {
    entering: FadeInUp,
    exiting: FadeOutUp,
  },
  fadeInLeft: {
    entering: FadeInLeft,
    exiting: FadeOutLeft,
  },
  fadeInRight: {
    entering: FadeInRight,
    exiting: FadeOutRight,
  },
};

export type AnimatedPreset = keyof typeof AnimatedPresets;

export const AnimatedPresetDurations = {
  fast: 0,
  medium: 250,
  slow: 500,
};

export type AnimatedPresetDuration = keyof typeof AnimatedPresetDurations;

const AnimatedView = Animated.createAnimatedComponent(View);

const AnimatedPresetView = memo(
  ({
    preset,
    children,
    duration,
  }: {
    preset: AnimatedPreset;
    children: React.ReactNode;
    duration?: AnimatedPresetDuration;
  }) => {
    return (
      <AnimatedView
        entering={AnimatedPresets[preset].entering.duration(
          duration ? AnimatedPresetDurations[duration] : 0,
        )}
        exiting={AnimatedPresets[preset].exiting.duration(
          duration ? AnimatedPresetDurations[duration] : 0,
        )}
      >
        {children}
      </AnimatedView>
    );
  },
);

AnimatedPresetView.displayName = 'AnimatedPresetView';

type AnimatedPresetProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  duration?: AnimatedPresetDuration;
};

const AnimatedPresetFadeIn = memo((props: AnimatedPresetProps) => {
  return <AnimatedPresetView preset="fadeIn" {...props} />;
});

AnimatedPresetFadeIn.displayName = 'AnimatedPresetFadeIn';

const AnimatedPresetFadeInDown = memo((props: AnimatedPresetProps) => {
  return <AnimatedPresetView preset="fadeInDown" {...props} />;
});

AnimatedPresetFadeInDown.displayName = 'AnimatedPresetFadeInDown';

const AnimatedPresetFadeInUp = memo((props: AnimatedPresetProps) => {
  return <AnimatedPresetView preset="fadeInUp" {...props} />;
});

AnimatedPresetFadeInUp.displayName = 'AnimatedPresetFadeInUp';

const AnimatedPresetFadeInLeft = memo((props: AnimatedPresetProps) => {
  return <AnimatedPresetView preset="fadeInLeft" {...props} />;
});

AnimatedPresetFadeInLeft.displayName = 'AnimatedPresetFadeInLeft';

const AnimatedPresetFadeInRight = memo((props: AnimatedPresetProps) => {
  return <AnimatedPresetView preset="fadeInRight" {...props} />;
});

AnimatedPresetFadeInRight.displayName = 'AnimatedPresetFadeInRight';

export {
  AnimatedPresetFadeIn,
  AnimatedPresetFadeInDown,
  AnimatedPresetFadeInLeft,
  AnimatedPresetFadeInRight,
  AnimatedPresetFadeInUp,
  AnimatedPresetView,
};
