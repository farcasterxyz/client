import { useInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { extendResult, useOnEndReached } from '../../helpers';
import { useBatchMergeIntoGloballyCachedCasts } from '../globallyCachedCast';
import { buildStarterPackFeedFetcher } from './buildStarterPackFeedFetcher';
import { buildStarterPackFeedKey } from './buildStarterPackFeedKey';

const useStarterPackFeed = ({ id }: { id: string }) => {
  const { apiClient } = useFarcasterApiClient();

  const batchMergeIntoGloballyCachedCasts =
    useBatchMergeIntoGloballyCachedCasts();

  const result = useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildStarterPackFeedKey({ id }),
    queryFn: buildStarterPackFeedFetcher({
      id,
      apiClient,
      batchMergeIntoGloballyCachedCasts,
    }),
    getNextPageParam: getNextPageCursor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

export { useStarterPackFeed };
