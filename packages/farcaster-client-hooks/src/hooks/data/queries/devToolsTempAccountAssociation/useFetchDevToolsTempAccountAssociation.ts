import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildDevToolsTempAccountAssociationFetcher } from './buildDevToolsTempAccountAssociationFetcher';

const useFetchDevToolsTempAccountAssociation = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ domain, fid }: { domain: string | undefined; fid?: number }) => {
      if (!domain) {
        return null;
      }

      const result = await buildDevToolsTempAccountAssociationFetcher({
        apiClient,
        domain,
        fid,
      })();

      return result;
    },
    [apiClient],
  );
};

export { useFetchDevToolsTempAccountAssociation };
