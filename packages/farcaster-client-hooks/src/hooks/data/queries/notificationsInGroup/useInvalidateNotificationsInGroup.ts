import { useQueryClient } from '@tanstack/react-query';
import { ApiNotificationType } from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildNotificationsInGroupKey } from './buildNotificationsInGroupKey';

const useInvalidateNotificationsInGroup = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ groupId, type }: { groupId: string; type: ApiNotificationType }) => {
      queryClient.invalidateQueries({
        queryKey: buildNotificationsInGroupKey({ groupId, type }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateNotificationsInGroup };
