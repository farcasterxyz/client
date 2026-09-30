import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildActiveChannelStreakKey } from './buildActiveChannelStreakKey';

const useInvalidateActiveChannelStreak = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ fid }: { fid: number }) => {
      queryClient.invalidateQueries({
        queryKey: buildActiveChannelStreakKey({ fid }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateActiveChannelStreak };
