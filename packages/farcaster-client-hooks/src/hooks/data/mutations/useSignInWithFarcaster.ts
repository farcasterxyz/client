import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

export const useSignInWithFarcaster = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async (args: Parameters<typeof apiClient.signInWithFarcaster>[0]) => {
      return await apiClient.signInWithFarcaster(args);
    },
    [apiClient],
  );
};
