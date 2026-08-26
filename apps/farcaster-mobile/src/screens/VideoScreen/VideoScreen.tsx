import { DdRum, ErrorSource } from '@datadog/mobile-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import {
  StackScreenProps,
  useGestureHandlerRef,
} from '@react-navigation/stack';
import { Image } from 'expo-image';
import { VideoPlayer } from 'expo-video';
import { AnalyticsEvent } from 'farcaster-analytics';
import type { ApiCast, ApiCastVideoEmbed } from 'farcaster-client-data';
import {
  useFetchThread,
  useGetGloballyCachedCast,
  useNonSuspenseFeedItems,
} from 'farcaster-client-hooks';
import throttle from 'lodash.throttle';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Dimensions,
  InteractionManager,
  ListRenderItem,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StatusBar,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  FlatList,
  Gesture,
  GestureDetector,
  GestureStateChangeEvent,
  GestureUpdateEvent,
  PanGestureHandler,
  PanGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoadingIndicator } from '~/components/LoadingIndicator';
import { RetryableErrorBoundary } from '~/components/RetryableErrorBoundary';
import { Text2 } from '~/components/Text';
import { BOTTOM_EXCLUSION_HEIGHT } from '~/components/Video/constants';
import { VideoFeedPlayer } from '~/components/Video/VideoFeedPlayer';
import { imageRequestHeaders } from '~/constants/Images';
import { hitSlop } from '~/constants/Pressable';
import { AnalyticsProvider, useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { ResultReturnedNullError, RootStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';

type VideoScreenProps = StackScreenProps<RootStackParamList, 'VideoScreen'>;

const { height: screenHeight } = Dimensions.get('window');
const DISMISS_SCROLL_THRESHOLD = -50; // negative scroll offset to trigger dismiss

// Drag-to-dismiss configuration
const DRAG_DISMISS_DISTANCE_THRESHOLD = 150; // pixels
const DRAG_DISMISS_VELOCITY_THRESHOLD = 800; // pixels per second
const DRAG_ANIMATION_DURATION = 300; // milliseconds
const DRAG_RESISTANCE = 0.6;
const DRAG_SCALE_FACTOR = 0.15;

// Platform-specific gesture thresholds
const IOS_MIN_DISTANCE = 10;
const IOS_MOVEMENT_THRESHOLD = 10;
const IOS_VERTICAL_SCROLL_RATIO = 1.5;
const IOS_HORIZONTAL_DRAG_RATIO = 1.5;

const ANDROID_MIN_DISTANCE = 20;
const ANDROID_HORIZONTAL_THRESHOLD = 15;
const ANDROID_VERTICAL_FAIL_THRESHOLD = 10;

const LIST_BATCH_SIZE = 4;

type VideoItem = {
  cast?: ApiCast;
  videoEmbed: ApiCastVideoEmbed;
  seedCastVideoInCastIndex?: number;
  initialPosition?: number;
  initialIsPlaying?: boolean;
  videoPlayer?: VideoPlayer;
};

const keyExtractor = (item: VideoItem, index: number) =>
  `video-item-${item.videoEmbed.sourceUrl}-${index}`;

function VideoScreen({ route: { params } }: VideoScreenProps) {
  const navigation = useNavigation();

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      DdRum.addViewLoadingTime(true);
    });
  }, []);
  const onBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <AnalyticsProvider>
      <RetryableErrorBoundary onBack={onBack}>
        <VideoScreenContent
          seedVideo={params.seedVideo}
          onClose={params.onClose}
        />
      </RetryableErrorBoundary>
    </AnalyticsProvider>
  );
}

const BackButton = ({ onPress }: { onPress: () => void }) => {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        t.absolute,
        t.top0,
        t.left0,
        t.flexRow,
        { zIndex: 10 },
        t.justifyStart,
        t.p2,
        { minHeight: 40, marginTop: insets.top },
      ]}
    >
      <TouchableOpacity
        style={[
          t.flex,
          t.flexRow,
          t.itemsCenter,
          t.justifyCenter,
          t.directCasts.bgImagePreview,
          t.p1,
          t.roundedFull,
        ]}
        onPress={onPress}
        hitSlop={hitSlop}
      >
        <Ionicons name="chevron-back" size={24} color={t.colors.text.light} />
      </TouchableOpacity>
    </View>
  );
};

