import { FarcasterApiClient } from 'farcaster-client-data';

export const buildVanityReferralCodeFetcher =
  ({
    apiClient,
    username,
  }: {
    apiClient: FarcasterApiClient;
    username: string;
  }) =>
  async () => {
    const response = await apiClient.getReferralCodeByUsername({
      username: username,
    });
    return response.data.result;
  };
