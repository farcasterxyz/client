import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

export const useDeleteQuests = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async (fid: number) => {
      const { data } = await apiClient.deleteQuestsForUser({ fid });
      return data.result;
    },

    [apiClient],
  );
};
