import type {
  ApiGetReferralsQueryParams,
  FarcasterApiClient,
} from 'farcaster-client-data';

import { wrapPaginatedFetcher } from '../../..';

export function buildReferralsFetcher({
  apiClient,
  params,
}: {
  apiClient: FarcasterApiClient;
  params: ApiGetReferralsQueryParams;
}) {
  return wrapPaginatedFetcher(
    async ({ pageParam }: { pageParam?: string | undefined }) => {
      const response = await apiClient.getReferrals({
        ...params,
        cursor: pageParam,
      });

      return {
        items: response.data.result.referrals,
        next: response.data.next,
      };
    },
  );
}
