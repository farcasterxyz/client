import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildConnectedAppKey } from './buildConnectedAppKey';

const useInvalidateConnectedApp = () => {
  const queryClient = useQueryClient();

  return useCallback(
    (params?: Parameters<typeof buildConnectedAppKey>[0]) => {
      if (params) {
        return queryClient.invalidateQueries({
          queryKey: buildConnectedAppKey(params),
        });
      }
      return queryClient.invalidateQueries({
        predicate: (query) => {
          return query.queryKey[0] === 'connectedApp';
        },
      });
    },
    [queryClient],
  );
};

export { useInvalidateConnectedApp };
