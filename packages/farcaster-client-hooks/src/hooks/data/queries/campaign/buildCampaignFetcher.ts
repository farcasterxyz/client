import { FarcasterApiClient } from 'farcaster-client-data';

const buildCampaignFetcher =
  ({ apiClient, id }: { id: string; apiClient: FarcasterApiClient }) =>
  async () => {
    const response = await apiClient.getCampaign({
      id,
    });

    return response.data.result;
  };

export { buildCampaignFetcher };
