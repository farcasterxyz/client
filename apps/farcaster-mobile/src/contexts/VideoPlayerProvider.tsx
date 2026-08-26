import { createVideoPlayer, VideoPlayer, VideoSource } from 'expo-video';
import * as React from 'react';
import { Platform } from 'react-native';

function getStringFromSource(source: VideoSource): string {
  if (typeof source === 'string') {
    return source;
  } else if (typeof source === 'number') {
    return source.toString();
  } else if (typeof source === 'object' && source?.uri) {
    return source.uri;
  } else if (typeof source === 'object' && source?.assetId) {
    return source.assetId.toString();
  }
  throw new Error('VideoSource with no uri or assetId');
}

type GetOrCreateVideoPlayerOptions = {
  recyclableRef: React.RefObject<boolean>;
  maxActiveVideoPlayers?: number;
};

interface ManagedVideoPlayer extends VideoPlayer {
  sourceAsString: string;
  components: Array<GetOrCreateVideoPlayerOptions & { symbol: symbol }>;
}

function copyVideoPlayerProperties(
  existingPlayer: ManagedVideoPlayer,
  newPlayer: VideoPlayer,
) {
  // This runs synchronously during render. `existingPlayer` may already have
  // had its native shared object released (recycled out and disposed, possibly
  // via the deferred release timeout below), in which case reading any property
  // throws NativeSharedObjectNotFoundException. An uncaught throw here happens
  // mid-render and corrupts the React reconciler ("Should not already be
  // working."), blanking the feed. Guard the whole copy so a released source
  // player just leaves the fresh player on its defaults.
  try {
    newPlayer.allowsExternalPlayback = existingPlayer.allowsExternalPlayback;
    newPlayer.audioMixingMode = existingPlayer.audioMixingMode;
    newPlayer.bufferOptions = existingPlayer.bufferOptions;
    newPlayer.currentTime = existingPlayer.currentTime;
    if (Platform.OS !== 'android') {
      // Fixed in https://github.com/expo/expo/pull/37928
      // Conditional can be removed after upgrading expo-video
      newPlayer.loop = existingPlayer.loop;
    }
    newPlayer.muted = existingPlayer.muted;
    newPlayer.playbackRate = existingPlayer.playbackRate;
    newPlayer.preservesPitch = existingPlayer.preservesPitch;
    newPlayer.showNowPlayingNotification =
      existingPlayer.showNowPlayingNotification;
    newPlayer.staysActiveInBackground = existingPlayer.staysActiveInBackground;
    newPlayer.subtitleTrack = existingPlayer.subtitleTrack;
    newPlayer.targetOffsetFromLive = existingPlayer.targetOffsetFromLive;
    newPlayer.timeUpdateEventInterval = existingPlayer.timeUpdateEventInterval;
    newPlayer.volume = existingPlayer.volume;
    if (existingPlayer.playing) {
      newPlayer.play();
    }
  } catch {
    // existingPlayer's native shared object was already released; nothing to
    // copy. Non-fatal — kept out of error reporting to avoid log spam.
  }
}

// Releasing an expo-video player frees its native shared object. If that
// happens synchronously during a React commit, React Native's dev-only render
// instrumentation (logComponentRender -> addObjectDiffToProperties) can still
// read getters (e.g. allowsExternalPlayback) on the *previous* `player` prop of
// a <VideoView> being recycled, which throws NativeSharedObjectNotFoundException
// mid-commit and corrupts the reconciler ("Should not already be working."),
// blanking/freezing the feed. Always release on a later tick so the in-flight
// commit (and its prop diff) is fully done before the native object is freed.
function scheduleRelease(player: VideoPlayer) {
  setTimeout(() => {
    try {
      player.release();
    } catch {
      // Already released elsewhere; nothing to do.
    }
  }, 0);
}

const MAX_ACTIVE_VIDEO_PLAYERS = 2;

// We need it to be standalone on Android for sure since it's not supported
// iOS is theoretically supported, but it seems to cause an audio glitch issue
const usingStandaloneExpandedPlayer = true;

type VideoPlayerProviderState = {
  orderedPlayers: ManagedVideoPlayer[];
  videoPlayers: Map<string, Map<symbol, ManagedVideoPlayer>>;
  // Players evicted from the active pool that are still referenced as a prop by
  // a mounted component. They are intentionally NOT released yet (doing so would
  // crash RN's commit-time prop diff). They get released once their last
  // referencing component unmounts/recycles (see removeSymbol).
  pendingReleasePlayers: ManagedVideoPlayer[];
};

