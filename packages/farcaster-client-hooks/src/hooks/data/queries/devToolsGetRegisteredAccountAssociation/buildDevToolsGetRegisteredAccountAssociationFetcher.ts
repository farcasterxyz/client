import { FarcasterApiClient } from 'farcaster-client-data';

const buildDevToolsGetRegisteredAccountAssociationFetcher =
  ({ apiClient, domain }: { apiClient: FarcasterApiClient; domain: string }) =>
  async () => {
    const response = await apiClient.devToolsGetRegisteredAccountAssociation({
      domain,
    });

    return response.data.result.accountAssociation;
  };

export { buildDevToolsGetRegisteredAccountAssociationFetcher };
