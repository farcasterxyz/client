import { ApiCreatorLabel } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useSetCreatorLabel = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({
      fid,
      creatorLabel,
    }: {
      fid: number;
      creatorLabel: ApiCreatorLabel;
    }) => {
      const response = await apiClient.setCreatorLabel({
        fid,
        creatorLabel,
      });

      return response.data;
    },
    [apiClient],
  );
};

export { useSetCreatorLabel };
