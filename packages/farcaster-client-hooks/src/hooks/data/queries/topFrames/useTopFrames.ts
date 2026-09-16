import { useInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { frameKeyExtractor } from '../../../../utils';
import {
  extendResult,
  useFlatStandardizedPaginatedResults,
  useOnEndReached,
} from '../../helpers';
import { useBatchMergeIntoGloballyCachedFrame } from '../frameDetails';
import { buildTopFramesFetcher } from './buildTopFramesFetcher';
import { buildTopFramesKey } from './buildTopFramesKey';

export function useTopFrames(params?: {
  enabled?: boolean;
  throwOnError?: boolean;
}) {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGlobalCache = useBatchMergeIntoGloballyCachedFrame();

  const result = useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildTopFramesKey(),
    queryFn: buildTopFramesFetcher({
      apiClient,
      params: { limit: 50 },
      batchMergeIntoGlobalCache,
    }),
    getNextPageParam: getNextPageCursor,
    staleTime: 0,
    enabled: params?.enabled ?? true,
    throwOnError: params?.throwOnError ?? false,
  });

  const flatData = useFlatStandardizedPaginatedResults({
    data: result.data,
    uniqBy: frameKeyExtractor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { flatData, onEndReached });
}
