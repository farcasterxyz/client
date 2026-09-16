import { useCallback } from 'react';

import { UserUpdates } from '../../../types';
import { useMergeIntoGloballyCachedUser } from '../queries/globallyCachedUser/useMergeIntoGloballyCachedUser';

const useOptimisticallyUpdateUser = () => {
  const mergeIntoGloballyCachedUser = useMergeIntoGloballyCachedUser();

  return useCallback(
    ({
      revertUpdates,
      updates,
    }: {
      revertUpdates: UserUpdates;
      updates: UserUpdates;
    }) => {
      mergeIntoGloballyCachedUser({ updates });

      // Return revert function
      return () => {
        mergeIntoGloballyCachedUser({ updates: revertUpdates });
      };
    },
    [mergeIntoGloballyCachedUser],
  );
};

export { useOptimisticallyUpdateUser };
