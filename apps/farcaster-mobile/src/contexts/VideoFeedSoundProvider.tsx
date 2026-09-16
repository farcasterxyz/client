import React from 'react';

type VideoFeedSoundContextValue = {
  videoFeedToggleSound(): boolean;
  videoFeedIsMuted: boolean;
};

const VideoFeedSoundContext = React.createContext<VideoFeedSoundContextValue>(
  {} as never,
);

export function VideoFeedSoundProvider({ children }: React.PropsWithChildren) {
  const [muted, setMuted] = React.useState(true);
  const videoFeedToggleSound = React.useCallback(() => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    return nextMuted;
  }, [muted]);

  return React.useMemo(
    () => (
      <VideoFeedSoundContext.Provider
        value={{ videoFeedToggleSound, videoFeedIsMuted: muted }}
      >
        {children}
      </VideoFeedSoundContext.Provider>
    ),
    [children, muted, videoFeedToggleSound],
  );
}

export const useVideoFeedSound = () => {
  return React.useContext(VideoFeedSoundContext);
};

VideoFeedSoundProvider.displayName = 'VideoFeedSoundProvider';
