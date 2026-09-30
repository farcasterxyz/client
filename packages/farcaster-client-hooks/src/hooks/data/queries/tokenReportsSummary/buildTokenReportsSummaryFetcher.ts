import { ApiChain, FarcasterApiClient } from 'farcaster-client-data';

const buildTokenReportsSummaryFetcher =
  ({
    apiClient,
    chain,
    ca,
  }: {
    apiClient: FarcasterApiClient;
    chain: ApiChain;
    ca: string;
  }) =>
  async () => {
    const response = await apiClient.getTokenReportsSummary({
      chain,
      ca,
    });
    return response.data;
  };

export { buildTokenReportsSummaryFetcher };
