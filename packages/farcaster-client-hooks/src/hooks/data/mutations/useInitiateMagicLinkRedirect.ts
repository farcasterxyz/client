import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useInitiateMagicLinkRedirect = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(async () => {
    return await apiClient.initiateMagicLinkDirect();
  }, [apiClient]);
};

export { useInitiateMagicLinkRedirect };