type VideoPlayerContextType = {
  getVideoPlayer: (
    source: VideoSource,
    symbol: symbol,
  ) => ManagedVideoPlayer | undefined;
  getOrCreateVideoPlayer: (
    source: VideoSource,
    symbol: symbol,
    options: GetOrCreateVideoPlayerOptions,
  ) => {
    videoPlayer: ManagedVideoPlayer;
    needsVersionBump: boolean;
  };
  removeSymbol: (stringSource: string, symbol: symbol) => void;
  bumpVideoPlayersRefVersion: () => void;
};

const VideoPlayerContext = React.createContext<VideoPlayerContextType>({
  getVideoPlayer: () => undefined,
  getOrCreateVideoPlayer: () => {
    throw new Error('no VideoPlayerContext');
  },
  removeSymbol: () => undefined,
  bumpVideoPlayersRefVersion: () => undefined,
});

function VideoPlayerProvider({ children }: { children: React.ReactNode }) {
  const videoPlayersRef = React.useRef<VideoPlayerProviderState>({
    orderedPlayers: [],
    videoPlayers: new Map(),
    pendingReleasePlayers: [],
  });

  // We need a state to trigger rerender when a one VideoPlayer caused another
  // to be recycled. This can happen during render of a component, since we
  // sometimes need a useVideoPlayer call to return a VideoPlayer on the first
  // invocation. Since we can't setState one component during another's render,
  // we instead use a ref to track the actual state, and use an effect that
  // bumps this version state to cause the component using the recycling
  // VideoPlayer to pick up the changes.
  const [, setVideoPlayersRefVersion] = React.useState(0);
  const bumpVideoPlayersRefVersion = React.useCallback(() => {
    setVideoPlayersRefVersion((prevVersion) => prevVersion + 1);
  }, []);

  const getVideoPlayer = React.useCallback(
    (source: VideoSource, symbol: symbol) => {
      const stringSource = getStringFromSource(source);
      const playersForSource =
        videoPlayersRef.current.videoPlayers.get(stringSource);
      if (!playersForSource || playersForSource.size === 0) {
        return undefined;
      }
      const videoPlayer = playersForSource.get(symbol);
      if (!videoPlayer) {
        return undefined;
      }
      return videoPlayer;
    },
    [],
  );

  const getOrCreateVideoPlayer = React.useCallback(
    (
      source: VideoSource,
      symbol: symbol,
      {
        recyclableRef,
        maxActiveVideoPlayers = MAX_ACTIVE_VIDEO_PLAYERS,
      }: GetOrCreateVideoPlayerOptions,
    ) => {
      const existingVideoPlayer = getVideoPlayer(source, symbol);
      if (existingVideoPlayer) {
        return { videoPlayer: existingVideoPlayer, needsVersionBump: false };
      }

      const stringSource = getStringFromSource(source);
      const playersForSource =
        videoPlayersRef.current.videoPlayers.get(stringSource);
      const existingPlayerForSource = playersForSource
        ? playersForSource.values().next().value
        : undefined;

      if (existingPlayerForSource && !usingStandaloneExpandedPlayer) {
        existingPlayerForSource.components.push({
          symbol,
          recyclableRef,
        });
        const newVideoPlayers = new Map(videoPlayersRef.current.videoPlayers);
        const existingVideoPlayersForSource = newVideoPlayers.get(stringSource);
        const videoPlayersForSource = new Map(existingVideoPlayersForSource);
        videoPlayersForSource.set(symbol, existingPlayerForSource);
        newVideoPlayers.set(stringSource, videoPlayersForSource);
        videoPlayersRef.current = {
          orderedPlayers: [
            ...videoPlayersRef.current.orderedPlayers.filter(
              (player) => player !== existingPlayerForSource,
            ),
            existingPlayerForSource,
          ],
          videoPlayers: newVideoPlayers,
          pendingReleasePlayers: videoPlayersRef.current.pendingReleasePlayers,
        };
        return {
          videoPlayer: existingPlayerForSource,
          needsVersionBump: false,
        };
      }

      const newVideoPlayer = createVideoPlayer(source) as ManagedVideoPlayer;
      if (existingPlayerForSource) {
        copyVideoPlayerProperties(existingPlayerForSource, newVideoPlayer);
      }
      newVideoPlayer.sourceAsString = stringSource;
      newVideoPlayer.components = [{ symbol, recyclableRef }];

      let newOrderedPlayers = [...videoPlayersRef.current.orderedPlayers];
      let removedPlayer;
      if (newOrderedPlayers.length >= maxActiveVideoPlayers) {
        const updatedOrderedPlayers = [];
        for (const videoPlayer of newOrderedPlayers) {
          if (
            !removedPlayer &&
            videoPlayer.sourceAsString !== stringSource &&
            videoPlayer.components.every(
              ({ recyclableRef }) => recyclableRef.current,
            )
          ) {
            removedPlayer = videoPlayer;
          } else {
            updatedOrderedPlayers.push(videoPlayer);
          }
        }
        newOrderedPlayers = updatedOrderedPlayers;
      }
      newOrderedPlayers.push(newVideoPlayer);

      const newVideoPlayers = new Map(videoPlayersRef.current.videoPlayers);
      const existingVideoPlayersForSource = newVideoPlayers.get(stringSource);
      const videoPlayersForSource = new Map(existingVideoPlayersForSource);
      videoPlayersForSource.set(symbol, newVideoPlayer);
      newVideoPlayers.set(stringSource, videoPlayersForSource);

      let newPendingReleasePlayers =
        videoPlayersRef.current.pendingReleasePlayers;
      if (removedPlayer) {
        const { sourceAsString } = removedPlayer;
        const videoPlayersForRemovedSource =
          newVideoPlayers.get(sourceAsString);
        if (videoPlayersForRemovedSource) {
          const newVideoPlayersForRemovedSource = new Map(
            videoPlayersForRemovedSource,
          );
          for (const component of removedPlayer.components) {
            newVideoPlayersForRemovedSource.delete(component.symbol);
          }
          if (newVideoPlayersForRemovedSource.size === 0) {
            newVideoPlayers.delete(sourceAsString);
          } else {
            newVideoPlayers.set(
              sourceAsString,
              newVideoPlayersForRemovedSource,
            );
          }
        }

        if (removedPlayer.components.length === 0) {
          // Nothing references it: safe to release (deferred off this commit).
          scheduleRelease(removedPlayer);
        } else {
          // Still referenced as a prop by mounted component(s). Releasing now
          // (or on a fixed timeout, as we used to) races with RN's commit-time
          // prop diff and crashes the reconciler. Keep it alive and pause it so
          // it stops producing audio without a view; it will be released in
          // removeSymbol once its last referencing component unmounts/recycles.
          try {
            removedPlayer.pause();
          } catch {
            // Player may already be in a bad state; ignore.
          }
          newPendingReleasePlayers = [
            ...newPendingReleasePlayers,
            removedPlayer,
          ];
        }
      }

      videoPlayersRef.current = {
        orderedPlayers: newOrderedPlayers,
        videoPlayers: newVideoPlayers,
        pendingReleasePlayers: newPendingReleasePlayers,
      };

      return { videoPlayer: newVideoPlayer, needsVersionBump: !!removedPlayer };
    },
    [getVideoPlayer],
  );

  const removeSymbol = React.useCallback(
    (stringSource: string, symbol: symbol) => {
      const state = videoPlayersRef.current;

      // First, check players that were evicted from the active pool but kept
      // alive because they were still referenced. They are no longer in the
      // active map, so handle them here.
      const pendingPlayer = state.pendingReleasePlayers.find(
        (player) =>
          player.sourceAsString === stringSource &&
          player.components.some((component) => component.symbol === symbol),
      );
      if (pendingPlayer) {
        pendingPlayer.components = pendingPlayer.components.filter(
          (component) => component.symbol !== symbol,
        );
        if (pendingPlayer.components.length === 0) {
          videoPlayersRef.current = {
            ...state,
            pendingReleasePlayers: state.pendingReleasePlayers.filter(
              (player) => player !== pendingPlayer,
            ),
          };
          // Last reference gone: release on a later tick so we never free the
          // native object during the recycling component's current commit.
          scheduleRelease(pendingPlayer);
        }
        return;
      }

      const curVideoPlayersForSource = state.videoPlayers.get(stringSource);
      const removedVideoPlayer = curVideoPlayersForSource?.get(symbol);
      if (!removedVideoPlayer) {
        return;
      }

      const newVideoPlayers = new Map(state.videoPlayers);
      const newVideoPlayersForSource = new Map(curVideoPlayersForSource);
      newVideoPlayersForSource.delete(symbol);
      if (newVideoPlayersForSource.size === 0) {
        newVideoPlayers.delete(stringSource);
      } else {
        newVideoPlayers.set(stringSource, newVideoPlayersForSource);
      }

      removedVideoPlayer.components = removedVideoPlayer.components.filter(
        (component) => component.symbol !== symbol,
      );

      let newOrderedPlayers = state.orderedPlayers;
      if (removedVideoPlayer.components.length === 0) {
        newOrderedPlayers = newOrderedPlayers.filter(
          (videoPlayer) => videoPlayer !== removedVideoPlayer,
        );
        // Release on a later tick rather than synchronously: this can run as a
        // passive-effect cleanup during a FlashList cell recycle, in the same
        // commit where RN's prop diff still reads the previous `player` prop.
        scheduleRelease(removedVideoPlayer);
      }

      videoPlayersRef.current = {
        orderedPlayers: newOrderedPlayers,
        videoPlayers: newVideoPlayers,
        pendingReleasePlayers: state.pendingReleasePlayers,
      };
    },
    [],
  );

  const value = React.useMemo(
    () => ({
      getVideoPlayer,
      getOrCreateVideoPlayer,
      removeSymbol,
      bumpVideoPlayersRefVersion,
    }),
    [
      getVideoPlayer,
      getOrCreateVideoPlayer,
      removeSymbol,
      bumpVideoPlayersRefVersion,
    ],
  );
  return (
    <VideoPlayerContext.Provider value={value}>
      {children}
    </VideoPlayerContext.Provider>
  );
}

