import {
  useInfiniteQuery,
  UseInfiniteQueryOptions,
} from '@tanstack/react-query';
import {
  ApiCast,
  ApiGetCastCollectiblesIndexQueryParams,
  FarcasterError,
  getNextPageCursor,
} from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import {
  buildSelectFlatStandardizedPaginatedResults,
  extendResult,
  PaginatedResult,
  useOnEndReached,
} from '../../helpers';
import { buildCastCollectiblesIndexFetcher } from './buildCastCollectiblesIndexFetcher';
import { buildCastCollectiblesIndexKey } from './buildCastCollectiblesIndexKey';

const useCastCollectiblesIndex = (
  params: ApiGetCastCollectiblesIndexQueryParams,
  options?: Omit<
    UseInfiniteQueryOptions<
      PaginatedResult<ApiCast>,
      FarcasterError,
      ApiCast[],
      PaginatedResult<ApiCast>,
      string[],
      string | undefined
    >,
    'queryKey' | 'queryFn' | 'select' | 'getNextPageParam' | 'initialPageParam'
  >,
) => {
  const { apiClient } = useFarcasterApiClient();

  const result = useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildCastCollectiblesIndexKey(params),
    queryFn: buildCastCollectiblesIndexFetcher({
      apiClient,
      params,
    }),
    select: buildSelectFlatStandardizedPaginatedResults<ApiCast>({
      uniqBy: (item) => item.hash,
    }),
    getNextPageParam: getNextPageCursor,
    ...options,
  });

  const onEndReached = useOnEndReached(result);

  return extendResult(result, { onEndReached });
};

export { useCastCollectiblesIndex };
