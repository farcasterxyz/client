import type { FarcasterApiClient } from 'farcaster-client-data';

export const buildDomainManifestStateFetcher = ({
  apiClient,
  domain,
  manifest,
}: {
  apiClient: FarcasterApiClient;
  domain?: string;
  manifest?: string;
}) => {
  return async () => {
    const response = await apiClient.getDomainManifestState({
      domain,
      manifest,
    });
    return response.data.result;
  };
};
