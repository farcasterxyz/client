import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useInitiateRecovery = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ email }: { email: string }) => {
      await apiClient.initiateRecovery({ email });
    },
    [apiClient],
  );
};

export { useInitiateRecovery };
