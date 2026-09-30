import { FarcasterApiClient } from 'farcaster-client-data';

import { buildSyncChannelsFetcher } from './buildSyncChannelFetcher';
import { getLatestMessage } from './shared';

const fetchLatestSyncChannelMessage = async ({
  apiClient,
  base64PublicKey,
  base64Signature,
  channelId,
}: {
  apiClient: FarcasterApiClient;
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
  const response = await buildSyncChannelsFetcher({ apiClient })({
    base64PublicKey,
    base64Signature,
    channelId,
    queryClient: undefined,
  });

  return await getLatestMessage({ channelId, response });
};

export { fetchLatestSyncChannelMessage };
