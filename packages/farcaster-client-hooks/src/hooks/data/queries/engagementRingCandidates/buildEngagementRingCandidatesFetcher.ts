import { FarcasterApiClient } from 'farcaster-client-data';

const buildEngagementRingCandidatesFetcher =
  ({ apiClient, fid }: { apiClient: FarcasterApiClient; fid: number }) =>
  async () => {
    const response = await apiClient.getEngagementRingCandidates({
      fid,
    });

    return response.data;
  };

export { buildEngagementRingCandidatesFetcher };
