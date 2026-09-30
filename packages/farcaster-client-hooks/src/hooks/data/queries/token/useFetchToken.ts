import { useQueryClient } from '@tanstack/react-query';
import { ApiChain } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useMergeIntoGloballyCachedToken } from '../globallyCachedToken';
import { buildTokenFetcher } from './buildTokenFetcher';
import { buildTokenKey } from './buildTokenKey';

const useFetchToken = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();
  const mergeIntoGloballyCachedToken = useMergeIntoGloballyCachedToken();

  return useCallback(
    ({
      chain,
      ca,
      retry,
    }: {
      chain: ApiChain;
      ca: string;
      retry?: boolean;
    }) => {
      const queryKey = buildTokenKey({ chain, ca });

      return queryClient.fetchQuery({
        queryKey: queryKey,
        queryFn: buildTokenFetcher({
          apiClient,
          params: {
            chain,
            ca,
          },
          mergeIntoGloballyCachedToken,
        }),
        retry,
      });
    },
    [apiClient, mergeIntoGloballyCachedToken, queryClient],
  );
};

export { useFetchToken };
