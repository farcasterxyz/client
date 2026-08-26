import { FarcasterApiClient } from 'farcaster-client-data';

const buildAppLauncherFetcher =
  ({
    apiClient,
    viewerFid,
    weightRecency,
    weightFrequency,
    weightInstalled,
  }: {
    apiClient: FarcasterApiClient;
    viewerFid?: number;
    weightRecency?: number;
    weightFrequency?: number;
    weightInstalled?: number;
  }) =>
  async () => {
    const response = await apiClient.getAppLauncher({
      viewerFid,
      weightRecency,
      weightFrequency,
      weightInstalled,
    });
    return response.data.result;
  };

export { buildAppLauncherFetcher };
