import { FarcasterApiClient } from 'farcaster-client-data';

const buildValidateNewChannelKeyFetcher =
  ({
    channelKey,
    apiClient,
  }: {
    channelKey: string;
    apiClient: FarcasterApiClient;
  }) =>
  async () => {
    const response = await apiClient.validateNewChannelKey({ channelKey });
    return response.data.result;
  };

export { buildValidateNewChannelKeyFetcher };
