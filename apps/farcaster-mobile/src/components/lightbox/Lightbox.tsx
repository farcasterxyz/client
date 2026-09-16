import {
  cacheDirectory,
  createDownloadResumable,
} from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { AnimatedPressable, useTheme } from 'farcaster-expo';
import { MoreHorizontal, X } from 'lucide-react-native';
import React from 'react';
import { BackHandler, PixelRatio, Platform, View } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import PagerView from 'react-native-pager-view';
import Animated, {
  AnimatedRef,
  cancelAnimation,
  interpolate,
  measure,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  useSafeAreaFrame,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  ActiveLightbox,
  ActiveLightboxImage,
  useLightbox,
} from '~/contexts/LightboxProvider';
import { trackError } from '~/utils/ErrorUtils';
import { createUUID } from '~/utils/UUIDUtils';

import { LightboxImage, type Transform } from './LightboxImage';

const SLOW_SPRING_CONFIG = {
  mass: Platform.OS === 'ios' ? 1.25 : 0.75,
  damping: 300,
  stiffness: 800,
  restDisplacementThreshold: 0.01,
  overshootClamping: true,
};

const FAST_SPRING_CONFIG = {
  mass: Platform.OS === 'ios' ? 1.25 : 0.75,
  damping: 150,
  stiffness: 900,
  restDisplacementThreshold: 0.01,
  overshootClamping: true,
};

export function Lightbox() {
  const { activeLightbox, closeLightbox, activeLightboxRef } = useLightbox();

  const onClose = React.useCallback(() => {
    closeLightbox();
  }, [closeLightbox]);

  const onCloseAnimationFinish = React.useCallback(() => {
    'worklet';
    activeLightboxRef.value = null;
  }, [activeLightboxRef]);

  const onUpdateIndex = React.useCallback(
    (index: number) => {
      activeLightboxRef.set(activeLightbox?.images[index].original ?? null);
    },
    [activeLightbox, activeLightboxRef],
  );

  return (
    <LightboxContent
      lightbox={activeLightbox}
      onClose={onClose}
      onCloseAnimationFinish={onCloseAnimationFinish}
      onUpdateIndex={onUpdateIndex}
    />
  );
}

// Stable, non-empty placeholder source for the always-mounted Image and
// the React `key` derived from `image.original`, kept well-formed while
// the lightbox is invisible (hidden by the outer `opacity: 0` wrapper).
//
// This is a 1x1 transparent GIF inlined as a data URI. expo-image decodes
// data URIs in-process, so it never hits the network. A custom scheme
// (the previous `placeholder://lightbox`) is NOT silently ignored — iOS
// tries to fetch it and fails with `NSURLErrorDomain -1002 (unsupported
// URL)`, which dominated RUM network-error tracking (see NEYN-11741).
const PLACEHOLDER_IMAGE_URI =
  'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
const PLACEHOLDER_LIGHTBOX: ActiveLightbox = {
  index: 0,
  images: [
    {
      original: PLACEHOLDER_IMAGE_URI,
      thumbnail: PLACEHOLDER_IMAGE_URI,
      aspectRatio: 1,
      width: 1,
      rect: null,
    },
  ],
};

