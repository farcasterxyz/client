import {
  renderChannelKey,
  resolveUsernameShort,
  useBanUserFromChannel as useBanUserFromChannelMutation,
} from 'farcaster-client-hooks';
import { ApiUser } from 'farcaster-cryptography';
import { useRootToast } from 'farcaster-expo';
import React, { useCallback, useMemo } from 'react';

import { BottomSheetModal } from '~/components/BottomSheet';
import {
  ConfirmActionBottomSheet,
  ConfirmBottomSheetProps,
  useConfirmBottomSheet,
} from '~/components/ConfirmActionBottomSheet';
import { PersonXIcon } from '~/components/icons/PersonXIcon';
import { Text2 } from '~/components/Text';
import { trackError } from '~/utils/ErrorUtils';

export const useBanUserFromChannel = () => {
  const toast = useRootToast();
  const banUserFromChannelMutation = useBanUserFromChannelMutation();

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
        await banUserFromChannelMutation({
          channelKey,
          banFid: user.fid,
        });

        toast.show(
          <Text2 style={{ color: 'white' }}>
            <Text2 weight="semibold" style={{ color: 'white' }}>
              {username}
            </Text2>{' '}
            was banned
          </Text2>,
          { type: 'success' },
        );
      } catch (e) {
        trackError(new Error('Failed to ban user from channel', { cause: e }));
        toast.show(
          <Text2 style={{ color: 'white' }}>
            Failed to ban{' '}
            <Text2 weight="semibold" style={{ color: 'white' }}>
              {username}
            </Text2>{' '}
          </Text2>,
          { type: 'error' },
        );
      }
    },
    [banUserFromChannelMutation, toast],
  );
};

export const useConfirmBanUserBottomSheetModal = ({
  channelKey,
  user,
}: {
  channelKey: string;
  user: Pick<ApiUser, 'fid' | 'username'>;
}) => {
  const toast = useRootToast();
  const banUserFromChannelMutation = useBanUserFromChannelMutation();

  const username = resolveUsernameShort(user);

  const banFromChannel = useCallback(async () => {
    try {
      await banUserFromChannelMutation({
        channelKey,
        banFid: user.fid,
      });

      toast.show(
        <Text2 style={{ color: 'white' }}>
          <Text2 weight="semibold" style={{ color: 'white' }}>
            {username}
          </Text2>{' '}
          was banned
        </Text2>,
        { type: 'success' },
      );
    } catch (e) {
      trackError(new Error('Failed to ban user from channel', { cause: e }));
      toast.show(
        <Text2 style={{ color: 'white' }}>
          Failed to ban{' '}
          <Text2 weight="semibold" style={{ color: 'white' }}>
            {username}
          </Text2>{' '}
        </Text2>,
        { type: 'error' },
      );
    }
  }, [banUserFromChannelMutation, channelKey, toast, user.fid, username]);

  const confirmBanBottomSheet = useConfirmBottomSheet({
    onConfirm: banFromChannel,
  });

  const Component = useMemo(() => {
    return (
      <BottomSheetModal
        name="confirmBanUserFromChannel"
        ref={confirmBanBottomSheet.modalRef}
      >
        <ConfirmBanUserFromChannelBottomSheet
          username={username}
          channelKey={channelKey}
          {...confirmBanBottomSheet.props}
        />
      </BottomSheetModal>
    );
  }, [
    channelKey,
    confirmBanBottomSheet.modalRef,
    confirmBanBottomSheet.props,
    username,
  ]);

  return {
    open: confirmBanBottomSheet.open,
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
