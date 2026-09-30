import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useDismissSuggestedUsers = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ fids }: { fids: number[] }) => {
      await apiClient.dismissSuggestedUsers({ fids });
    },
    [apiClient],
  );
};

export { useDismissSuggestedUsers };
