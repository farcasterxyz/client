import { useCallback } from 'react';

import { ChannelUpdates } from '../../../types';
import { useMergeIntoGloballyCachedChannel } from '../queries/globallyCachedChannel/useMergeIntoGloballyCachedChannel';

const useOptimisticallyUpdateChannel = () => {
  const mergeIntoGloballyCachedChannel = useMergeIntoGloballyCachedChannel();

  return useCallback(
    ({
      revertUpdates,
      updates,
    }: {
      revertUpdates: ChannelUpdates;
      updates: ChannelUpdates;
    }) => {
      mergeIntoGloballyCachedChannel({ updates });

      // Return revert function
      return () => {
        mergeIntoGloballyCachedChannel({ updates: revertUpdates });
      };
    },
    [mergeIntoGloballyCachedChannel],
  );
};

export { useOptimisticallyUpdateChannel };
