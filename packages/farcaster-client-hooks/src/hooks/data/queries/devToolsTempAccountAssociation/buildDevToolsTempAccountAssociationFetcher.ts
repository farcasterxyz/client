import { FarcasterApiClient } from 'farcaster-client-data';

const buildDevToolsTempAccountAssociationFetcher =
  ({
    apiClient,
    domain,
    fid,
  }: {
    apiClient: FarcasterApiClient;
    domain: string;
    fid?: number;
  }) =>
  async () => {
    const response = await apiClient.devToolsGetTempAccountAssociation({
      domain,
      fid,
    });

    return response.data.result.accountAssociation;
  };

export { buildDevToolsTempAccountAssociationFetcher };
