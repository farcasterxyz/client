import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildAllStarterPacksFetcher } from './buildAllStarterPacksFetcher';
import { buildAllStarterPacksKey } from './buildAllStarterPacksKey';

const useAllStarterPacks = () => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildAllStarterPacksKey(),
    queryFn: buildAllStarterPacksFetcher({ apiClient }),
    getNextPageParam: getNextPageCursor,
  });
};

export { useAllStarterPacks };
