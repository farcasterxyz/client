import { useInfiniteQuery } from '@tanstack/react-query';
import {
  ApiGetWalletNftsQueryParams,
  getNextPageCursor,
} from 'farcaster-client-data';

import { MILLIS_PER_SECOND } from '../../../..';
import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildWalletNftsFetcher } from './buildWalletNftsFetcher';
import { buildWalletNftsKey } from './buildWalletNftsKey';

const BASE64_EMPTY_CURSOR = 'e30';

const useWalletNfts = ({
  params,
  enabled,
}: {
  params: Omit<ApiGetWalletNftsQueryParams, 'limit'>;
  enabled: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useInfiniteQuery({
    initialPageParam: undefined,
    queryKey: buildWalletNftsKey(params),

    queryFn: buildWalletNftsFetcher({
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
  });
};

export { useWalletNfts };
