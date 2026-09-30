import {
  QueryKey,
  UseInfiniteQueryOptions,
  useSuspenseInfiniteQuery,
} from '@tanstack/react-query';
import {
  ApiGetTopMiniAppsQueryParams,
  ApiRankedMiniApp,
  FarcasterError,
  getNextPageCursor,
} from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import {
  extendResult,
  PaginatedResult,
  selectFlatStandardizedPaginatedResults,
  useOnEndReached,
} from '../../helpers';
import { buildTopMiniAppsFetcher } from './buildTopMiniAppsFetcher';
import { buildTopMiniAppsKey } from './buildTopMiniAppsKey';

const useTopMiniApps = (
  params: ApiGetTopMiniAppsQueryParams,
  options?: Omit<
    UseInfiniteQueryOptions<
      PaginatedResult<ApiRankedMiniApp>,
      FarcasterError,
      ApiRankedMiniApp[],
      PaginatedResult<ApiRankedMiniApp>,
      QueryKey,
      string | undefined
    >,
    'queryKey' | 'queryFn' | 'select' | 'getNextPageParam' | 'initialPageParam'
  >,
) => {
  const { apiClient } = useFarcasterApiClient();

  const result = useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildTopMiniAppsKey(params),
    queryFn: buildTopMiniAppsFetcher({
      apiClient,
      params,
    }),
    select: selectFlatStandardizedPaginatedResults,
    getNextPageParam: getNextPageCursor,
    ...options,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

export { useTopMiniApps };
