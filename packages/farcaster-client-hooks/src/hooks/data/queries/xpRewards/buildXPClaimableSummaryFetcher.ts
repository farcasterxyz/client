import { FarcasterApiClient } from 'farcaster-client-data';

export const buildXPClaimableSummaryFetcher = ({
  apiClient,
}: {
  apiClient: FarcasterApiClient;
}) => {
  return async () => {
    const response = await apiClient.xpClaimableSummary();
    return response.data.result;
  };
};
