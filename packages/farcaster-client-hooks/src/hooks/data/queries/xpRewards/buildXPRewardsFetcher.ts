import { type FarcasterApiClient } from 'farcaster-client-data';

import { wrapPaginatedFetcher } from '../../helpers';

export type XPRewardsFetcherParams = {
  limit: number;
};

export const buildXPRewardsFetcher = ({
  apiClient,
}: {
  apiClient: FarcasterApiClient;
}) =>
  wrapPaginatedFetcher(async ({ pageParam: cursor }) => {
    const response = await apiClient.getXPRewards({
      cursor,
      limit: 50,
    });

    const totalUsdc = response.data.result.totalUsdc;
    const totalReferrals = response.data.result.totalReferrals;

    return {
      items: response.data.result.rewards,
      next: response.data.next,
      totalUsdc,
      totalReferrals,
    };
  });
