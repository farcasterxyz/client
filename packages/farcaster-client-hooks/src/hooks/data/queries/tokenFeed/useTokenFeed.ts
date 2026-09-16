import { useInfiniteQuery } from '@tanstack/react-query';
import {
  ApiGetTokenEmbedFeedQueryParamsCamelCase,
  getNextPageCursor,
} from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildTokenFeedFetcher } from './buildTokenFeedFetcher';
import { buildTokenFeedKey } from './buildTokenFeedKey';

const useTokenFeed = (
  params: Omit<ApiGetTokenEmbedFeedQueryParamsCamelCase, 'limit'>,
) => {
  const { apiClient } = useFarcasterApiClient();

  return useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildTokenFeedKey(params),

    queryFn: buildTokenFeedFetcher({
      apiClient,
      params,
    }),

    getNextPageParam: getNextPageCursor,
    staleTime: 0,
  });
};

export { useTokenFeed };
