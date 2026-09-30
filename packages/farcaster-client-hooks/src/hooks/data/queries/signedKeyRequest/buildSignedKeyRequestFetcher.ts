import { FarcasterApiClient } from 'farcaster-client-data';

const buildSignedKeyRequestFetcher =
  ({
    apiClient,
    token,
    deadline,
  }: {
    apiClient: FarcasterApiClient;
    token: string;
    deadline?: number;
  }) =>
  async () => {
    const response = await apiClient.getSignedKeyRequest({ token, deadline });
    return response.data;
  };

export { buildSignedKeyRequestFetcher };
