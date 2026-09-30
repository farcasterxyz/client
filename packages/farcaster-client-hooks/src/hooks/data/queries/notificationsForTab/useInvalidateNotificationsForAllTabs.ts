import { useQueryClient } from '@tanstack/react-query';

import { buildNotificationsForTabKey } from './buildNotificationsForTabKey';

export const useInvalidateNotificationsForAllTabs = () => {
  const queryClient = useQueryClient();

  return () =>
    queryClient.invalidateQueries({
      queryKey: buildNotificationsForTabKey({}),
    });
};
