import { FarcasterApiClient } from 'farcaster-client-data';

const buildChannelSettingsFetcher =
  ({ apiClient, key }: { apiClient: FarcasterApiClient; key: string }) =>
  async () => {
    const response = await apiClient.getChannelSettings({ key });

    return response.data.result.settings;
  };

export { buildChannelSettingsFetcher };
