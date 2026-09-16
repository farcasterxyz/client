import { FarcasterApiClient } from 'farcaster-client-data';

import { MergeIntoGloballyCachedChannel } from '../../../../types';

const buildChannelFetcher =
  ({
    apiClient,
    key,
    mergeIntoGloballyCachedChannel,
  }: {
    apiClient: FarcasterApiClient;
    key: string;
    mergeIntoGloballyCachedChannel: MergeIntoGloballyCachedChannel;
  }) =>
  async () => {
    const response = await apiClient.getChannel({ key });

    // Returning the same value as the one stored in the global cache so that
    // getChannelFromGlobalCache works seamlessly
    mergeIntoGloballyCachedChannel({ updates: response.data.result.channel });
    return response.data.result.channel;
  };

export { buildChannelFetcher };
