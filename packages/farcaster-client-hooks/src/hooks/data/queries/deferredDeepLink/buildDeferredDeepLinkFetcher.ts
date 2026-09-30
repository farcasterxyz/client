import { FarcasterApiClient } from 'farcaster-client-data';

const buildDeferredDeepLinkFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async ({
    platform,
    platformVersion,
    deviceName,
  }: {
    platform: string;
    platformVersion: string;
    deviceName: string;
  }) => {
    const response = await apiClient.getSavedDeferredDeepLink({
      platform,
      platformVersion,
      deviceName,
    });
    return response.data;
  };

export { buildDeferredDeepLinkFetcher };
