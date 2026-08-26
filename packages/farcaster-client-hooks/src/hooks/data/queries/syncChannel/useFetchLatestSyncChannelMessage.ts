import { useCallback } from 'react';

import { getLatestMessage } from './shared';
import { useFetchSyncChannel } from './useFetchSyncChannel';

const useFetchLatestSyncChannelMessage = () => {
  const fetchSyncChannel = useFetchSyncChannel();

  return useCallback(
    async ({
      base64PublicKey,
      base64Signature,
      channelId,
    }: {
      base64PublicKey: string;
      base64Signature: string;
      channelId: string;
    }): Promise<{
      channelId: string;
      base64PublicKey: string;
      base64Signature: string;
      messageHash: string;
      message: string;
    }> => {
      const response = await fetchSyncChannel({
        base64PublicKey,
        base64Signature,
        channelId,
      });

      return await getLatestMessage({ channelId, response });
    },
    [fetchSyncChannel],
  );
};

export { useFetchLatestSyncChannelMessage };
