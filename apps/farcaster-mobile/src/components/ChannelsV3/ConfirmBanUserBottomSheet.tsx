import { renderChannelKey, resolveUsername } from 'farcaster-client-hooks';
import { ApiUser } from 'farcaster-cryptography';
import React, { useCallback, useMemo, useState } from 'react';

import { BottomSheetModal } from '~/components/BottomSheet';
import {
  ConfirmActionBottomSheet,
  ConfirmBottomSheetProps,
  useConfirmBottomSheet,
} from '~/components/ConfirmActionBottomSheet';
import { PersonXIcon } from '~/components/icons/PersonXIcon';
import { Text2 } from '~/components/Text';
import { useBanUserFromChannel } from '~/hooks/channels/useBanUserFromChannel';

export const useConfirmBanUserBottomSheetModal = ({
  channelKey,
  user,
}: {
  channelKey: string;
  user: Pick<ApiUser, 'fid' | 'username'>;
}) => {
  const [handleDismiss, setHandleDismiss] = useState<
    (() => void) | undefined
  >();

  const banUserFromChannel = useBanUserFromChannel();
  const wrappedBanUserFromChannel = useCallback(
    () =>
      banUserFromChannel({
        channelKey,
        user,
      }),
    [banUserFromChannel, channelKey, user],
  );

  const confirmBottomSheet = useConfirmBottomSheet({
    onConfirm: wrappedBanUserFromChannel,
  });

  const username = resolveUsername(user);
  const Component = useMemo(() => {
    return (
      <BottomSheetModal
        name="confirmBanUserFromChannel"
        ref={confirmBottomSheet.modalRef}
        onDismiss={handleDismiss}
      >
        <ConfirmBanUserFromChannelBottomSheet
          username={username}
          channelKey={channelKey}
          {...confirmBottomSheet.props}
        />
      </BottomSheetModal>
    );
  }, [
    channelKey,
    confirmBottomSheet.modalRef,
    confirmBottomSheet.props,
    handleDismiss,
    username,
  ]);

  return {
    open: ({ onDismiss }: { onDismiss?: () => void }) => {
      setHandleDismiss(() => onDismiss);
      confirmBottomSheet.open();
    },
    Component,
  };
};

function ConfirmBanUserFromChannelBottomSheet({
  username,
  channelKey,
  ...rest
}: ConfirmBottomSheetProps<{ username: string; channelKey: string }>) {
  return (
    <ConfirmActionBottomSheet
      Icon={PersonXIcon}
      Body={
        <>
          <Text2>
            <Text2 weight="semibold">{username}</Text2> will be unable to reply
            to casts in{' '}
            <Text2 weight="semibold">{renderChannelKey(channelKey)}</Text2>
          </Text2>
        </>
      }
      title="Ban from channel"
      confirmText="Ban"
      destructive
      {...rest}
    />
  );
}
