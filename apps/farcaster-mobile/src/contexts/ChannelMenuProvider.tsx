import { Octicons } from '@expo/vector-icons';
import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import { ApiChannel } from 'farcaster-client-data';
import {
  useAddFavoriteFeed,
  useDisableChannelNotifications,
  useEnableChannelNotifications,
  useGloballyCachedChannel,
  useRemoveChannelMember,
  useRemoveChannelModerator,
  useRemoveFavoriteFeed,
} from 'farcaster-client-hooks';
import { useRootToast } from 'farcaster-expo';
import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

import {
  BottomSheetContentContainer,
  BottomSheetModal,
  useBottomSheetModalRef,
} from '~/components/BottomSheet';
import { ButtonGroup, ButtonGroupOption } from '~/components/ButtonGroup';
import { ConfirmActionBottomSheet } from '~/components/ConfirmActionBottomSheet';
import { BellCheckFillIcon } from '~/components/icons/BellCheckFillIcon';
import { ShieldStarFillIcon } from '~/components/icons/ShieldStarFillIcon';
import { ShieldSlashIcon } from '~/components/images/ShieldSlashIcon';
import { RemoteImage } from '~/components/RemoteImage';
import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { usePush } from '~/hooks/navigation/usePush';
import { useFollowChannel } from '~/hooks/useFollowChannel';
import { useShareChannel } from '~/hooks/useShareChannel';
import { useUserChannelRole } from '~/hooks/useUserChannelRole';
import { trackError } from '~/utils/ErrorUtils';

export type ChannelMenuContextValue = {
  openMenu: (menuType: MenuType) => void;
};

const ChannelMenuContext = React.createContext<ChannelMenuContextValue>({
  openMenu: () => {
    throw new Error('Must be called in ChannelMenuContext provider');
  },
});

type ChannelMenuProviderProps = {
  channel: ApiChannel;
  children: React.ReactNode;
};

export const useChannelMenu = () => React.useContext(ChannelMenuContext);

export const ChannelMenuProvider: React.FC<ChannelMenuProviderProps> =
  React.memo(({ channel: propsChannel, children }) => {
    const [menuType, setMenuType] = useState<MenuType>('full');

    const channel = useGloballyCachedChannel({ fallback: propsChannel });
    const toast = useRootToast();
    const { dismissAll } = useBottomSheetModal();

    const menuModalRef = useBottomSheetModalRef();
    const confirmLeaveChannelModalRef = useBottomSheetModalRef();
    const confirmRemoveModeratorModalRef = useBottomSheetModalRef();

    const currentUser = useCurrentUser_UNSAFE();
    const removeChannelModerator = useRemoveChannelModerator();
    const removeChannelMember = useRemoveChannelMember();

    const removeMember = useCallback(async () => {
      try {
        dismissAll();

        await removeChannelMember({
          channelKey: channel.key,
          removeFid: currentUser.fid,
          actorFid: currentUser.fid,
        });
      } catch (e) {
        trackError(new Error('Failed to remove member', { cause: e }));
        toast.show('Failed to remove member', {
          placement: 'top',
          type: 'danger',
        });
      }
    }, [dismissAll, removeChannelMember, channel.key, currentUser.fid, toast]);

    const removeModerator = useCallback(async () => {
      try {
        dismissAll();

        await removeChannelModerator({
          channelKey: channel.key,
          fid: currentUser.fid,
          actorFid: currentUser.fid,
        });
      } catch (e) {
        trackError(new Error('Failed to remove moderator', { cause: e }));
        toast.show('Failed to remove moderator', {
          placement: 'top',
          type: 'danger',
        });
      }
    }, [
      dismissAll,
      removeChannelModerator,
      channel.key,
      currentUser.fid,
      toast,
    ]);

    const openMenu = useCallback(
      (menuType: MenuType) => {
        setMenuType(menuType);
        menuModalRef.current?.present();
      },
      [menuModalRef],
    );

    const confirmLeaveChannel = useCallback(async () => {
      confirmLeaveChannelModalRef.current?.present();
    }, [confirmLeaveChannelModalRef]);

    const confirmRemoveModerator = useCallback(async () => {
      confirmRemoveModeratorModalRef.current?.present();
    }, [confirmRemoveModeratorModalRef]);

    const contextValue = useMemo(
      () => ({
        openMenu,
      }),
      [openMenu],
    );

    return (
      <ChannelMenuContext.Provider value={contextValue}>
        {children}

        <BottomSheetModal name="channelMenu" ref={menuModalRef}>
          <ChannelMenuBottomSheet
            channel={channel}
            menuType={menuType}
            dismiss={() => menuModalRef.current?.dismiss()}
            confirmLeaveChannel={confirmLeaveChannel}
            confirmRemoveModerator={confirmRemoveModerator}
          />
        </BottomSheetModal>
        <BottomSheetModal
          name="confirmLeaveChannel"
          ref={confirmLeaveChannelModalRef}
        >
          <ConfirmLeaveChannelBottomSheet
            onCancel={() => confirmLeaveChannelModalRef.current?.dismiss()}
            onConfirm={removeMember}
          />
        </BottomSheetModal>
        <BottomSheetModal
          name="confirmRemoveModerator"
          ref={confirmRemoveModeratorModalRef}
        >
          <ConfirmRemoveModeratorBottomSheet
            onCancel={() => confirmRemoveModeratorModalRef.current?.dismiss()}
            onConfirm={removeModerator}
          />
        </BottomSheetModal>
      </ChannelMenuContext.Provider>
    );
  });

