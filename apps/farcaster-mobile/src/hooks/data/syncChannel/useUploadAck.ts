import { useUpdateSyncChannel } from 'farcaster-client-hooks';
import { getKeyTransport } from 'farcaster-cryptography';
import { useCallback } from 'react';

import { useFarcasterAsyncDataStore } from '~/contexts/FarcasterAsyncDataStore';
import { useFarcasterCryptographyKeyStore } from '~/contexts/FarcasterCryptographyKeyStoreProvider';

const useUploadAck = () => {
  const updateSyncChannel = useUpdateSyncChannel();
  const { dataStore } = useFarcasterAsyncDataStore();
  const { keyStore } = useFarcasterCryptographyKeyStore();

  return useCallback(
    async ({ channelId }: { channelId: string }) => {
      const transport = await getKeyTransport({ dataStore, keyStore });
      const message = await transport!.encryptString(channelId, 'ACK');
      await updateSyncChannel(message);
    },
    [dataStore, keyStore, updateSyncChannel],
  );
};

export { useUploadAck };
