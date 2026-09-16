import { ApiCast } from 'farcaster-client-data';
import { FeedItemType, MixedFeedItem } from 'farcaster-client-hooks';
import React, {
  createContext,
  memo,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
} from 'react';
import {
  Platform,
  ViewabilityConfig,
  ViewabilityConfigCallbackPair,
  ViewToken,
} from 'react-native';

import { useUserAppContext } from './UserAppContextProvider';

type VideosOnFeedCallbackCache = {
  [castHash: string]: {
    play: () => void;
    pause: () => void;
  };
};

type AnimatedImageCallbacks = {
  start: () => void;
  stop: () => void;
};

type AnimatedImagesOnFeedCallbackCache = {
  [castHash: string]: Map<string, AnimatedImageCallbacks>;
};

type VideoFeedViewablilityContextValue = {
  addVideo(params: { hash: string; play: () => void; pause: () => void }): void;
  removeVideo(params: { hash: string }): void;
  addAnimatedImage(
    params: {
      hash: string;
      imageKey: string;
    } & AnimatedImageCallbacks,
  ): void;
  removeAnimatedImage(params: { hash: string; imageKey: string }): void;
  onEnterOrLeaveChanged({ changed }: { changed: ViewToken[] }): void;
  onMajorityVisibleChanged({ changed }: { changed: ViewToken[] }): void;
  onAnimatedImageViewableChanged({ changed }: { changed: ViewToken[] }): void;
};

const getCastFromViewToken = (item: ViewToken['item']): ApiCast | undefined => {
  // We could get undefined item when an item is removed from the list
  if (!item) {
    return undefined;
  }

  if ('type' in item) {
    // Handle ThreadListItem (Cast screen)
    if (item.type === 'cast' && 'wrappedCast' in item) {
      return item.wrappedCast.cast;
    }
    // Handle ApiNotification (NotificationsInGroup screen): cast-bearing
    // notification variants carry the cast at content.cast
    if (
      'content' in item &&
      typeof item.content === 'object' &&
      item.content !== null &&
      'cast' in item.content
    ) {
      return (item.content as { cast: ApiCast }).cast;
    }
    const mixedFeedItem = item as MixedFeedItem;
    return mixedFeedItem.type === FeedItemType.Cast
      ? mixedFeedItem.item.cast
      : undefined;
  }

  return item;
};

const VideoFeedViewablilityContext =
  createContext<VideoFeedViewablilityContextValue>({} as never);

