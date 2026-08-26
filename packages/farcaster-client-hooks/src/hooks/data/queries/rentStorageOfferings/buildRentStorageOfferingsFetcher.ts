import { FarcasterApiClient } from 'farcaster-client-data';

const buildRentStorageOfferingsFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async () => {
    const response = await apiClient.getRentStorageOfferings();

    return response.data.result;
  };

export { buildRentStorageOfferingsFetcher };
