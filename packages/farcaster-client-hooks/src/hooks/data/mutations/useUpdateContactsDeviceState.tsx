import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useUpdateContactsDeviceState = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({
      deviceId,
      enabled,
      localStorageSize,
      nextUploadIndex,
      lastUploadTimestamp,
    }: {
      deviceId: string;
      enabled: boolean;
      localStorageSize: number;
      nextUploadIndex?: number;
      lastUploadTimestamp?: number;
    }) => {
      await apiClient.setContactsDeviceState({
        deviceId,
        enabled,
        localStorageSize,
        nextUploadIndex,
        lastUploadTimestamp,
      });
    },
    [apiClient],
  );
};

export { useUpdateContactsDeviceState };