const VideoScreenLoading = ({ onBack }: { onBack?: () => void }) => {
  const t = useTheme();
  return (
    <View style={[t.flex1, t.bgBlack, t.itemsCenter, t.justifyCenter]}>
      {onBack && <BackButton onPress={onBack} />}
      <LoadingIndicator />
    </View>
  );
};

function VideoScreenContent({
  seedVideo,
  onClose,
}: {
  seedVideo: VideoScreenProps['route']['params']['seedVideo'];
  onClose: VideoScreenProps['route']['params']['onClose'];
}) {
  const navigation = useNavigation();
  const getGloballyCachedCast = useGetGloballyCachedCast();
  const fetchThread = useFetchThread();

  const t = useTheme();
  const flatListRef = useRef<FlatList<VideoItem>>(null);
  const { trackEvent } = useAnalytics();
  const seedCastRef = useRef<ApiCast>(undefined);
  let loadingSeedCast = false;
  let loadingSeedCastError: Error | null = null;

  const loadSeedCast = async () => {
    if (seedVideo?.castHash && !seedCastRef.current) {
      try {
        const thread = await fetchThread({
          castHash: seedVideo.castHash,
          limit: 1,
        });
        if (!thread.casts.length) {
          loadingSeedCastError = new Error('No cast found');
          return;
        }
        if (thread.casts[0].hash === seedVideo.castHash) {
          seedCastRef.current = thread.casts[0];
        } else {
          loadingSeedCastError = new Error('Cast hash mismatch');
        }
      } catch (error) {
        loadingSeedCastError = error as Error;
      }
    }
    loadingSeedCast = false;
  };
  if (seedVideo?.castHash) {
    if (!seedCastRef.current) {
      seedCastRef.current = getGloballyCachedCast({
        hash: seedVideo.castHash,
        recast: false,
      });
    }
    if (!seedCastRef.current) {
      loadingSeedCast = true;
      loadSeedCast();
    }
  }

  const isTouchingExclusionArea = useRef(false);
  const setTouchingExclusionArea = useCallback((isTouching: boolean) => {
    isTouchingExclusionArea.current = isTouching;
  }, []);

  const initialSeedCastVideoInCastIndexRef = useRef<number>(undefined);
  if (
    initialSeedCastVideoInCastIndexRef.current === undefined &&
    typeof seedVideo?.videoInCastIndex === 'number' &&
    seedVideo.videoInCastIndex >= 0 &&
    seedVideo.videoInCastIndex <
      (seedCastRef.current?.embeds?.videos?.length ?? 0)
  ) {
    initialSeedCastVideoInCastIndexRef.current = seedVideo.videoInCastIndex;
  } else if (initialSeedCastVideoInCastIndexRef.current === undefined) {
    initialSeedCastVideoInCastIndexRef.current = 0;
  }

  const initialOnCloseRef = useRef(onClose);
  const initialSeedVideoRef = useRef(seedVideo);

  // Track video state for the initial video
  const initialSeedVideoStateRef = useRef<{
    position: number;
    isPlaying: boolean;
  }>({
    position: seedVideo?.position || 0,
    isPlaying: seedVideo?.isPlaying ?? true,
  });

  const [controlsVisible, setControlsVisible] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(
    initialSeedCastVideoInCastIndexRef.current,
  );

  // Throttle video index updates to prevent excessive re-renders
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const throttledSetCurrentVideoIndex = useCallback(
    throttle((newIndex: number) => {
      setCurrentVideoIndex(newIndex);
    }, 150),
    [],
  );

  // Drag-to-dismiss state
  const dragTranslateX = useSharedValue(0);
  const dragTranslateY = useSharedValue(0);
  const dragScale = useSharedValue(1);
  const isDragging = useSharedValue(false);

  const [muted, setMuted] = useState(false);
  const toggleMute = useCallback(() => {
    setMuted((prev) => !prev);
  }, []);

  const onNullFeedItemsResponse = useCallback(() => {
    trackError(
      new ResultReturnedNullError({
        screenOrProviderId: 'FeedContent',
      }),
    );
  }, []);

  const {
    isPending,
    feedItems,
    isError,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    error,
  } = useNonSuspenseFeedItems({
    feedKey: 'video',
    feedType: 'default',
    updateState: true,
    purgeToFirstPageOnMount: true,
    seedCastHash: seedCastRef.current?.hash,
    onNullFeedItemsResponse: onNullFeedItemsResponse,
  });

  const numVideosInFeedRef = useRef(0);
  const numSkippedCastsRef = useRef(0);

  const videoNotFromCast = initialSeedVideoRef.current?.castHash
    ? undefined
    : initialSeedVideoRef.current?.video;

  const [displayLimit, setDisplayLimit] = useState(LIST_BATCH_SIZE);
  const feedItemsLength = Math.min(feedItems.length, displayLimit);

  const handleGetFeedItemsWithVideoUpToLimit = useCallback(() => {
    const result: VideoItem[] = [];

    numVideosInFeedRef.current = 0;
    numSkippedCastsRef.current = 0;

    for (const item of feedItems) {
      const videos =
        item.cast.embeds?.videos?.map((video) => ({
          cast: item.cast,
          videoEmbed: video,
        })) ?? [];

      if (videos.length > 0) {
        numVideosInFeedRef.current += videos.length;
      }

      if (videos.length === 0) {
        numSkippedCastsRef.current++;
      }

      for (const video of videos) {
        if (video !== undefined) {
          result.push(video as VideoItem);
          if (result.length >= feedItemsLength) {
            return result;
          }
        }
      }
    }

    return result;
  }, [feedItems, feedItemsLength]);

  useEffect(() => {
    return () => {
      if (numSkippedCastsRef.current === 0) {
        return;
      }

      try {
        DdRum.addError('VideoScreen skipped casts', ErrorSource.CUSTOM, '', {
          fc: true,
          isFatal: false,
          numCastsSkipped: numSkippedCastsRef.current,
        });
      } catch {
        // Do nothing
      }
    };
  }, []);

  const baseVideoItems: VideoItem[] = React.useMemo(
    () => [
      ...((
        seedCastRef.current?.embeds?.videos?.map((video, i) => ({
          cast: seedCastRef.current,
          videoEmbed: video,
          seedCastVideoInCastIndex: i,
          initialPosition:
            i === initialSeedCastVideoInCastIndexRef.current
              ? initialSeedVideoRef.current?.position
              : undefined,
          initialIsPlaying:
            i === initialSeedCastVideoInCastIndexRef.current
              ? initialSeedVideoRef.current?.isPlaying
              : undefined,
          videoPlayer:
            i === initialSeedCastVideoInCastIndexRef.current
              ? initialSeedVideoRef.current?.videoPlayer
              : undefined,
        })) ??
        (videoNotFromCast
          ? [
              {
                cast: undefined,
                videoEmbed: videoNotFromCast,
                seedCastVideoInCastIndex: 0,
                initialPosition: initialSeedVideoRef.current?.position,
                initialIsPlaying: initialSeedVideoRef.current?.isPlaying,
                videoPlayer: initialSeedVideoRef.current?.videoPlayer,
              },
            ]
          : [])
      ).filter((item) => item !== undefined) as VideoItem[]),
      // Only show feed items if there is no seed video or it's from a cast.
      ...(!videoNotFromCast ? handleGetFeedItemsWithVideoUpToLimit() : []),
    ],
    [videoNotFromCast, handleGetFeedItemsWithVideoUpToLimit],
  );

  useEffect(() => {
    trackEvent(AnalyticsEvent.VideoFeedView, {
      source: seedVideo
        ? seedVideo.castHash
          ? 'expand_cast_video'
          : 'expand_dc_video'
        : 'video_feed',
    });
  }, [seedVideo, trackEvent]);

  // The user can navigate from a video to a cast or profile, and from there
  // they can open a new video. When that happens, we want to splice in the
  // selected video in the list of videos
  const [splicedVideos, setSplicedVideos] = useState<
    Array<{ index: number; item: VideoItem }>
  >([]);
  const prevSeedVideoRef = React.useRef(seedVideo);
  useEffect(() => {
    if (
      !seedVideo ||
      !seedVideo.video ||
      seedVideo === prevSeedVideoRef.current
    ) {
      return;
    }
    prevSeedVideoRef.current = seedVideo;

    const { video } = seedVideo;
    const newIndex = currentVideoIndex + 1;
    setSplicedVideos((prevSplicedVideos) => [
      ...prevSplicedVideos,
      {
        index: newIndex,
        item: {
          cast: seedVideo.castHash
            ? getGloballyCachedCast({
                hash: seedVideo.castHash,
                recast: false,
              })
            : undefined,
          videoEmbed: video,
          initialPosition: seedVideo.position,
          initialIsPlaying: seedVideo.isPlaying,
        },
      },
    ]);
    setCurrentVideoIndex(newIndex);
    flatListRef.current?.scrollToIndex({ index: newIndex });
  }, [seedVideo, currentVideoIndex, getGloballyCachedCast]);

  const videoItems = React.useMemo(() => {
    const result = [...baseVideoItems];
    for (const splicedVideo of splicedVideos) {
      result.splice(splicedVideo.index, 0, splicedVideo.item);
    }
    return result;
  }, [baseVideoItems, splicedVideos]);

  // error isn't cleared when the retry button is pressed so created a separate
  // state-based error so we can clear it on button press so the failure indicator
  // doesn't render.
  const [fetchError, setFetchError] = useState<Error | null>(error);
  useEffect(() => {
    setFetchError(error);
  }, [error]);

  const handleEndReached = React.useCallback(() => {
    setFetchError(null);
    setDisplayLimit((prev) =>
      prev >= numVideosInFeedRef.current ? prev : prev + LIST_BATCH_SIZE,
    );
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
    if (!hasNextPage) {
      try {
        DdRum.addError('VideoScreen feed end reached', ErrorSource.CUSTOM, '', {
          fc: true,
          isFatal: false,
        });
      } catch {
        // Do nothing
      }
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const isFocused = useIsFocused();

  useEffect(() => {
    // The system status bar doesn't reset properly on Android
    // so we'll not change it.
    if (Platform.OS === 'android') {
      return;
    }
    const entry = StatusBar.pushStackEntry({
      barStyle: 'light-content',
      backgroundColor: 'transparent',
      translucent: true,
    });

    return () => {
      StatusBar.popStackEntry(entry);
    };
  }, []);

  const currentSeedCastVideoInCastIndex =
    videoItems[currentVideoIndex]?.seedCastVideoInCastIndex;

  const isDismissing = React.useRef(false);
  const handleBack = useCallback(
    ({ gesture }: { gesture: 'swipe' | 'drag' | 'press' | 'native' }) => {
      if (isDismissing.current) {
        return;
      }
      isDismissing.current = true;
      // Only call onClose callback for the initial seed video (at its original index)
      if (
        initialOnCloseRef.current &&
        currentSeedCastVideoInCastIndex ===
          initialSeedCastVideoInCastIndexRef.current
      ) {
        initialOnCloseRef.current({
          position: initialSeedVideoStateRef.current.position,
          isPlaying: initialSeedVideoStateRef.current.isPlaying,
        });
      }
      trackEvent(AnalyticsEvent.VideoFeedDismiss, { gesture });
      navigation.goBack();
    },
    [navigation, currentSeedCastVideoInCastIndex, trackEvent],
  );

  useEffect(() => {
    if (Platform.OS === 'android') {
      const onBackPress = () => {
        // Prevent back gesture from interfering with video controls
        if (isFocused && !isTouchingExclusionArea.current) {
          handleBack({ gesture: 'native' });
        }
        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      return () => subscription.remove();
    }
  }, [isFocused, handleBack]);

  const handleControlsVisibilityChange = useCallback((visible: boolean) => {
    setControlsVisible(visible);
  }, []);

  // Handle scroll to track position and detect dismiss gesture with platform optimizations
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset } = event.nativeEvent;

      // Platform-specific index calculation for better precision
      let newIndex: number;
      if (Platform.OS === 'android') {
        // More precise calculation for Android to prevent overshooting
        const scrollRatio = contentOffset.y / screenHeight;
        newIndex = Math.round(scrollRatio);

        // Clamp to valid range to prevent invalid indices
        newIndex = Math.max(0, Math.min(newIndex, videoItems.length - 1));
      } else {
        newIndex = Math.round(contentOffset.y / screenHeight);
      }

      if (newIndex < currentVideoIndex) {
        trackEvent(AnalyticsEvent.VideoFeedSwipeUp, {
          videoIndex: newIndex,
        });
      } else if (newIndex > currentVideoIndex) {
        trackEvent(AnalyticsEvent.VideoFeedSwipeDown, {
          videoIndex: newIndex,
        });
      }

      if (newIndex !== currentVideoIndex && newIndex >= 0) {
        // Use throttled version to prevent excessive re-renders
        throttledSetCurrentVideoIndex(newIndex);
      }

      // Handle dismiss when scrolling down on first video with negative scroll
      // More lenient threshold for Android due to different scroll physics
      const dismissThreshold =
        Platform.OS === 'android' ? -30 : DISMISS_SCROLL_THRESHOLD;
      if (newIndex === 0 && contentOffset.y < dismissThreshold) {
        handleBack({ gesture: 'swipe' });
        return;
      }
    },
    [
      currentVideoIndex,
      handleBack,
      videoItems.length,
      throttledSetCurrentVideoIndex,
      trackEvent,
    ],
  );

  const handleSeedVideoStateChange = useCallback(
    (state: { position: number; isPlaying: boolean }) => {
      initialSeedVideoStateRef.current = state;
    },
    [],
  );

  const resetDragAnimation = useCallback(() => {
    dragTranslateX.value = withSpring(0, { damping: 20, stiffness: 300 });
    dragTranslateY.value = withSpring(0, { damping: 20, stiffness: 300 });
    dragScale.value = withSpring(1, { damping: 20, stiffness: 300 });
    isDragging.value = false;
  }, [dragTranslateX, dragTranslateY, dragScale, isDragging]);

  const isVerticalScroll = useSharedValue(false);

  // Common gesture handler functions
  const calculateTotalTranslation = useCallback(
    (translationX: number, translationY: number) => {
      'worklet';
      return Math.sqrt(
        translationX * translationX + translationY * translationY,
      );
    },
    [],
  );

  const calculateTotalVelocity = useCallback(
    (velocityX: number, velocityY: number) => {
      'worklet';
      return Math.sqrt(velocityX * velocityX + velocityY * velocityY);
    },
    [],
  );

  const applyDragTransform = useCallback(
    (event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
      'worklet';

      // Apply drag translation with resistance
      dragTranslateX.value = event.translationX * DRAG_RESISTANCE;
      dragTranslateY.value = event.translationY * DRAG_RESISTANCE;

      // Calculate progress based on total movement for visual feedback
      const totalTranslation = calculateTotalTranslation(
        event.translationX,
        event.translationY,
      );
      const progress = Math.min(
        totalTranslation / DRAG_DISMISS_DISTANCE_THRESHOLD,
        1,
      );
      dragScale.value = 1 - progress * DRAG_SCALE_FACTOR;
    },
    [dragTranslateX, dragTranslateY, dragScale, calculateTotalTranslation],
  );

  const handleGestureEnd = useCallback(
    (event: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
      'worklet';

      const totalTranslation = calculateTotalTranslation(
        event.translationX,
        event.translationY,
      );
      const totalVelocity = calculateTotalVelocity(
        event.velocityX,
        event.velocityY,
      );

      const shouldDismiss =
        totalTranslation > DRAG_DISMISS_DISTANCE_THRESHOLD ||
        totalVelocity > DRAG_DISMISS_VELOCITY_THRESHOLD;

      if (shouldDismiss) {
        // Animate out in the direction of the gesture
        const angle = Math.atan2(event.translationY, event.translationX);
        const exitDistance = screenHeight * 1.5;
        const exitX = Math.cos(angle) * exitDistance;
        const exitY = Math.sin(angle) * exitDistance;

        dragTranslateX.value = withTiming(exitX, {
          duration: DRAG_ANIMATION_DURATION,
        });
        dragTranslateY.value = withTiming(
          exitY,
          { duration: DRAG_ANIMATION_DURATION },
          () => {
            runOnJS(handleBack)({ gesture: 'drag' });
          },
        );
        dragScale.value = withTiming(0.7, {
          duration: DRAG_ANIMATION_DURATION,
        });
      } else {
        runOnJS(resetDragAnimation)();
      }
    },
    [
      dragTranslateX,
      dragTranslateY,
      dragScale,
      handleBack,
      resetDragAnimation,
      calculateTotalTranslation,
      calculateTotalVelocity,
    ],
  );

  const reactNavStackGestureHandlerRef =
    useGestureHandlerRef() as React.RefObject<PanGestureHandler> | null;
  const externalGestures = [];
  if (reactNavStackGestureHandlerRef) {
    externalGestures.push(reactNavStackGestureHandlerRef);
  }
  // Always include flatListRef regardless of .current being set on first render;
  // omitting it on initial mount causes gesture competition that makes the second
  // scroll stop the feed instead of adding velocity.
  externalGestures.push(
    flatListRef as unknown as React.RefObject<React.ComponentType<object>>,
  );

  // Create platform-specific gestures
  const iosGesture = Gesture.Pan()
    .minDistance(IOS_MIN_DISTANCE)
    .onStart(() => {
      'worklet';
      isDragging.value = false;
      isVerticalScroll.value = false;
    })
    .onUpdate((event) => {
      'worklet';

      // Avoid dragging above video controls to prevent dismissing when scrubbing
      if (event.y > screenHeight - BOTTOM_EXCLUSION_HEIGHT) {
        return;
      }

      // Determine gesture type only at the beginning
      if (!isDragging.value && !isVerticalScroll.value) {
        const horizontalMovement = Math.abs(event.translationX);
        const verticalMovement = Math.abs(event.translationY);

        // Need minimum movement to determine direction
        if (
          horizontalMovement > IOS_MOVEMENT_THRESHOLD ||
          verticalMovement > IOS_MOVEMENT_THRESHOLD
        ) {
          // iOS logic (original)
          if (
            verticalMovement >
            horizontalMovement * IOS_VERTICAL_SCROLL_RATIO
          ) {
            isVerticalScroll.value = true;
            return;
          } else if (
            horizontalMovement >
            verticalMovement * IOS_HORIZONTAL_DRAG_RATIO
          ) {
            isDragging.value = true;
          }
        } else {
          // Not enough movement yet
          return;
        }
      }

      // If it's a vertical scroll, ignore completely
      if (isVerticalScroll.value) {
        return;
      }

      // If we're not in drag mode yet, don't process
      if (!isDragging.value) {
        return;
      }

      applyDragTransform(event);
    })
    .onEnd((event) => {
      'worklet';

      // Skip if it was a scroll or never started dragging
      if (isVerticalScroll.value || !isDragging.value) {
        runOnJS(resetDragAnimation)();
        return;
      }

      handleGestureEnd(event);
    })
    .simultaneousWithExternalGesture(...externalGestures);

  const checkTouchingExclusionArea = (
    touches: Readonly<
      {
        id: number;
        x: number;
        y: number;
        absoluteX: number;
        absoluteY: number;
      }[]
    >,
  ) => {
    'worklet';
    for (const touch of touches) {
      if (touch.y > screenHeight - BOTTOM_EXCLUSION_HEIGHT) {
        return true;
      }
    }
    return false;
  };

  // Android-specific gesture that only triggers on clearly horizontal movement
  const androidGesture = Gesture.Pan()
    .minDistance(ANDROID_MIN_DISTANCE) // Higher threshold for Android
    .activeOffsetX([
      -ANDROID_HORIZONTAL_THRESHOLD,
      ANDROID_HORIZONTAL_THRESHOLD,
    ]) // Only activate on horizontal movement
    .failOffsetY([
      -ANDROID_VERTICAL_FAIL_THRESHOLD,
      ANDROID_VERTICAL_FAIL_THRESHOLD,
    ]) // Fail if vertical movement is too much
    .onStart(() => {
      'worklet';
      isDragging.value = true;
      isVerticalScroll.value = false;
    })
    .onUpdate((event) => {
      'worklet';
      // Avoid dragging above video controls to prevent dismissing when scrubbing
      if (event.y > screenHeight - BOTTOM_EXCLUSION_HEIGHT) {
        return;
      }

      applyDragTransform(event);
    })
    .onEnd(handleGestureEnd)
    .onTouchesDown((e) => {
      'worklet';
      if (checkTouchingExclusionArea(e.allTouches)) {
        runOnJS(setTouchingExclusionArea)(true);
      }
    })
    .onTouchesMove((e) => {
      'worklet';
      if (checkTouchingExclusionArea(e.allTouches)) {
        runOnJS(setTouchingExclusionArea)(true);
      } else {
        runOnJS(setTouchingExclusionArea)(false);
      }
    })
    .onTouchesUp((e) => {
      'worklet';
      if (!checkTouchingExclusionArea(e.allTouches)) {
        runOnJS(setTouchingExclusionArea)(false);
      }
    })
    .simultaneousWithExternalGesture(...externalGestures);

  // Select platform-appropriate gesture
  const panGesture = Platform.OS === 'ios' ? iosGesture : androidGesture;

  const renderVideoItem: ListRenderItem<VideoItem> = useCallback(
    ({ item, index }) => {
      const isCurrentVideo = index === currentVideoIndex;
      const distance = Math.abs(index - currentVideoIndex);

      // Android: render all as VideoFeedPlayer to avoid component switching flicker
      // iOS: render VideoFeedPlayer for current + adjacent (distance <= 1) for smoother preloading
      const shouldRenderVideo =
        Platform.OS === 'android' ? true : distance <= 1;

      if (!shouldRenderVideo) {
        return (
          <View style={{ height: screenHeight }}>
            <Image
              source={{
                uri: item.videoEmbed.thumbnailUrl,
                headers: imageRequestHeaders,
              }}
              recyclingKey={item.videoEmbed.thumbnailUrl}
              cachePolicy="memory-disk"
              style={{ width: '100%', height: '100%' }}
              contentFit="contain"
              priority="normal"
              transition={200}
            />
          </View>
        );
      }

      const { initialPosition, initialIsPlaying, seedCastVideoInCastIndex } =
        item;

      const onStateChange =
        seedCastVideoInCastIndex === initialSeedCastVideoInCastIndexRef.current
          ? handleSeedVideoStateChange
          : undefined;

      return (
        <View style={{ height: screenHeight }}>
          <VideoFeedPlayer
            cast={item.cast}
            videoEmbed={item.videoEmbed}
            onControlsVisibilityChange={handleControlsVisibilityChange}
            isActive={isCurrentVideo}
            initialPosition={initialPosition}
            initialPlaying={initialIsPlaying}
            loop={true}
            onStateChange={onStateChange}
            onVideoEnded={undefined}
            muted={isCurrentVideo ? muted : true}
            onMute={toggleMute}
          />
        </View>
      );
    },
    [
      handleControlsVisibilityChange,
      currentVideoIndex,
      handleSeedVideoStateChange,
      muted,
      toggleMute,
    ],
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<VideoItem> | null | undefined, index: number) => ({
      length: screenHeight,
      offset: screenHeight * index,
      index,
    }),
    [],
  );

  const dragAnimatedStyle = useAnimatedStyle(() => {
    const isCurrentlyDragging =
      dragTranslateX.value !== 0 || dragTranslateY.value !== 0;

    return {
      transform: [
        { translateX: dragTranslateX.value },
        { translateY: dragTranslateY.value },
        { scale: dragScale.value },
      ],
      borderRadius: isCurrentlyDragging ? 50 : 0,
      overflow: 'hidden',
    };
  });

  const footer = useCallback(() => {
    if (isPending) {
      return (
        <View style={{ height: screenHeight }}>
          <VideoScreenLoading onBack={() => handleBack({ gesture: 'press' })} />
        </View>
      );
    }
    return undefined;
  }, [isPending, handleBack]);

  if (seedVideo?.castHash && !seedCastRef.current) {
    if (loadingSeedCast) {
      return (
        <VideoScreenLoading onBack={() => handleBack({ gesture: 'press' })} />
      );
    }
    if (loadingSeedCastError) {
      return (
        <View style={[t.flex1, t.bgBlack, t.itemsCenter, t.justifyCenter]}>
          <BackButton onPress={() => handleBack({ gesture: 'press' })} />
          <Text2 color={'light'}>Error loading seed cast</Text2>
        </View>
      );
    }
  }

  if (!isError && !videoItems.length) {
    if (isPending) {
      return (
        <VideoScreenLoading onBack={() => handleBack({ gesture: 'press' })} />
      );
    }
    try {
      DdRum.addError('VideoScreen feed is empty', ErrorSource.CUSTOM, '', {
        fc: true,
        isFatal: false,
      });
    } catch {
      // Do nothing
    }
    return (
      <View style={[t.flex1, t.bgBlack, t.itemsCenter, t.justifyCenter]}>
        <BackButton onPress={() => handleBack({ gesture: 'press' })} />
        <Text2 color={'light'}>No videos, try again later :(</Text2>
      </View>
    );
  }

  if (fetchError && !videoItems.length) {
    throw fetchError;
  }

  // Enable the swipe-to-dismiss gesture when we're on the first video
  const simultaneousHandlers =
    reactNavStackGestureHandlerRef && currentVideoIndex === 0
      ? reactNavStackGestureHandlerRef
      : undefined;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[t.flex1, t.bgBlack, dragAnimatedStyle]}>
        {controlsVisible && (
          <BackButton onPress={() => handleBack({ gesture: 'press' })} />
        )}

        <FlatList
          ref={flatListRef}
          simultaneousHandlers={simultaneousHandlers}
          data={videoItems}
          renderItem={renderVideoItem}
          keyExtractor={keyExtractor}
          // Platform-optimized paging configuration
          pagingEnabled={Platform.OS === 'ios'}
          snapToInterval={Platform.OS === 'android' ? screenHeight : undefined}
          snapToAlignment={Platform.OS === 'android' ? 'start' : undefined}
          disableIntervalMomentum={Platform.OS === 'android'}
          showsVerticalScrollIndicator={false}
          bounces={Platform.OS === 'ios'}
          bouncesZoom={false}
          // Platform-optimized scroll physics
          scrollEventThrottle={Platform.OS === 'android' ? 8 : 16}
          decelerationRate={Platform.OS === 'android' ? 'normal' : 'fast'}
          getItemLayout={getItemLayout}
          onScroll={handleScroll}
          // Optimized rendering configuration
          windowSize={Platform.OS === 'android' ? 2 : 3}
          maxToRenderPerBatch={Platform.OS === 'android' ? 1 : 2}
          initialNumToRender={2}
          updateCellsBatchingPeriod={Platform.OS === 'android' ? 100 : 50}
          removeClippedSubviews={Platform.OS === 'android'}
          initialScrollIndex={initialSeedCastVideoInCastIndexRef.current}
          style={[t.flex1]}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.8}
          ListFooterComponent={footer}
        />
      </Animated.View>
    </GestureDetector>
  );
}

export { VideoScreen };