function LightboxContent({
  lightbox,
  onClose,
  onCloseAnimationFinish,
  onUpdateIndex,
}: {
  lightbox: ActiveLightbox | null;
  onClose: () => void;
  onCloseAnimationFinish: () => void;
  onUpdateIndex: (index: number) => void;
}) {
  const t = useTheme();
  const [activeLightbox, setActiveLightbox] =
    React.useState<ActiveLightbox | null>(lightbox);

  const openProgress = useSharedValue(0);
  const dismissTranslateY = useSharedValue(0);
  const dismissTranslateX = useSharedValue(0);
  const safeAreaRef = useAnimatedRef<View>();

  if (!activeLightbox && lightbox) {
    setActiveLightbox(lightbox);
  }

  React.useEffect(() => {
    if (!lightbox) {
      return;
    }

    dismissTranslateY.set(0);
    dismissTranslateX.set(0);

    _requestAnimationFrame(() => {
      openProgress.set(withSpring(1, SLOW_SPRING_CONFIG));
    });

    return () => {
      _requestAnimationFrame(() => {
        openProgress.set(
          withSpring(0, SLOW_SPRING_CONFIG, onCloseAnimationFinish),
        );
      });
    };
  }, [
    lightbox,
    openProgress,
    dismissTranslateY,
    dismissTranslateX,
    onCloseAnimationFinish,
  ]);

  useAnimatedReaction(
    () => openProgress.get() === 0,
    (isOpen, wasOpen) => {
      if (isOpen && !wasOpen) {
        runOnJS(setActiveLightbox)(null);
      }
    },
  );

  // Always-render LightboxGallery (with a placeholder when inactive) so
  // PagerView never unmounts. PagerView is backed by UIPageViewController
  // on iOS; tearing it down was leaving safe-area / contentInset state
  // behind on the parent nav controller, which then cascaded into
  // sibling UIScrollViews as accumulating top inset. Keeping it mounted
  // permanently costs the idle memory of one inactive paged scroll view.
  const galleryLightbox = activeLightbox ?? PLACEHOLDER_LIGHTBOX;
  return (
    <View
      style={[
        t.absolute,
        t.top0,
        t.left0,
        t.right0,
        t.bottom0,
        !activeLightbox && {
          opacity: 0,
          pointerEvents: 'none',
        },
      ]}
    >
      <Animated.View ref={safeAreaRef} style={[t.flex1]} collapsable={false}>
        <LightboxGallery
          lightbox={galleryLightbox}
          onClose={onClose}
          openProgress={openProgress}
          dismissTranslateY={dismissTranslateY}
          dismissTranslateX={dismissTranslateX}
          safeAreaRef={safeAreaRef}
          onUpdateIndex={onUpdateIndex}
        />
      </Animated.View>
    </View>
  );
}

function LightboxGallery({
  lightbox,
  onClose,
  openProgress,
  dismissTranslateY,
  dismissTranslateX,
  safeAreaRef,
  onUpdateIndex,
}: {
  lightbox: ActiveLightbox;
  onClose: () => void;
  openProgress: SharedValue<number>;
  dismissTranslateY: SharedValue<number>;
  dismissTranslateX: SharedValue<number>;
  safeAreaRef: AnimatedRef<View>;
  onUpdateIndex: (index: number) => void;
}) {
  const t = useTheme();

  const [showHeader, setShowHeader] = React.useState(true);
  const [isScaled, setIsScaled] = React.useState(false);
  const [itemIndex, setItemIndex] = React.useState(lightbox.index);
  const pagerViewRef = React.useRef<PagerView>(null);

  // PagerView is permanently mounted to avoid the UIPageViewController
  // teardown leak; `initialPage` is only respected on first mount, so we
  // imperatively sync the page when a real lightbox replaces the
  // placeholder, otherwise the wrong image would show on open.
  const isPlaceholder = lightbox === PLACEHOLDER_LIGHTBOX;
  const lightboxIdentity = lightbox.images[0]?.original ?? '';
  React.useEffect(() => {
    if (isPlaceholder) return;
    pagerViewRef.current?.setPageWithoutAnimation(lightbox.index);
    setItemIndex(lightbox.index);
  }, [isPlaceholder, lightbox.index, lightboxIdentity]);

  const onTap = React.useCallback(() => {
    setShowHeader((show) => !show);
  }, []);

  const onZoom = React.useCallback((nextIsScaled: boolean) => {
    setIsScaled(nextIsScaled);
    if (nextIsScaled) {
      setShowHeader(false);
    }
  }, []);

  // Handle Android back button — but only while a real lightbox is open.
  // LightboxGallery is permanently mounted (placeholder when inactive) to avoid a
  // PagerView teardown inset leak; registering this handler for the placeholder makes
  // it swallow every back event app-wide (it returns true), breaking the hardware back
  // button and the edge-swipe-back gesture on all screens.
  React.useEffect(() => {
    if (Platform.OS !== 'android' || isPlaceholder) {
      return;
    }

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onClose();
        return true; // Prevent default back behavior
      },
    );

    return () => backHandler.remove();
  }, [onClose, isPlaceholder]);

  const backdropStyle = useAnimatedStyle(() => {
    return {
      opacity:
        openProgress.get() -
        Math.min(0.5, Math.abs(dismissTranslateY.get()) * 0.001),
    };
  });
  const insets = useSafeAreaInsets();
  const headerStyle = useAnimatedStyle(() => {
    const show = showHeader && dismissTranslateY.get() === 0;

    return {
      pointerEvents: show ? 'box-none' : 'none',
      opacity: withSpring(
        show && openProgress.get() === 1 ? 1 : 0,
        FAST_SPRING_CONFIG,
      ),
      transform: [
        {
          translateY: withSpring(show ? 0 : -30, FAST_SPRING_CONFIG),
        },
      ],
    };
  });

  return (
    <View style={[t.flex1]}>
      <Animated.View
        style={[
          t.absolute,
          t.top0,
          t.left0,
          t.right0,
          t.bottom0,
          {
            backgroundColor: '#000',
          },
          backdropStyle,
        ]}
        renderToHardwareTextureAndroid
      />
      <PagerView
        ref={pagerViewRef}
        scrollEnabled={!isScaled && lightbox.images.length !== 1}
        initialPage={lightbox.index}
        onPageSelected={(e) => {
          setItemIndex(e.nativeEvent.position);
          onUpdateIndex(e.nativeEvent.position);
          setIsScaled(false);
        }}
        overdrag={true}
        style={[t.flex1]}
      >
        {lightbox.images.map((image, index) => (
          <LightboxGalleryItem
            key={image.original}
            lightboxItem={image}
            openProgress={openProgress}
            dismissTranslateY={dismissTranslateY}
            dismissTranslateX={dismissTranslateX}
            isScaled={isScaled}
            onTap={onTap}
            onZoom={onZoom}
            onClose={onClose}
            safeAreaRef={safeAreaRef}
            isActive={index === itemIndex}
          />
        ))}
      </PagerView>
      <Animated.View
        style={[
          t.absolute,
          t.top0,
          t.left0,
          t.right0,
          { marginTop: insets.top },
          headerStyle,
        ]}
      >
        <LightboxHeader
          lightbox={lightbox}
          index={itemIndex}
          onClose={onClose}
        />
      </Animated.View>
    </View>
  );
}

