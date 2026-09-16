import {
  useInfiniteQuery,
  useSuspenseInfiniteQuery,
} from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { frameKeyExtractor } from '../../../../utils';
import {
  extendResult,
  useFlatStandardizedPaginatedResults,
  useOnEndReached,
} from '../../helpers';
import { useBatchMergeIntoGloballyCachedFrame } from '../frameDetails';
import { buildFavoriteFramesFetcher } from './buildFavoriteFramesFetcher';
import { buildFavoriteFramesKey } from './buildFavoriteFramesKey';

export function useFavoriteFrames() {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGlobalCache = useBatchMergeIntoGloballyCachedFrame();

  const result = useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildFavoriteFramesKey(),
    queryFn: buildFavoriteFramesFetcher({
      apiClient,
      params: { limit: 20 },
      batchMergeIntoGlobalCache,
    }),
    getNextPageParam: getNextPageCursor,
    staleTime: 0,
  });

  const flatData = useFlatStandardizedPaginatedResults({
    data: result.data,
    uniqBy: frameKeyExtractor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { flatData, onEndReached });
}

export function useSuspenseFavoriteFrames() {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGlobalCache = useBatchMergeIntoGloballyCachedFrame();

  const result = useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildFavoriteFramesKey(),
    queryFn: buildFavoriteFramesFetcher({
      apiClient,
      params: { limit: 20 },
      batchMergeIntoGlobalCache,
    }),
    getNextPageParam: getNextPageCursor,
    staleTime: 0,
  });

  const flatData = useFlatStandardizedPaginatedResults({
    data: result.data,
    uniqBy: frameKeyExtractor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { flatData, onEndReached });
}
