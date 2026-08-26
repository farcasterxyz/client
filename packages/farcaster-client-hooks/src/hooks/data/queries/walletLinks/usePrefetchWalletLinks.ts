import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildWalletLinksFetcher } from './buildWalletLinksFetcher';
import { buildWalletLinksKey } from './buildWalletLinksKey';
import { walletLinksDefaultQueryOptions } from './walletLinksDefaultQueryOptions';

const usePrefetchWalletLinks = () => {
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();

  const prefetchWalletLinks = useCallback(() => {
    return queryClient.prefetchQuery({
      ...walletLinksDefaultQueryOptions,
      queryKey: buildWalletLinksKey(),
      queryFn: buildWalletLinksFetcher({ apiClient }),
    });
  }, [apiClient, queryClient]);

  return { prefetchWalletLinks };
};

export { usePrefetchWalletLinks };