function LightboxGalleryItem({
  lightboxItem,
  openProgress,
  dismissTranslateY,
  dismissTranslateX,
  isScaled,
  isActive,
  onTap,
  onZoom,
  onClose,
  safeAreaRef,
}: {
  lightboxItem: ActiveLightboxImage;
  openProgress: SharedValue<number>;
  dismissTranslateY: SharedValue<number>;
  dismissTranslateX: SharedValue<number>;
  isScaled: boolean;
  isActive: boolean;
  onTap: () => void;
  onZoom: (nextIsScaled: boolean) => void;
  onClose: () => void;
  safeAreaRef: AnimatedRef<View>;
}) {
  const safeFrameDelayedForJSThreadOnly = useSafeAreaFrame();
  const safeInsetsDelayedForJSThreadOnly = useSafeAreaInsets();

  const measureSafeArea = React.useCallback(() => {
    'worklet';
    let safeArea: {
      x: number;
      y: number;
      width: number;
      height: number;
    } | null = measure(safeAreaRef);
    if (!safeArea) {
      const frame = safeFrameDelayedForJSThreadOnly;
      const insets = safeInsetsDelayedForJSThreadOnly;
      safeArea = {
        x: frame.x + insets.left,
        y: frame.y + insets.top,
        width: frame.width - insets.left - insets.right,
        height: frame.height - insets.top - insets.bottom,
      };
    }
    return safeArea;
  }, [
    safeFrameDelayedForJSThreadOnly,
    safeInsetsDelayedForJSThreadOnly,
    safeAreaRef,
  ]);

  const transforms = useDerivedValue(() => {
    'worklet';
    const safeArea = measureSafeArea();
    const openProgressValue = openProgress.get();
    const translateY = dismissTranslateY.get() * 0.25;
    const translateX = dismissTranslateX.get() * 0.25;
    const scale = Math.min(1, Math.max(0.9, 1 - Math.abs(translateY) / 400));
    const borderRadius =
      translateY === 0
        ? 12 - openProgressValue * 12
        : Math.min(16, Math.abs(translateY) / 2);

    if (openProgressValue === 0) {
      return {
        isHidden: true,
        isResting: false,
        scaleAndMoveTransform: [],
        cropFrameTransform: [],
        cropContentTransform: [],
        borderRadiusTransform: 0,
      };
    }

    if (isActive && lightboxItem?.rect && openProgressValue < 1) {
      return interpolateTransform(
        openProgressValue,
        lightboxItem.rect,
        safeArea,
        lightboxItem.aspectRatio,
        {
          translateY,
          translateX,
          scale,
          borderRadius,
        },
      );
    }

    return {
      isHidden: false,
      isResting: translateY === 0 && translateX === 0,
      scaleAndMoveTransform: [
        {
          translateY:
            translateY > 0
              ? 200 * (1 - Math.exp(-translateY / 100))
              : -200 * (1 - Math.exp(translateY / 100)),
        },
        {
          translateX,
        },
        {
          scale,
        },
      ],
      cropFrameTransform: [],
      cropContentTransform: [],
      borderRadiusTransform: borderRadius,
    };
  });

  const dismissSwipePan = Gesture.Pan()
    .enabled(isActive && !isScaled)
    .activeOffsetY([-10, 10])
    .failOffsetX([-10, 10])
    .maxPointers(1)
    .onUpdate((e) => {
      'worklet';
      if (openProgress.get() !== 1) {
        return;
      }
      dismissTranslateY.set(e.translationY);
      dismissTranslateX.set(e.translationX);
    })
    .onEnd((e) => {
      'worklet';
      if (openProgress.get() !== 1) {
        return;
      }
      if (Math.abs(e.velocityY) > 200 || Math.abs(e.translationY) > 100) {
        runOnJS(onClose)();
      } else {
        dismissTranslateY.set(() => {
          'worklet';
          return withSpring(0, {
            stiffness: 700,
            damping: 50,
          });
        });
        dismissTranslateX.set(() => {
          'worklet';
          return withSpring(0, {
            stiffness: 700,
            damping: 50,
          });
        });
      }
    });

  const onFlyAway = React.useCallback(() => {
    'worklet';
    openProgress.set(0);
    runOnJS(onClose)();
  }, [onClose, openProgress]);

  useAnimatedReaction(
    () => {
      const screenSize = measure(safeAreaRef);
      return (
        !screenSize || Math.abs(dismissTranslateY.get()) > screenSize.height
      );
    },
    (isOut, wasOut) => {
      if (isOut && !wasOut) {
        // Stop the animation from blocking the screen forever.
        cancelAnimation(dismissTranslateY);
        onFlyAway();
      }
    },
  );

  return (
    <LightboxImage
      image={lightboxItem}
      measureSafeArea={measureSafeArea}
      transforms={transforms}
      onTap={onTap}
      dismissSwipePan={dismissSwipePan}
      onZoom={onZoom}
    />
  );
}

