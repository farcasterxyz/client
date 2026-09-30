import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { Image } from 'expo-image';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoPlayer, VideoView } from 'expo-video';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiCast, ApiCastVideoEmbed } from 'farcaster-client-data';
import { useTrackEvent } from 'farcaster-client-hooks';
import { Text2 } from 'farcaster-expo';
import throttle from 'lodash.throttle';
import { Heart } from 'lucide-react-native';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AppState,
  AppStateStatus,
  Dimensions,
  InteractionManager,
  Platform,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MoreCastActionsBottomSheet } from '~/components/casts/CastActions/MoreCastActionsBottomSheet';
import { imageRequestHeaders } from '~/constants/Images';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { sizes, useTheme } from '~/contexts/ThemeProvider';
import { useProvidedVideoPlayer } from '~/contexts/VideoPlayerProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';

import { BOTTOM_BAR_HEIGHT, BOTTOM_EXCLUSION_HEIGHT } from './constants';
import { PlaybackTime } from './PlaybackTime';
import { VideoCastActionsBar } from './VideoCastActionsBar';
import { VideoCastDetails } from './VideoCastDetails';
import { VideoControlsBar } from './VideoControlsBar';
import { VideoSlider } from './VideoSlider';

const getSectionFromX = (x: number, width: number) => {
  'worklet';
  if (x < width / 3) {
    return 'left';
  }
  if (x > (2 * width) / 3) {
    return 'right';
  }
  return 'middle';
};

