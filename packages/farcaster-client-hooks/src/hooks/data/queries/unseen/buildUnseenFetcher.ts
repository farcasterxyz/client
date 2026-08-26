import {
  DEFAULT_TIMEOUT_UNSEEN,
  FarcasterApiClient,
} from 'farcaster-client-data';

const buildUnseenFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async (
    { timeout }: { timeout?: number } = { timeout: DEFAULT_TIMEOUT_UNSEEN },
  ) => {
    const response = await apiClient.getUnseen({ timeout });
    return response.data;
  };

export { buildUnseenFetcher };
