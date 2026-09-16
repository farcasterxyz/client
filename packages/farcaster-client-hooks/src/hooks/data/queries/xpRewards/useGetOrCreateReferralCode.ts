import { useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildGetOrCreateReferralCodeFetcher } from './buildGetOrCreateReferralCodeFetcher';
import { buildGetOrCreateReferralCodeKey } from './buildGetOrCreateReferralCodeKey';

export type UseGetOrCreateReferralCodeResult = {
  code: string;
  id: string;
};

export const useGetOrCreateReferralCode = ({ fid }: { fid: number }) => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery<UseGetOrCreateReferralCodeResult>({
    queryKey: buildGetOrCreateReferralCodeKey({ fid }),
    queryFn: buildGetOrCreateReferralCodeFetcher({ apiClient }),
    refetchIntervalInBackground: true,
    refetchInterval: 60000,
  });
};

export const useNonSuspenseGetOrCreateReferralCode = ({
  fid,
}: {
  fid: number;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useQuery<UseGetOrCreateReferralCodeResult>({
    queryKey: buildGetOrCreateReferralCodeKey({ fid }),
    queryFn: buildGetOrCreateReferralCodeFetcher({ apiClient }),
  });
};
