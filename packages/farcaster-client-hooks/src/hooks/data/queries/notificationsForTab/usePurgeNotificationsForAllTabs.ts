import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildNotificationsForTabKey } from './buildNotificationsForTabKey';

export const usePurgeNotificationsForAllTabs = () => {
  const queryClient = useQueryClient();

  return useCallback(
    () =>
      queryClient.removeQueries({
        queryKey: buildNotificationsForTabKey({}),
      }),
    [queryClient],
  );
};
