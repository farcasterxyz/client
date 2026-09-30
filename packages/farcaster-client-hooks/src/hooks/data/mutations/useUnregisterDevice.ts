import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useUnregisterDevice = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({
      deviceId,
      deviceToken,
    }: {
      deviceId: string;
      deviceToken: string | undefined;
    }) => {
      await apiClient.unregisterDevice({ deviceId, deviceToken });
    },
    [apiClient],
  );
};

export { useUnregisterDevice };
