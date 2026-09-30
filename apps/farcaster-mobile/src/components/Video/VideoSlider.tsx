import { hitSlop } from 'farcaster-expo';
import React, { RefObject, useCallback, useEffect, useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureType,
} from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useAnimationPauseOnBackground } from '~/hooks/useAnimationPauseOnBackground';

type VideoSliderProps = {
  blockGestureRef: GestureType | RefObject<GestureType>;
  onSeekStart: (value: number) => void;
  onSeekEnd: (value: number) => void;
  onSeek: (value: number) => void;
  value: number;
  height?: number;
  variant?: 'default' | 'bar-only' | 'loading';
};

const DEFAULT_HEIGHT = 3;
const DEFAULT_HANDLE_SIZE = 12;
const ACTIVE_HANDLE_SIZE = 20;
const HANDLE_SIZE_TIMING = 200;

const VideoSlider: React.FC<VideoSliderProps> = ({
  onSeek,
  onSeekEnd,
  onSeekStart,
  value,
  blockGestureRef,
  height = 36,
  variant = 'default',
}: VideoSliderProps) => {
  const [sliderWidth, setSliderWidth] = useState(0);
  const position = useSharedValue(value);
  const handleSize = useSharedValue(DEFAULT_HANDLE_SIZE);
  const [gestureActive, setGestureActive] = useState(false);
  const handleHeight = useSharedValue(DEFAULT_HEIGHT);

  // Loading animation shared values
  const loadingProgress = useSharedValue(0);
  const loadingOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (!gestureActive && sliderWidth) {
      position.value = value * sliderWidth;
    }
  }, [value, position, sliderWidth, gestureActive]);

  const stopLoadingAnimation = useCallback(() => {
    cancelAnimation(loadingProgress);
    cancelAnimation(loadingOpacity);
    loadingProgress.value = 0;
    loadingOpacity.value = 0.3;
  }, [loadingOpacity, loadingProgress]);

  const startLoadingAnimation = useCallback(() => {
    stopLoadingAnimation();

    // Start the pulsating animation.
    loadingProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );

    loadingOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, {
          duration: 500,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0.2, {
          duration: 500,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      false,
    );
  }, [loadingOpacity, loadingProgress, stopLoadingAnimation]);

  useAnimationPauseOnBackground({
    enabled: variant === 'loading' && sliderWidth > 0,
    startAnimation: startLoadingAnimation,
    stopAnimation: stopLoadingAnimation,
  });

  const wrappedOnSeekStart = (v: number) => {
    setGestureActive(true);
    onSeekStart(v);
  };

  const wrappedOnSeekEnd = (v: number) => {
    onSeekEnd(v);
    setGestureActive(false);
  };

  const barTap = Gesture.Tap()
    .maxDuration(250)
    .onEnd((event) => {
      const newPosition = event.x;
      position.value = Math.min(Math.max(newPosition, 0), sliderWidth);
      const newPercentage = position.value / sliderWidth;
      runOnJS(wrappedOnSeekEnd)(newPercentage);
    })
    .blocksExternalGesture(blockGestureRef);

  const barPan = Gesture.Pan()
    .onStart((event) => {
      const newPosition = event.x;
      position.value = Math.min(Math.max(newPosition, 0), sliderWidth);
      const newPercentage = position.value / sliderWidth;
      runOnJS(wrappedOnSeekStart)(newPercentage);

      handleSize.value = withTiming(ACTIVE_HANDLE_SIZE, { duration: 150 });
      if (variant !== 'default') {
        handleHeight.value = withTiming(DEFAULT_HEIGHT * 2, { duration: 150 });
      }
    })
    .onChange((event) => {
      const newPosition = event.x;
      position.value = Math.min(Math.max(newPosition, 0), sliderWidth);
      const newPercentage = position.value / sliderWidth;
      runOnJS(onSeek)(newPercentage);
    })
    .onEnd((event) => {
      const newPosition = event.x;
      position.value = Math.min(Math.max(newPosition, 0), sliderWidth);
      const newPercentage = position.value / sliderWidth;
      runOnJS(wrappedOnSeekEnd)(newPercentage);

      handleSize.value = withTiming(DEFAULT_HANDLE_SIZE, {
        duration: HANDLE_SIZE_TIMING,
      });
      if (variant !== 'default') {
        handleHeight.value = withTiming(DEFAULT_HEIGHT, { duration: 150 });
      }
    })
    .blocksExternalGesture(blockGestureRef);

  const barGesture = Gesture.Race(barTap, barPan);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setSliderWidth(width);
  }, []);

  const barAnimatedStyle = useAnimatedStyle(() => {
    if (variant === 'loading') {
      return {
        width: 0,
        height: 0,
      };
    }
    return {
      width: position.value,
      height: handleHeight.value,
    };
  });

  const loadingBarAnimatedStyle = useAnimatedStyle(() => {
    if (variant !== 'loading') {
      return {
        width: 0,
        opacity: 0,
      };
    }

    // Calculate the loading bar width that grows from center to edges
    const centerX = sliderWidth / 2;
    const maxWidth = sliderWidth;
    const currentWidth = interpolate(
      loadingProgress.value,
      [0, 1],
      [0, maxWidth],
    );

    return {
      width: currentWidth,
      opacity: loadingOpacity.value,
      left: centerX - currentWidth / 2, // Center the loading bar
    };
  });

  const handleAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: handleSize.value,
      width: handleSize.value,
      borderRadius: handleSize.value,
      borderWidth: 0,
    };
  });

  return (
    <View style={{ width: '100%' }} onLayout={onLayout}>
      <GestureDetector gesture={barGesture}>
        <View
          style={{
            width: '100%',
            height,
            justifyContent: 'center',
            position: 'relative',
          }}
          hitSlop={hitSlop}
        >
          <Animated.View
            style={[
              {
                backgroundColor: '#ffffff',
                position: 'absolute',
                left: 0,
              },
              barAnimatedStyle,
            ]}
          >
            <View
              style={[
                {
                  height: 24,
                  width: 24,
                  right: -12,
                  top: -11,
                  position: 'absolute',
                  alignItems: 'center',
                  justifyContent: 'center',
                  display: variant !== 'default' ? 'none' : 'flex',
                },
              ]}
            >
              <Animated.View
                style={[
                  {
                    backgroundColor: '#ffffff',
                  },
                  handleAnimatedStyle,
                ]}
              />
            </View>
          </Animated.View>

          {/* Loading bar that pulsates from center to edges */}
          <Animated.View
            style={[
              {
                backgroundColor: '#ffffff',
                position: 'absolute',
                height: handleHeight.value,
                borderRadius: 2,
              },
              loadingBarAnimatedStyle,
            ]}
          />
          <View
            style={{
              height: 3,
              width: '100%',
              backgroundColor: '#ffffff4D',
              justifyContent: 'center',
            }}
          ></View>
        </View>
      </GestureDetector>
    </View>
  );
};

export { VideoSlider };
