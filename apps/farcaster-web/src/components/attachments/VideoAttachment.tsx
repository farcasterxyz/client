import {
  MediaPlayer,
  MediaPlayerInstance,
  MediaProvider,
  Poster,
  useStore,
} from '@vidstack/react';
import {
  defaultLayoutIcons,
  DefaultVideoLayout,
} from '@vidstack/react/player/layouts/default';
import classNames from 'classnames';
import {
  CastClickType,
  getImageAspectRatio,
  useTrackCastClick,
} from 'farcaster-client-hooks';
import {
  Component,
  FC,
  memo,
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useInView } from 'react-intersection-observer';

import { useVideoPlayStatus } from '~/contexts/VideoPlayStatusProvider';

interface VideoAttachmentProps {
  url: string;
  videoWidth: number;
  videoHeight: number;
  thumbnailUrl?: string;
  mode: 'cast' | 'quote-cast' | 'composer';
  autoPlay: boolean;
  controlledVideoPlayerRef?: React.Ref<{ enterFullscreen: () => void }>;
  renderWidth?: number;
  renderHeight?: number;
  maxHeight?: number;
  maxWidth?: number;
}

// Analytics dedupe flags. Owned by VideoAttachment (which stays mounted for
// the life of the feed item) rather than the players, so player unload/reload
// cycles don't re-arm once-per-video events.
type VideoAnalyticsEventsEmitted = {
  volume: boolean;
  fullscreen: boolean;
  play: boolean;
};

interface VideoPlayerProps {
  url: string;
  thumbnailUrl?: string;
  mode: 'cast' | 'quote-cast' | 'composer';
  autoPlay: boolean;
  controlledVideoPlayerRef?: React.Ref<{ enterFullscreen: () => void }>;
  inView: boolean;
  aspectRatio: number;
  renderWidth?: number;
  renderHeight?: number;
  maxHeight?: number;
  maxWidth?: number;
  onPlayingChange?: (playing: boolean) => void;
  // Identifies this attachment in the app-global autoplay queue so duplicate
  // mounts of the same URL can't remove each other's queue entry.
  autoplayOwnerId: string;
  // "User deliberately played/paused this video" — must survive player
  // unload/reload cycles, so it lives on VideoAttachment, not the players.
  manualAutoplayOverrideRef: RefObject<boolean>;
  eventsEmittedRef: RefObject<VideoAnalyticsEventsEmitted>;
}

// How far outside the viewport a video player stays mounted. Beyond this the
// player is unmounted and replaced with a lightweight poster placeholder.
// Feed lists are not virtualized, so without this every video ever scrolled
// into view keeps its MediaSource buffers (~15-40MB each) alive for the life
// of the tab, growing tab memory unboundedly (users reported 1.4GB+ tabs).
const PLAYER_UNLOAD_ROOT_MARGIN = '2000px 0px 2000px 0px';

// Image extensions plus the Warpcast CDN variant suffixes (see
// ImageUtils.ts in farcaster-client-hooks) that are safe to use as a poster.
const POSTER_EXTENSION_PATTERN = /\.(jpe?g|png|webp|gif|avif)$/i;
const POSTER_CDN_VARIANT_PATTERN =
  /\/(original|rectcontain[1-3]|rectcrop[1-3]|squarecrop[1-3]|squarecover[1-3])$/;

