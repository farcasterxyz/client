import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { type ApiUser } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildReferralCodeJoinFetcher } from './buildReferralCodeJoinFetcher';
import { buildReferralCodeJoinKey } from './buildReferralCodeJoinKey';

export type UseReferralCodeJoinResult = {
  inviter: ApiUser;
  currentlyJoinedCreator?: ApiUser;
  code: string | undefined;
};

export const useReferralCodeJoin = ({ code }: { code: string }) => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery<UseReferralCodeJoinResult>({
    queryKey: buildReferralCodeJoinKey({ code }),
    queryFn: buildReferralCodeJoinFetcher({ apiClient, code }),
    refetchIntervalInBackground: true,
    refetchInterval: 60000,
  });
};

export const useNonSuspenseReferralCodeJoin = ({ code }: { code: string }) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery<UseReferralCodeJoinResult>({
    queryKey: buildReferralCodeJoinKey({ code }),
    queryFn: buildReferralCodeJoinFetcher({ apiClient, code }),
  });
};
