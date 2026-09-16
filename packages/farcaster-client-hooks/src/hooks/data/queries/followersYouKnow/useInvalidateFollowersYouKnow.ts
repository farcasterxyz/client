import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildFollowersYouKnowKey } from './buildFollowersYouKnowKey';

const useInvalidateFollowersYouKnow = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ fid, limit }: { fid: number; limit: number }) => {
      queryClient.invalidateQueries({
        queryKey: buildFollowersYouKnowKey({ fid, limit }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateFollowersYouKnow };
