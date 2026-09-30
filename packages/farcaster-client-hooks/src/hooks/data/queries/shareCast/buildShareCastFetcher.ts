import { ApiShareCastContext, FarcasterApiClient } from 'farcaster-client-data';

const buildShareCastFetcher =
  ({
    apiClient,
    castHash,
    context,
    maxTargets,
  }: {
    apiClient: FarcasterApiClient;
    castHash: string;
    context?: ApiShareCastContext;
    maxTargets?: number;
  }) =>
  async () => {
    const response = await apiClient.shareCast({
      castHash,
      context,
      maxTargets,
    });
    return response.data;
  };

export { buildShareCastFetcher };
