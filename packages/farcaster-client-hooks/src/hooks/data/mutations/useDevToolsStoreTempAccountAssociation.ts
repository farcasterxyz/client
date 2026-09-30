import { ApiJsonFarcasterSignature } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useDevToolsStoreTempAccountAssociation = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({
      domain,
      accountAssociation,
    }: {
      domain: string;
      accountAssociation: ApiJsonFarcasterSignature;
    }) => {
      await apiClient.devToolsStoreTempAccountAssociation({
        domain,
        accountAssociation,
      });
    },
    [apiClient],
  );
};

export { useDevToolsStoreTempAccountAssociation };