type VideoFeedPlayerProps = {
  cast?: ApiCast;
  videoEmbed: ApiCastVideoEmbed;
  onControlsVisibilityChange?: (visible: boolean) => void;
  isActive?: boolean;
  initialPosition?: number;
  initialPlaying?: boolean;
  onStateChange?: (state: { position: number; isPlaying: boolean }) => void;
  player?: VideoPlayer;
  onVideoEnded?: () => void;
  loop?: boolean;
  muted: boolean;
  onMute: () => void;
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const RIGHT_EXCLUSION_WIDTH = 55;
const LOADING_INDICATOR_DELAY = 500;

const VideoFeedPlayer = React.memo(
  ({
    cast,
    videoEmbed,
    onControlsVisibilityChange,
    isActive = true,
    initialPosition,
    initialPlaying,
    onStateChange,
    player: providedPlayer,
    onVideoEnded,
    loop,
    muted,
    onMute,
  }: VideoFeedPlayerProps) => {
    const t = useTheme();
    const { fid: _currentUserFid } = useCurrentUser_UNSAFE();
    const isFocused = useIsFocused();
    const [appState, setAppState] = useState<AppStateStatus>(
      AppState.currentState,
    );
    const { trackEvent } = useAnalytics();
    const { trackCastView, trackInternalEvent } = useTrackEvent();
    const [showLoading, setShowLoading] = useState(true);
    const [videoReady, setVideoReady] = useState(false);
    const [activelyPlaying, setActivelyPlaying] = useState(false);
    const isUpdatingPlayingStateRef = useRef(false);
    const [controlsVisible, setControlsVisible] = useState(false);
    const [currentPosition, setCurrentPosition] = useState(
      initialPosition || 0,
    );
    const [currentDuration, setCurrentDuration] = useState(
      videoEmbed.duration || 0,
    );
    // Refs for immediate values during seeking
    const currentPositionRef = useRef(initialPosition || 0);
    const currentDurationRef = useRef(videoEmbed.duration || 0);
    const [isFastForwarding, setIsFastForwarding] = useState(false);
    const suspendedRef = useRef(false);
    const userControlledRef = useRef(false);
    const [isSeeking, setIsSeeking] = useState(false);
    const completionEventSentRef = useRef(false);
    const videoId = videoEmbed.sourceUrl.split('/').at(-1)?.split('.')[0];
    const videoReadyActionStartedRef = useRef(false);
    const videoPlayActionStartedRef = useRef(false);
    const [shouldShowLoadingIndicator, setShouldShowLoadingIndicator] =
      useState(false);

    // Start RUM action when video becomes active
    useEffect(() => {
      if (isActive && !videoReadyActionStartedRef.current) {
        videoReadyActionStartedRef.current = true;
        DdRum.startAction(RumActionType.CUSTOM, 'video_load', {
          castHash: cast?.hash ?? '',
          videoId: videoId ?? '',
        });
      }
    }, [
      isActive,
      videoReady,
      videoId,
      cast?.hash,
      cast?.author.fid,
      videoEmbed.sourceUrl,
    ]);

    // Stop RUM action when video becomes ready
    useEffect(() => {
      if (videoReady && videoReadyActionStartedRef.current) {
        videoReadyActionStartedRef.current = false;
        DdRum.stopAction(RumActionType.CUSTOM, 'video_load', {
          videoId: videoId ?? '',
          castHash: cast?.hash ?? '',
          interrupted: false,
        });
      }
    }, [
      videoReady,
      videoId,
      cast?.hash,
      cast?.author.fid,
      videoEmbed.sourceUrl,
    ]);

    useEffect(() => {
      setTimeout(() => {
        setShouldShowLoadingIndicator(isActive);
      }, LOADING_INDICATOR_DELAY);
    }, [isActive, setShouldShowLoadingIndicator]);

    // Start video playtime RUM action when video is ready
    useEffect(() => {
      if (videoReady && isActive && !videoPlayActionStartedRef.current) {
        videoPlayActionStartedRef.current = true;
        DdRum.startAction(RumActionType.CUSTOM, 'video_play', {
          videoId: videoId ?? '',
          castHash: cast?.hash ?? '',
        });
      }
    }, [videoReady, isActive, videoId, cast?.hash, cast?.author.fid]);

    // Cleanup RUM action if component unmounts before video is ready
    useEffect(() => {
      return () => {
        if (videoReadyActionStartedRef.current) {
          videoReadyActionStartedRef.current = false;
          DdRum.stopAction(RumActionType.CUSTOM, 'video_load', {
            videoId: videoId ?? '',
            castHash: cast?.hash ?? '',
            interrupted: true,
          });
        }
        if (videoPlayActionStartedRef.current) {
          videoPlayActionStartedRef.current = false;
          DdRum.stopAction(RumActionType.CUSTOM, 'video_play', {
            videoId: videoId ?? '',
            castHash: cast?.hash ?? '',
            interrupted: true,
          });
        }
      };
    }, [videoId, cast?.hash, cast?.author.fid, videoEmbed.sourceUrl]);

    useEffect(() => {
      if (cast?.hash && isActive && isFocused && videoReady) {
        const timeoutId = setTimeout(() => {
          if (isActive && isFocused) {
            trackCastView(
              {
                castHash: cast?.hash,
                castAuthorFid: cast?.author.fid,
                feed: 'video',
              },
              { urgent: true },
            );
          }
        }, 1000);

        return () => {
          clearTimeout(timeoutId);
        };
      }
    }, [
      cast?.hash,
      cast?.author.fid,
      isActive,
      isFocused,
      trackCastView,
      videoReady,
    ]);

    const videoSource = React.useMemo(() => {
      return providedPlayer ? null : { uri: videoEmbed.sourceUrl };
    }, [providedPlayer, videoEmbed.sourceUrl]);

    const [playbackRate, setPlaybackRate] = useState(1);
    const setInitialPositionOnce = useRef(false);
    const [showMoreCastActionsBottomSheet, setShowMoreCastActionsBottomSheet] =
      useState(false);
    const likeHandlerRef = useRef<((allowUnlike?: boolean) => void) | null>(
      null,
    );
    const likeAnimationOpacity = useSharedValue(0);
    const likeAnimationScale = useSharedValue(0);

    const recyclableRef = React.useRef(Platform.OS !== 'android');
    const createdPlayer = useProvidedVideoPlayer(
      videoSource,
      (player) => {
        player.loop = loop ?? false;
        player.muted = muted;
        player.audioMixingMode = muted ? 'mixWithOthers' : 'doNotMix';
        player.timeUpdateEventInterval = 0.25;
        player.staysActiveInBackground = false;
        player.bufferOptions = { preferredForwardBufferDuration: 5 };
      },
      {
        visible:
          Platform.OS === 'android' || isActive || !recyclableRef.current,
        recyclableRef,
      },
    );

    const player = providedPlayer || createdPlayer;
    const playerRef = useRef(player);

    // Throttled video seek during dragging to avoid performance issues
    const throttledVideoSeek = useMemo(
      () =>
        throttle(
          (position: number) => {
            player?.seekBy(position / 1000 - player?.currentTime);
          },
          100,
          { leading: true, trailing: true },
        ),
      [player],
    );

    useEffect(() => {
      return () => {
        if (!providedPlayer && player) {
          player?.release();
        }
      };
    }, [player, providedPlayer]);

    // Cleanup throttled video seek function on unmount
    useEffect(() => {
      return () => {
        throttledVideoSeek.cancel();
      };
    }, [throttledVideoSeek]);

    // Keep the screen awake while video is playing
    useEffect(() => {
      if (isActive && activelyPlaying) {
        activateKeepAwakeAsync('videoFeedPlayer');
      } else {
        deactivateKeepAwake('videoFeedPlayer');
      }

      return () => {
        deactivateKeepAwake('videoFeedPlayer');
      };
    }, [isActive, activelyPlaying]);

    useEffect(() => {
      const statusListener = player?.addListener('statusChange', (event) => {
        if (event.status !== 'readyToPlay') {
          return;
        }
        setShowLoading(false);
        setVideoReady(true);
        if (player?.duration && player?.duration > 0) {
          const newDuration = player?.duration * 1000;
          currentDurationRef.current = newDuration;
          setCurrentDuration(newDuration);
        }

        if (!providedPlayer && initialPosition && initialPosition > 0) {
          if (!setInitialPositionOnce.current) {
            setInitialPositionOnce.current = true;
            player?.seekBy(initialPosition / 1000);
            currentPositionRef.current = initialPosition;
            setCurrentPosition(initialPosition);
          }
        }

        if (!suspendedRef.current) {
          if (providedPlayer) {
            if (typeof player !== 'undefined' && player !== null) {
              player.muted = muted;
              player.loop = loop ?? false;
              player.audioMixingMode = muted ? 'mixWithOthers' : 'doNotMix';
            }

            setActivelyPlaying(player?.playing);
            const currentPos = player?.currentTime * 1000;
            currentPositionRef.current = currentPos;
            setCurrentPosition(currentPos);
          } else {
            const shouldAutoPlay =
              initialPlaying !== undefined ? initialPlaying : true;
            if (shouldAutoPlay && !player?.playing && isActive) {
              setActivelyPlaying(true);
            }
          }
        }
      });

      const playingListener = player?.addListener('playingChange', (event) => {
        if (!suspendedRef.current) {
          const shouldBePlaying = event.isPlaying && isActive;
          setActivelyPlaying(shouldBePlaying);

          onStateChange?.({
            position: currentPositionRef.current,
            isPlaying: shouldBePlaying,
          });
        }
      });

      const timeUpdateListener = player?.addListener('timeUpdate', (event) => {
        const newPosition = event.currentTime * 1000;

        // Always update ref for accurate values
        currentPositionRef.current = newPosition;

        if (!suspendedRef.current) {
          setCurrentPosition(newPosition);

          onStateChange?.({
            position: newPosition,
            isPlaying: activelyPlaying,
          });
        }

        if (player?.duration && player?.duration > 0) {
          const newDuration = player?.duration * 1000;

          if (currentDurationRef.current !== newDuration) {
            currentDurationRef.current = newDuration;
            setCurrentDuration(newDuration);
          }

          if (event.currentTime >= player?.duration - 0.05) {
            if (
              !completionEventSentRef.current &&
              cast?.hash &&
              cast.author.fid
            ) {
              InteractionManager.runAfterInteractions(() => {
                trackInternalEvent({
                  type: 'video-play',
                  data: {
                    castHash: cast.hash,
                    castFid: cast.author.fid,
                    durationMillis: Math.floor(newDuration),
                    videoId: videoId ?? '',
                    videoUrl: videoEmbed.sourceUrl,
                    feed: 'video',
                  },
                });
              });
              completionEventSentRef.current = true;
            }
            if (typeof onVideoEnded === 'function' && activelyPlaying) {
              onVideoEnded();
            }
          }
        }
      });

      return () => {
        statusListener?.remove();
        playingListener?.remove();
        timeUpdateListener?.remove();
      };
    }, [
      player,
      showLoading,
      onStateChange,
      activelyPlaying,
      initialPlaying,
      initialPosition,
      providedPlayer,
      onVideoEnded,
      loop,
      muted,
      cast,
      trackInternalEvent,
      videoId,
      isActive,
      videoEmbed.sourceUrl,
    ]);

    useEffect(() => {
      // Prevent circular updates when we're already updating the playing state
      if (isUpdatingPlayingStateRef.current) {
        isUpdatingPlayingStateRef.current = false;
        return;
      }

      if (!playerRef.current) {
        return;
      }

      if (isActive) {
        if (userControlledRef.current) {
          return;
        }

        // CRITICAL FIX: Don't auto-play if app is not active
        if (appState !== 'active') {
          return;
        }

        completionEventSentRef.current = false;
        if (!suspendedRef.current && !activelyPlaying) {
          isUpdatingPlayingStateRef.current = true;
          setActivelyPlaying(true);
          try {
            playerRef.current?.play();
          } catch {
            // this is a non-fatal error that commonly happens when the video
            // instance has already been disposed of. We don't have a way to
            // well whether this is the case so we just catch the error.
            // We don't report it to DD to avoid spamming the logs.
          }
        }
      } else {
        userControlledRef.current = false;
        const durationMillis = Math.floor(currentPositionRef.current);
        if (
          cast?.hash &&
          cast.author.fid &&
          durationMillis > 0 &&
          activelyPlaying
        ) {
          trackInternalEvent({
            type: 'video-play',
            data: {
              castHash: cast.hash,
              castFid: cast.author.fid,
              durationMillis,
              videoId: videoId ?? '',
              videoUrl: videoEmbed.sourceUrl,
              feed: 'video',
            },
          });
        }

        // Stop video playtime RUM action when video is no longer active
        if (videoPlayActionStartedRef.current) {
          videoPlayActionStartedRef.current = false;
          DdRum.stopAction(RumActionType.CUSTOM, 'video_play', {
            videoId: videoId ?? '',
            castHash: cast?.hash ?? '',
            interrupted: false,
          });
        }

        isUpdatingPlayingStateRef.current = true;
        setActivelyPlaying(false);
        try {
          playerRef.current?.pause();
          if (
            playerRef.current?.currentTime &&
            playerRef.current?.currentTime > 0
          ) {
            playerRef.current?.seekBy(-playerRef.current?.currentTime);
          }
          setCurrentPosition(0);
          currentPositionRef.current = 0;
        } catch (error) {
          // this is a non-fatal error that commonly happens when the video
          // instance has already been disposed of. We don't have a way to
          // well whether this is the case so we just catch the error.
          // We don't report it to DD to avoid spamming the logs.
        }
      }
    }, [
      isActive,
      activelyPlaying,
      cast?.hash,
      cast?.author.fid,
      trackInternalEvent,
      videoId,
      appState,
      videoEmbed.sourceUrl,
    ]);

    useEffect(() => {
      if (player) {
        player.muted = muted;
        player.audioMixingMode = muted ? 'mixWithOthers' : 'doNotMix';
      }
    }, [player, muted]);

    useEffect(() => {
      if (player) {
        player.playbackRate = playbackRate;
      }
    }, [player, playbackRate]);

    const showControls = useCallback(() => {
      setControlsVisible(true);
      onControlsVisibilityChange?.(true);
    }, [onControlsVisibilityChange]);

    const hideControls = useCallback(() => {
      setControlsVisible(false);
      onControlsVisibilityChange?.(false);
    }, [onControlsVisibilityChange]);

    // Listen for app state changes
    useEffect(() => {
      const handleAppStateChange = (nextAppState: AppStateStatus) => {
        setAppState(nextAppState);
      };
      const subscription = AppState.addEventListener(
        'change',
        handleAppStateChange,
      );
      return () => {
        subscription.remove();
      };
    }, []);

    useEffect(() => {
      if (!isActive) {
        return;
      }

      if (!playerRef.current) {
        return;
      }

      const isAppActive = appState === 'active';

      try {
        if (isAppActive) {
          playerRef.current?.play();
          setActivelyPlaying(true);
          hideControls();
        } else {
          playerRef.current?.pause();
          setActivelyPlaying(false);
          showControls();
        }
      } catch (error) {
        // this is a non-fatal error that commonly happens when the video
        // instance has already been disposed of. We don't have a way to
        // well whether this is the case so we just catch the error.
        // We don't report it to DD to avoid spamming the logs.
      }
    }, [appState, isActive, setActivelyPlaying, showControls, hideControls]);

    const handleTap = useCallback(() => {
      userControlledRef.current = true;

      if (!activelyPlaying && isActive) {
        player?.play();
        setActivelyPlaying(true);
        hideControls();
      } else {
        trackEvent(AnalyticsEvent.VideoFeedPause);
        try {
          player?.pause();
        } catch (error) {
          // this is a non-fatal error that commonly happens when the video
          // instance has already been disposed of. We don't have a way to
          // well whether this is the case so we just catch the error.
          // We don't report it to DD to avoid spamming the logs.
        }
        setActivelyPlaying(false);
        showControls();
      }
    }, [
      activelyPlaying,
      showControls,
      hideControls,
      player,
      trackEvent,
      isActive,
    ]);

    const handleDoubleTapLike = useCallback(() => {
      if (!cast) {
        return;
      }
      trackEvent(AnalyticsEvent.VideoFeedDoubleTapToLike);
      likeHandlerRef.current?.(false);

      likeAnimationOpacity.value = 0;
      likeAnimationScale.value = 0;

      // Animate the heart with opacity and scale (total duration: 1 second)
      likeAnimationOpacity.value = withSequence(
        withTiming(1, { duration: 150 }),
        withDelay(700, withTiming(0, { duration: 150 })),
      );

      likeAnimationScale.value = withSequence(
        withSpring(1, {
          damping: 12,
          stiffness: 180,
          overshootClamping: false,
        }),
        withDelay(350, withTiming(0, { duration: 150 })),
      );
    }, [likeAnimationOpacity, likeAnimationScale, cast, trackEvent]);

    const registerLikeHandler = useCallback(
      (handler: (allowUnlike?: boolean) => void) => {
        likeHandlerRef.current = handler;
      },
      [],
    );

    const startFastForward = useCallback(() => {
      if (!activelyPlaying && isActive) {
        player?.play();
        setActivelyPlaying(true);
      }
      trackEvent(AnalyticsEvent.VideoFeedHoldToSpeedUp);
      setPlaybackRate(2);
      setIsFastForwarding(true);
      hideControls();
    }, [activelyPlaying, hideControls, player, trackEvent, isActive]);

    const stopFastForward = useCallback(() => {
      setPlaybackRate(1);
      setIsFastForwarding(false);
    }, []);

    const handleSeekStart = useCallback(
      (p: number) => {
        suspendedRef.current = true;
        const newPosition = p * currentDurationRef.current;
        currentPositionRef.current = newPosition;
        setCurrentPosition(newPosition);
        trackEvent(AnalyticsEvent.VideoFeedScrub, {
          controlsVisible: controlsVisible,
        });
        if (!controlsVisible) {
          setIsSeeking(true);
        }
        try {
          player?.pause();
        } catch (error) {
          // this is a non-fatal error that commonly happens when the video
          // instance has already been disposed of. We don't have a way to
          // well whether this is the case so we just catch the error.
          // We don't report it to DD to avoid spamming the logs.
        }
      },
      [player, controlsVisible, setIsSeeking, trackEvent],
    );

    const handleSeek = useCallback((p: number) => {
      const newPosition = p * currentDurationRef.current;
      currentPositionRef.current = newPosition;
      setCurrentPosition(newPosition);
    }, []);

    const handleSeekEnd = useCallback(
      (p: number) => {
        const newPosition = p * currentDurationRef.current;
        currentPositionRef.current = newPosition;
        setCurrentPosition(newPosition);
        player?.seekBy(newPosition / 1000 - player?.currentTime);

        if (!controlsVisible) {
          player?.play();
          setActivelyPlaying(true);
          suspendedRef.current = false;
          setIsSeeking(false);
        }
      },
      [player, controlsVisible],
    );

    const handleMoreCastActionsPress = useCallback(() => {
      if (!cast) {
        return;
      }
      trackEvent(AnalyticsEvent.VideoFeedHoldToShowMenu);
      handleTap();
      setShowMoreCastActionsBottomSheet(true);
    }, [handleTap, cast, trackEvent]);

    const handleMoreCastActionsDismiss = useCallback(() => {
      setShowMoreCastActionsBottomSheet(false);
      handleTap();
    }, [handleTap]);

    const longPressGesture = useMemo(
      () =>
        Gesture.LongPress()
          .onStart((event) => {
            'worklet';
            const section = getSectionFromX(event.x, screenWidth);
            if (section === 'left' || section === 'right') {
              runOnJS(startFastForward)();
            }
            if (section === 'middle') {
              runOnJS(handleMoreCastActionsPress)();
            }
          })
          .onEnd((event) => {
            'worklet';
            const section = getSectionFromX(event.x, screenWidth);
            if (section !== 'middle') {
              runOnJS(stopFastForward)();
            }
          }),
      [startFastForward, stopFastForward, handleMoreCastActionsPress],
    );

    const tapGesture = useMemo(
      () =>
        Gesture.Tap().onEnd((event) => {
          'worklet';

          // Check if tap is in the excluded areas
          if (
            event.y > screenHeight - BOTTOM_EXCLUSION_HEIGHT ||
            event.x > screenWidth - RIGHT_EXCLUSION_WIDTH
          ) {
            // Tap is in excluded area, don't handle it
            return;
          }

          runOnJS(handleTap)();
        }),
      [handleTap],
    );

    const doubleTapGesture = useMemo(
      () =>
        Gesture.Tap()
          .numberOfTaps(2)
          .onEnd((event) => {
            'worklet';

            // Check if double tap is in the excluded areas
            if (
              event.y > screenHeight - BOTTOM_EXCLUSION_HEIGHT ||
              event.x > screenWidth - RIGHT_EXCLUSION_WIDTH
            ) {
              // Double tap is in excluded area, don't handle it
              return;
            }

            runOnJS(handleDoubleTapLike)();
          }),
      [handleDoubleTapLike],
    );

    const composedGesture = useMemo(
      () => Gesture.Exclusive(longPressGesture, doubleTapGesture, tapGesture),
      [longPressGesture, doubleTapGesture, tapGesture],
    );

    const sliderValue = useMemo(() => {
      const value = currentPosition / currentDuration;
      // prevents returning Infinity or NaN when video.duration is 0
      return Number.isFinite(value) ? value : 0;
    }, [currentDuration, currentPosition]);

    const handlePlayStateChangeRequest = useCallback(
      (playState: 'play' | 'pause') => {
        if (!isActive) {
          return;
        }
        userControlledRef.current = true;

        if (playState === 'play') {
          player?.play();
          setActivelyPlaying(true);
          hideControls();
        } else {
          player?.pause();
          setActivelyPlaying(false);
          showControls();
        }
      },
      [player, setActivelyPlaying, showControls, hideControls, isActive],
    );

    const videoStyle = useMemo(
      () => [
        t.roundedNone,
        {
          width: '100%',
          aspectRatio:
            videoEmbed.width && videoEmbed.height
              ? videoEmbed.width / videoEmbed.height
              : 9 / 16,
          backgroundColor: 'transparent',
        },
      ],
      [t.roundedNone, videoEmbed.width, videoEmbed.height],
    );

    const castDetailsStyle = useMemo(
      () => [t.absolute, t.mB4, { bottom: BOTTOM_BAR_HEIGHT, left: 12 }],
      [t], // Theme styles don't change structurally
    );

    const castActionsStyle = useMemo(
      () => [t.absolute, t.pB4, { bottom: BOTTOM_BAR_HEIGHT, right: 12 }],
      [t], // Theme styles don't change structurally
    );

    const controlsBarStyle = useMemo(
      () => [t.absolute, t.bottom0, { height: BOTTOM_BAR_HEIGHT }],
      [t], // Theme styles don't change structurally
    );
    const seekBarStyle = useMemo(
      () => [t.absolute, t.bottom0, { height: BOTTOM_BAR_HEIGHT + 32 }],
      [t], // Theme styles don't change structurally
    );
    const videoToRender = useMemo(() => {
      if (!player) {
        return null;
      }
      return (
        <VideoView
          style={videoStyle}
          player={player}
          contentFit="contain"
          nativeControls={false}
          allowsVideoFrameAnalysis={false}
          allowsPictureInPicture={false}
        />
      );
    }, [videoStyle, player]);

    const imageOpacity = useSharedValue(1);
    const videoOpacity = useSharedValue(0);

    useEffect(() => {
      if (videoReady && isActive) {
        imageOpacity.value = withDelay(150, withTiming(0, { duration: 250 }));
        videoOpacity.value = withTiming(1, { duration: 400 });
      } else if (!isActive || !videoReady) {
        imageOpacity.value = 0.7;
        videoOpacity.value = 0;
      }
    }, [videoReady, isActive, imageOpacity, videoOpacity]);

    const imageAnimatedStyle = useAnimatedStyle(() => ({
      opacity: imageOpacity.value,
    }));

    const videoAnimatedStyle = useAnimatedStyle(() => ({
      opacity: videoOpacity.value,
    }));

    const likeAnimatedStyle = useAnimatedStyle(() => {
      const scale = interpolate(likeAnimationScale.value, [0, 1], [0.3, 1]);

      return {
        opacity: likeAnimationOpacity.value,
        transform: [{ scale }],
      };
    });

    const dummyGesture = useMemo(() => Gesture.Tap(), []);

    return (
      <>
        <GestureDetector gesture={composedGesture}>
          <View style={[t.flex1, t.relative]}>
            <View style={[t.flex1, t.justifyCenter, t.itemsCenter]}>
              <View style={[t.relative, videoStyle]}>
                <Animated.View
                  style={[
                    {
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                    },
                    imageAnimatedStyle,
                  ]}
                >
                  <Image
                    source={{
                      uri: videoEmbed.thumbnailUrl,
                      headers: imageRequestHeaders,
                    }}
                    recyclingKey={videoEmbed.thumbnailUrl}
                    cachePolicy="memory-disk"
                    style={{ width: '100%', height: '100%' }}
                    contentFit="contain"
                  />
                </Animated.View>

                <Animated.View
                  style={[t.absolute, t.inset0, videoAnimatedStyle]}
                >
                  {videoToRender}
                </Animated.View>
              </View>

              <LinearGradient
                colors={['rgba(0, 0, 0, 0.0)', 'rgba(0, 0, 0, 0.5)']}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 490,
                }}
                pointerEvents="none"
              />

              {controlsVisible && (
                <View
                  style={[
                    t.absolute,
                    t.inset0,
                    t.justifyCenter,
                    t.itemsCenter,
                    t.opacity75,
                  ]}
                  pointerEvents="none"
                >
                  <PlayStateIndicator isPlaying={activelyPlaying} />
                </View>
              )}

              {controlsVisible ? (
                <View style={[t.absolute, t.inset0]} pointerEvents="box-none">
                  <View
                    style={[t.relative, t.hFull, t.wFull]}
                    pointerEvents="box-none"
                  >
                    <VideoControlsBar
                      currentPosition={currentPosition}
                      currentDuration={currentDuration}
                      muted={muted}
                      onMute={onMute}
                      onSeekStart={handleSeekStart}
                      onSeek={handleSeek}
                      onSeekEnd={handleSeekEnd}
                      seekerValue={sliderValue}
                      style={controlsBarStyle}
                    />
                  </View>
                </View>
              ) : (
                <View style={[t.absolute, t.inset0]} pointerEvents="box-none">
                  <View
                    style={[t.relative, t.hFull, t.wFull]}
                    pointerEvents="box-none"
                  >
                    <View
                      style={[
                        t.flex,
                        t.flexCol,
                        t.itemsCenter,
                        t.wFull,
                        seekBarStyle,
                      ]}
                    >
                      {isSeeking ? (
                        <PlaybackTime
                          currentPosition={currentPosition}
                          currentDuration={currentDuration}
                          size="xl"
                        />
                      ) : (
                        <View style={[{ height: 24 }]} />
                      )}
                      <View
                        style={[
                          t.flex1,
                          t.relative,
                          t.flex,
                          t.flexRow,
                          t.justifyBetween,
                          t.pT2,
                        ]}
                      >
                        <VideoSlider
                          onSeekStart={handleSeekStart}
                          onSeek={handleSeek}
                          onSeekEnd={handleSeekEnd}
                          value={sliderValue}
                          blockGestureRef={dummyGesture}
                          height={10}
                          variant={
                            shouldShowLoadingIndicator && !videoReady
                              ? 'loading'
                              : 'bar-only'
                          }
                        />
                      </View>
                      <View style={{ height: 12 }} />
                    </View>
                  </View>
                </View>
              )}

              {cast && (
                <View
                  style={[t.absolute, t.inset0, { opacity: isSeeking ? 0 : 1 }]}
                  pointerEvents="box-none"
                >
                  <View
                    style={[t.relative, t.hFull, t.wFull]}
                    pointerEvents="box-none"
                  >
                    <VideoCastDetails
                      cast={cast}
                      onPlayStateChangeRequest={handlePlayStateChangeRequest}
                      style={castDetailsStyle}
                    />
                  </View>
                </View>
              )}

              {cast && (
                <View
                  style={[t.absolute, t.inset0, { opacity: isSeeking ? 0 : 1 }]}
                  pointerEvents="box-none"
                >
                  <View
                    style={[t.relative, t.hFull, t.wFull]}
                    pointerEvents="box-none"
                  >
                    <VideoCastActionsBar
                      cast={cast}
                      onPlayStateChangeRequest={handlePlayStateChangeRequest}
                      onLike={registerLikeHandler}
                      style={castActionsStyle}
                    />
                  </View>
                </View>
              )}

              {isFastForwarding && <SpeedUpIndicator rate={2} />}

              <Animated.View
                style={[
                  t.absolute,
                  t.inset0,
                  t.justifyCenter,
                  t.itemsCenter,
                  likeAnimatedStyle,
                ]}
                pointerEvents="none"
              >
                <Heart
                  size={80}
                  color={t.colors.text.light}
                  fill={t.colors.text.light}
                  style={{
                    shadowColor: t.colors.text.dark,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.2,
                    shadowRadius: 3,
                    elevation: 10,
                  }}
                />
              </Animated.View>
            </View>
          </View>
        </GestureDetector>
        {cast && showMoreCastActionsBottomSheet && (
          <MoreCastActionsBottomSheet
            cast={cast}
            onDismiss={handleMoreCastActionsDismiss}
          />
        )}
      </>
    );
  },
);

VideoFeedPlayer.displayName = 'VideoFeedPlayer';

const PlayStateIndicator = ({ isPlaying }: { isPlaying: boolean }) => {
  const t = useTheme();
  return (
    <View
      style={[
        t.flex,
        t.flexRow,
        t.itemsCenter,
        t.justifyCenter,
        t.directCasts.bgImagePreview,
        t.h16,
        t.w16,
        { maxWidth: sizes.s16 },
        t.roundedFull,
      ]}
    >
      <Ionicons
        name={isPlaying ? 'pause' : 'play'}
        size={32}
        style={[t.texts.light]}
      />
    </View>
  );
};

const SpeedUpIndicator = ({ rate }: { rate: number }) => {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        t.absolute,
        { bottom: (insets.bottom || 0) + 10 },
        t.selfCenter,
        t.flexRow,
        t.itemsCenter,
        { gap: 8 },
      ]}
    >
      <Text2 size="base" weight="semibold" color="light">
        Speed: {rate}x
      </Text2>
      <Ionicons name="play-forward" size={20} style={[t.texts.light]} />
    </View>
  );
};

export { VideoFeedPlayer };