type UseProvidedVideoPlayerOptions = GetOrCreateVideoPlayerOptions & {
  visible: boolean;
};

function useProvidedVideoPlayer(
  videoSource: VideoSource,
  initFunction: ((player: VideoPlayer) => void) | undefined,
  options: UseProvidedVideoPlayerOptions,
) {
  const symbolRef = React.useRef(Symbol());
  const symbol = symbolRef.current;

  const {
    getVideoPlayer,
    getOrCreateVideoPlayer,
    removeSymbol,
    bumpVideoPlayersRefVersion,
  } = React.useContext(VideoPlayerContext);

  const { recyclableRef, visible } = options;

  const stringSource = getStringFromSource(videoSource);
  React.useEffect(() => {
    if (!visible) {
      removeSymbol(stringSource, symbol);
      return;
    }
    return () => {
      removeSymbol(stringSource, symbol);
    };
  }, [visible, removeSymbol, stringSource, symbol]);

  const createdRef = React.useRef<string>(undefined);
  const prevVisibleRef = React.useRef(false);

  let videoPlayer;
  let needsVersionBump = false;
  if (
    visible &&
    (createdRef.current !== stringSource || !prevVisibleRef.current)
  ) {
    const getOrCreateResult = getOrCreateVideoPlayer(videoSource, symbol, {
      recyclableRef,
    });
    videoPlayer = getOrCreateResult.videoPlayer;
    needsVersionBump = getOrCreateResult.needsVersionBump;
    initFunction?.(videoPlayer);
    createdRef.current = stringSource;
  } else if (visible) {
    videoPlayer = getVideoPlayer(videoSource, symbol);
  }

  prevVisibleRef.current = visible;

  React.useEffect(() => {
    if (needsVersionBump) {
      bumpVideoPlayersRefVersion();
    }
  }, [needsVersionBump, bumpVideoPlayersRefVersion]);

  return videoPlayer;
}

function useVideoPlayer(
  videoSource: VideoSource,
  initFunction?: (player: VideoPlayer) => void,
) {
  const recyclableRef = React.useRef(false);
  const result = useProvidedVideoPlayer(videoSource, initFunction, {
    recyclableRef,
    visible: true,
  });
  if (!result) {
    throw new Error('useVideoPlayer encountered falsey VideoPlayer');
  }
  return result;
}

function useRecyclableVideoPlayer(
  videoSource: VideoSource,
  options: UseProvidedVideoPlayerOptions,
  initFunction?: (player: VideoPlayer) => void,
) {
  return useProvidedVideoPlayer(videoSource, initFunction, options);
}

export {
  useProvidedVideoPlayer,
  useRecyclableVideoPlayer,
  useVideoPlayer,
  VideoPlayerProvider,
};
