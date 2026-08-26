import { useInfiniteQuery } from '@tanstack/react-query';
import { ApiGetWalletPositionsOpenQueryParams } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { MILLIS_PER_MINUTE } from '../../../../utils/TimeUtils';
import { useBatchMergeIntoGloballyCachedTokens } from '../globallyCachedToken';
import { buildWalletPositionsOpenFetcher } from './buildWalletPositionsOpenFetcher';
import { buildWalletPositionsOpenKey } from './buildWalletPositionsOpenKey';

type WalletPositionsOpenQueryParams = Omit<
  ApiGetWalletPositionsOpenQueryParams,
  'cursor' | 'limit'
> & { limit?: number };

export const useWalletPositionsOpen = (
  params: WalletPositionsOpenQueryParams,
) => {
  const { limit = 25 } = params;
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedTokens =
    useBatchMergeIntoGloballyCachedTokens();

  return useInfiniteQuery({
    queryKey: buildWalletPositionsOpenKey({ ...params, limit }),
    queryFn: ({ pageParam: cursor }) =>
      buildWalletPositionsOpenFetcher({
        apiClient,
        params: { ...params, cursor, limit },
        batchMergeIntoGloballyCachedTokens,
      })(),

    getNextPageParam: (lastPage) => lastPage.next?.cursor || undefined,
    initialPageParam: undefined as string | undefined,

    staleTime: MILLIS_PER_MINUTE,
  });
};
