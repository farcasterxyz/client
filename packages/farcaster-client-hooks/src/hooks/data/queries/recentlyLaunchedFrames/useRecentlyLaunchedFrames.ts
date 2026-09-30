import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { frameKeyExtractor } from '../../../../utils';
import {
  extendResult,
  useFlatStandardizedPaginatedResults,
} from '../../helpers';
import { useBatchMergeIntoGloballyCachedFrame } from '../frameDetails';
import { buildRecentlyLaunchedFramesFetcher } from './buildRecentlyLaunchedFramesFetcher';
import { buildRecentlyLaunchedFramesKey } from './buildRecentlyLaunchedFramesKey';

export function useRecentlyLaunchedFrames({
  filterToNotAdded,
  limit = 20,
}: {
  filterToNotAdded: boolean;
  limit: number;
}) {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGlobalCache = useBatchMergeIntoGloballyCachedFrame();

  const result = useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildRecentlyLaunchedFramesKey({ filterToNotAdded }),
    queryFn: buildRecentlyLaunchedFramesFetcher({
      apiClient,
      params: { filterToNotAdded, limit },
      batchMergeIntoGlobalCache,
    }),
    getNextPageParam: getNextPageCursor,
    staleTime: 0,
  });

  const flatData = useFlatStandardizedPaginatedResults({
    data: result.data,
    uniqBy: frameKeyExtractor,
  });

  return extendResult(result, { flatData });
}
