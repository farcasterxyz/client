import { useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildIsInReferralCodePromoFetcher } from './buildIsInReferralCodePromoFetcher';
import { buildIsInReferralCodePromoKey } from './buildIsInReferralCodePromoKey';

export type UseIsInReferralCodePromoResult = {
  isInReferralCodePromo: boolean;
};

export const useIsInReferralCodePromo = () => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery<UseIsInReferralCodePromoResult>({
    queryKey: buildIsInReferralCodePromoKey(),
    queryFn: buildIsInReferralCodePromoFetcher({ apiClient }),
    refetchIntervalInBackground: true,
    refetchInterval: 60000,
  });
};

export const useNonSuspenseIsInReferralCodePromo = () => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery<UseIsInReferralCodePromoResult>({
    queryKey: buildIsInReferralCodePromoKey(),
    queryFn: buildIsInReferralCodePromoFetcher({ apiClient }),
  });
};
