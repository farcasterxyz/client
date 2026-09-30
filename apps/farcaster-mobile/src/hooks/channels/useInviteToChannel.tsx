import { useInviteToChannel as useInviteToChannelMutation } from 'farcaster-client-hooks';
import { useRootToast } from 'farcaster-expo';
import React, { useCallback } from 'react';

import { Text2 } from '~/components/Text';
import { trackError } from '~/utils/ErrorUtils';

export const useInviteToChannel = () => {
  const toast = useRootToast();
  const inviteToChannelMutation = useInviteToChannelMutation();

  return useCallback(
    async ({
      channelKey,
      fid,
      username,
    }: {
      channelKey: string;
      fid: number;
      username: string;
    }) => {
      try {
        await inviteToChannelMutation({
          channelKey,
          fid,
        });

        toast.show(
          <Text2 style={{ color: 'white' }}>
            Invite sent to{' '}
            <Text2 weight="semibold" style={{ color: 'white' }}>
              {username}
            </Text2>
          </Text2>,
          {},
        );
      } catch (e) {
        trackError(new Error('Failed to invite user to channel', { cause: e }));
        toast.show('Failed to invite user', {
          placement: 'top',
          type: 'danger',
        });
      }
    },
    [inviteToChannelMutation, toast],
  );
};
