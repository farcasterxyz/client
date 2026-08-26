import { ApiDomainManifest, FarcasterApiClient } from 'farcaster-client-data';

const buildDevToolsFarcasterJsonFetcher =
  ({ apiClient, domain }: { apiClient: FarcasterApiClient; domain: string }) =>
  async () => {
    const response = await apiClient.devToolsFarcasterJson({
      domain,
    });

    return response.data as unknown as ApiDomainManifest;
  };

export { buildDevToolsFarcasterJsonFetcher };
