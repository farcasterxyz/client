import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildUserCastsAndRepliesKey } from './buildUserCastsAndRepliesKey';

const usePurgeUserCastsAndReplies = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ fid }: { fid: number }) =>
      queryClient.removeQueries({
        queryKey: buildUserCastsAndRepliesKey({ fid }),
      }),
    [queryClient],
  );
};

export { usePurgeUserCastsAndReplies };
