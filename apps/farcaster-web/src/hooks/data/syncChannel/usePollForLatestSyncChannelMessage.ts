import { ApiSyncChannelMessage } from 'farcaster-client-data';
import {
  sleep,
  SYNC_CHANNEL_AUTH_POLL_INTERVAL_MS,
  SYNC_CHANNEL_AUTH_POLL_MAX_MS,
  SYNC_CHANNEL_AUTH_POLL_TIMEOUT_MESSAGE,
  useFetchLatestSyncChannelMessage,
} from 'farcaster-client-hooks';
import { getKeyTransport } from 'farcaster-cryptography';
import { MutableRefObject, useCallback } from 'react';

import { dataStore, keyStore } from '~/utils/cryptographyUtils';

const usePollForLatestSyncChannelMessage = () => {
  const fetchLatestSyncChannelMessage = useFetchLatestSyncChannelMessage();

  return useCallback(
    async ({
      cancelControllerRef,
      channelId,
      pollInterval = SYNC_CHANNEL_AUTH_POLL_INTERVAL_MS,
      maxDurationMs = SYNC_CHANNEL_AUTH_POLL_MAX_MS,
    }: {
      cancelControllerRef: MutableRefObject<{ cancel: boolean }>;
      channelId: string;
      pollInterval?: number;
      maxDurationMs?: number;
    }): Promise<ApiSyncChannelMessage | undefined> => {
      let message: ApiSyncChannelMessage | undefined;
      const startedAt = Date.now();

      const transport = await getKeyTransport({ keyStore, dataStore });

      do {
        if (cancelControllerRef.current.cancel) {
          return undefined;
        }

        if (Date.now() - startedAt >= maxDurationMs) {
          throw new Error(SYNC_CHANNEL_AUTH_POLL_TIMEOUT_MESSAGE);
        }

        await sleep(pollInterval);

        try {
          message = await fetchLatestSyncChannelMessage(
            await transport.generateSyncChannelGetParams(channelId),
          );
        } catch {} // Deploys and connectivity issues will interrupt this, we shouldn't break
      } while (!message);

      return message;
    },
    [fetchLatestSyncChannelMessage],
  );
};

export { usePollForLatestSyncChannelMessage };
