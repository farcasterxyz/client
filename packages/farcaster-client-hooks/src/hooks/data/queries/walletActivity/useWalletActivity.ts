import { useInfiniteQuery } from '@tanstack/react-query';
import {
  ApiGetWalletActivityQueryParams,
  getNextPageCursor,
} from 'farcaster-client-data';

import { MILLIS_PER_SECOND } from '../../../..';
import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildWalletActivityFetcher } from './buildWalletActivityFetcher';
import { buildWalletActivityKey } from './buildWalletActivityKey';

const BASE64_EMPTY_CURSOR = 'e30';

const useWalletActivity = ({
  params,
  enabled,
}: {
  params: Omit<ApiGetWalletActivityQueryParams, 'limit'>;
  enabled?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildWalletActivityKey(params),

    queryFn: buildWalletActivityFetcher({
      apiClient,
      params,
    }),

    getNextPageParam: (lastPage) => {
      const cursor = getNextPageCursor(lastPage);
      if (cursor === BASE64_EMPTY_CURSOR) {
        return undefined;
      }
      return cursor;
    },
    staleTime: MILLIS_PER_SECOND * 30,
    enabled,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    placeholderData: undefined,
  });
};

export { useWalletActivity };
