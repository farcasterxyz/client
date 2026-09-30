import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useUpdateSyncChannel = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({
      base64PublicKey,
      base64Signature,
      channelId,
      message,
      messageHash,
    }: {
      base64PublicKey: string;
      base64Signature: string;
      channelId: string;
      message: string;
      messageHash: string;
    }) => {
      apiClient.updateSyncChannel({
        base64PublicKey,
        base64Signature,
        channelId,
        message,
        messageHash,
      });
    },
    [apiClient],
  );
};

export { useUpdateSyncChannel };
