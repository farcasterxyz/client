import { Ionicons, Octicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { Image } from 'expo-image';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { VideoSource, VideoView } from 'expo-video';
import { ApiCastVideoEmbed } from 'farcaster-client-data';
import { CastClickType, useTrackCastClick } from 'farcaster-client-hooks';
import * as React from 'react';
import {
  Dimensions,
  Platform,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useAttachmentsCarouselVisibility } from '~/components/casts/CastAttachments/AttachmentsCarousel';
import { LoadingIndicator } from '~/components/LoadingIndicator';
import { easing } from '~/constants/Animated';
import { imageRequestHeaders } from '~/constants/Images';
import { hitSlop } from '~/constants/Pressable';
import { videoRequestHeaders } from '~/constants/Videos';
import { useDataSaver } from '~/contexts/DataSaverProvider';
import { sizes, useTheme } from '~/contexts/ThemeProvider';
import { useVideoFeedViewablility } from '~/contexts/VideoFeedViewablilityProvider';
import { useRecyclableVideoPlayer } from '~/contexts/VideoPlayerProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { getMinutesSecondsFromMilliseconds } from '~/utils/ImageUtils';

type PlaybackState = {
  duration: number | undefined;
  state: 'playing' | 'paused';
};

type VideoPlayerProps = {
  castHash: string;
  videoIndex?: number;
  source: VideoSource;
  aspectRatio: number;
  poster: string | undefined;
  duration: number;
  quoteCastMode: boolean;
  isLooping: boolean;
  muted: boolean;
  onMuteToggle: () => void;
  hideMetadata: boolean;
};

// expo-video's audio mixing mode behavior is different on iOS and Android.
// This function ensures that when scrolling past a muted video on the feed,
// it doesn't take over the system audio in both Android and iOS.
const determineAudioMixingMode = (videoFeedIsMuted: boolean) => {
  if (Platform.OS === 'android') {
    return videoFeedIsMuted ? 'mixWithOthers' : 'doNotMix';
  }
  return videoFeedIsMuted ? 'auto' : 'doNotMix';
};

const screenWidth = Dimensions.get('window').width;

// Wraps useVideoFeedViewablility so we can control whether video autoplay when
// visible based on the connection status. We keep autopause as is so videos
// still pause when scrolled out of view.
const useWrappedVideoFeedViewablility = ({
  hash,
  play,
  pause,
  shouldAutoplay,
}: {
  hash: string;
  play: () => void;
  pause: () => void;
  shouldAutoplay: boolean;
}) => {
  return useVideoFeedViewablility({
    hash,
    play: shouldAutoplay ? play : () => undefined,
    pause,
  });
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  castHash,
  videoIndex,
  source,
  aspectRatio,
  poster,
  duration,
  isLooping,
  muted,
  onMuteToggle,
  hideMetadata,
}) => {
  const trackCastClick = useTrackCastClick();
  const t = useTheme();
  const { shouldAutoPlayVideos: shouldAutoplay } = useDataSaver();
  const navigate = useNavigate();

  const { isInCarousel, isCarouselVisible, visibleIndex } =
    useAttachmentsCarouselVisibility();

  const isVisibleInCarousel = React.useMemo(() => {
    if (!isInCarousel) {
      return true;
    }
    return isCarouselVisible && visibleIndex === videoIndex;
  }, [isInCarousel, isCarouselVisible, visibleIndex, videoIndex]);

  const [playbackInstanceInfo, setPlaybackInstanceInfo] =
    React.useState<PlaybackState>({
      duration,
      state: 'paused',
    });

  // Update: This used to be a state variable but we are going with TextInput.text update
  // trick to free up JS thread on every second this was updating the whole state on the player.
  const currentTimestampInputRef = React.useRef<TextInput>(null);
  const currentMsPositionRef = React.useRef(0);

  const [shouldPlay, setShouldPlay] = React.useState<boolean>(false);
  const [isVideoLoaded, setIsVideoLoaded] = React.useState<boolean>(false);

  const isFocused = useIsFocused();

  // Keep the screen awake while video is playing (Android fix)
  React.useEffect(() => {
    if (shouldPlay && isVideoLoaded) {
      activateKeepAwakeAsync('videoPlayer');
    } else {
      deactivateKeepAwake('videoPlayer');
    }

    return () => {
      deactivateKeepAwake('videoPlayer');
    };
  }, [shouldPlay, isVideoLoaded]);

  const videoSource = React.useMemo(() => {
    if (typeof source === 'string') {
      return {
        ...videoRequestHeaders,
        uri: source,
      };
    } else if (typeof source === 'number') {
      return {
        ...videoRequestHeaders,
        assetId: source,
      };
    } else {
      return {
        ...source,
        ...videoRequestHeaders,
      };
    }
  }, [source]);

  const recyclableRef = React.useRef(true);
  const player = useRecyclableVideoPlayer(
    videoSource,
    {
      visible: shouldPlay || !recyclableRef.current,
      recyclableRef,
    },
    (player) => {
      player.loop = isLooping;
      player.muted = muted;
      player.audioMixingMode = determineAudioMixingMode(muted);
      player.timeUpdateEventInterval = 0.5;
      if (shouldPlay) {
        player.play();
      }
    },
  );

  React.useEffect(() => {
    if (player) {
      try {
        player.muted = muted;
        player.audioMixingMode = determineAudioMixingMode(muted);
      } catch (error) {
        // Non-fatal: the player may have been recycled/released. Reading or
        // writing a released expo-video player throws synchronously and would
        // otherwise crash this effect.
      }
    }
  }, [muted, player]);

  const calculateTimestamp = React.useCallback(
    (currentSecTimestamp: number) => {
      const durationWithFallback = playbackInstanceInfo.duration ?? duration;
      return getMinutesSecondsFromMilliseconds(
        durationWithFallback - currentSecTimestamp * 1000,
      );
    },
    [duration, playbackInstanceInfo.duration],
  );

  const animatedIsPlaying = useSharedValue(0);
  const animatedOpacity = useAnimatedStyle(
    () => ({
      opacity: withTiming(
        interpolate(animatedIsPlaying.value, [0, 1], [1, 0]),
        { duration: 200, easing },
      ),
    }),
    [],
  );

  const videoContainerRef = React.useRef<View>(null);

  const playInFeed = React.useCallback(() => {
    if (!isVisibleInCarousel) {
      return;
    }

    setShouldPlay(true);
    try {
      player?.play();
    } catch (error) {
      // Non-fatal: the player may have been recycled/released by the time the
      // viewability callback fires. We don't report it to DD to avoid log spam.
    }
    animatedIsPlaying.value = 1;
  }, [animatedIsPlaying, isVisibleInCarousel, player]);

  const pauseInFeed = React.useCallback(() => {
    try {
      player?.pause();
    } catch (error) {
      // This is a non-fatal error that commonly happens when the video
      // instance has already been disposed of. We don't have a way to
      // well whether this is the case so we just catch the error.
      // We don't report it to DD to avoid spamming the logs.
    }
    animatedIsPlaying.value = 0;
    setShouldPlay(false);
  }, [animatedIsPlaying, player]);

  const registrationHash = isInCarousel
    ? `${castHash}-video-${videoIndex ?? 0}`
    : castHash;

  useWrappedVideoFeedViewablility({
    hash: registrationHash,
    play: playInFeed,
    pause: pauseInFeed,
    shouldAutoplay,
  });

  // Handle carousel video switching
  React.useEffect(() => {
    if (!isInCarousel) {
      return;
    }

    const shouldBeVisible =
      isFocused && isCarouselVisible && visibleIndex === videoIndex;

    if (shouldBeVisible && !shouldPlay && shouldAutoplay) {
      playInFeed();
    } else if (!shouldBeVisible && shouldPlay) {
      pauseInFeed();
    }
  }, [
    isFocused,
    isInCarousel,
    isCarouselVisible,
    visibleIndex,
    videoIndex,
    shouldPlay,
    shouldAutoplay,
    playInFeed,
    pauseInFeed,
  ]);

  const toggleMute = React.useCallback(() => {
    onMuteToggle();
  }, [onMuteToggle]);

  React.useEffect(() => {
    if (!player) {
      return undefined;
    }

    const playerRefInEffect = player;

    const statusListener = playerRefInEffect.addListener(
      'statusChange',
      (event) => {
        if (event.status !== 'readyToPlay' || isVideoLoaded) {
          return;
        }
        setIsVideoLoaded(true);

        try {
          const nativeDuration = playerRefInEffect.duration;
          if (nativeDuration && nativeDuration > 0) {
            setPlaybackInstanceInfo((prev) => ({
              ...prev,
              duration: nativeDuration * 1000,
            }));
          }
        } catch {
          /* player recycled before listener fired */
        }
      },
    );

    const playingListener = playerRefInEffect.addListener(
      'playingChange',
      (event) => {
        try {
          playerRefInEffect.muted = muted;
          playerRefInEffect.audioMixingMode = determineAudioMixingMode(muted);
          setPlaybackInstanceInfo((prev) => ({
            ...prev,
            state: event.isPlaying ? 'playing' : 'paused',
          }));
        } catch {
          /* player recycled before listener fired */
        }
      },
    );

    const timeUpdateListener = playerRefInEffect.addListener(
      'timeUpdate',
      (event) => {
        currentTimestampInputRef?.current?.setNativeProps({
          text: calculateTimestamp(Math.floor(event.currentTime)),
        });
        currentMsPositionRef.current = event.currentTime * 1000;
      },
    );

    return () => {
      statusListener.remove();
      playingListener.remove();
      timeUpdateListener.remove();
    };
  }, [calculateTimestamp, duration, isVideoLoaded, muted, player]);

  React.useEffect(() => {
    setPlaybackInstanceInfo((prev) => ({
      ...prev,
      duration,
    }));
  }, [source, duration]);

  const onExpandPress = React.useCallback(() => {
    trackCastClick({ type: CastClickType.VideoFullscreen });
    recyclableRef.current = false;

    // Likely a DC video
    const isNonCastVideo = castHash === '0x0';
    const videoUrl =
      typeof source === 'string'
        ? source
        : typeof source === 'number'
          ? undefined
          : source?.uri;

    navigate('VideoScreen', {
      seedVideo: {
        castHash: isNonCastVideo ? undefined : castHash,
        video: {
          type: 'video',
          url: videoUrl,
          sourceUrl: videoUrl,
          duration: duration,
          thumbnailUrl: poster,
          width: screenWidth,
          height: screenWidth / aspectRatio,
        } as ApiCastVideoEmbed,
        videoInCastIndex: videoIndex,
        position: currentMsPositionRef.current,
        isPlaying: playbackInstanceInfo.state === 'playing',
        // TODO: there is a choppy audio issue when using the existing player
        // so we're not using it for now
        // videoPlayer: Platform.OS === 'ios' ? player : undefined,
      },
      onClose: (state) => {
        // Delay the state sync to avoid interfering with the closing animation
        setTimeout(() => {
          recyclableRef.current = true;
          if (!state) {
            return;
          }
          try {
            const positionDiff = state.position - currentMsPositionRef.current;
            if (Math.abs(positionDiff) > 100) {
              player?.seekBy(positionDiff / 1000);
            }

            // Handle play/pause state
            if (state.isPlaying && !shouldPlay) {
              playInFeed();
            } else if (!state.isPlaying && shouldPlay) {
              pauseInFeed();
            } else if (state.isPlaying && shouldPlay) {
              player?.play();
              animatedIsPlaying.value = 1;
              setShouldPlay(true);
            }

            // Restore the original mute state
            if (player) {
              player.muted = muted;
              player.loop = isLooping;
              player.audioMixingMode = determineAudioMixingMode(muted);
            }
          } catch (error) {
            // this is a non-fatal error that commonly happens when the video
            // instance has already been disposed of. We don't have a way to
            // well whether this is the case so we just catch the error.
            // We don't report it to DD to avoid spamming the logs.
          }
        }, 300); // Wait for the navigation animation to complete
      },
    });
  }, [
    trackCastClick,
    animatedIsPlaying,
    castHash,
    aspectRatio,
    playbackInstanceInfo.state,
    duration,
    player,
    navigate,
    source,
    poster,
    videoIndex,
    shouldPlay,
    muted,
    isLooping,
    playInFeed,
    pauseInFeed,
  ]);

  React.useEffect(() => {
    if (shouldPlay && isVideoLoaded) {
      try {
        player?.play();
      } catch (error) {
        // this is a non-fatal error that commonly happens when the video
        // instance has already been disposed of. We don't have a way to
        // well whether this is the case so we just catch the error.
        // We don't report it to DD to avoid spamming the logs.
      }
      animatedIsPlaying.value = 1;
    } else if (!shouldPlay) {
      try {
        player?.pause();
      } catch (error) {
        // this is a non-fatal error that commonly happens when the video
        // instance has already been disposed of. We don't have a way to
        // well whether this is the case so we just catch the error.
        // We don't report it to DD to avoid spamming the logs.
      }
      animatedIsPlaying.value = 0;
    }
  }, [shouldPlay, player, isVideoLoaded, animatedIsPlaying]);

  React.useEffect(() => {
    if (!isFocused && shouldPlay) {
      pauseInFeed();
    }
  }, [isFocused, shouldPlay, pauseInFeed]);

  const videoToRender = React.useMemo(() => {
    if (!player) {
      return undefined;
    }
    return (
      <VideoView
        style={{
          height: '100%',
          width: '100%',
        }}
        player={player}
        contentFit="cover"
        nativeControls={false}
        allowsVideoFrameAnalysis={false}
        allowsPictureInPicture={false}
      />
    );
  }, [player]);

  const nativePlayerDurationOrZero = React.useMemo(() => {
    if (typeof player === 'undefined') {
      return 0;
    }
    try {
      return player.duration ?? 0;
    } catch {
      /* native shared object disposed; treat as duration unknown */
      return 0;
    }
  }, [player]);

  const onVideoPress = React.useCallback(() => {
    if (shouldPlay || (isInCarousel && !isVisibleInCarousel)) {
      onExpandPress();
    } else {
      playInFeed();
    }
  }, [
    onExpandPress,
    playInFeed,
    shouldPlay,
    isInCarousel,
    isVisibleInCarousel,
  ]);

  return (
    <TouchableOpacity
      style={[t.flex1, t.relative]}
      onPress={onVideoPress}
      activeOpacity={0.95}
    >
      <View ref={videoContainerRef} style={[t.overflowHidden]}>
        <View style={[t.relative, t.bgElevated]}>
          <Image
            source={{ uri: poster, headers: imageRequestHeaders }}
            recyclingKey={poster}
            cachePolicy="memory-disk"
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        </View>
      </View>
      <View
        style={[
          t.inset0,
          {
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
          },
        ]}
      >
        {shouldPlay && videoToRender}
      </View>
      <Animated.View
        style={[
          t.wFull,
          t.hFull,
          t.absolute,
          t.justifyCenter,
          t.itemsCenter,
          t.flex,
          t.flexCol,
          animatedOpacity,
        ]}
      >
        <View
          style={[
            t.flex,
            t.flexRow,
            t.itemsCenter,
            t.justifyCenter,
            t.directCasts.bgImagePreview,
            t.h12,
            t.w12,
            { maxWidth: sizes.s18 },
            t.roundedFull,
          ]}
        >
          <Ionicons
            name="play"
            size={24}
            style={[t.texts.light, { paddingLeft: shouldPlay ? 2 : 4 }]}
          />
        </View>
      </Animated.View>
      {shouldPlay && !isVideoLoaded && (
        <View
          style={[
            t.wFull,
            t.hFull,
            t.absolute,
            t.justifyCenter,
            t.itemsCenter,
            t.flex,
            t.flexCol,
          ]}
        >
          <LoadingIndicator />
        </View>
      )}
      <View
        style={[
          t.flex,
          t.flexRow,
          t.itemsCenter,
          t.absolute,
          t.bottom0,
          t.left0,
          t.mL1,
          t.mB2,
          hideMetadata && [t.opacity0],
        ]}
      >
        <View
          style={[
            t.flex,
            t.flexRow,
            t.itemsCenter,
            t.justifyCenter,
            t.directCasts.bgImagePreview,
            { borderRadius: 6 },
            t.pX2,
            t.h6,
            t.w12,
            duration === 0 && nativePlayerDurationOrZero === 0 && [t.opacity0],
          ]}
        >
          <TextInput
            ref={currentTimestampInputRef}
            style={[t.texts.light, t.textXs, t.fontSemibold]}
            defaultValue={getMinutesSecondsFromMilliseconds(duration)}
          />
        </View>
      </View>
      <View
        style={[
          t.flex,
          t.flexRow,
          t.itemsCenter,
          t.absolute,
          t.bottom0,
          t.right0,
          t.mR1,
          t.mB2,
          hideMetadata && [t.opacity0],
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
            t.h6,
            t.w6,
          ]}
          hitSlop={hitSlop}
          onPress={toggleMute}
          activeOpacity={0.75}
        >
          <Octicons
            name={muted ? 'mute' : 'unmute'}
            size={14}
            style={[t.texts.light]}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

VideoPlayer.displayName = 'VideoPlayer';

export { VideoPlayer };
