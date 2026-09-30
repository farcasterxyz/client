import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildWalletLinksFetcher } from './buildWalletLinksFetcher';
import { buildWalletLinksKey } from './buildWalletLinksKey';
import { walletLinksDefaultQueryOptions } from './walletLinksDefaultQueryOptions';

const useWalletLinks = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const { apiClient } = useFarcasterApiClient();

  const result = useQuery({
    ...walletLinksDefaultQueryOptions,
    queryKey: buildWalletLinksKey(),
    queryFn: buildWalletLinksFetcher({ apiClient }),
    enabled,
  });

  return result;
};

export { useWalletLinks };
