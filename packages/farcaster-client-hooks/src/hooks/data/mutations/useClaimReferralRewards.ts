import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { ApiXPReward } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { buildXPClaimableSummaryKey } from '../queries/xpRewards/buildXPClaimableSummaryKey';
import { buildXPRewardsKey } from '../queries/xpRewards/buildXPRewardsKey';

export type ClaimXPRewardResult = {
  success: boolean;
  usdcAmount: number;
};

const useClaimReferralRewards = () => {
  const { apiClient } = useFarcasterApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.claimXPRewards();
    },
    onSuccess: () => {
      const claimableSummaryKey = buildXPClaimableSummaryKey();
      queryClient.setQueryData(claimableSummaryKey, (data) => {
        if (!data) {
          return data;
        }
        return {
          ...data,
          totalClaimableUsdc: 0,
          eligibleToClaim: false,
          ineligibleToClaimReason: 'insufficient-balance',
        };
      });
      const xpRewardsKey = buildXPRewardsKey();
      queryClient.setQueryData<
        InfiniteData<{
          items: ApiXPReward[];
        }>
      >(xpRewardsKey, (data) => {
        if (!data) {
          return data;
        }
        return {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.map((item) => {
              if (item.status === 'pending') {
                return {
                  ...item,
                  status: 'earned',
                };
              }
              return item;
            }),
          })),
        };
      });
    },
  });
};

export { useClaimReferralRewards };
