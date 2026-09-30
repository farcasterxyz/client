import { useInviteToChannel as useInviteToChannelMutation } from 'farcaster-client-hooks';
import { useCallback } from 'react';

import { useConfirmRestrictedModal } from '~/components/channels/ConfirmInviteRestrictedModal';
import { trackError } from '~/utils/errorUtils';
import { toast } from '~/utils/toast';

export const useInviteToChannel = ({
  channelKey,
  fid,
  username,
  restricted,
}: {
  channelKey: string;
  fid: number;
  username: string;
  restricted: boolean | undefined;
}) => {
  const inviteToChannelMutation = useInviteToChannelMutation();
  const inviteToChannel = useCallback(async () => {
    try {
      await inviteToChannelMutation({
        fid,
        channelKey,
      });

      toast({
        message: (
          <>
            Invite sent to <span className="font-semibold">{username}</span>
          </>
        ),
        type: 'success',
      });
    } catch (e) {
      trackError(new Error('Failed to invite user to channel', { cause: e }));
      toast({
        message: (
          <>
            Failed to invite <span className="font-semibold">{username}</span>
          </>
        ),
        type: 'error',
      });
    }
  }, [channelKey, fid, inviteToChannelMutation, username]);

  const confirmRestrictedModal = useConfirmRestrictedModal({
    onConfirm: inviteToChannel,
    username,
  });

  const wrappedInviteToChannel = useCallback(async () => {
    if (restricted) {
      confirmRestrictedModal.open();
      return;
    }

    void inviteToChannel();
  }, [confirmRestrictedModal, inviteToChannel, restricted]);

  return {
    inviteToChannel: wrappedInviteToChannel,
    Component: confirmRestrictedModal.Component,
  };
};
