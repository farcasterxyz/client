import { useCallback, useMemo } from 'react';

import { useQueryWithRefreshOnMount } from '../../helpers';
import { buildLocationUsersKey } from './buildLocationUsersKey';
import { useInvalidateLocationUsers } from './useInvalidateLocationUsers';
import { useLocationUsers } from './useLocationUsers';

const useLocationUsersWithRefreshOnMount = ({
  placeId,
}: {
  placeId: string;
}) => {
  const initialValue = useLocationUsers({
    placeId,
  });

  const queryKey = useMemo(() => buildLocationUsersKey({ placeId }), [placeId]);

  const invalidateLocationUsers = useInvalidateLocationUsers();
  const invalidate = useCallback(() => {
    invalidateLocationUsers({ placeId });
  }, [invalidateLocationUsers, placeId]);

  return useQueryWithRefreshOnMount({
    initialValue,
    queryKey,
    invalidate,
  });
};

export { useLocationUsersWithRefreshOnMount };
