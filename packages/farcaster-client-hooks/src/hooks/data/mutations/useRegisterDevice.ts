import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useRegisterDevice = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({
      deviceId,
      deviceModel,
      deviceName,
      deviceOs,
      deviceToken,
      expoPushToken,
      notificationsSystemEnabled,
      previousDeviceToken,
    }: {
      deviceId: string;
      deviceModel: string;
      deviceName: string;
      deviceOs: string;
      deviceToken?: string;
      expoPushToken?: string;
      notificationsSystemEnabled?: boolean;
      previousDeviceToken?: string;
    }) => {
      await apiClient.registerDevice({
        deviceId,
        deviceModel,
        deviceName,
        deviceOs,
        deviceToken,
        expoPushToken,
        notificationsSystemEnabled,
        previousDeviceToken,
      });
    },
    [apiClient],
  );
};

export { useRegisterDevice };
