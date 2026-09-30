import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import { ApiGetDirectCastInbox200Response } from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildDirectCastInboxByAccountKey } from '../queries/directCastInbox/buildDirectCastInboxByAccountKey';

const useOptimisticallyMarkRequestsAsRead = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({ fid }: { fid: number }) => {
      queryClient.setQueryData(
        buildDirectCastInboxByAccountKey({
          fid,
          category: 'default',
        }),
        (
          prev: InfiniteData<ApiGetDirectCastInbox200Response> | undefined,
        ): InfiniteData<ApiGetDirectCastInbox200Response> | undefined => {
          if (!prev || prev.pages.length === 0) return prev;

          const lastPage = prev.pages[prev.pages.length - 1];
          return {
            ...prev,
            pages: [
              ...prev.pages.slice(0, -1),
              {
                ...lastPage,
                result: {
                  ...lastPage.result,
                  hasUnreadRequests: false,
                },
              },
            ],
          } as InfiniteData<ApiGetDirectCastInbox200Response>;
        },
      );
    },
    [queryClient],
  );
};

export { useOptimisticallyMarkRequestsAsRead };
