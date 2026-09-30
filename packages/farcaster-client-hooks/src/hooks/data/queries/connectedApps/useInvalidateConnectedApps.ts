import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildConnectedAppsKey } from './buildConnectedAppsKey';

const useInvalidateConnectedApps = () => {
  const queryClient = useQueryClient();

  return useCallback(
    (params?: Parameters<typeof buildConnectedAppsKey>[0]) => {
      if (params) {
        return queryClient.invalidateQueries({
          queryKey: buildConnectedAppsKey(params),
        });
      }
      return queryClient.invalidateQueries({
        predicate: (query) => {
          return query.queryKey[0] === 'connectedApps';
        },
      });
    },
    [queryClient],
  );
};

export { useInvalidateConnectedApps };
