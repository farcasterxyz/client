import { QueryClient } from '@tanstack/react-query';
import { FarcasterApiClient } from 'farcaster-client-data';

import { base64ToBase64Url } from '../../../../utils';
import { buildSyncChannelKey } from './buildSyncChannelKey';

const buildSyncChannelsFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async ({
    base64Signature,
    base64PublicKey,
    channelId,
    queryClient,
  }: {
    base64PublicKey: string;
    base64Signature: string;
    channelId: string;
    queryClient: QueryClient | undefined;
  }) => {
    const response = await apiClient.getSyncChannel({
      channelId,
      base64PublicKey: base64ToBase64Url(base64PublicKey),
      base64Signature: base64ToBase64Url(base64Signature),
    });

    if (queryClient) {
      queryClient.setQueryData(buildSyncChannelKey({ channelId }), response);
    }

    return response.data;
  };

export { buildSyncChannelsFetcher };
