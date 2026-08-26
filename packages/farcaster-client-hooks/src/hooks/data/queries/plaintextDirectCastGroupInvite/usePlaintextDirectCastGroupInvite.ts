import { useSuspenseQuery } from '@tanstack/react-query';
import type { FetchError } from 'farcaster-client-data';

import { useFarcasterApiClient } from '../../../../providers/FarcasterApiClientProvider';
import { buildPlaintextDirectCastGroupInviteFetcher } from './buildPlaintextDirectCastGroupInviteFetcher';
import { buildPlaintextDirectCastGroupInviteKey } from './buildPlaintextDirectCastGroupInviteKey';

const usePlaintextDirectCastGroupInvite = ({
  fid,
  conversationId,
  inviteCode,
}: {
  fid: number;
  conversationId?: string;
  inviteCode?: string;
}) => {
  const { apiClient } = useFarcasterApiClient();

  return useSuspenseQuery({
    queryKey: buildPlaintextDirectCastGroupInviteKey({
      fid,
      conversationId,
      inviteCode,
    }),

    queryFn: buildPlaintextDirectCastGroupInviteFetcher({
      apiClient,
      conversationId,
      inviteCode,
    }),

    // Prevent retrying on 400 errors
    retry: (failureCount, error: Error) => {
      if (error && 'status' in error && (error as FetchError).status === 400)
        return false;
      return failureCount < 3;
    },
  });
};

export { usePlaintextDirectCastGroupInvite };
