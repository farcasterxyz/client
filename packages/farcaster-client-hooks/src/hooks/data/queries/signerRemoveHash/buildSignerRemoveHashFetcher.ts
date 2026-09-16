import { FarcasterApiClient } from 'farcaster-client-data';

const buildSignerRemoveHashFetcher =
  ({
    apiClient,
    publicKey,
    deadline,
  }: {
    apiClient: FarcasterApiClient;
    publicKey: string;
    deadline: number;
  }) =>
  async () => {
    const response = await apiClient.getSignerRemoveHash({
      publicKey,
      deadline,
    });
    return response.data;
  };

export { buildSignerRemoveHashFetcher };
