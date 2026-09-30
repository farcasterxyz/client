import { useCallback } from 'react';

import { useFarcasterApiClient } from '../../../providers/FarcasterApiClientProvider';
import { useMergeIntoGloballyCachedUser } from '../queries/globallyCachedUser/useMergeIntoGloballyCachedUser';

const useUpdateUserLocation = () => {
  const { apiClient } = useFarcasterApiClient();
  const mergeIntoGloballyCachedUser = useMergeIntoGloballyCachedUser();

  return useCallback(
    async (location: { placeId: string; description: string }) => {
      const result = await apiClient.updateUserLocation({ location });

      mergeIntoGloballyCachedUser({ updates: result.data.result.user });

      return result;
    },
    [apiClient, mergeIntoGloballyCachedUser],
  );
};

export { useUpdateUserLocation };
