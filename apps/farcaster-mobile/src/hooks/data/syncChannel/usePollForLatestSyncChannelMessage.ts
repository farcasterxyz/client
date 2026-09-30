import { ApiSyncChannelMessage } from 'farcaster-client-data';
import {
  sleep,
  useFetchLatestSyncChannelMessage,
} from 'farcaster-client-hooks';
import { getKeyTransport } from 'farcaster-cryptography';
import { MutableRefObject, useCallback } from 'react';

import { useFarcasterAsyncDataStore } from '~/contexts/FarcasterAsyncDataStore';
import { useFarcasterCryptographyKeyStore } from '~/contexts/FarcasterCryptographyKeyStoreProvider';

const defaultPollInterval = 500;

const usePollForLatestSyncChannelMessage = () => {
  const fetchLatestSyncChannelMessage = useFetchLatestSyncChannelMessage();
  const { keyStore } = useFarcasterCryptographyKeyStore();
  const { dataStore } = useFarcasterAsyncDataStore();

  return useCallback(
    async ({
      channelId,
      cancelControllerRef,
      pollInterval = defaultPollInterval,
    }: {
      channelId: string;
      cancelControllerRef: MutableRefObject<{ cancel: boolean }>;
      pollInterval?: number;
    }): Promise<ApiSyncChannelMessage | undefined> => {
      let message: ApiSyncChannelMessage | undefined;

      do {
        if (cancelControllerRef.current.cancel) {
          return undefined;
        }

        await sleep(pollInterval);

        const transport = await getKeyTransport({ keyStore, dataStore });

        try {
          message = await fetchLatestSyncChannelMessage(
            await transport.generateSyncChannelGetParams(channelId),
          );
        } catch {
          /* empty */
        } // Deploys and connectivity issues will interrupt this, we shouldn't break, just let it stay unset
      } while (!message);

      return message;
    },
    [dataStore, fetchLatestSyncChannelMessage, keyStore],
  );
};

export { usePollForLatestSyncChannelMessage };
