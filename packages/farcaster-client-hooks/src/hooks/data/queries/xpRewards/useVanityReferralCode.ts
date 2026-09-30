import { useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildVanityReferralCodeFetcher } from './buildVanityReferralCodeFetcher';
import { buildVanityReferralCodeKey } from './buildVanityReferralCodeKey';

export const useVanityReferralCode = ({ username }: { username: string }) => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildVanityReferralCodeKey({ username }),
    queryFn: buildVanityReferralCodeFetcher({ apiClient, username }),
    refetchIntervalInBackground: true,
    refetchInterval: 60000,
  });
};

export const useNonSuspenseVanityReferralCode = ({
  username,
}: {
  username: string;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery({
    queryKey: buildVanityReferralCodeKey({ username }),
    queryFn: buildVanityReferralCodeFetcher({ apiClient, username }),
  });
};
