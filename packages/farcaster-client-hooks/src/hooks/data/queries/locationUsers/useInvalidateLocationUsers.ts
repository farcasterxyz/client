import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildLocationUsersKey } from './buildLocationUsersKey';

const useInvalidateLocationUsers = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ placeId }: { placeId: string }) => {
      queryClient.invalidateQueries({
        queryKey: buildLocationUsersKey({ placeId }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateLocationUsers };
