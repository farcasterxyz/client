import { FarcasterApiClient } from 'farcaster-client-data';

const buildOnchainMorphoFarcasterVaultFetcher =
  ({ apiClient }: { apiClient: FarcasterApiClient }) =>
  async () => {
    const response = await apiClient.getMorphoFarcasterVault();
    return response.data.result;
  };

export { buildOnchainMorphoFarcasterVaultFetcher };