function LightboxHeader({
  lightbox,
  index,
  onClose,
}: {
  lightbox: ActiveLightbox;
  index: number;
  onClose: () => void;
}) {
  const t = useTheme();

  const handleSharePress = React.useCallback(async () => {
    if (!lightbox.images[index]) {
      return;
    }

    // Default to PNG if the mime type is not set
    const mimeType = lightbox.images[index].mimeType ?? 'image/png';

    const uri = lightbox.images[index].original;
    const filename = createUUID();
    const ext = mimeType.split('/')[1];
    const path = `${cacheDirectory}/${filename}.${ext}`;

    const download = createDownloadResumable(uri, path, { cache: true });
    const timeout = setTimeout(() => download.cancelAsync(), 5_000);
    const result = await download.downloadAsync();
    clearTimeout(timeout);

    if (!result?.uri) {
      trackError(new Error('Failed to download image'), {
        uri,
        path,
      });
      return;
    }

    await Sharing.shareAsync(result.uri, {
      mimeType,
      UTI: mimeType,
    });
  }, [lightbox, index]);

  return (
    <View style={[t.pX3, t.flexRow, t.justifyBetween]}>
      <AnimatedPressable
        style={[
          t.w9,
          t.h9,
          t.itemsCenter,
          t.justifyCenter,
          t.roundedFull,
          { backgroundColor: '#1E1E1E' },
        ]}
        onPress={onClose}
      >
        <X color="#FFF" />
      </AnimatedPressable>
      <AnimatedPressable
        style={[
          t.w9,
          t.h9,
          t.itemsCenter,
          t.justifyCenter,
          t.roundedFull,
          { backgroundColor: '#1E1E1E' },
        ]}
        onPressIn={handleSharePress}
      >
        <MoreHorizontal color="#FFF" />
      </AnimatedPressable>
    </View>
  );
}

const PIXEL_RATIO = PixelRatio.get();

function interpolatePx(
  px: number,
  inputRange: readonly number[],
  outputRange: readonly number[],
) {
  'worklet';
  const value = interpolate(px, inputRange, outputRange);
  return Math.round(value * PIXEL_RATIO) / PIXEL_RATIO;
}

