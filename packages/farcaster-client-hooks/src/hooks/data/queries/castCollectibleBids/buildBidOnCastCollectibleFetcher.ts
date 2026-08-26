import { FarcasterApiClient } from 'farcaster-client-data';

const buildBidOnCastCollectibleFetcher =
  ({
    apiClient,
    castHash,
    bidderAddress,
    bidAmount,
    permit,
  }: {
    apiClient: FarcasterApiClient;
    castHash: string;
    bidderAddress: string;
    bidAmount: string;
    permit: {
      signature: string;
      deadline: number;
    };
  }) =>
  async () => {
    const response = await apiClient.bidOnCastCollectible({
      castHash,
      bidderAddress,
      bidAmount,
      permit,
    });

    return response.data.result.transaction;
  };

export { buildBidOnCastCollectibleFetcher };
