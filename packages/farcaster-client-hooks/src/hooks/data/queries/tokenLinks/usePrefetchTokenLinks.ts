import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useCheckIfRecentlyPrefetched } from '../../helpers';
import { useBatchMergeIntoGloballyCachedTokens } from '../globallyCachedToken';
import { buildTokenLinksFetcher } from './buildTokenLinksFetcher';
import { buildTokenLinksKey } from './buildTokenLinksKey';

const usePrefetchTokenLinks = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();
  const checkIfRecentlyPrefetched = useCheckIfRecentlyPrefetched();

  const batchMergeIntoGloballyCachedTokens =
    useBatchMergeIntoGloballyCachedTokens();

  return useCallback(
    ({ ticker }: { ticker: string }) => {
      const queryKey = buildTokenLinksKey({ ticker });

      if (checkIfRecentlyPrefetched({ queryKey })) {
        return;
      }

      return queryClient.prefetchQuery({
        queryKey: queryKey,
        queryFn: buildTokenLinksFetcher({
          apiClient,
          ticker,
          batchMergeIntoGloballyCachedTokens,
        }),
      });
    },
    [
      apiClient,
      batchMergeIntoGloballyCachedTokens,
      checkIfRecentlyPrefetched,
      queryClient,
    ],
  );
};

export { usePrefetchTokenLinks };
