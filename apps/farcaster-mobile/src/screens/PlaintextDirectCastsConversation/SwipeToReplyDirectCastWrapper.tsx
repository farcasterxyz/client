import { Octicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, LayoutChangeEvent, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { easing } from '~/constants/Animated';
import { hitSlopLg } from '~/constants/Pressable';
import { useTheme } from '~/contexts/ThemeProvider';
import { useHaptics } from '~/hooks/useHaptics';

type SwipeToReplyDirectCastWrapperProps = {
  placedAtTheEndOfRow: boolean;
  onSwipeCallback: () => void;
  disabled: boolean;
  children: React.ReactNode;
};

const SwipeToReplyDirectCastWrapper: React.FC<SwipeToReplyDirectCastWrapperProps> =
  React.memo(({ placedAtTheEndOfRow, onSwipeCallback, children, disabled }) => {
    const t = useTheme();

    const { triggerImpactAsync } = useHaptics();

    const panTranslateX = useSharedValue(0);
    const panStartX = useSharedValue(0);
    const panReachedThreshold = useSharedValue(false);

    const windowWidth = Dimensions.get('window').width;
    const windowHeight = Dimensions.get('window').height;

    const [nonSelfAuthoredDCWidth, setNonSelfAuthoredDCWidth] = React.useState<
      number | undefined
    >();
    const onLayout = React.useCallback((e: LayoutChangeEvent) => {
      setNonSelfAuthoredDCWidth(e.nativeEvent.layout.width);
    }, []);

    const basePanThreshold = windowWidth / 3;
    const nonSelfAuthoredDCMinPanThreshold =
      nonSelfAuthoredDCWidth !== undefined
        ? Math.max(nonSelfAuthoredDCWidth - 100, 35)
        : undefined;

    const panThreshold =
      nonSelfAuthoredDCMinPanThreshold !== undefined
        ? Math.min(basePanThreshold, nonSelfAuthoredDCMinPanThreshold)
        : basePanThreshold;

    const pan = React.useMemo(
      () =>
        Gesture.Pan()
          .hitSlop(hitSlopLg)
          .activeOffsetX([-40, windowWidth])
          .activeOffsetY([-windowHeight, windowHeight])
          .failOffsetY([-40, 40])
          .onStart(() => {
            panStartX.value = panTranslateX.value;
          })
          .onUpdate(({ translationX }) => {
            if (panReachedThreshold.value === true) {
              return;
            }

            const nextTranslate = translationX + panStartX.value;

            if (Math.abs(nextTranslate) > panThreshold) {
              panReachedThreshold.value = true;
              runOnJS(triggerImpactAsync)();
              runOnJS(onSwipeCallback)();
              panTranslateX.value = withTiming(0, { duration: 400, easing });
              return;
            }

            panTranslateX.value = Math.min(0, nextTranslate);
          })
          .onEnd(() => {
            panTranslateX.value = withTiming(0, { duration: 200, easing });
            panReachedThreshold.value = false;
          }),
      [
        panThreshold,
        onSwipeCallback,
        panReachedThreshold,
        panStartX,
        panTranslateX,
        triggerImpactAsync,
        windowHeight,
        windowWidth,
      ],
    );

    const styleTranslateX = useAnimatedStyle(
      () => ({
        transform: [{ translateX: panTranslateX.value }],
      }),
      [panTranslateX],
    );

    const styleReplyTranslate = useAnimatedStyle(
      () => ({
        transform: [
          { translateX: placedAtTheEndOfRow ? 25 : windowWidth - 220 },
          {
            translateX:
              panTranslateX.value +
              (placedAtTheEndOfRow ? 0 : windowWidth - 220),
          },
          { scaleX: 1 },
        ],
      }),
      [panTranslateX, placedAtTheEndOfRow],
    );

    const styleReplyIcon = useAnimatedStyle(() => {
      const translate = Math.abs(panTranslateX.value);
      return {
        opacity: interpolate(translate, [0, panThreshold / 1.5], [0, 1]),
        transform: [
          {
            rotate: `${interpolate(
              translate,
              [0, panThreshold / 1.5],
              [270, 0],
              Extrapolate.CLAMP,
            )}deg`,
          },
          {
            scale: interpolate(
              translate,
              [0, panThreshold / 1.5],
              [0, 1],
              Extrapolate.CLAMP,
            ),
          },
        ],
      };
    }, [panTranslateX, panThreshold]);

    if (disabled) {
      return <>{children}</>;
    }

    return (
      <>
        <Animated.View
          style={[
            { position: 'absolute', alignSelf: 'center' },
            styleReplyTranslate,
          ]}
        >
          <Animated.View style={[styleReplyIcon]}>
            <Octicons name="reply" style={[t.texts.primary]} size={16} />
          </Animated.View>
        </Animated.View>
        <GestureDetector gesture={pan}>
          {placedAtTheEndOfRow ? (
            <Animated.View style={[styleTranslateX]}>{children}</Animated.View>
          ) : (
            <View style={[t.flexRow, t.wFull]}>
              <Animated.View style={[styleTranslateX]} onLayout={onLayout}>
                {children}
              </Animated.View>
              {<View style={[t.flex1]} />}
            </View>
          )}
        </GestureDetector>
      </>
    );
  });

export { SwipeToReplyDirectCastWrapper };
