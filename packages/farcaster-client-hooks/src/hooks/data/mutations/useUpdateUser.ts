import { ApiUpdateUserRequestBody } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useMergeIntoGloballyCachedUser } from '../queries/globallyCachedUser/useMergeIntoGloballyCachedUser';
import { useInvalidateUserByFid } from '../queries/userByFid/useInvalidateUserByFid';

const useUpdateUser = () => {
  const { apiClient } = useFarcasterApiClient();

  const mergeIntoGloballyCachedUser = useMergeIntoGloballyCachedUser();
  const invalidateUserByFid = useInvalidateUserByFid();

  return useCallback(
    async (params: ApiUpdateUserRequestBody) => {
      const result = await apiClient.updateUser(params);

      mergeIntoGloballyCachedUser({ updates: result.data.result.user });
      invalidateUserByFid({ fid: result.data.result.user.fid });

      return result;
    },
    [apiClient, invalidateUserByFid, mergeIntoGloballyCachedUser],
  );
};

export { useUpdateUser };
