import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildPlaintextDirectCastReactionsKey } from './buildPlaintextDirectCastReactionsKey';

const useInvalidatePlaintextDirectCastReactions = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({
      fid,
      conversationId,
      messageId,
    }: {
      fid: number;
      conversationId: string;
      messageId: string;
    }) => {
      queryClient.invalidateQueries({
        queryKey: buildPlaintextDirectCastReactionsKey({
          fid,
          conversationId,
          messageId,
        }),
      });
    },
    [queryClient],
  );
};

export { useInvalidatePlaintextDirectCastReactions };
