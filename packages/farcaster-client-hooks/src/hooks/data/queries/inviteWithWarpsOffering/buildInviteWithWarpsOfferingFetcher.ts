import { FarcasterApiClient } from 'farcaster-client-data';

const buildInviteWithWarpsOfferingFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async () => {
    const response = await apiClient.getInviteWithWarpsOffering();

    return response.data.result;
  };

export { buildInviteWithWarpsOfferingFetcher };
