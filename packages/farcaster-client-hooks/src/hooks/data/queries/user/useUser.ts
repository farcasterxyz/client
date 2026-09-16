import { useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useMergeIntoGloballyCachedUser } from '../globallyCachedUser/useMergeIntoGloballyCachedUser';
import { buildUserFetcher } from './buildUserFetcher';
import { buildUserKey } from './buildUserKey';

const useUser = ({
  fid,
  isCurrentUser = false,
}: {
  fid: number;
  isCurrentUser?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const mergeIntoGloballyCachedUser = useMergeIntoGloballyCachedUser();

  const result = useSuspenseQuery({
    queryKey: buildUserKey({ fid, isCurrentUser }),

    queryFn: buildUserFetcher({
      apiClient,
      fid,
      mergeIntoGloballyCachedUser,
    }),
  });

  return result;
};

export { useUser };
