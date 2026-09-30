import {
  UseInfiniteQueryOptions,
  useSuspenseInfiniteQuery,
} from '@tanstack/react-query';
import {
  ApiConnectedApp,
  ApiGetConnectedAppsQueryParams,
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
import { buildConnectedAppsFetcher } from './buildConnectedAppsFetcher';
import { buildConnectedAppsKey } from './buildConnectedAppsKey';

const useConnectedApps = (
  params: ApiGetConnectedAppsQueryParams,
  options?: Omit<
    UseInfiniteQueryOptions<
      PaginatedResult<ApiConnectedApp>,
      FarcasterError,
      ApiConnectedApp[],
      PaginatedResult<ApiConnectedApp>,
      string[],
      string | undefined
    >,
    'queryKey' | 'queryFn' | 'select' | 'getNextPageParam' | 'initialPageParam'
  >,
) => {
  const { apiClient } = useFarcasterApiClient();

  const result = useSuspenseInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildConnectedAppsKey(params),
    queryFn: buildConnectedAppsFetcher({
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

export { useConnectedApps };
