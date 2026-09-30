import { useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { useMergeIntoGloballyCachedUser } from '../globallyCachedUser/useMergeIntoGloballyCachedUser';
import { buildUserByUsernameFetcher } from './buildUserByUsernameFetcher';
import { buildUserByUsernameKey } from './buildUserByUsernameKey';

const useUserByUsername = ({ username }: { username: string }) => {
  const { apiClient } = useFarcasterApiClient();
  const mergeIntoGloballyCachedUser = useMergeIntoGloballyCachedUser();

  const result = useSuspenseQuery({
    queryKey: buildUserByUsernameKey({ username }),

    queryFn: buildUserByUsernameFetcher({
      apiClient,
      username,
      mergeIntoGloballyCachedUser,
    }),
  });

  return result;
};

const useNonSuspenseUserByUsername = ({
  username,
  throwOnError = false,
}: {
  username: string;
  throwOnError?: boolean;
}) => {
  const { apiClient } = useFarcasterApiClient();
  const mergeIntoGloballyCachedUser = useMergeIntoGloballyCachedUser();

  const result = useQuery({
    queryKey: buildUserByUsernameKey({ username }),

    queryFn: buildUserByUsernameFetcher({
      apiClient,
      username,
      mergeIntoGloballyCachedUser,
    }),
    throwOnError,
  });

  return result;
};

export { useNonSuspenseUserByUsername, useUserByUsername };
