import { useCallback } from 'react';

import { CastUpdates } from '../../../types';
import { useMergeIntoGloballyCachedCast } from '../queries/globallyCachedCast/useMergeIntoGloballyCachedCast';

const useOptimisticallyUpdateCast = () => {
  const mergeIntoGloballyCachedCast = useMergeIntoGloballyCachedCast();

  return useCallback(
    ({
      revertUpdates,
      updates,
    }: {
      revertUpdates: CastUpdates | undefined;
      updates: CastUpdates;
    }) => {
      mergeIntoGloballyCachedCast({ updates });

      // Return revert function
      return () => {
        if (revertUpdates) {
          mergeIntoGloballyCachedCast({ updates: revertUpdates });
        }
      };
    },
    [mergeIntoGloballyCachedCast],
  );
};

export { useOptimisticallyUpdateCast };
