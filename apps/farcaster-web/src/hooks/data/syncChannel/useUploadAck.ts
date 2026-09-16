import { useUpdateSyncChannel } from 'farcaster-client-hooks';
import { getKeyTransport } from 'farcaster-cryptography';
import { useCallback } from 'react';

import { dataStore, keyStore } from '~/utils/cryptographyUtils';

const useUploadAck = () => {
  const updateSyncChannel = useUpdateSyncChannel();

  return useCallback(
    async ({ channelId }: { channelId: string }) => {
      const transport = await getKeyTransport({ dataStore, keyStore });
      const message = await transport!.encryptString(channelId, 'ACK');
      await updateSyncChannel(message);
    },
    [updateSyncChannel],
  );
};

export { useUploadAck };