const posterIsRenderable = (thumbnailUrl?: string): thumbnailUrl is string => {
  if (typeof thumbnailUrl !== 'string') {
    return false;
  }
  const path = thumbnailUrl.split(/[?#]/)[0];
  return (
    POSTER_EXTENSION_PATTERN.test(path) || POSTER_CDN_VARIANT_PATTERN.test(path)
  );
};

const VideoAttachment: FC<VideoAttachmentProps> = memo((props) => {
  const { renderWidth, renderHeight, maxHeight, maxWidth } = props;

  const { aspectRatio } = useMemo(() => {
    return {
      aspectRatio: getImageAspectRatio({
        w: props.videoWidth,
        h: props.videoHeight,
      }),
    };
  }, [props.videoHeight, props.videoWidth]);

  const { ref: inViewRef, inView } = useInView({
    threshold: 0.9,
  });

  // Tracks whether the player is anywhere near the viewport. When it drifts
  // far away we unmount the player entirely so the browser can release its
  // media buffers (see PLAYER_UNLOAD_ROOT_MARGIN). Starts false so that
  // far-off-screen attachments (e.g. a freshly appended feed page) never
  // mount a player even transiently; near-viewport ones show the poster
  // placeholder until the observer's initial callback, and the 2000px margin
  // means scroll-approached players mount long before they become visible.
  const { ref: nearViewportRef, inView: nearViewport } = useInView({
    rootMargin: PLAYER_UNLOAD_ROOT_MARGIN,
    threshold: 0,
  });

  // Keep a playing video mounted even when it scrolls far away (e.g. the user
  // manually played it with sound and kept scrolling) so audio doesn't cut out.
  // False reports are debounced: Vidstack implements `loop` in JS, so every
  // loop boundary emits a real pause a few ms before play() restores it, and
  // buffering stalls do the same — reacting to those instantly would destroy
  // the player mid-listen.
  const [isPlaying, setIsPlaying] = useState(false);
  const playingFalseTimerRef = useRef<number | undefined>(undefined);
  const handlePlayingChange = useCallback((playing: boolean) => {
    window.clearTimeout(playingFalseTimerRef.current);
    playingFalseTimerRef.current = undefined;
    if (playing) {
      setIsPlaying(true);
    } else {
      playingFalseTimerRef.current = window.setTimeout(() => {
        setIsPlaying(false);
      }, 1500);
    }
  }, []);
  useEffect(() => {
    return () => {
      window.clearTimeout(playingFalseTimerRef.current);
    };
  }, []);

  // Keyboard users can be focused inside the player (controls, seek bar);
  // unloading it then would drop focus to <body> and restart tabbing from the
  // top of the feed, so a focused player is never unloaded.
  const [hasFocusWithin, setHasFocusWithin] = useState(false);

  // Per-instance identity in the app-global autoplay queue, and cross-remount
  // state the players need to share (see VideoPlayerProps).
  const autoplayOwnerId = useId();
  const manualAutoplayOverrideRef = useRef<boolean>(false);
  const eventsEmittedRef = useRef<VideoAnalyticsEventsEmitted>({
    volume: false,
    fullscreen: false,
    play: false,
  });

  // Stable merged ref: an inline closure would re-register both
  // IntersectionObservers on every render (each gets called with null, then
  // the node again), which is wasted work on a component that re-renders on
  // every visibility flip while scrolling.
  const setViewportRefs = useCallback(
    (node: HTMLDivElement | null) => {
      inViewRef(node);
      nearViewportRef(node);
    },
    [inViewRef, nearViewportRef],
  );

  const videoPlayerProps: VideoPlayerProps = useMemo(() => {
    return {
      ...props,
      inView,
      aspectRatio,
      onPlayingChange: handlePlayingChange,
      autoplayOwnerId,
      manualAutoplayOverrideRef,
      eventsEmittedRef,
    };
  }, [props, inView, aspectRatio, handlePlayingChange, autoplayOwnerId]);

  const isSafari = useMemo(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('safari') && !userAgent.includes('chrome');
  }, []);

  // This is complex, but basically:
  // - player needs an outer div for sizing (max width/height + aspect ratio), no border because it
  //   messes up the aspect ratio (empty space at bottom/right), so
  // - we add another div to wrap it and add a tight border in cast mode
  // - we need a parent to be the flex parent of the div above so it can collapse it in non-quote mode,
  //   and center it and add a full-width border in quote mode
  // Some of this is driven by Firefox making a general mess with the width, so make sure to test it,
  // especially the w-full classes.
  return (
    <div
      className={classNames(
        'flex shrink-0 flex-col overflow-hidden rounded-[12px] border border-default',
      )}
    >
      <div
        ref={setViewportRefs}
        className="flex items-center"
        style={{
          width: renderWidth,
          height: renderHeight,
          maxWidth,
          maxHeight,
          aspectRatio,
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onFocusCapture={() => {
          setHasFocusWithin(true);
        }}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setHasFocusWithin(false);
          }
        }}
      >
        {/*
          The player must stay mounted when:
          - it is near the viewport (the memory optimization's normal path),
          - it is playing (audio must not cut out when scrolled far away),
          - focus is inside it (keyboard users would lose their tab position),
          - a controlled ref is attached: DM embeds render a hidden h-0 copy
            purely for its enterFullscreen() handle, inside an inner scroll
            container that defeats viewport rootMargin — if the placeholder
            rendered there, tap-to-fullscreen would silently no-op (and a
            deferred retry can't work, fullscreen needs a live user gesture).
        */}
        {nearViewport ||
        isPlaying ||
        hasFocusWithin ||
        (props.controlledVideoPlayerRef !== undefined &&
          props.controlledVideoPlayerRef !== null) ? (
          <VideoPlayerErrorBoundary
            fallback={
              <UnloadedVideoPlaceholder
                thumbnailUrl={props.thumbnailUrl}
                maxWidth={maxWidth}
                maxHeight={maxHeight}
                aspectRatio={aspectRatio}
              />
            }
          >
            {isSafari ? (
              <NativeVideoPlayer {...videoPlayerProps} />
            ) : (
              <VidstackVideoPlayer {...videoPlayerProps} />
            )}
          </VideoPlayerErrorBoundary>
        ) : (
          <UnloadedVideoPlaceholder
            thumbnailUrl={props.thumbnailUrl}
            maxWidth={maxWidth}
            maxHeight={maxHeight}
            aspectRatio={aspectRatio}
          />
        )}
      </div>
    </div>
  );
});