export type MenuType = 'full' | 'relation';

export function ChannelMenuBottomSheet({
  channel,
  menuType,
  dismiss,
  confirmLeaveChannel,
  confirmRemoveModerator,
}: {
  channel: ApiChannel;
  menuType: MenuType;
  dismiss: () => void;
  confirmLeaveChannel: () => void;
  confirmRemoveModerator: () => void;
}) {
  const { fid } = useCurrentUser_UNSAFE();

  const t = useTheme();

  const push = usePush();
  const enablePushNotifications = useEnableChannelNotifications();
  const disablePushNotifications = useDisableChannelNotifications();
  const addFavoriteFeed = useAddFavoriteFeed();
  const removeFavoriteFeed = useRemoveFavoriteFeed();

  const { isFollowing, toggleFollowing } = useFollowChannel(
    channel,
    'channel bottom sheet menu',
  );
  const channelRole = useUserChannelRole(channel);
  const isOwner = channelRole === 'owner';
  const isMod = channelRole === 'moderator';
  const isMember = channelRole !== null;
  const favorited = (channel.viewerContext.favoritePosition ?? -1) > 0;
  const notifications = channel.viewerContext.enableNotifications;

  const favorite = useCallback(async () => {
    await addFavoriteFeed({ feedKey: channel.key, channel, fid });
  }, [addFavoriteFeed, channel, fid]);

  const unfavorite = useCallback(async () => {
    await removeFavoriteFeed({
      feedKey: channel.key,
      favoritePosition: channel.viewerContext.favoritePosition ?? -1,
      channel,
      fid,
    });
  }, [channel, fid, removeFavoriteFeed]);

  const notify = useCallback(async () => {
    await enablePushNotifications({ channelKey: channel.key });
  }, [enablePushNotifications, channel.key]);

  const doNotNofity = useCallback(async () => {
    disablePushNotifications({ channelKey: channel.key });
  }, [disablePushNotifications, channel.key]);

  const share = useShareChannel({
    channelKey: channel.key,
    location: 'channel bottom sheet menu',
  });

  const manageChannel = useCallback(() => {
    push('ChannelManage', { channelKey: channel.key });
  }, [channel, push]);

  const wrappedShare = useCallback(() => {
    dismiss();
    share();
  }, [share, dismiss]);

  const options: ButtonGroupOption[] = useMemo(() => {
    const opts: ButtonGroupOption[] = [];

    if (menuType === 'full') {
      opts.push({
        label: 'Share via...',
        icon: ({ size }) => (
          <Octicons name="share" size={size} color={t.colors.text.primary} />
        ),
        onPress: wrappedShare,
      });

      opts.push(
        notifications
          ? {
              label: 'Do not notify',
              icon: ({ size }) => (
                <BellCheckFillIcon size={size} color={t.colors.text.primary} />
              ),
              onPress: doNotNofity,
            }
          : {
              label: 'Notify',
              icon: ({ size }) => (
                <Octicons
                  name="bell"
                  size={size}
                  color={t.colors.text.primary}
                />
              ),
              onPress: notify,
            },
      );
    }

    opts.push({
      label: isFollowing ? 'Unfollow' : 'Follow',
      icon: ({ size }) => (
        <Octicons
          name={isFollowing ? 'x-circle' : 'plus-circle'}
          size={size}
          color={t.colors.text.primary}
        />
      ),
      onPress: toggleFollowing,
    });

    if (isOwner || isMod) {
      opts.push({
        label: 'Manage channel',
        icon: ({ size }) => (
          <ShieldStarFillIcon size={size} color={t.colors.text.primary} />
        ),
        onPress: manageChannel,
      });
    }

    opts.push(
      favorited
        ? {
            label: 'Unfavorite',
            icon: ({ size }) => (
              <Octicons
                name="star-fill"
                size={size}
                color={t.colors.text.primary}
              />
            ),
            onPress: unfavorite,
          }
        : {
            label: 'Favorite',
            icon: ({ size }) => (
              <Octicons name="star" size={size} color={t.colors.text.primary} />
            ),
            onPress: favorite,
          },
    );

    if (isMember && !(isMod || isOwner)) {
      opts.push({
        label: 'Leave as member',
        icon: ({ size }) => (
          <Octicons name="sign-out" size={size} color={t.colors.text.danger} />
        ),
        destructive: true,
        onPress: confirmLeaveChannel,
      });
    }

    if (isMod && !isOwner) {
      opts.push({
        label: 'Remove self as moderator',
        icon: ({ size }) => (
          <ShieldSlashIcon size={size} color={t.colors.text.danger} />
        ),
        destructive: true,
        onPress: confirmRemoveModerator,
      });
    }

    return opts;
  }, [
    menuType,
    isFollowing,
    toggleFollowing,
    isOwner,
    isMod,
    isMember,
    favorited,
    unfavorite,
    favorite,
    wrappedShare,
    notifications,
    doNotNofity,
    notify,
    t.colors.text.primary,
    t.colors.text.danger,
    manageChannel,
    confirmLeaveChannel,
    confirmRemoveModerator,
  ]);

  return (
    <BottomSheetContentContainer>
      {menuType === 'full' && (
        <View
          style={[
            t.pY2,
            t.mB4,
            t.flex,
            t.flexCol,
            t.itemsCenter,
            t.justifyCenter,
            { gap: 12 },
          ]}
        >
          <RemoteImage
            uri={channel.imageUrl}
            style={[{ height: 80, width: 80 }, t.roundedFull]}
          />
          <Text2 weight="semibold" size="2xl">
            /{channel.key}
          </Text2>
        </View>
      )}
      <ButtonGroup options={options} />
    </BottomSheetContentContainer>
  );
}

export function ConfirmLeaveChannelBottomSheet({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmActionBottomSheet
      Icon={({ color, size }) => (
        <Octicons name="sign-out" size={size} color={color} />
      )}
      title="Leave channel"
      Body={
        <Text2>
          By removing yourself from this channel, you will lose access to
          casting in this channel, and any replies you've made will be hidden
          from other members.
        </Text2>
      }
      onCancel={onCancel}
      onConfirm={onConfirm}
      confirmText="Leave"
      destructive
    />
  );
}

export function ConfirmRemoveModeratorBottomSheet({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmActionBottomSheet
      Icon={({ color, size }) => <ShieldSlashIcon size={size} color={color} />}
      title="Remove self as moderator"
      Body={
        <Text2>
          If you remove yourself as a moderator, you will no longer be able to
          manage channel members or invite links. You will still have access to
          the channel as a regular member.
        </Text2>
      }
      onCancel={onCancel}
      onConfirm={onConfirm}
      destructive
    />
  );
}
