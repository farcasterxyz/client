import { ApiJsonFarcasterSignature } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useDevToolsDecodeAccountAssociation = () => {
  const { apiClient } = useFarcasterApiClient();
  return useCallback(
    async (accountAssociation: ApiJsonFarcasterSignature) => {
      const response = await apiClient.devToolsDecodeAccountAssociation({
        accountAssociation,
      });
      return response.data.result.decodedAccountAssociation;
    },
    [apiClient],
  );
};

export { useDevToolsDecodeAccountAssociation };
