import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildDevToolsDomainsOwnedFetcher } from './buildDevToolsDomainsOwnedFetcher';

const useFetchDevToolsDomainsOwned = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ fid }: { fid?: number } = {}) => {
      const result = await buildDevToolsDomainsOwnedFetcher({
        apiClient,
        fid,
      })();

      return result;
    },
    [apiClient],
  );
};

export { useFetchDevToolsDomainsOwned };
