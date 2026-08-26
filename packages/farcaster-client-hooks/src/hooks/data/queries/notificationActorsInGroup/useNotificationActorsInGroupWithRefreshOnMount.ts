import { ApiNotificationType } from 'farcaster-client-data';
import { useCallback, useMemo } from 'react';

import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildNotificationActorsInGroupKey } from './buildNotificationActorsInGroupKey';
import { useInvalidateNotificationActorsInGroup } from './useInvalidateNotificationActorsInGroup';
import { useNotificationActorsInGroup } from './useNotificationActorsInGroup';

const useNotificationActorsInGroupWithRefreshOnMount = ({
  groupId,
  type,
}: {
  groupId: string;
  type: ApiNotificationType;
}) => {
  const initialValue = useNotificationActorsInGroup({
    groupId,
    type,
  });

  const queryKey = useMemo(
    () => buildNotificationActorsInGroupKey({ groupId, type }),
    [groupId, type],
  );

  const invalidateNotificationsInGroup =
    useInvalidateNotificationActorsInGroup();
  const invalidate = useCallback(() => {
    invalidateNotificationsInGroup({ groupId, type });
  }, [groupId, invalidateNotificationsInGroup, type]);

  return useQueryWithRefreshOnMount({
    initialValue,
    queryKey,
    invalidate,
  });
};

export { useNotificationActorsInGroupWithRefreshOnMount };
