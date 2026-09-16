import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

const useMarkSyncChannelMessageRead = () => {
  const { apiClient } = useFarcasterApiClient();

  return useCallback(
    async ({
      channelId,
      messageHash,
      base64PublicKey,
      base64Signature,
    }: {
      channelId: string;
      messageHash: string;
      base64PublicKey: string;
      base64Signature: string;
    }) => {
      const response = await apiClient.markSyncChannelMessageRead({
        channelId,
        messageHash,
        base64PublicKey,
        base64Signature,
      });

      return response.data;
    },
    [apiClient],
  );
};

export { useMarkSyncChannelMessageRead };
