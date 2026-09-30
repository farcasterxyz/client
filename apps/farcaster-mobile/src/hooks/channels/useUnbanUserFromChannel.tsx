import {
  resolveUsernameShort,
  useUnbanUserFromChannel as useUnbanUserFromChannelMutation,
} from 'farcaster-client-hooks';
import { ApiUser } from 'farcaster-cryptography';
import { useRootToast } from 'farcaster-expo';
import { useCallback } from 'react';

import { trackError } from '~/utils/ErrorUtils';

export const useUnbanUserFromChannel = () => {
  const unbanUserFromChannelMutation = useUnbanUserFromChannelMutation();
  const toast = useRootToast();

  return useCallback(
    async ({
      channelKey,
      user,
    }: {
      channelKey: string;
      user: Pick<ApiUser, 'fid' | 'username'>;
    }) => {
      const username = resolveUsernameShort(user);

      try {
        await unbanUserFromChannelMutation({
          channelKey,
          unbanFid: user.fid,
        });

        toast.show(`${username} was unbanned`, { type: 'generic' });
      } catch (e) {
        trackError(new Error('Failed to unban user', { cause: e }));
        toast.show('Failed to unban user', {
          placement: 'top',
          type: 'danger',
        });
      }
    },
    [unbanUserFromChannelMutation, toast],
  );
};
