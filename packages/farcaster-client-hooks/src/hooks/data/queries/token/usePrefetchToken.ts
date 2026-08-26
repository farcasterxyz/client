import { QueryClient, useQueryClient } from '@tanstack/react-query';
import {
  ApiChain,
  ApiGetTokenQueryParams,
  FarcasterApiClient,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useCheckIfRecentlyPrefetched } from '../../helpers';
import { buildMergeIntoGloballyCachedToken } from '../globallyCachedToken';
import { buildTokenFetcher } from './buildTokenFetcher';
import { buildTokenKey } from './buildTokenKey';

export const prefetchToken = (
  queryClient: QueryClient,
  apiClient: FarcasterApiClient,
  { params }: { params: ApiGetTokenQueryParams },
) => {
  const mergeIntoGloballyCachedToken =
    buildMergeIntoGloballyCachedToken(queryClient);

  queryClient.prefetchQuery({
    queryKey: buildTokenKey(params),
    queryFn: buildTokenFetcher({
      apiClient,
      params,
      mergeIntoGloballyCachedToken,
    }),
  });
};

const usePrefetchToken = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  const checkIfRecentlyPrefetched = useCheckIfRecentlyPrefetched();

  return useCallback(
    ({ chain, ca }: { chain: ApiChain; ca: string }) => {
      const queryKey = buildTokenKey({ chain, ca });

      if (checkIfRecentlyPrefetched({ queryKey })) {
        return;
      }

      return prefetchToken(queryClient, apiClient, { params: { chain, ca } });
    },
    [checkIfRecentlyPrefetched, queryClient, apiClient],
  );
};

export { usePrefetchToken };
