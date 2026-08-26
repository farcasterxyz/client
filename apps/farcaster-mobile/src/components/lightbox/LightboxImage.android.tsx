import { Image } from 'expo-image';
import { useTheme } from 'farcaster-expo';
import React from 'react';
import { ActivityIndicator, TransformsStyle } from 'react-native';
import {
  Gesture,
  GestureDetector,
  PanGesture,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { imageRequestHeaders } from '~/constants/Images';
import { ActiveLightboxImage } from '~/contexts/LightboxProvider';

import {
  applyRounding,
  createTransform,
  prependPan,
  prependPinch,
  prependTransform,
  readTransform,
  TransformMatrix,
} from './transforms';

export type Transform = Exclude<
  TransformsStyle['transform'],
  string | undefined
>;

const MAX_ORIGINAL_IMAGE_ZOOM = 2;
const MIN_SCREEN_ZOOM = 2;
// Cap how far users can zoom; extremely large scales on Android break gesture math
// and make the image appear unresponsive.
const MAX_SCREEN_ZOOM = 4;

const getMaxZoomScale = (
  image: ActiveLightboxImage,
  screenSize: { width: number; height: number },
) => {
  'worklet';
  if (!image.width || !screenSize.width || !screenSize.height) {
    return MIN_SCREEN_ZOOM;
  }
  const imageHeight = image.width / (image.aspectRatio || 1);
  const widthLimitedZoom =
    (image.width / screenSize.width) * MAX_ORIGINAL_IMAGE_ZOOM;
  const heightLimitedZoom =
    (imageHeight / screenSize.height) * MAX_ORIGINAL_IMAGE_ZOOM;
  const resolutionLimitedZoom = Math.min(widthLimitedZoom, heightLimitedZoom);
  return Math.min(
    MAX_SCREEN_ZOOM,
    Math.max(MIN_SCREEN_ZOOM, resolutionLimitedZoom),
  );
};

const initialTransform = createTransform();

export function LightboxImage({
  image,
  measureSafeArea,
  transforms,
  onTap,
  dismissSwipePan,
  onZoom,
  isScrollViewBeingDragged = false,
}: {
  image: ActiveLightboxImage;
  onTap: () => void;
  measureSafeArea: () => { width: number; height: number };
  transforms: Readonly<
    SharedValue<{
      scaleAndMoveTransform: Transform;
      cropFrameTransform: Transform;
      cropContentTransform: Transform;
      borderRadiusTransform: number;
      isResting: boolean;
      isHidden: boolean;
    }>
  >;
  dismissSwipePan: PanGesture;
  onZoom: (nextIsScaled: boolean) => void;
  isScrollViewBeingDragged?: boolean;
}) {
  const t = useTheme();
  const [isScaled, setIsScaled] = React.useState(false);
  const committedTransform = useSharedValue(initialTransform);
  const panTranslation = useSharedValue({ x: 0, y: 0 });
  const pinchOrigin = useSharedValue({ x: 0, y: 0 });
  const pinchScale = useSharedValue(1);
  const pinchTranslation = useSharedValue({ x: 0, y: 0 });
  const containerRef = useAnimatedRef();

  // Keep track of when we're entering or leaving scaled rendering.
  useAnimatedReaction(
    () => {
      if (pinchScale.get() !== 1) {
        // We're currently pinching.
        return true;
      }
      const [, , committedScale] = readTransform(committedTransform.get());
      if (committedScale !== 1) {
        // We started from a pinched in state.
        return true;
      }
      // We're at rest.
      return false;
    },
    (nextIsScaled, prevIsScaled) => {
      if (nextIsScaled !== prevIsScaled) {
        runOnJS(handleZoom)(nextIsScaled);
      }
    },
  );

  function handleZoom(nextIsScaled: boolean) {
    setIsScaled(nextIsScaled);
    onZoom(nextIsScaled);
  }

  // On Android, stock apps prevent going "out of bounds" on pan or pinch. You should "bump" into edges.
  // If the user tried to pan too hard, this function will provide the negative panning to stay in bounds.
  function getExtraTranslationToStayInBounds(
    candidateTransform: TransformMatrix,
    screenSize: { width: number; height: number },
  ) {
    'worklet';
    if (!image.aspectRatio) {
      return [0, 0];
    }
    const [nextTranslateX, nextTranslateY, nextScale] =
      readTransform(candidateTransform);
    const scaledDimensions = getScaledDimensions(
      image.aspectRatio,
      nextScale,
      screenSize,
    );
    const clampedTranslateX = clampTranslation(
      nextTranslateX,
      scaledDimensions.width,
      screenSize.width,
    );
    const clampedTranslateY = clampTranslation(
      nextTranslateY,
      scaledDimensions.height,
      screenSize.height,
    );
    const dx = clampedTranslateX - nextTranslateX;
    const dy = clampedTranslateY - nextTranslateY;
    return [dx, dy];
  }

  const pinch = Gesture.Pinch()
    .onStart((e) => {
      'worklet';
      const screenSize = measureSafeArea();
      pinchOrigin.set({
        x: e.focalX - screenSize.width / 2,
        y: e.focalY - screenSize.height / 2,
      });
    })
    .onChange((e) => {
      'worklet';
      const screenSize = measureSafeArea();
      if (!image.width) {
        return;
      }
      // Don't let the picture zoom in so close that it gets blurry.
      // Also, like in stock Android apps, don't let the user zoom out further than 1:1.
      const [, , committedScale] = readTransform(committedTransform.get());
      const maxCommittedScale = getMaxZoomScale(image, screenSize);
      const minPinchScale = 1 / committedScale;
      const maxPinchScale = maxCommittedScale / committedScale;
      const nextPinchScale = Math.min(
        Math.max(minPinchScale, e.scale),
        maxPinchScale,
      );
      pinchScale.set(nextPinchScale);

      // Zooming out close to the corner could push us out of bounds, which we don't want on Android.
      // Calculate where we'll end up so we know how much to translate back to stay in bounds.
      const t = createTransform();
      prependPan(t, panTranslation.get());
      prependPinch(
        t,
        nextPinchScale,
        pinchOrigin.get(),
        pinchTranslation.get(),
      );
      prependTransform(t, committedTransform.get());
      const [dx, dy] = getExtraTranslationToStayInBounds(t, screenSize);
      if (dx !== 0 || dy !== 0) {
        const pt = pinchTranslation.get();
        pinchTranslation.set({
          x: pt.x + dx,
          y: pt.y + dy,
        });
      }
    })
    .onEnd(() => {
      'worklet';
      // Commit just the pinch.
      const t = createTransform();
      prependPinch(
        t,
        pinchScale.get(),
        pinchOrigin.get(),
        pinchTranslation.get(),
      );
      prependTransform(t, committedTransform.get());
      applyRounding(t);
      committedTransform.set(t);

      // Reset just the pinch.
      pinchScale.set(1);
      pinchOrigin.set({ x: 0, y: 0 });
      pinchTranslation.set({ x: 0, y: 0 });
    });

  const pan = Gesture.Pan()
    .averageTouches(true)
    // Unlike .enabled(isScaled), this ensures that an initial pinch can turn into a pan midway:
    .minPointers(isScaled ? 1 : 2)
    .onChange((e) => {
      'worklet';
      // While an active pinch is in progress, pinch already accounts for focal-point
      // translation. Letting pan also run simultaneously causes double-counting of
      // finger movement, which makes the image fly way off-screen on Android.
      if (pinchScale.get() !== 1) {
        return;
      }
      const screenSize = measureSafeArea();
      if (!image.width) {
        return;
      }

      const [, , committedScale] = readTransform(committedTransform.get());

      const nextPanTranslation = {
        x: e.translationX / Math.max(1, committedScale - 3),
        y: e.translationY / Math.max(1, committedScale - 3),
      };
      const t = createTransform();
      prependPan(t, nextPanTranslation);
      prependPinch(
        t,
        pinchScale.get(),
        pinchOrigin.get(),
        pinchTranslation.get(),
      );
      prependTransform(t, committedTransform.get());

      // Prevent panning from going out of bounds.
      const [dx, dy] = getExtraTranslationToStayInBounds(t, {
        width: screenSize.width + 200,
        height: screenSize.height + 200,
      });
      nextPanTranslation.x += dx / 2;
      nextPanTranslation.y += dy / 2;
      panTranslation.set(nextPanTranslation);
    })
    .onEnd(() => {
      'worklet';
      // Commit just the pan.
      const t = createTransform();
      prependPan(t, panTranslation.get());
      prependTransform(t, committedTransform.get());
      applyRounding(t);
      committedTransform.set(t);

      // Reset just the pan.
      panTranslation.set({ x: 0, y: 0 });
    });

  const singleTap = Gesture.Tap().onEnd(() => {
    'worklet';
    runOnJS(onTap)();
  });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => {
      'worklet';
      const screenSize = measureSafeArea();
      if (!image.width || !image.aspectRatio) {
        return;
      }
      const [, , committedScale] = readTransform(committedTransform.get());
      if (committedScale !== 1) {
        // Go back to 1:1 using the identity vector.
        const t = createTransform();
        committedTransform.set(withClampedSpring(t));
        return;
      }

      // Try to zoom in so that we get rid of the black bars (whatever the orientation was).
      const screenAspect = screenSize.width / screenSize.height;
      const candidateScale = Math.max(
        image.aspectRatio / screenAspect,
        screenAspect / image.aspectRatio,
        MIN_SCREEN_ZOOM,
      );
      // But don't zoom in so close that the picture gets blurry.
      const maxScale = getMaxZoomScale(image, screenSize);
      const scale = Math.min(candidateScale, maxScale);

      // Calculate where we would be if the user pinched into the double tapped point.
      // We won't use this transform directly because it may go out of bounds.
      const candidateTransform = createTransform();
      const origin = {
        x: e.absoluteX - screenSize.width / 2,
        y: e.absoluteY - screenSize.height / 2,
      };
      prependPinch(candidateTransform, scale, origin, { x: 0, y: 0 });

      // Now we know how much we went out of bounds, so we can shoot correctly.
      const [dx, dy] = getExtraTranslationToStayInBounds(
        candidateTransform,
        screenSize,
      );
      const finalTransform = createTransform();
      prependPinch(finalTransform, scale, origin, { x: dx, y: dy });
      committedTransform.set(withClampedSpring(finalTransform));
    });

  const composedGesture = isScrollViewBeingDragged
    ? // If the parent is not at rest, provide a no-op gesture.
      Gesture.Manual()
    : Gesture.Exclusive(
        dismissSwipePan,
        Gesture.Simultaneous(pinch, pan),
        doubleTap,
        singleTap,
      );

  const containerStyle = useAnimatedStyle(() => {
    const { scaleAndMoveTransform, isHidden } = transforms.get();
    // Apply the active adjustments on top of the committed transform before the gestures.
    // This is matrix multiplication, so operations are applied in the reverse order.
    const t = createTransform();
    prependPan(t, panTranslation.get());
    prependPinch(
      t,
      pinchScale.get(),
      pinchOrigin.get(),
      pinchTranslation.get(),
    );
    prependTransform(t, committedTransform.get());
    const [translateX, translateY, scale] = readTransform(t);
    const manipulationTransform = [
      { translateX },
      { translateY: translateY },
      { scale },
    ];
    const screenSize = measureSafeArea();
    return {
      opacity: isHidden ? 0 : 1,
      transform: scaleAndMoveTransform.concat(manipulationTransform),
      width: screenSize.width,
      maxHeight: screenSize.height,
      alignSelf: 'center',
      aspectRatio: image.aspectRatio ?? 1 /* force onLoad */,
    };
  });

  const imageCropStyle = useAnimatedStyle(() => {
    const { cropFrameTransform, borderRadiusTransform } = transforms.get();
    return {
      flex: 1,
      overflow: 'hidden',
      transform: cropFrameTransform,
      borderRadius: image.type === 'circle' ? 1000 : borderRadiusTransform,
    };
  });

  const imageStyle = useAnimatedStyle(() => {
    const { cropContentTransform } = transforms.get();
    return {
      flex: 1,
      transform: cropContentTransform,
      opacity: image.aspectRatio === undefined ? 0 : 1,
    };
  });

  const [showLoader, setShowLoader] = React.useState(false);
  const [hasLoaded, setHasLoaded] = React.useState(false);

  useAnimatedReaction(
    () => {
      return transforms.get().isResting && !hasLoaded;
    },
    (show, prevShow) => {
      if (!prevShow && show) {
        runOnJS(setShowLoader)(true);
      } else if (prevShow && !show) {
        runOnJS(setShowLoader)(false);
      }
    },
  );

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        ref={containerRef}
        style={[t.flex1, { overflow: 'hidden', justifyContent: 'center' }]}
        renderToHardwareTextureAndroid
      >
        <Animated.View style={containerStyle}>
          {showLoader && (
            <ActivityIndicator
              size="small"
              color="#FFF"
              style={[
                t.absolute,
                t.top0,
                t.left0,
                t.right0,
                t.bottom0,
                { justifyContent: 'center' },
              ]}
            />
          )}
          <Animated.View style={imageCropStyle}>
            <Animated.View style={imageStyle}>
              <Image
                source={{ uri: image.original, headers: imageRequestHeaders }}
                placeholder={{ uri: image.thumbnail }}
                placeholderContentFit="contain"
                style={[t.flex1]}
                contentFit={image.type === 'circle' ? 'cover' : 'contain'}
                contentPosition="center"
                cachePolicy="memory-disk"
                onLoad={hasLoaded ? undefined : () => setHasLoaded(true)}
              />
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

function getScaledDimensions(
  imageAspect: number,
  scale: number,
  screenSize: { width: number; height: number },
): { width: number; height: number } {
  'worklet';
  const screenAspect = screenSize.width / screenSize.height;
  const isLandscape = imageAspect > screenAspect;
  if (isLandscape) {
    return {
      width: scale * screenSize.width,
      height: (scale * screenSize.width) / imageAspect,
    };
  } else {
    return {
      width: scale * screenSize.height * imageAspect,
      height: scale * screenSize.height,
    };
  }
}

function clampTranslation(
  value: number,
  scaledSize: number,
  screenSize: number,
): number {
  'worklet';
  // Figure out how much the user should be allowed to pan, and constrain the translation.
  const panDistance = Math.max(0, (scaledSize - screenSize) / 2);
  const clampedValue = Math.min(Math.max(-panDistance, value), panDistance);
  return clampedValue;
}

function withClampedSpring(value: TransformMatrix) {
  'worklet';
  return withSpring(value, { overshootClamping: true });
}
