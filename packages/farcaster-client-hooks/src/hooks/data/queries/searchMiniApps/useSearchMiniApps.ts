import { useInfiniteQuery } from '@tanstack/react-query';
import { getNextPageCursor } from 'farcaster-client-data';

import { MILLIS_PER_MINUTE } from '../../../..';
import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { frameKeyExtractor } from '../../../../utils';
import {
  extendResult,
  useFlatStandardizedPaginatedResults,
  useOnEndReached,
} from '../../helpers';
import { useBatchMergeIntoGloballyCachedFrame } from '../frameDetails';
import { buildSearchMiniAppsFetcher } from './buildSearchMiniAppsFetcher';
import { buildSearchMiniAppsKey } from './buildSearchMiniAppsKey';
import { defaultLimit } from './shared';

const gcTime = MILLIS_PER_MINUTE;

const useSearchMiniApps = ({
  limit = defaultLimit,
  query,
}: {
  limit?: number;
  query: string;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGlobalCache = useBatchMergeIntoGloballyCachedFrame();

  const result = useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildSearchMiniAppsKey({ query, limit }),

    queryFn: buildSearchMiniAppsFetcher({
      query,
      limit,
      apiClient,
      batchMergeIntoGlobalCache,
    }),

    gcTime,
    getNextPageParam: getNextPageCursor,
    enabled: !!query,
  });

  const flatData = useFlatStandardizedPaginatedResults({
    data: result.data,
    uniqBy: frameKeyExtractor,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { flatData, onEndReached });
};

export { useSearchMiniApps };
