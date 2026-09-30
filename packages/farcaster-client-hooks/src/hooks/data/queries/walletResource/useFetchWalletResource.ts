import { useQueryClient } from '@tanstack/react-query';
import { ApiWalletResourceName } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildWalletResourceFetcher } from './buildWalletResourceFetcher';
import { buildWalletResourceKey } from './buildWalletResourceKey';

const useFetchWalletResource = () => {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();

  return useCallback(
    (name: ApiWalletResourceName) => {
      const fetcher = buildWalletResourceFetcher({
        name,
        apiClient,
      });

      return queryClient.fetchQuery({
        queryKey: buildWalletResourceKey({ name }),
        queryFn: fetcher,
        // Don't cache this query. Can have sensitive data.
        staleTime: 0,
        gcTime: 0,
      });
    },
    [queryClient, apiClient],
  );
};

export { useFetchWalletResource };
