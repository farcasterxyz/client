import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import type {
  ApiCastCollectibleAuctionBid,
  ApiGetCastCollectibleBidHistoryQueryParams,
} from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildCastCollectibleBidHistoryFetcher } from './buildCastCollectibleBidHistoryFetcher';
import { buildCastCollectibleBidHistoryKey } from './buildCastCollectibleBidHistoryKey';
import { castCollectibleBidHistoryDefaultQueryOptions } from './castCollectibleBidHistoryDefaultQueryOptions';

const useCastCollectibleBidHistory = (
  { castHash }: ApiGetCastCollectibleBidHistoryQueryParams,
  options?: Omit<
    UseQueryOptions<
      ApiCastCollectibleAuctionBid[] | undefined,
      unknown,
      ApiCastCollectibleAuctionBid[] | undefined,
      ReturnType<typeof buildCastCollectibleBidHistoryKey>
    >,
    'queryKey' | 'queryFn'
  >,
) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    ...castCollectibleBidHistoryDefaultQueryOptions,
    queryKey: buildCastCollectibleBidHistoryKey({
      castHash,
    }),
    queryFn: buildCastCollectibleBidHistoryFetcher({
      apiClient,
      params: {
        castHash,
      },
    }),
    ...options,
  });
};
export { useCastCollectibleBidHistory };
