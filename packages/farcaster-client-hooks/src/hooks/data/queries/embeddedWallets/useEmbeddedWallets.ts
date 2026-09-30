import { useQuery } from '@tanstack/react-query';
import { ApiListEmbeddedWalletsQueryParams } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildEmbeddedWalletsFetcher } from './buildEmbeddedWalletsFetcher';
import { buildEmbeddedWalletsKey } from './buildEmbeddedWalletsKey';

export const useEmbeddedWalletsQuery = ({
  params = {},
  scopeKey,
  enabled = true,
}: {
  params?: ApiListEmbeddedWalletsQueryParams;
  scopeKey?: string | number;
  enabled?: boolean;
} = {}) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildEmbeddedWalletsKey({ ...params, scopeKey }),
    queryFn: buildEmbeddedWalletsFetcher({ apiClient, params }),
    enabled,
  });
};
