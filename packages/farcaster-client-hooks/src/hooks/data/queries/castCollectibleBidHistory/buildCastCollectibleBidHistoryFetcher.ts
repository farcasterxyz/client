import {
  ApiGetCastCollectibleBidHistoryQueryParams,
  FarcasterApiClient,
} from 'farcaster-client-data';

const buildCastCollectibleBidHistoryFetcher =
  ({
    apiClient,
    params,
  }: {
    apiClient: FarcasterApiClient;
    params: ApiGetCastCollectibleBidHistoryQueryParams;
  }) =>
  async () => {
    const response = await apiClient.getCastCollectibleBidHistory(params);

    return response.data.result.bids;
  };

export { buildCastCollectibleBidHistoryFetcher };
