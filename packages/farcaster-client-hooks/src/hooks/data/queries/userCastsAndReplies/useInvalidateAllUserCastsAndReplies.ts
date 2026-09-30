import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildUserCastsAndRepliesKey } from './buildUserCastsAndRepliesKey';

const useInvalidateAllUserCastsAndReplies = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ fid }: { fid: number }) =>
      queryClient.invalidateQueries({
        queryKey: buildUserCastsAndRepliesKey({ fid }),
      }),
    [queryClient],
  );
};

export { useInvalidateAllUserCastsAndReplies };
