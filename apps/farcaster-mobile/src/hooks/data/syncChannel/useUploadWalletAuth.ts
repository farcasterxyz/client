import { useUpdateSyncChannel } from 'farcaster-client-hooks';
import { getKeyTransport } from 'farcaster-cryptography';
import { useCallback } from 'react';

import { useFarcasterAsyncDataStore } from '~/contexts/FarcasterAsyncDataStore';
import { useFarcasterCryptographyKeyStore } from '~/contexts/FarcasterCryptographyKeyStoreProvider';
import { useSiwf } from '~/hooks/data/useSiwf';

const useUploadWalletAuth = () => {
  const { keyStore } = useFarcasterCryptographyKeyStore();
  const { dataStore } = useFarcasterAsyncDataStore();
  const updateSyncChannel = useUpdateSyncChannel();
  const siwf = useSiwf();

  return useCallback(
    async ({
      channelId,
      nonce,
      expiresAt,
    }: {
      channelId: string;
      nonce: string;
      expiresAt: string;
    }) => {
      const transport = await getKeyTransport({ keyStore, dataStore });

      const data = await siwf({
        nonce,
        expirationTime: new Date(parseInt(expiresAt)),
        uri: 'https://farcaster.xyz/login',
      });

      const message = await transport!.encryptString(
        channelId,
        JSON.stringify(data),
      );

      await updateSyncChannel(message);
    },
    [keyStore, dataStore, updateSyncChannel, siwf],
  );
};

export { useUploadWalletAuth };
