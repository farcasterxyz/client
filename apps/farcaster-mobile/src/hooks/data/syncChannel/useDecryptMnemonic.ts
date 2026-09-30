import { ApiSyncChannelMessage } from 'farcaster-client-data';
import { KeyTransport } from 'farcaster-cryptography';
import { useCallback } from 'react';

import { syncChannelIdKey } from '~/constants/Storage';
import { setItem } from '~/utils/StorageUtils';

const useDecryptMnemonic = () => {
  return useCallback(
    async ({
      channelId,
      message,
      transport,
    }: {
      channelId: string;
      message: ApiSyncChannelMessage;
      transport: KeyTransport;
    }) => {
      const base64Mnemonic = await transport!.handleSyncMessage({
        ...message,
        channelId,
      });

      // Once we have a mnemonic, we need to ensure we always use this sync channel
      // info moving forward, in case we built any other channel before this.
      if (base64Mnemonic) {
        await setItem({
          key: syncChannelIdKey,
          value: channelId,
        });
      }
      return Buffer.from(base64Mnemonic as string, 'base64').toString('utf8');
    },
    [],
  );
};

export { useDecryptMnemonic };
