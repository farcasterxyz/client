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
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaFrame } from 'react-native-safe-area-context';

import { imageRequestHeaders } from '~/constants/Images';
import { ActiveLightboxImage } from '~/contexts/LightboxProvider';

type Transform = Exclude<TransformsStyle['transform'], string | undefined>;

const MAX_ORIGINAL_IMAGE_ZOOM = 2;
const MIN_SCREEN_ZOOM = 2;

const LIGHTBOX_CONTENT_CONTAINER_STYLE = {
  flexGrow: 1,
  justifyContent: 'center' as const,
};

export function LightboxImage({
  image,
  measureSafeArea,
  transforms,
  onTap,
  dismissSwipePan,
  onZoom,
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
}) {
  const t = useTheme();
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();
  const [scaled, setScaled] = React.useState(false);
  const isDragging = useSharedValue(false);
  const screenSizeDelayedForJSThreadOnly = useSafeAreaFrame();

  const maxZoomScale = Math.max(
    MIN_SCREEN_ZOOM,
    (image.width / screenSizeDelayedForJSThreadOnly.width) *
      MAX_ORIGINAL_IMAGE_ZOOM,
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll(e) {
      'worklet';
      const nextIsScaled = e.zoomScale > 1;
      if (scaled !== nextIsScaled) {
        runOnJS(handleZoom)(nextIsScaled);
      }
    },
    onBeginDrag() {
      'worklet';
      isDragging.value = true;
    },
    onEndDrag() {
      'worklet';
      isDragging.value = false;
    },
  });

  function handleZoom(nextIsScaled: boolean) {
    onZoom(nextIsScaled);
    setScaled(nextIsScaled);
  }

  function zoomTo(nextZoomRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) {
    const scrollResponderRef = scrollViewRef?.current?.getScrollResponder();
    scrollResponderRef?.scrollResponderZoomTo({
      ...nextZoomRect,
      animated: true,
    });
  }

  const singleTap = Gesture.Tap().onEnd(() => {
    'worklet';
    runOnJS(onTap)();
  });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => {
      'worklet';
      const screenSize = measureSafeArea();
      const { absoluteX, absoluteY } = e;
      let nextZoomRect = {
        x: 0,
        y: 0,
        width: screenSize.width,
        height: screenSize.height,
      };
      const willZoom = !scaled;
      if (willZoom) {
        nextZoomRect = getZoomRectAfterDoubleTap(
          image.aspectRatio,
          absoluteX,
          absoluteY,
          screenSize,
        );
      }
      runOnJS(zoomTo)(nextZoomRect);
    });

  const composedGesture = Gesture.Exclusive(
    dismissSwipePan,
    doubleTap,
    singleTap,
  );

  const containerStyle = useAnimatedStyle(() => {
    const { scaleAndMoveTransform, isHidden } = transforms.get();
    return {
      flex: 1,
      transform: scaleAndMoveTransform,
      opacity: isHidden ? 0 : 1,
    };
  });

  const imageCropStyle = useAnimatedStyle(() => {
    const screenSize = measureSafeArea();
    const { cropFrameTransform, borderRadiusTransform } = transforms.get();
    return {
      overflow: 'hidden',
      transform: cropFrameTransform,
      width: screenSize.width,
      maxHeight: screenSize.height,
      alignSelf: 'center',
      aspectRatio: image.aspectRatio ?? 1 /* force onLoad */,
      opacity: image.aspectRatio === undefined ? 0 : 1,
      borderRadius: image.type === 'circle' ? 1000 : borderRadiusTransform,
    };
  });

  const imageStyle = useAnimatedStyle(() => {
    const { cropContentTransform } = transforms.get();
    return {
      transform: cropContentTransform,
      width: '100%',
      aspectRatio: image.aspectRatio ?? 1 /* force onLoad */,
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

  const scrollViewProps = useAnimatedProps(() => ({
    bounces: scaled || isDragging.value,
    // When the image is at its natural zoom (1x) the user shouldn't be
    // able to pan it around the viewer — pinch-to-zoom, double-tap-to-
    // zoom, and drag-to-dismiss all flow through gesture handlers, so
    // the ScrollView itself only needs to accept input while zoomed.
    scrollEnabled: scaled,
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.ScrollView
        ref={scrollViewRef}
        pinchGestureEnabled
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        maximumZoomScale={maxZoomScale}
        onScroll={scrollHandler}
        style={containerStyle}
        animatedProps={scrollViewProps}
        // Keep iOS auto-inset adjustment off — without this the lightbox
        // ScrollView's chrome-aware inset state cascades into sibling
        // UIScrollViews (e.g. the cast detail FlatList) on PagerView
        // teardown, bringing back the blank-space-at-top bug.
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        // Center vertically via flex on the content container rather than
        // relying on UIScrollView's `centerContent` (which is effectively
        // disabled by the inset-adjust flags above).
        contentContainerStyle={LIGHTBOX_CONTENT_CONTAINER_STYLE}
      >
        {showLoader && (
          <ActivityIndicator
            size="small"
            color="#FFF"
            style={[t.absolute, t.top0, t.left0, t.right0, t.bottom0]}
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
      </Animated.ScrollView>
    </GestureDetector>
  );
}

const getZoomRectAfterDoubleTap = (
  imageAspect: number | undefined,
  touchX: number,
  touchY: number,
  screenSize: { width: number; height: number },
): {
  x: number;
  y: number;
  width: number;
  height: number;
} => {
  'worklet';
  if (!imageAspect) {
    return {
      x: 0,
      y: 0,
      width: screenSize.width,
      height: screenSize.height,
    };
  }

  // First, let's figure out how much we want to zoom in.
  // We want to try to zoom in at least close enough to get rid of black bars.
  const screenAspect = screenSize.width / screenSize.height;
  const zoom = Math.max(
    imageAspect / screenAspect,
    screenAspect / imageAspect,
    MIN_SCREEN_ZOOM,
  );
  // Unlike in the Android version, we don't constrain the *max* zoom level here.
  // Instead, this is done in the ScrollView props so that it constraints pinch too.

  // Next, we'll be calculating the rectangle to "zoom into" in screen coordinates.
  // We already know the zoom level, so this gives us the rectangle size.
  const rectWidth = screenSize.width / zoom;
  const rectHeight = screenSize.height / zoom;

  // Before we settle on the zoomed rect, figure out the safe area it has to be inside.
  // We don't want to introduce new black bars or make existing black bars unbalanced.
  let minX = 0;
  let minY = 0;
  let maxX = screenSize.width - rectWidth;
  let maxY = screenSize.height - rectHeight;
  if (imageAspect >= screenAspect) {
    // The image has horizontal black bars. Exclude them from the safe area.
    const renderedHeight = screenSize.width / imageAspect;
    const horizontalBarHeight = (screenSize.height - renderedHeight) / 2;
    minY += horizontalBarHeight;
    maxY -= horizontalBarHeight;
  } else {
    // The image has vertical black bars. Exclude them from the safe area.
    const renderedWidth = screenSize.height * imageAspect;
    const verticalBarWidth = (screenSize.width - renderedWidth) / 2;
    minX += verticalBarWidth;
    maxX -= verticalBarWidth;
  }

  // Finally, we can position the rect according to its size and the safe area.
  let rectX;
  if (maxX >= minX) {
    // Content fills the screen horizontally so we have horizontal wiggle room.
    // Try to keep the tapped point under the finger after zoom.
    rectX = touchX - touchX / zoom;
    rectX = Math.min(rectX, maxX);
    rectX = Math.max(rectX, minX);
  } else {
    // Keep the rect centered on the screen so that black bars are balanced.
    rectX = screenSize.width / 2 - rectWidth / 2;
  }
  let rectY;
  if (maxY >= minY) {
    // Content fills the screen vertically so we have vertical wiggle room.
    // Try to keep the tapped point under the finger after zoom.
    rectY = touchY - touchY / zoom;
    rectY = Math.min(rectY, maxY);
    rectY = Math.max(rectY, minY);
  } else {
    // Keep the rect centered on the screen so that black bars are balanced.
    rectY = screenSize.height / 2 - rectHeight / 2;
  }

  return {
    x: rectX,
    y: rectY,
    height: rectHeight,
    width: rectWidth,
  };
};
