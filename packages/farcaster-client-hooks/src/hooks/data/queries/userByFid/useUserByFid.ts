import { useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useMergeIntoGloballyCachedUser } from '../globallyCachedUser/useMergeIntoGloballyCachedUser';
import { buildUserByFidFetcher } from './buildUserByFidFetcher';
import { buildUserByFidKey } from './buildUserByFidKey';

const useUserByFid = ({ fid }: { fid: number }) => {
  const { apiClient } = useFarcasterApiClient();
  const mergeIntoGloballyCachedUser = useMergeIntoGloballyCachedUser();

  const result = useSuspenseQuery({
    queryKey: buildUserByFidKey({ fid }),

    queryFn: buildUserByFidFetcher({
      apiClient,
      fid,
      mergeIntoGloballyCachedUser,
    }),
  });

  return result;
};

const useNonSuspenseUserByFid = ({
  fid,
  enabled,
  throwOnError = false,
}: {
  fid: number;
  enabled?: boolean;
  throwOnError?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const mergeIntoGloballyCachedUser = useMergeIntoGloballyCachedUser();

  const result = useQuery({
    queryKey: buildUserByFidKey({ fid }),

    queryFn: buildUserByFidFetcher({
      apiClient,
      fid,
      mergeIntoGloballyCachedUser,
    }),
    enabled,
    throwOnError,
  });

  return result;
};

export { useNonSuspenseUserByFid, useUserByFid };
