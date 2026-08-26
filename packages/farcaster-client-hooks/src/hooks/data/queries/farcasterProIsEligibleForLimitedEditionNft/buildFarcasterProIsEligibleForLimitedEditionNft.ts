import { FarcasterApiClient } from 'farcaster-client-data';

const buildFarcasterProIsEligibleForLimitedEditionNftFetcher =
  ({ apiClient, fid }: { apiClient: FarcasterApiClient; fid: number }) =>
  async () => {
    const response = await apiClient.farcasterProIsEligibleForLimitedEditionNft(
      {
        fid,
      },
    );
    return response.data.result.eligible;
  };

export { buildFarcasterProIsEligibleForLimitedEditionNftFetcher };
