import { useMutation } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';

export type ClaimReferralV2Params = {
  code: string;
};

export type ClaimReferralV2Result = {
  success: boolean;
};

const useClaimReferralV2 = () => {
  const { apiClient } = useFarcasterApiClient();

  return useMutation({
    mutationFn: async ({ code }: ClaimReferralV2Params) => {
      await apiClient.claimReferralCode({
        code,
      });
    },
  });
};

export { useClaimReferralV2 };
