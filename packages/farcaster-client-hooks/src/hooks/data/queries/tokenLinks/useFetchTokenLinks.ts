import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useBatchMergeIntoGloballyCachedTokens } from '../globallyCachedToken';
import { buildTokenLinksFetcher } from './buildTokenLinksFetcher';
import { buildTokenLinksKey } from './buildTokenLinksKey';

const useFetchTokenLinks = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  const batchMergeIntoGloballyCachedTokens =
    useBatchMergeIntoGloballyCachedTokens();

  return useCallback(
    ({ ticker }: { ticker: string }) => {
      const queryKey = buildTokenLinksKey({ ticker });

      return queryClient.fetchQuery({
        queryKey: queryKey,
        queryFn: buildTokenLinksFetcher({
          apiClient,
          ticker,
          batchMergeIntoGloballyCachedTokens,
        }),
      });
    },
    [apiClient, batchMergeIntoGloballyCachedTokens, queryClient],
  );
};

export { useFetchTokenLinks };
