import { useQuery } from '@tanstack/react-query';
import { ApiDefaultFeedPreference } from 'farcaster-client-data';
import {
  buildHighlightedChannelsFetcher,
  buildHighlightedChannelsKey,
  useBatchMergeIntoGloballyCachedChannels,
  useFarcasterApiClient,
} from 'farcaster-client-hooks';
import React from 'react';

type HomeLastSelectedTabContextType = {
  defaultFeed: ApiDefaultFeedPreference;
  feedKey: string;
  setFeedKey: ({ feedKey }: { feedKey: string }) => void;
};

const HomeLastSelectedTabContext =
  React.createContext<HomeLastSelectedTabContextType>({} as never);

export function HomeLastSelectedTabContextProvider({
  children,
}: React.PropsWithChildren) {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedChannels =
    useBatchMergeIntoGloballyCachedChannels();

  const { data } = useQuery({
    queryKey: buildHighlightedChannelsKey(),
    queryFn: buildHighlightedChannelsFetcher({
      apiClient,
      batchMergeIntoGloballyCachedChannels,
    }),
  });

  const defaultFeed = data?.viewerContext.defaultFeed ?? 'home';

  const [feedKey, setFeedKey] = React.useState<string>('home');

  // Sync feedKey with user's preference when data loads (only on initial load)
  const hasInitialized = React.useRef(false);
  React.useEffect(() => {
    if (data && !hasInitialized.current) {
      hasInitialized.current = true;
      if (data.viewerContext.defaultFeed !== 'home') {
        setFeedKey(data.viewerContext.defaultFeed);
      }
    }
  }, [data]);

  const setFeedKeyForContext = React.useCallback(
    ({ feedKey: feedKeyToSet }: { feedKey: string }) => {
      if (feedKey !== feedKeyToSet) {
        setFeedKey(feedKeyToSet);
      }
    },
    [feedKey],
  );

  const value = React.useMemo(
    () => ({
      defaultFeed,
      feedKey,
      setFeedKey: setFeedKeyForContext,
    }),
    [defaultFeed, feedKey, setFeedKeyForContext],
  );

  return (
    <HomeLastSelectedTabContext.Provider value={value}>
      {children}
    </HomeLastSelectedTabContext.Provider>
  );
}

export function useHomeLastSelectedTab() {
  return React.useContext(HomeLastSelectedTabContext);
}
