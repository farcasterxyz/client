import { ApiNotificationType } from 'farcaster-client-data';
import { useCallback, useMemo } from 'react';

import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildNotificationsInGroupKey } from './buildNotificationsInGroupKey';
import { useInvalidateNotificationsInGroup } from './useInvalidateNotificationsInGroup';
import { useNotificationsInGroup } from './useNotificationsInGroup';

const useNotificationsInGroupWithRefreshOnMount = ({
  groupId,
  type,
}: {
  groupId: string;
  type: ApiNotificationType;
}) => {
  const initialValue = useNotificationsInGroup({
    groupId,
    type,
  });

  const queryKey = useMemo(
    () => buildNotificationsInGroupKey({ groupId, type }),
    [groupId, type],
  );

  const invalidateNotificationsInGroup = useInvalidateNotificationsInGroup();
  const invalidate = useCallback(() => {
    invalidateNotificationsInGroup({ groupId, type });
  }, [groupId, invalidateNotificationsInGroup, type]);

  return useQueryWithRefreshOnMount({
    initialValue,
    queryKey,
    invalidate,
  });
};

export { useNotificationsInGroupWithRefreshOnMount };
