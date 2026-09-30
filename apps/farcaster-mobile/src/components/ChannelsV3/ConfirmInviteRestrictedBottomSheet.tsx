import { Octicons } from '@expo/vector-icons';
import { ApiUser } from 'farcaster-client-data';
import { resolveUsernameShort } from 'farcaster-client-hooks';
import React, { useCallback, useMemo } from 'react';

import { BottomSheetModal } from '~/components/BottomSheet';
import {
  ConfirmActionBottomSheet,
  ConfirmBottomSheetProps,
  useConfirmBottomSheet,
} from '~/components/ConfirmActionBottomSheet';
import { Text2 } from '~/components/Text';
import { useInviteToChannel } from '~/hooks/channels/useInviteToChannel';

export const useConfirmInviteRestrictedBottomSheetModal = ({
  channelKey,
  user,
  restricted,
}: {
  channelKey: string;
  user: Pick<ApiUser, 'fid' | 'username'>;
  restricted?: boolean;
}) => {
  const inviteToChannel = useInviteToChannel();

  const username = resolveUsernameShort(user);

  const wrappedInviteToChannel = useCallback(
    () =>
      inviteToChannel({
        channelKey,
        username,
        fid: user.fid,
      }),
    [inviteToChannel, channelKey, username, user.fid],
  );

  const confirmBottomSheet = useConfirmBottomSheet({
    onConfirm: wrappedInviteToChannel,
  });

  const Component = useMemo(() => {
    return (
      <BottomSheetModal
        name="confirmBanUserFromChannel"
        ref={confirmBottomSheet.modalRef}
      >
        <ConfirmInviteRestrictedBottomSheet
          username={username}
          {...confirmBottomSheet.props}
        />
      </BottomSheetModal>
    );
  }, [confirmBottomSheet.modalRef, confirmBottomSheet.props, username]);

  const inviteOrOpen = useCallback(() => {
    if (restricted) {
      confirmBottomSheet.open();
      return;
    }

    return wrappedInviteToChannel();
  }, [confirmBottomSheet, restricted, wrappedInviteToChannel]);

  return {
    inviteOrOpen,
    Component,
  };
};

function ConfirmInviteRestrictedBottomSheet({
  username,
  ...rest
}: ConfirmBottomSheetProps<{ username: string }>) {
  return (
    <ConfirmActionBottomSheet
      Icon={({ color, size }) => (
        <Octicons name="alert" size={size} color={color} />
      )}
      title="Previously removed"
      Body={
        <Text2>
          <Text2 weight="semibold">{username} </Text2>
          was previously removed from this channel. Are you sure you want to add
          them back?
        </Text2>
      }
      destructive
      {...rest}
    />
  );
}
