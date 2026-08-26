import { FarcasterApiClient } from 'farcaster-client-data';

const buildUserPreferencesFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async () => {
    const response = await apiClient.getUserPreferences();
    return response.data;
  };

export { buildUserPreferencesFetcher };
