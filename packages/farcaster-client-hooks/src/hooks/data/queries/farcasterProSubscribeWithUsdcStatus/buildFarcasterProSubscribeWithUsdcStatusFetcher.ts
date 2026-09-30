import { FarcasterApiClient } from 'farcaster-client-data';

const buildFarcasterProSubscribeWithUsdcStatusFetcher =
  ({
    workflowId,
    apiClient,
  }: {
    workflowId: string;
    apiClient: FarcasterApiClient;
  }) =>
  async () => {
    const response = await apiClient.farcasterProSubscribeWithUsdcStatus({
      workflowId,
    });

    return response.data.result;
  };

export { buildFarcasterProSubscribeWithUsdcStatusFetcher };
