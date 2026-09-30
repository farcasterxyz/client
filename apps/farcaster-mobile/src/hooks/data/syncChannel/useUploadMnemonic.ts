import { useUpdateSyncChannel } from 'farcaster-client-hooks';
import { getKeyTransport } from 'farcaster-cryptography';
import { useCallback } from 'react';

import { useFarcasterAsyncDataStore } from '~/contexts/FarcasterAsyncDataStore';
import { useFarcasterCryptographyKeyStore } from '~/contexts/FarcasterCryptographyKeyStoreProvider';
import { useWallet } from '~/contexts/WalletProvider';

const useUploadMnemonic = () => {
  const { keyStore } = useFarcasterCryptographyKeyStore();
  const { dataStore } = useFarcasterAsyncDataStore();
  const updateSyncChannel = useUpdateSyncChannel();
  const { account } = useWallet();

  return useCallback(
    async ({ channelId }: { channelId: string }) => {
      const transport = await getKeyTransport({ keyStore, dataStore });

      const message = await transport!.encryptString(
        channelId,
        account!.mnemonic,
      );

      await updateSyncChannel(message);
    },
    [keyStore, dataStore, account, updateSyncChannel],
  );
};

export { useUploadMnemonic };
