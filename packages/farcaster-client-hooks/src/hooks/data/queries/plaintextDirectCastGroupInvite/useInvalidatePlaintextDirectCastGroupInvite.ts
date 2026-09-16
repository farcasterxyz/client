import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildPlaintextDirectCastGroupInviteKey } from './buildPlaintextDirectCastGroupInviteKey';

const useInvalidatePlaintextDirectCastGroupInvite = () => {
  const queryClient = useQueryClient();

  return useCallback(
    ({
      fid,
      conversationId,
      inviteCode,
    }: {
      fid: number;
      conversationId?: string;
      inviteCode?: string;
    }) => {
      queryClient.invalidateQueries({
        queryKey: buildPlaintextDirectCastGroupInviteKey({
          fid,
          conversationId,
          inviteCode,
        }),
      });
    },
    [queryClient],
  );
};

export { useInvalidatePlaintextDirectCastGroupInvite };
