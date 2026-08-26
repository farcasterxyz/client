import { useQueryClient } from '@tanstack/react-query';
import { ApiGetConnectedApp200Response } from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildConnectedAppKey } from './buildConnectedAppKey';

export const useOptimisticallyRemoveKey = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({
      appFid,
      publicKey,
      keyType,
    }: {
      appFid: number;
      publicKey: string;
      keyType: 'auth' | 'write';
    }) => {
      queryClient.setQueryData<ApiGetConnectedApp200Response['result']>(
        buildConnectedAppKey({ appFid }),
        (oldData) => {
          if (!oldData) {
            return;
          }

          return {
            ...oldData,
            connectedApp: {
              ...oldData.connectedApp,
              authKeys:
                keyType === 'auth'
                  ? oldData.connectedApp.authKeys.filter(
                      (key) => key.publicKey !== publicKey,
                    )
                  : oldData.connectedApp.authKeys,
              writeKeys:
                keyType === 'write'
                  ? oldData.connectedApp.writeKeys.filter(
                      (key) => key.publicKey !== publicKey,
                    )
                  : oldData.connectedApp.writeKeys,
            },
          };
        },
      );
    },
    [queryClient],
  );
};
