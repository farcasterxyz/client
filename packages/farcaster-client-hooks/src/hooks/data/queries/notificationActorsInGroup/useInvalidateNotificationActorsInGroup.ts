import { useQueryClient } from '@tanstack/react-query';
import { ApiNotificationType } from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildNotificationActorsInGroupKey } from './buildNotificationActorsInGroupKey';

const useInvalidateNotificationActorsInGroup = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ groupId, type }: { groupId: string; type: ApiNotificationType }) => {
      queryClient.invalidateQueries({
        queryKey: buildNotificationActorsInGroupKey({ groupId, type }),
      });
    },
    [queryClient],
  );
};

export { useInvalidateNotificationActorsInGroup };