// A crash inside one player (e.g. during a Vidstack teardown/remount cycle)
// must degrade to that video's placeholder, not blank the whole feed route to
// the page-level error fallback. Mobile hit exactly this with the same
// unload optimization (NEYN-11807). Remounting after a band crossing gives a
// fresh boundary, so a transient crash self-heals on re-approach.
class VideoPlayerErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

// Layout-preserving stand-in for a far-off-screen player. Renders the poster
// (when we have a usable one) inside the same sized box so scroll height and
// positions don't shift when players unload/reload.
const UnloadedVideoPlaceholder: FC<{
  thumbnailUrl?: string;
  maxWidth?: number;
  maxHeight?: number;
  aspectRatio: number;
}> = ({ thumbnailUrl, maxWidth, maxHeight, aspectRatio }) => {
  return (
    <div
      className="video-player flex h-full w-full items-center justify-center"
      style={{ maxWidth, maxHeight, aspectRatio }}
    >
      {posterIsRenderable(thumbnailUrl) && (
        <img
          className="h-full w-full object-contain"
          style={{ maxHeight, aspectRatio }}
          src={thumbnailUrl}
          alt="Cast video"
        />
      )}
    </div>
  );
};

const VidstackVideoPlayer: FC<VideoPlayerProps> = memo(
  ({
    url,
    thumbnailUrl,
    autoPlay,
    controlledVideoPlayerRef,
    inView,
    maxHeight,
    maxWidth,
    aspectRatio,
    onPlayingChange,
    autoplayOwnerId,
    manualAutoplayOverrideRef,
    eventsEmittedRef,
  }) => {
    const trackCastClick = useTrackCastClick();

    const {
      activeVideoUrl,
      enqueueVideoForAutoplay,
      dequeueVideoFromAutoplay,
      forcePlayVideo,
    } = useVideoPlayStatus();

    const [canPlay, setCanPlay] = useState(false);

    const ref = useRef<MediaPlayerInstance>(null);
    const { playing, waiting } = useStore(MediaPlayerInstance, ref);

    const onExitFullscreen = useCallback(() => {
      ref.current?.pause();
    }, []);

    useImperativeHandle(controlledVideoPlayerRef, () => {
      return {
        enterFullscreen: () => {
          if (typeof ref.current === 'undefined' || ref.current === null) {
            return;
          }

          ref.current.enterFullscreen().catch(() => {
            // Fullscreen can be denied (permissions, not a user gesture)
          });

          ref.current.play().catch(() => {
            // Autoplay restrictions / detached source
          });
        },
      };
    });

    useEffect(() => {
      return () => {
        dequeueVideoFromAutoplay(url, autoplayOwnerId);
      };
    }, [dequeueVideoFromAutoplay, url, autoplayOwnerId]);

    // Report play state up so the parent can keep playing videos mounted.
    // `waiting` counts as playing: a buffering stall pauses the media without
    // ending the listening session, and must not unmount the player.
    useEffect(() => {
      onPlayingChange?.(playing || waiting);
    }, [playing, waiting, onPlayingChange]);

    useEffect(() => {
      return () => {
        onPlayingChange?.(false);
      };
    }, [onPlayingChange]);

    // Add video to autoplay queue before it is loaded so that videos play in the correct
    // top to bottom order. Also remove from autoplay queue if video goes out of view
    useEffect(() => {
      if (!autoPlay) {
        return;
      }

      if (inView && !manualAutoplayOverrideRef.current) {
        enqueueVideoForAutoplay(url, autoplayOwnerId);
      } else {
        dequeueVideoFromAutoplay(url, autoplayOwnerId);
      }
    }, [
      autoPlay,
      inView,
      enqueueVideoForAutoplay,
      dequeueVideoFromAutoplay,
      url,
      autoplayOwnerId,
      manualAutoplayOverrideRef,
    ]);

    // Play and pause based on visibility
    useEffect(() => {
      if (!autoPlay) {
        return;
      }

      if (
        inView &&
        activeVideoUrl === url &&
        canPlay &&
        !playing &&
        !manualAutoplayOverrideRef.current
      ) {
        ref.current?.play();
      } else if (playing && activeVideoUrl !== url) {
        ref.current?.pause();
      }
    }, [
      activeVideoUrl,
      autoPlay,
      canPlay,
      inView,
      playing,
      url,
      manualAutoplayOverrideRef,
    ]);
    return (
      <MediaPlayer
        ref={ref}
        className={classNames('video-player')}
        load="visible"
        onMediaExitFullscreenRequest={onExitFullscreen}
        muted
        crossOrigin
        playsInline
        loop={true}
        hideControlsOnMouseLeave
        style={{
          maxWidth,
          maxHeight,
          aspectRatio,
        }}
        onCanPlay={() => {
          setCanPlay(true);
        }}
        onVolumeChange={(detail) => {
          if (
            !detail.muted &&
            detail.volume > 0 &&
            eventsEmittedRef.current.volume === false
          ) {
            trackCastClick({ type: CastClickType.VideoUnmute });
            eventsEmittedRef.current.volume = true;
          }
        }}
        onFullscreenChange={(detail) => {
          if (detail && eventsEmittedRef.current.fullscreen === false) {
            trackCastClick({ type: CastClickType.VideoFullscreen });
            eventsEmittedRef.current.fullscreen = true;
          }

          if (ref.current) {
            if (detail) {
              ref.current.muted = false;
              ref.current.volume = 1;
            } else {
              ref.current.muted = true;
            }
          }
        }}
        onPlay={() => {
          if (eventsEmittedRef.current.play === false) {
            eventsEmittedRef.current.play = true;
          }
          // If video starts playing and it's not the active video,
          // it means the user manually started it (e.g., via spacebar or clicking play button)
          // So we need to make it the active video to prevent it from being paused by the autoplay effect
          // Only do this when the video is in view: a focused-but-offscreen player can receive spacebar play, and it must not steal active status from the video the user is actually watching.
          if (activeVideoUrl !== url && inView) {
            forcePlayVideo(url, autoplayOwnerId);
            manualAutoplayOverrideRef.current = true;
          }
        }}
        onPause={() => {
          if (manualAutoplayOverrideRef.current) {
            // Only remove from autoplay queue if we manually started. If this video was paused because the user played
            // another video (and this video is still in view) we don't want to remove it, so that when the other video
            // is paused, this can be resumed
            dequeueVideoFromAutoplay(url, autoplayOwnerId);
          }
        }}
        onClick={() => {
          forcePlayVideo(url, autoplayOwnerId);
          manualAutoplayOverrideRef.current = true;
        }}
        src={url}
      >
        <MediaProvider>
          {posterIsRenderable(thumbnailUrl) && (
            <Poster
              className="vds-poster"
              style={{ maxHeight, aspectRatio }}
              src={thumbnailUrl}
              alt="Cast video"
            />
          )}
        </MediaProvider>
        <DefaultVideoLayout
          icons={defaultLayoutIcons}
          smallLayoutWhen={false}
          slots={{
            googleCastButton: false,
            airPlayButton: false,
            pipButton: false,
            settingsMenu: false,
          }}
        />
      </MediaPlayer>
    );
  },
);

// Native Video Player for Safari
const NativeVideoPlayer: FC<VideoPlayerProps> = ({
  url,
  thumbnailUrl,
  autoPlay,
  controlledVideoPlayerRef,
  inView,
  aspectRatio,
  onPlayingChange,
  autoplayOwnerId,
  manualAutoplayOverrideRef,
  eventsEmittedRef,
}) => {
  const trackCastClick = useTrackCastClick();
  const videoRef = useRef<HTMLVideoElement>(null);
  const {
    activeVideoUrl,
    enqueueVideoForAutoplay,
    dequeueVideoFromAutoplay,
    forcePlayVideo,
  } = useVideoPlayStatus();
  const [isPlaying, setIsPlaying] = useState(false);

  // Report play state up so the parent can keep playing videos mounted
  useEffect(() => {
    onPlayingChange?.(isPlaying);
  }, [isPlaying, onPlayingChange]);

  useEffect(() => {
    return () => {
      onPlayingChange?.(false);
    };
  }, [onPlayingChange]);

  // WebKit holds media buffers until GC unless the source is explicitly
  // detached — without this, unmounting the player doesn't actually release
  // memory on Safari (the platform the unload optimization matters least
  // without).
  useEffect(() => {
    const video = videoRef.current;
    return () => {
      if (video === null) {
        return;
      }
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, []);

  // Pause when leaving fullscreen (parity with the Vidstack player's
  // onMediaExitFullscreenRequest). DM videos play hidden in an h-0 box, so
  // without this they'd keep playing audibly after the user closes
  // fullscreen — and autoPlay=false players are never paused by the
  // visibility coordinator.
  useEffect(() => {
    const video = videoRef.current;
    if (video === null) {
      return;
    }
    const onFullscreenChange = () => {
      if (document.fullscreenElement !== video) {
        video.pause();
      }
    };
    // iPhone Safari uses its own fullscreen API and end event
    const onWebkitEndFullscreen = () => {
      video.pause();
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    video.addEventListener('webkitendfullscreen', onWebkitEndFullscreen);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      video.removeEventListener('webkitendfullscreen', onWebkitEndFullscreen);
    };
  }, []);

  const enterFullscreen = useCallback(() => {
    const video = videoRef.current;
    if (video === null) {
      return;
    }
    if (video.requestFullscreen) {
      video.requestFullscreen().catch((_err) => {
        // Silently fail if fullscreen request fails
      });
    } else {
      // iPhone Safari: element fullscreen API is unavailable; use the
      // video-specific WebKit one so the tap still opens the system player.
      const webkitVideo = video as HTMLVideoElement & {
        webkitEnterFullscreen?: () => void;
      };
      try {
        webkitVideo.webkitEnterFullscreen?.();
      } catch {
        // Not ready or not allowed; the play() below still runs
      }
    }
    // No optimistic isPlaying here: onPlay reports success. Latching before
    // play() resolves would pin an invisible player mounted forever if play
    // is rejected (Low Power Mode, dead URL).
    video.play().catch(() => {
      // Silently fail if play is blocked
    });
  }, []);

  useImperativeHandle(controlledVideoPlayerRef, () => {
    return {
      enterFullscreen,
    };
  });

  const playVideo = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Silently fail if play is blocked
      });
    }
  }, []);

  // Handle pausing the video
  const pauseVideo = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  }, []);

  useEffect(() => {
    return () => {
      dequeueVideoFromAutoplay(url, autoplayOwnerId);
    };
  }, [dequeueVideoFromAutoplay, url, autoplayOwnerId]);

  useEffect(() => {
    if (!autoPlay) {
      return;
    }

    if (inView && !manualAutoplayOverrideRef.current) {
      enqueueVideoForAutoplay(url, autoplayOwnerId);
    } else {
      dequeueVideoFromAutoplay(url, autoplayOwnerId);
    }
  }, [
    autoPlay,
    inView,
    enqueueVideoForAutoplay,
    dequeueVideoFromAutoplay,
    url,
    autoplayOwnerId,
    manualAutoplayOverrideRef,
  ]);

  useEffect(() => {
    if (!autoPlay) {
      return;
    }

    if (
      inView &&
      activeVideoUrl === url &&
      videoRef.current &&
      !isPlaying &&
      !manualAutoplayOverrideRef.current
    ) {
      playVideo();
    } else if (isPlaying && activeVideoUrl !== url) {
      pauseVideo();
    }
  }, [
    activeVideoUrl,
    autoPlay,
    inView,
    isPlaying,
    url,
    playVideo,
    pauseVideo,
    manualAutoplayOverrideRef,
  ]);

  return (
    <video
      ref={videoRef}
      className={classNames('h-full w-full flex-1 object-contain')}
      poster={thumbnailUrl}
      src={url}
      playsInline
      loop
      muted
      controls
      onPlay={() => {
        if (eventsEmittedRef.current.play === false) {
          eventsEmittedRef.current.play = true;
        }
        // If video starts playing and it's not the active video,
        // it means the user manually started it (e.g., via spacebar or clicking play button)
        // So we need to make it the active video to prevent it from being paused by the autoplay effect
        // Only do this when the video is in view: a focused-but-offscreen player can receive spacebar play, and it must not steal active status from the video the user is actually watching.
        if (activeVideoUrl !== url && inView) {
          forcePlayVideo(url, autoplayOwnerId);
          manualAutoplayOverrideRef.current = true;
        }
        setIsPlaying(true);
      }}
      onPause={() => {
        setIsPlaying(false);
        if (manualAutoplayOverrideRef.current) {
          // Only remove from autoplay queue if we manually started. If this video was paused because the user played
          // another video (and this video is still in view) we don't want to remove it, so that when the other video
          // is paused, this can be resumed
          dequeueVideoFromAutoplay(url, autoplayOwnerId);
        }
      }}
      onClick={() => {
        forcePlayVideo(url, autoplayOwnerId);
        manualAutoplayOverrideRef.current = true;
      }}
      onVolumeChange={(e) => {
        if (
          !e.currentTarget.muted &&
          eventsEmittedRef.current.volume === false
        ) {
          trackCastClick({ type: CastClickType.VideoUnmute });
          eventsEmittedRef.current.volume = true;
        }
      }}
      style={{
        aspectRatio,
      }}
    />
  );
};

VideoAttachment.displayName = 'VideoAttachment';

export { VideoAttachment };
