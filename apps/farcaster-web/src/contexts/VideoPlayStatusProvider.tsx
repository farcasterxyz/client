import React, {
  createContext,
  FC,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';

/*
The way this context works is that it maintains a queue of video URLs that should be auto-played
and provides as a state the URL of the video that is allowed to play (= active).
- Videos should run effects on activeVideoUrl and compare with their own url to start/stop playing
- Videos should enqueue themselves with enqueueVideoForAutoplay when coming into view, ideally
  in vertical order
- Videos should dequeue themselves with dequeueVideoFromAutoplay when going out of view or moving
  to manual mode (after user interaction)
- When a user manually plays a video, forcePlayVideo should be called which will change the active
  video (which should then stop itself). When a manually played video is stopped,
  dequeueVideoFromAutoplay should be called to remove it from the queue and switch the active
  video to the first in the queue.

Queue entries are owned per player instance (ownerId), not just per URL: the same video URL can
be mounted more than once (e.g. repeated feed pages, a cast plus an embed of the same upload),
and players may dequeue without ever having enqueued (unmount cleanup). A URL leaves the queue
only when its last owner dequeues, so one instance unmounting can't stop another instance of the
same URL mid-playback.
*/
export type VideoPlayStatusContextType = {
  activeVideoUrl: string;
  enqueueVideoForAutoplay: (url: string, ownerId: string) => void;
  dequeueVideoFromAutoplay: (url: string, ownerId: string) => void;
  forcePlayVideo: (url: string, ownerId: string) => void;
};

const VidePlayStatusContext = createContext<VideoPlayStatusContextType>({
  activeVideoUrl: '',
  enqueueVideoForAutoplay: () => {},
  dequeueVideoFromAutoplay: () => {},
  forcePlayVideo: () => {},
});

export type VideoPlayStatusProviderProps = {
  children: ReactNode;
};

type AutoplayQueueEntry = {
  url: string;
  owners: Set<string>;
};

const VideoPlayStatusProvider: FC<VideoPlayStatusProviderProps> = memo(
  ({ children }) => {
    const queueRef = useRef<AutoplayQueueEntry[]>([]);
    const activeVideoUrlRef = useRef('');
    const [activeVideoUrl, setActiveVideoUrl] = useState('');

    const recalculateState = useCallback(() => {
      if (
        !queueRef.current.some(
          (entry) => entry.url === activeVideoUrlRef.current,
        )
      ) {
        if (queueRef.current.length > 0) {
          const url = queueRef.current[0].url;
          activeVideoUrlRef.current = url;
          setActiveVideoUrl(url);
        } else if (activeVideoUrlRef.current !== '') {
          activeVideoUrlRef.current = '';
          setActiveVideoUrl('');
        }
      }
    }, []);

    const enqueueVideoForAutoplay = useCallback(
      (url: string, ownerId: string) => {
        const entry = queueRef.current.find((e) => e.url === url);
        if (entry) {
          entry.owners.add(ownerId);
        } else {
          queueRef.current.push({ url, owners: new Set([ownerId]) });
          recalculateState();
        }
      },
      [recalculateState],
    );

    const dequeueVideoFromAutoplay = useCallback(
      (url: string, ownerId: string) => {
        const index = queueRef.current.findIndex((e) => e.url === url);
        if (index === -1) {
          return;
        }
        const entry = queueRef.current[index];
        entry.owners.delete(ownerId);
        if (entry.owners.size === 0) {
          queueRef.current.splice(index, 1);
          recalculateState();
        }
      },
      [recalculateState],
    );

    const forcePlayVideo = useCallback((url: string, ownerId: string) => {
      const entry = queueRef.current.find((e) => e.url === url);
      if (entry) {
        entry.owners.add(ownerId);
      } else {
        queueRef.current.push({ url, owners: new Set([ownerId]) });
      }
      if (activeVideoUrlRef.current !== url) {
        activeVideoUrlRef.current = url;
        setActiveVideoUrl(url);
      }
    }, []);

    return (
      <VidePlayStatusContext.Provider
        value={{
          activeVideoUrl,
          enqueueVideoForAutoplay,
          dequeueVideoFromAutoplay,
          forcePlayVideo,
        }}
      >
        {children}
      </VidePlayStatusContext.Provider>
    );
  },
);

VideoPlayStatusProvider.displayName = 'VideoPlayStatusProvider';

const useVideoPlayStatus = () => useContext(VidePlayStatusContext);

export { useVideoPlayStatus, VideoPlayStatusProvider };