function interpolateTransform(
  progress: number,
  thumbnailDims: {
    pageX: number;
    width: number;
    pageY: number;
    height: number;
  },
  safeArea: { width: number; height: number; x: number; y: number },
  imageAspect: number,
  dismissTransform: {
    translateY: number;
    translateX: number;
    scale: number;
    borderRadius: number;
  },
): {
  scaleAndMoveTransform: Transform;
  cropFrameTransform: Transform;
  cropContentTransform: Transform;
  borderRadiusTransform: number;
  isResting: boolean;
  isHidden: boolean;
} {
  'worklet';
  const thumbAspect = thumbnailDims.width / thumbnailDims.height;
  let uncroppedInitialWidth;
  let uncroppedInitialHeight;
  if (imageAspect > thumbAspect) {
    uncroppedInitialWidth = thumbnailDims.height * imageAspect;
    uncroppedInitialHeight = thumbnailDims.height;
  } else {
    uncroppedInitialWidth = thumbnailDims.width;
    uncroppedInitialHeight = thumbnailDims.width / imageAspect;
  }
  const safeAreaAspect = safeArea.width / safeArea.height;
  let finalWidth;
  let finalHeight;
  if (safeAreaAspect > imageAspect) {
    finalWidth = safeArea.height * imageAspect;
    finalHeight = safeArea.height;
  } else {
    finalWidth = safeArea.width;
    finalHeight = safeArea.width / imageAspect;
  }
  const initialScale = Math.min(
    uncroppedInitialWidth / finalWidth,
    uncroppedInitialHeight / finalHeight,
  );
  const croppedFinalWidth = thumbnailDims.width / initialScale;
  const croppedFinalHeight = thumbnailDims.height / initialScale;
  const screenCenterX = safeArea.width / 2;
  const screenCenterY = safeArea.height / 2;
  const thumbnailSafeAreaX = thumbnailDims.pageX - safeArea.x;
  const thumbnailSafeAreaY = thumbnailDims.pageY - safeArea.y;
  const thumbnailCenterX = thumbnailSafeAreaX + thumbnailDims.width / 2;
  const thumbnailCenterY = thumbnailSafeAreaY + thumbnailDims.height / 2;
  const initialTranslateX = thumbnailCenterX - screenCenterX;
  const initialTranslateY = thumbnailCenterY - screenCenterY;
  const scale = interpolate(
    progress,
    [0, 1],
    [initialScale, dismissTransform.scale],
  );
  const translateX = interpolatePx(
    progress,
    [0, 1],
    [initialTranslateX, dismissTransform.translateX],
  );
  const translateY = interpolatePx(
    progress,
    [0, 1],
    [initialTranslateY, dismissTransform.translateY],
  );
  const cropScaleX = interpolate(
    progress,
    [0, 1],
    [croppedFinalWidth / finalWidth, 1],
  );
  const cropScaleY = interpolate(
    progress,
    [0, 1],
    [croppedFinalHeight / finalHeight, 1],
  );
  return {
    isHidden: false,
    isResting: progress === 1,
    scaleAndMoveTransform: [{ translateX }, { translateY }, { scale }],
    cropFrameTransform: [{ scaleX: cropScaleX }, { scaleY: cropScaleY }],
    cropContentTransform: [
      { scaleX: 1 / cropScaleX },
      { scaleY: 1 / cropScaleY },
    ],
    borderRadiusTransform: dismissTransform.borderRadius,
  };
}

// We have to do this because we can't trust RN's requestAnimationFrame to fire in order.
// https://github.com/facebook/react-native/issues/48005
let isFrameScheduled = false;
let pendingFrameCallbacks: Array<() => void> = [];
function _requestAnimationFrame(callback: () => void) {
  pendingFrameCallbacks.push(callback);
  if (!isFrameScheduled) {
    isFrameScheduled = true;
    requestAnimationFrame(() => {
      const callbacks = pendingFrameCallbacks.slice();
      isFrameScheduled = false;
      pendingFrameCallbacks = [];
      let hasError = false;
      let error;
      for (let i = 0; i < callbacks.length; i++) {
        try {
          callbacks[i]();
        } catch (e) {
          hasError = true;
          error = e;
        }
      }
      if (hasError) {
        throw error;
      }
    });
  }
}