export const VideoFeedViewablilityProvider = memo(
  ({ children }: PropsWithChildren) => {
    const { enabledVideoAutoplay } = useUserAppContext();

    const videoCallbacks = useRef<VideosOnFeedCallbackCache>({});

    const addVideo = useCallback(
      ({
        hash,
        play,
        pause,
      }: {
        hash: string;
        play: () => void;
        pause: () => void;
      }) => {
        // We are limiting the auto-play to smaller set of users for the time being
        // to watch for the amount of bandwidth we are spending.
        if (enabledVideoAutoplay) {
          videoCallbacks.current[hash] = { play, pause };
        }
      },
      [enabledVideoAutoplay],
    );

    // Changing viewabilityConfigCallbackPairs on the fly is not supported by
    // React Native's FlatList component, so we need the callbacks below to be
    // stable references. To achieve that we use a ref that gets updated by
    // isExpanded via an effect

    const nowPlayingRef = useRef<string | null>(null);

    const removeVideo = useCallback(({ hash }: { hash: string }) => {
      if (nowPlayingRef.current === hash) {
        // The component is unregistering, often from an effect cleanup during
        // unmount. Clear provider state without invoking its pause callback,
        // since callers may update local React state from pause().
        nowPlayingRef.current = null;
      }

      delete videoCallbacks.current[hash];
    }, []);

    const startIfNothingPlaying = useCallback((hash: string) => {
      // cast does not have a video
      if (!videoCallbacks.current[hash]) {
        return;
      }

      // another video is playing
      if (nowPlayingRef.current) {
        return;
      }

      // play cast video
      nowPlayingRef.current = hash;
      videoCallbacks.current[hash]?.play();
    }, []);

    const forceStart = useCallback((hash: string) => {
      // cast does not have a video
      if (!videoCallbacks.current[hash]) {
        return;
      }

      const nowPlayingHash = nowPlayingRef.current;

      // cast video is already playing
      if (nowPlayingHash === hash) {
        return;
      }

      // pause currently playing video
      if (nowPlayingHash && nowPlayingHash !== hash) {
        videoCallbacks.current[nowPlayingHash]?.pause();
        nowPlayingRef.current = null;
      }

      // play cast video
      nowPlayingRef.current = hash;
      videoCallbacks.current[hash]?.play();
    }, []);

    const pauseIfPlaying = useCallback((hash: string) => {
      if (!videoCallbacks.current[hash]) {
        return;
      }

      const nowPlayingHash = nowPlayingRef.current;
      if (nowPlayingHash === hash) {
        // pause video
        nowPlayingRef.current = null;
        videoCallbacks.current[hash]?.pause();
      }
    }, []);

    // Animated images (GIF/WebP) only run their frame-decode loop while a
    // cast is actually viewable. Unlike videos, all visible animated images
    // animate concurrently — there is no single-playing slot.
    const animatedImageCallbacks = useRef<AnimatedImagesOnFeedCallbackCache>(
      {},
    );
    const visibleCastHashes = useRef<Set<string>>(new Set());

    const setAnimatedImagesAnimating = useCallback(
      (hash: string, animating: boolean) => {
        const imagesForCast = animatedImageCallbacks.current[hash];
        if (!imagesForCast) {
          return;
        }
        for (const callbacks of imagesForCast.values()) {
          if (animating) {
            callbacks.start();
          } else {
            callbacks.stop();
          }
        }
      },
      [],
    );

    const addAnimatedImage = useCallback(
      ({
        hash,
        imageKey,
        start,
        stop,
      }: {
        hash: string;
        imageKey: string;
      } & AnimatedImageCallbacks) => {
        const imagesForCast = animatedImageCallbacks.current[hash] ?? new Map();
        imagesForCast.set(imageKey, { start, stop });
        animatedImageCallbacks.current[hash] = imagesForCast;

        // The cast may already be on screen when the image registers (e.g. a
        // recycled cell whose viewability event fired before this effect ran).
        if (visibleCastHashes.current.has(hash)) {
          start();
        }
      },
      [],
    );

    const removeAnimatedImage = useCallback(
      ({ hash, imageKey }: { hash: string; imageKey: string }) => {
        const imagesForCast = animatedImageCallbacks.current[hash];
        if (!imagesForCast) {
          return;
        }
        imagesForCast.delete(imageKey);
        if (imagesForCast.size === 0) {
          delete animatedImageCallbacks.current[hash];
        }
      },
      [],
    );

    const onEnterOrLeaveChanged = useCallback(
      async ({ changed }: { changed: ViewToken[] }) => {
        for (const { isViewable, item } of changed) {
          const cast = getCastFromViewToken(item);

          if (cast) {
            // Recasts come first so an embedded cast's video wins the
            // single-playing slot over the parent cast's, as before.
            const hashes = [
              ...(cast.embeds?.casts?.map((recast) => recast.hash) ?? []),
              cast.hash,
            ];

            for (const hash of hashes) {
              if (isViewable) {
                startIfNothingPlaying(hash);
              } else {
                pauseIfPlaying(hash);
              }
            }
          }
        }
      },
      [pauseIfPlaying, startIfNothingPlaying],
    );

    // Animated images use their own viewability pair rather than the video
    // enter/leave pair: that pair's viewAreaCoveragePercentThreshold (70% of
    // the *viewport*) only ever matches casts that fill most of the screen or
    // are pixel-perfect fully visible — a tall GIF cast cut off by a few dp
    // never qualifies, leaving it frozen until a scroll happens to make it
    // exactly fully visible. itemVisiblePercentThreshold measures the % of
    // the *item* on screen, which is the right semantics for "animate while
    // visible".
    const onAnimatedImageViewableChanged = useCallback(
      ({ changed }: { changed: ViewToken[] }) => {
        for (const { isViewable, item } of changed) {
          const cast = getCastFromViewToken(item);

          if (cast) {
            const hashes = [
              ...(cast.embeds?.casts?.map((recast) => recast.hash) ?? []),
              cast.hash,
            ];

            for (const hash of hashes) {
              if (isViewable) {
                visibleCastHashes.current.add(hash);
              } else {
                visibleCastHashes.current.delete(hash);
              }
              setAnimatedImagesAnimating(hash, isViewable);
            }
          }
        }
      },
      [setAnimatedImagesAnimating],
    );

    const onMajorityVisibleChanged = useCallback(
      async ({ changed }: { changed: ViewToken[] }) => {
        for (const { isViewable, item } of changed) {
          const cast = getCastFromViewToken(item);

          if (cast) {
            if (isViewable) {
              forceStart(cast.hash);
            }
          }
        }
      },
      [forceStart],
    );

    const contextValue = useMemo(
      () => ({
        addVideo,
        removeVideo,
        addAnimatedImage,
        removeAnimatedImage,
        onEnterOrLeaveChanged,
        onMajorityVisibleChanged,
        onAnimatedImageViewableChanged,
      }),
      [
        addVideo,
        removeVideo,
        addAnimatedImage,
        removeAnimatedImage,
        onEnterOrLeaveChanged,
        onMajorityVisibleChanged,
        onAnimatedImageViewableChanged,
      ],
    );

    return (
      <VideoFeedViewablilityContext.Provider value={contextValue}>
        {children}
      </VideoFeedViewablilityContext.Provider>
    );
  },
);
VideoFeedViewablilityProvider.displayName = 'VideoFeedViewablilityProvider';

