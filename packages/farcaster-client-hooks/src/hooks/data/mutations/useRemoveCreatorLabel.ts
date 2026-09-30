import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useRemoveCreatorLabel = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({ fid }: { fid: number }) => {
      const response = await apiClient.removeCreatorLabel({
        fid,
      });

      return response.data;
    },
    [apiClient],
  );
};

export { useRemoveCreatorLabel };
