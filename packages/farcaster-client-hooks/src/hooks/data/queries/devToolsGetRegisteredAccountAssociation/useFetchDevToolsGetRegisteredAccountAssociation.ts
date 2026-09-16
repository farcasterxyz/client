import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildDevToolsGetRegisteredAccountAssociationFetcher } from './buildDevToolsGetRegisteredAccountAssociationFetcher';

const useFetchDevToolsGetRegisteredAccountAssociation = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ domain }: { domain: string | undefined }) => {
      if (!domain) {
        return null;
      }

      const result = await buildDevToolsGetRegisteredAccountAssociationFetcher({
        apiClient,
        domain,
      })();

      return result;
    },
    [apiClient],
  );
};

export { useFetchDevToolsGetRegisteredAccountAssociation };