export const useVideoFeedViewablility = ({
  hash,
  play,
  pause,
}: {
  hash: string;
  play: () => void;
  pause: () => void;
}) => {
  const { addVideo, removeVideo } = useContext(VideoFeedViewablilityContext);

  useEffect(() => {
    addVideo({ hash, play, pause });
    return () => {
      removeVideo({ hash });
    };
  }, [hash, play, pause, removeVideo, addVideo]);
};

// Marks a subtree whose list feeds enter/leave events into this provider
// (via useVideoFeedViewablilityPairs). Animated-image gating must only
// activate inside such a subtree — elsewhere (composer previews, search
// results, DMs) nothing would ever fire the start callback and GIFs would
// stay frozen on their first frame.
const AnimatedImageViewabilityScopeContext = createContext(false);

export const AnimatedImageViewabilityScopeProvider = ({
  children,
}: PropsWithChildren) => (
  <AnimatedImageViewabilityScopeContext.Provider value={true}>
    {children}
  </AnimatedImageViewabilityScopeContext.Provider>
);

/**
 * Registers start/stop callbacks for an animated image (GIF/animated WebP)
 * belonging to `castHash`, driven by feed viewability. Returns whether the
 * image's animation is gated: when true, the image should render with
 * `autoplay={false}` and rely on the callbacks; when false (not animated, no
 * cast hash, or outside a viewability-driven list) it should autoplay as
 * before.
 */
export const useAnimatedImageFeedViewability = ({
  castHash,
  start,
  stop,
  enabled,
}: {
  castHash: string | undefined;
  start: () => void;
  stop: () => void;
  enabled: boolean;
}): boolean => {
  const inScope = useContext(AnimatedImageViewabilityScopeContext);
  const { addAnimatedImage, removeAnimatedImage } = useContext(
    VideoFeedViewablilityContext,
  );
  const imageKey = useId();

  const gated = inScope && enabled && typeof castHash !== 'undefined';

  useEffect(() => {
    if (!gated || typeof castHash === 'undefined') {
      return;
    }
    addAnimatedImage({ hash: castHash, imageKey, start, stop });
    return () => {
      removeAnimatedImage({ hash: castHash, imageKey });
      // Reset the caller's animation intent so a recycled cell doesn't
      // carry over the previous cast's visible state.
      stop();
    };
  }, [
    gated,
    castHash,
    imageKey,
    start,
    stop,
    addAnimatedImage,
    removeAnimatedImage,
  ]);

  return gated;
};

// On Android, use a higher minimumViewTime to reduce the frequency of
// play/pause callbacks during fast scrolling, which competes with the JS
// thread for frame rendering. 300ms is still imperceptible to users but
// significantly reduces callback volume. iOS keeps 100ms (existing behavior).
export const enterLeaveViewabilityConfig: ViewabilityConfig = {
  minimumViewTime: Platform.OS === 'android' ? 300 : 100,
  viewAreaCoveragePercentThreshold: 70,
};

export const majorityVisibleViewabilityConfig: ViewabilityConfig = {
  minimumViewTime: 500,
  itemVisiblePercentThreshold: 90,
};

// % of the item visible (not % of the viewport covered) — see
// onAnimatedImageViewableChanged for why animated images need this.
export const animatedImageViewabilityConfig: ViewabilityConfig = {
  minimumViewTime: Platform.OS === 'android' ? 300 : 100,
  itemVisiblePercentThreshold: 50,
};

export const useVideoFeedViewablilityPairs =
  (): ViewabilityConfigCallbackPair[] => {
    const {
      onEnterOrLeaveChanged,
      onMajorityVisibleChanged,
      onAnimatedImageViewableChanged,
    } = useContext(VideoFeedViewablilityContext);

    return useMemo(
      () => [
        {
          viewabilityConfig: enterLeaveViewabilityConfig,
          onViewableItemsChanged: onEnterOrLeaveChanged,
        },
        {
          viewabilityConfig: majorityVisibleViewabilityConfig,
          onViewableItemsChanged: onMajorityVisibleChanged,
        },
        {
          viewabilityConfig: animatedImageViewabilityConfig,
          onViewableItemsChanged: onAnimatedImageViewableChanged,
        },
      ],
      [
        onEnterOrLeaveChanged,
        onMajorityVisibleChanged,
        onAnimatedImageViewableChanged,
      ],
    );
  };
