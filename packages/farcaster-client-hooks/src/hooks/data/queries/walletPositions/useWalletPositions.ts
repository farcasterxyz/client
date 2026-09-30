import { useQuery } from '@tanstack/react-query';
import { ApiGetWalletPositionsQueryParams } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useBatchMergeIntoGloballyCachedTokens } from '../globallyCachedToken';
import { buildWalletPositionsFetcher } from './buildWalletPositionsFetcher';
import { buildWalletPositionsKey } from './buildWalletPositionsKey';

export const useWalletPositionsQuery = ({
  params,
  staleTime,
  refetchInterval,
  enabled = true,
  keepPreviousData = false,
}: {
  params: ApiGetWalletPositionsQueryParams;
  staleTime?: number;
  refetchInterval?: number;
  enabled?: boolean;
  keepPreviousData?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const batchMergeIntoGloballyCachedTokens =
    useBatchMergeIntoGloballyCachedTokens();

  return useQuery({
    queryKey: buildWalletPositionsKey(params),
    queryFn: buildWalletPositionsFetcher({
      params,
      apiClient,
      batchMergeIntoGloballyCachedTokens,
    }),
    staleTime,
    refetchInterval,
    enabled,
    placeholderData: keepPreviousData
      ? (previousData) => previousData
      : undefined,
  });
};
