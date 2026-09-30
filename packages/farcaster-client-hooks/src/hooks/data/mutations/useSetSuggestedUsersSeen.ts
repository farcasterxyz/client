import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useSetSuggestedUsersSeen = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ fids }: { fids: number[] }) => {
      try {
        await apiClient.setSuggestedUsersAsSeen({
          fids: fids,
        });
      } catch (error) {
        // ignore, as a filure here or there shouldn't impact the experience
      }
    },
    [apiClient],
  );
};

export { useSetSuggestedUsersSeen };
