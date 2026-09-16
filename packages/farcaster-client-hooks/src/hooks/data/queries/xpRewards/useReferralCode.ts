import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { type ApiUser } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildReferralCodeFetcher } from './buildReferralCodeFetcher';
import { buildReferralCodeKey } from './buildReferralCodeKey';

export type UseReferralCodeResult = {
  inviter: ApiUser;
  code: string | undefined;
};

export const useReferralCode = ({ code }: { code: string }) => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery<UseReferralCodeResult>({
    queryKey: buildReferralCodeKey({ code }),
    queryFn: buildReferralCodeFetcher({ apiClient, code }),
    refetchIntervalInBackground: true,
    refetchInterval: 60000,
  });
};

export const useNonSuspenseReferralCode = ({ code }: { code: string }) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery<UseReferralCodeResult>({
    queryKey: buildReferralCodeKey({ code }),
    queryFn: buildReferralCodeFetcher({ apiClient, code }),
  });
};
