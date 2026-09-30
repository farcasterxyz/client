import { useQueryClient } from '@tanstack/react-query';
import {
  ApiDirectCastConversationFilter,
  ApiDirectCastConversationViewCategory,
} from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildDirectCastInboxByAccountKey } from './buildDirectCastInboxByAccountKey';

const useInvalidateDirectCastInboxByAccount = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({
      fid,
      category,
      filter,
    }: {
      fid: number;
      category: ApiDirectCastConversationViewCategory;
      filter?: ApiDirectCastConversationFilter;
    }) => {
      queryClient.invalidateQueries(
        {
          queryKey: buildDirectCastInboxByAccountKey({
            fid,
            category,
            filter,
          }),

          refetchType: 'all',
        },
        { cancelRefetch: false },
      );
    },
    [queryClient],
  );
};

export { useInvalidateDirectCastInboxByAccount };
