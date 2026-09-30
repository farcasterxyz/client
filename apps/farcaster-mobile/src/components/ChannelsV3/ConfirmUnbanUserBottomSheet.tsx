import { ApiUser } from 'farcaster-client-data';
import { resolveUsername } from 'farcaster-client-hooks';
import React, { useCallback, useMemo } from 'react';

import { BottomSheetModal } from '~/components/BottomSheet';
import {
  ConfirmActionBottomSheet,
  ConfirmBottomSheetProps,
  useConfirmBottomSheet,
} from '~/components/ConfirmActionBottomSheet';
import { PersonXIcon } from '~/components/icons/PersonXIcon';
import { Text2 } from '~/components/Text';
import { useUnbanUserFromChannel } from '~/hooks/channels/useUnbanUserFromChannel';

export const useConfirmUnbanUserBottomSheetModal = ({
  channelKey,
  user,
  onConfirm,
}: {
  channelKey: string;
  user: Pick<ApiUser, 'fid' | 'username'>;
  onConfirm?: () => void;
}) => {
  const unbanUserFromChannel = useUnbanUserFromChannel();
  const wrappedUnbanUserFromChannel = useCallback(async () => {
    onConfirm?.();
    return await unbanUserFromChannel({
      channelKey,
      user,
    });
  }, [onConfirm, unbanUserFromChannel, channelKey, user]);

  const confirmBottomSheet = useConfirmBottomSheet({
    onConfirm: wrappedUnbanUserFromChannel,
  });

  const username = resolveUsername(user);
  const Component = useMemo(() => {
    return (
      <BottomSheetModal
        name="confirmBanUserFromChannel"
        ref={confirmBottomSheet.modalRef}
      >
        <ConfirmUnbanUserFromChannelBottomSheet
          username={username}
          {...confirmBottomSheet.props}
        />
      </BottomSheetModal>
    );
  }, [confirmBottomSheet.modalRef, confirmBottomSheet.props, username]);

  return {
    open: confirmBottomSheet.open,
    Component,
  };
};

function ConfirmUnbanUserFromChannelBottomSheet({
  username,
  ...rest
}: ConfirmBottomSheetProps<{ username: string }>) {
  return (
    <ConfirmActionBottomSheet
      Icon={PersonXIcon}
      Body={
        <Text2>
          <Text2 weight="semibold">{username}</Text2> will be able to reply to
          casts and all existing replies will be unhidden
        </Text2>
      }
      title="Unban from channel"
      confirmText="Unban"
      {...rest}
    />
  );
}
