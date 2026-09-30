import React, { memo, useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../../../contexts';
import { useHaptics } from '../../../hooks';
import { Text2 } from '../Text';

export interface HoldToConfirmButtonProps {
  onConfirm: () => void;
  title: string | React.ReactNode;
  pressingTitle?: string;
  successTitle?: string;
  warning?: boolean;
  error?: boolean;
  disabled?: boolean;
  height?: 'normal' | 'sm' | 'xs';
  Icon?: (options: { isPressing: boolean }) => React.ReactNode | null;
}

export const HoldToConfirmButton = memo(
  ({
    onConfirm,
    disabled = false,
    error = false,
    warning = false,
    title,
    successTitle,
    pressingTitle,
    height = 'normal',
    Icon,
  }: HoldToConfirmButtonProps) => {
    const t = useTheme();
    const { triggerImpactAsync, triggerSuccessNotificationAsync } =
      useHaptics();
    const [pressing, setPressing] = useState(false);
    const [buttonWidth, setButtonWidth] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);

    const scale = useSharedValue(1);
    const progressWidth = useSharedValue(0);
    const backgroundColorProgress = useSharedValue(0);

    const HOLD_DURATION = 666;
    const COLOR_ANIMATION_DURATION = 100;
    const SUCCESS_DURATION = 2500;

    useEffect(() => {
      if (showSuccess) {
        // Keep the background color at active state
        backgroundColorProgress.value = 1;

        const timeout = setTimeout(() => {
          setShowSuccess(false);
          // Reset color when success state ends
          backgroundColorProgress.value = withTiming(0, {
            duration: COLOR_ANIMATION_DURATION,
          });
        }, SUCCESS_DURATION);

        return () => {
          clearTimeout(timeout);
        };
      }
    }, [showSuccess, backgroundColorProgress]);

    const heightStyle =
      height === 'normal'
        ? { height: 48 }
        : height === 'sm'
          ? { height: 34 }
          : { height: 30 };

    // Define disabled color as a muted version of the action color
    const backgroundColor = React.useMemo(() => {
      if (disabled) {
        return t.colors.bgMuted;
      }
      if (error) {
        return t.colors.bgDanger;
      }
      if (warning) {
        return t.colors.yellow900;
      }
      return t.colors.bgAction;
    }, [
      disabled,
      t.colors.bgMuted,
      t.colors.bgAction,
      t.colors.bgDanger,
      error,
      warning,
      t.colors.yellow900,
    ]);

    const textStyle = React.useMemo(() => {
      return {
        color: disabled ? t.colors.text.secondary : t.colors.text.light,
      };
    }, [disabled, t.colors.text.secondary, t.colors.text.light]);

    const animatedButtonStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: scale.value }],
        backgroundColor: interpolateColor(
          backgroundColorProgress.value,
          [0, 1],
          [
            backgroundColor,
            error
              ? t.colors.red600
              : warning
                ? t.colors.text.warning
                : t.colors.bgButtonPress,
          ],
        ),
      };
    });

    const animatedProgressStyle = useAnimatedStyle(() => {
      return {
        width: progressWidth.value,
        backgroundColor: backgroundColor,
      };
    });

    // Measure the button width to set absolute width values instead of percentages
    const onButtonLayout = useCallback(
      (event: { nativeEvent: { layout: { width: number } } }) => {
        const { width } = event.nativeEvent.layout;
        setButtonWidth(width);
      },
      [],
    );

    const handleSuccess = useCallback(() => {
      setShowSuccess(true);
    }, []);

    const onComplete = useCallback(() => {
      'worklet';
      runOnJS(triggerSuccessNotificationAsync)();
      runOnJS(onConfirm)();
      runOnJS(setPressing)(false);
      if (successTitle) {
        runOnJS(handleSuccess)();
        // Animate scale back to 1 for success state
        scale.value = withTiming(1, { duration: 200 });
      }
    }, [
      triggerSuccessNotificationAsync,
      onConfirm,
      successTitle,
      handleSuccess,
      scale,
    ]);

    // Handle press out
    const handlePressOut = useCallback(() => {
      'worklet';
      cancelAnimation(progressWidth);
      progressWidth.value = 0;
      scale.value = withTiming(1, { duration: 100 });
      // Don't reset color if we have a success title (will be showing success state)
      if (!successTitle) {
        backgroundColorProgress.value = withTiming(0, {
          duration: COLOR_ANIMATION_DURATION,
        });
      }
      runOnJS(setPressing)(false);
    }, [progressWidth, scale, backgroundColorProgress, successTitle]);

    // Handle press in
    const handlePressIn = useCallback(() => {
      if (disabled) {
        return;
      }

      setPressing(true);
      scale.value = withTiming(0.98, { duration: 100 });
      backgroundColorProgress.value = withTiming(1, {
        duration: COLOR_ANIMATION_DURATION,
      });

      // Initial haptic feedback
      triggerImpactAsync();

      // Start the progress animation
      progressWidth.value = 0;
      progressWidth.value = withTiming(
        buttonWidth,
        {
          duration: HOLD_DURATION,
          easing: Easing.linear,
        },
        (finished) => {
          'worklet';
          if (finished) {
            onComplete();
            progressWidth.value = 0;
            scale.value = withTiming(1, { duration: 100 });
            // Only reset color if no success title
            if (!successTitle) {
              backgroundColorProgress.value = withTiming(0, {
                duration: COLOR_ANIMATION_DURATION,
              });
            }
          }
        },
      );
    }, [
      disabled,
      progressWidth,
      scale,
      backgroundColorProgress,
      buttonWidth,
      triggerImpactAsync,
      onComplete,
      successTitle,
    ]);

    // Clean up animations on unmount
    useEffect(() => {
      return () => {
        cancelAnimation(progressWidth);
        cancelAnimation(scale);
        cancelAnimation(backgroundColorProgress);
      };
    }, [progressWidth, scale, backgroundColorProgress]);

    const MemoizedIcon = React.useMemo(() => {
      if (showSuccess || !Icon) {
        return null;
      }

      return <Icon isPressing={pressing} />;
    }, [Icon, pressing, showSuccess]);

    const displayTitle = React.useMemo(() => {
      if (showSuccess && successTitle) {
        return successTitle;
      }
      return pressing && pressingTitle ? pressingTitle : title;
    }, [showSuccess, successTitle, pressing, pressingTitle, title]);

    return (
      <View style={[t.wFull]}>
        <Animated.View
          style={[
            animatedButtonStyle,
            t.roundedFull,
            heightStyle,
            { overflow: 'hidden' },
          ]}
        >
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onLayout={onButtonLayout}
            style={[t.itemsCenter, t.justifyCenter, t.wFull, t.hFull]}
            disabled={disabled || showSuccess}
          >
            {/* Progress Bar */}
            {pressing && buttonWidth > 0 && (
              <Animated.View
                style={[
                  t.absolute,
                  t.top0,
                  t.left0,
                  t.bottom0,
                  animatedProgressStyle,
                ]}
              />
            )}
            <Animated.View
              style={[
                t.wFull,
                t.flexRow,
                t.justifyCenter,
                t.itemsCenter,
                { gap: 8 },
              ]}
              entering={FadeIn.easing(Easing.ease)}
              key={typeof displayTitle === 'string' ? displayTitle : null}
            >
              {MemoizedIcon}
              {typeof displayTitle === 'string' ? (
                <Text2 size="lg" weight="semibold" style={textStyle}>
                  {displayTitle}
                </Text2>
              ) : (
                displayTitle
              )}
            </Animated.View>
          </Pressable>
        </Animated.View>
      </View>
    );
  },
);
