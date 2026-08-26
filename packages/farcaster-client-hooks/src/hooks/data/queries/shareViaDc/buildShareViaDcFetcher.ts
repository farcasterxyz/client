import { FarcasterApiClient } from 'farcaster-client-data';

const buildShareViaDcFetcher =
  ({
    apiClient,
    maxTargets,
    fresh,
    overrideFid,
  }: {
    apiClient: FarcasterApiClient;
    maxTargets?: number;
    fresh?: boolean;
    overrideFid?: number;
  }) =>
  async () => {
    const response = await apiClient.shareViaDC({
      maxTargets,
      fresh,
      overrideFid,
    });
    return response.data;
  };

export { buildShareViaDcFetcher };
