import { useQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildDevToolsDomainsOwnedFetcher } from './buildDevToolsDomainsOwnedFetcher';
import { buildDevToolsDomainsOwnedKey } from './buildDevToolsDomainsOwnedKey';

const useDevToolsDomainsOwned = ({
  fid,
  enabled,
}: { fid?: number; enabled?: boolean } = {}) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildDevToolsDomainsOwnedKey({ fid }),
    queryFn: buildDevToolsDomainsOwnedFetcher({
      apiClient,
      fid,
    }),
    enabled,
  });
};

export { useDevToolsDomainsOwned };
