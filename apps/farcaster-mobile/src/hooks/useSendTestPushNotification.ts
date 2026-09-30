import { useFarcasterApiClient } from 'farcaster-client-hooks';

const useSendTestPushNotification = () => {
  const { apiClient } = useFarcasterApiClient();

  return async () => {
    await apiClient.sendPushNotification({});
  };
};

export { useSendTestPushNotification };
