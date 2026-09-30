import {
  createContext,
  FC,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useRef,
} from 'react';

import { removeOldTimestamps } from '~/utils/timeUtils';

const windowDuration = 1000 * 5;

type RecentFetchContextValue = {
  getRecentFetchCount: () => number;
  trackFetch: () => void;
};

const RecentFetchContext = createContext<RecentFetchContextValue>({
  getRecentFetchCount: () => 0,
  trackFetch: () => undefined,
});

type RecentFetchProviderProps = {
  children: ReactNode;
};

const RecentFetchProvider: FC<RecentFetchProviderProps> = memo(
  ({ children }) => {
    const recentFetchTimestamps = useRef<number[]>([]).current;

    const getRecentFetchCount = useCallback(() => {
      removeOldTimestamps({
        sortedTimestamps: recentFetchTimestamps,
        threshold: Date.now() - windowDuration,
      });
      return recentFetchTimestamps.length;
    }, [recentFetchTimestamps]);

    const trackFetch = useCallback(() => {
      recentFetchTimestamps.push(Date.now());
    }, [recentFetchTimestamps]);

    return (
      <RecentFetchContext.Provider value={{ getRecentFetchCount, trackFetch }}>
        {children}
      </RecentFetchContext.Provider>
    );
  },
);

RecentFetchProvider.displayName = 'RecentFetchProvider';

const useRecentFetch = () => useContext(RecentFetchContext);

export { RecentFetchProvider, useRecentFetch };
