import { Octicons } from '@expo/vector-icons';
import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import { ApiChannelUser } from 'farcaster-client-data';
import {
  buildNonGroupConversationId,
  resolveUsername,
  useChannelUserAbilities,
  useInviteToModerateChannel,
  useRemoveChannelMember,
  useRemoveChannelModerator,
} from 'farcaster-client-hooks';
import { useRootToast } from 'farcaster-expo';
import React, { useCallback, useMemo } from 'react';
import { Keyboard, View } from 'react-native';

import { Avatar } from '~/components/Avatar';
import {
  BottomSheetContentContainer,
  BottomSheetModal,
  useBottomSheetModalRef,
} from '~/components/BottomSheet';
import { ButtonGroup, ButtonGroupOption } from '~/components/ButtonGroup';
import { useConfirmInviteRestrictedBottomSheetModal } from '~/components/ChannelsV3/ConfirmInviteRestrictedBottomSheet';
import { useConfirmUnbanUserBottomSheetModal } from '~/components/ChannelsV3/ConfirmUnbanUserBottomSheet';
import { ConfirmActionBottomSheet } from '~/components/ConfirmActionBottomSheet';
import { PersonXIcon } from '~/components/icons/PersonXIcon';
import { PersonCircleIcon } from '~/components/images/PersonCircleIcon';
import { ShieldCheckFillIcon } from '~/components/images/ShieldCheckFillIcon';
import { ShieldSlashIcon } from '~/components/images/ShieldSlashIcon';
import { Text2 } from '~/components/Text';
import { UnorderedListItem } from '~/components/UnorderedList';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';
import { useChannelModOrOwner } from '~/hooks/useUserChannelRole';
import { trackError } from '~/utils/ErrorUtils';

type ManageChannelUserContextValue = {
  openManageUserBottomSheet: () => void;
};

const ManageChannelUserContext =
  React.createContext<ManageChannelUserContextValue>({
    openManageUserBottomSheet: () => {
      throw new Error('Must be called in ManageChannelUserContext provider');
    },
  });

type ManageChannelUserProviderProps = {
  channelKey: string;
  channelUser: ApiChannelUser;
  children: React.ReactNode;
};

export const useManageChannelUser = () =>
  React.useContext(ManageChannelUserContext);

/**
 * Must be rendered within an authenticated context where current user is
 * available.
 */
export const ManageChannelUserProvider: React.FC<ManageChannelUserProviderProps> =
  React.memo(({ channelKey, channelUser, children }) => {
    const toast = useRootToast();
    const { dismissAll } = useBottomSheetModal();

    const currentUser = useCurrentUser_UNSAFE();
    const manageModalRef = useBottomSheetModalRef();
    const confirmRemoveMemberModalRef = useBottomSheetModalRef();
    const confirmRemoveModeratorModalRef = useBottomSheetModalRef();
    const confirmUnbanUserModalRef = useBottomSheetModalRef();

    const removeChannelModerator = useRemoveChannelModerator();
    const removeChannelMember = useRemoveChannelMember();

    const username = useMemo(
      () => resolveUsername(channelUser.user),
      [channelUser.user],
    );

    const removeMember = useCallback(async () => {
      try {
        dismissAll();

        await removeChannelMember({
          channelKey,
          removeFid: channelUser.user.fid,
          actorFid: currentUser.fid,
        });
      } catch (e) {
        trackError(new Error('Failed to remove member', { cause: e }));
        toast.show('Failed to remove member', {
          placement: 'top',
          type: 'danger',
        });
      }
    }, [
      dismissAll,
      removeChannelMember,
      channelKey,
      channelUser.user.fid,
      currentUser.fid,
      toast,
    ]);

    const removeModerator = useCallback(async () => {
      try {
        dismissAll();

        await removeChannelModerator({
          channelKey,
          fid: channelUser.user.fid,
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
      channelKey,
      channelUser.user.fid,
      currentUser.fid,
      toast,
    ]);

    const confirmUnbanUserBottomSheetModal =
      useConfirmUnbanUserBottomSheetModal({
        channelKey,
        user: channelUser.user,
        onConfirm: () => {
          dismissAll();
        },
      });

    const confirmInviteRestrictedBottomSheetModal =
      useConfirmInviteRestrictedBottomSheetModal({
        restricted: channelUser.channelContext.restricted,
        user: channelUser.user,
        channelKey,
      });

    const wrappedInviteToChannel = useCallback(() => {
      dismissAll();
      confirmInviteRestrictedBottomSheetModal.inviteOrOpen();
    }, [confirmInviteRestrictedBottomSheetModal, dismissAll]);

    const openManageUserBottomSheet = useCallback(() => {
      Keyboard.dismiss();
      manageModalRef.current?.present();
    }, [manageModalRef]);

    const confirmRemoveMember = useCallback(async () => {
      confirmRemoveMemberModalRef.current?.present();
    }, [confirmRemoveMemberModalRef]);

    const confirmRemoveModerator = useCallback(async () => {
      confirmRemoveModeratorModalRef.current?.present();
    }, [confirmRemoveModeratorModalRef]);

    const confirmUnbanUser = useCallback(async () => {
      confirmUnbanUserModalRef.current?.present();
    }, [confirmUnbanUserModalRef]);

    const contextValue = useMemo(
      () => ({
        openManageUserBottomSheet,
      }),
      [openManageUserBottomSheet],
    );

    return (
      <ManageChannelUserContext.Provider value={contextValue}>
        {children}

        <BottomSheetModal name="manageChannelUser" ref={manageModalRef}>
          <ManageChannelUserBottomSheet
            channelKey={channelKey}
            channelUser={channelUser}
            inviteToChannel={wrappedInviteToChannel}
            confirmRemoveMember={confirmRemoveMember}
            confirmRemoveModerator={confirmRemoveModerator}
            confirmUnbanUser={confirmUnbanUser}
          />
        </BottomSheetModal>
        <BottomSheetModal
          name="confirmRemoveChannelMember"
          ref={confirmRemoveMemberModalRef}
        >
          <ConfirmRemoveMemberBottomSheet
            username={username}
            onCancel={() => confirmRemoveMemberModalRef.current?.dismiss()}
            onConfirm={removeMember}
          />
        </BottomSheetModal>
        <BottomSheetModal
          name="confirmRemoveChannelModerator"
          ref={confirmRemoveModeratorModalRef}
        >
          <ConfirmRemoveModeratorBottomSheet
            username={username}
            onCancel={() => confirmRemoveModeratorModalRef.current?.dismiss()}
            onConfirm={removeModerator}
          />
        </BottomSheetModal>
        {confirmUnbanUserBottomSheetModal.Component}
        {confirmInviteRestrictedBottomSheetModal.Component}
      </ManageChannelUserContext.Provider>
    );
  });

export function ManageChannelUserBottomSheet({
  channelKey,
  channelUser,
  inviteToChannel,
  confirmRemoveMember,
  confirmRemoveModerator,
  confirmUnbanUser,
}: {
  channelKey: string;
  channelUser: ApiChannelUser;
  inviteToChannel: () => void;
  confirmRemoveMember: () => void;
  confirmRemoveModerator: () => void;
  confirmUnbanUser: () => void;
}) {
  const t = useTheme();
  const toast = useRootToast();
  const { dismiss } = useBottomSheetModal();

  const pushToUserProfile = usePushToUserProfile();
  const navigate = useNavigate();
  const currentUser = useCurrentUser_UNSAFE();
  const inviteToModerate = useInviteToModerateChannel();

  const isSelf = currentUser.fid === channelUser.user.fid;
  const viewerRole = useChannelModOrOwner(channelKey);
  const abilities = useChannelUserAbilities({
    viewerFid: currentUser.fid,
    viewerRole,
    targetFid: channelUser.user.fid,
    targetRole: channelUser.channelContext.role,
    targetBanned: channelUser.channelContext.banned,
  });

  const viewProfile = useCallback(() => {
    dismiss();

    pushToUserProfile({ fid: channelUser.user.fid });
  }, [channelUser.user.fid, dismiss, pushToUserProfile]);

  const message = useCallback(() => {
    dismiss();

    navigate('PlaintextDirectCastsConversation', {
      counterParty: channelUser.user,
      conversationId: buildNonGroupConversationId({
        participantFids: [channelUser.user.fid, currentUser.fid],
      }),
      create: true,
      intentText: undefined,
    });
  }, [dismiss, navigate, currentUser.fid, channelUser.user]);

  const inviteToMod = useCallback(async () => {
    try {
      dismiss();

      await inviteToModerate({
        channelKey,
        fid: channelUser.user.fid,
      });
    } catch (e) {
      trackError(new Error('Failed to invite to moderate', { cause: e }));
      toast.show('Failed to invite user to moderate', {
        placement: 'top',
        type: 'danger',
      });
    }
  }, [channelKey, channelUser.user.fid, dismiss, toast, inviteToModerate]);

  const options: ButtonGroupOption[] = useMemo(() => {
    const opts: ButtonGroupOption[] = [
      {
        label: 'View profile',
        icon: ({ size }) => (
          <Octicons name="person" size={size} color={t.colors.text.primary} />
        ),
        onPress: viewProfile,
      },
    ];

    if (!isSelf) {
      opts.push(
        !isSelf && {
          label: 'Message',
          icon: ({ size }) => (
            <Octicons
              name="comment"
              size={size}
              color={t.colors.text.primary}
            />
          ),
          onPress: message,
        },
      );

      if (abilities.canAddAsModerator) {
        opts.push({
          label: 'Add as moderator',
          icon: ({ size }) => (
            <ShieldCheckFillIcon height={size} color={t.colors.text.primary} />
          ),
          onPress: inviteToMod,
        });
      }

      if (abilities.canRemoveAsModerator) {
        opts.push({
          label: 'Remove moderator',
          icon: ({ size }) => (
            <ShieldSlashIcon size={size} color={t.colors.text.danger} />
          ),
          onPress: confirmRemoveModerator,
          destructive: true,
        });
      }

      if (abilities.canAddAsMember) {
        opts.push({
          label: 'Add as member',
          icon: ({ size }) => (
            <PersonCircleIcon size={size} color={t.colors.text.primary} />
          ),
          onPress: inviteToChannel,
        });
      }

      if (abilities.canRemoveAsMember) {
        opts.push({
          label: 'Remove member',
          icon: ({ size }) => (
            <Octicons name="skip" size={size} color={t.colors.text.danger} />
          ),
          onPress: confirmRemoveMember,
          destructive: true,
        });
      }

      if (abilities.canUnbanFromChannel) {
        opts.push({
          label: 'Unban',
          icon: ({ size }) => (
            <PersonXIcon size={size} color={t.colors.text.primary} />
          ),
          onPress: confirmUnbanUser,
        });
      }
    } else {
      if (abilities.canRemoveAsModerator) {
        opts.push({
          label: 'Remove member',
          icon: ({ size }) => (
            <Octicons name="skip" size={size} color={t.colors.text.danger} />
          ),
          onPress: confirmRemoveMember,
          destructive: true,
        });
      }
    }

    return opts;
  }, [
    isSelf,
    t,
    abilities,
    message,
    viewProfile,
    inviteToMod,
    confirmRemoveModerator,
    inviteToChannel,
    confirmRemoveMember,
    confirmUnbanUser,
  ]);

  return (
    <>
      <BottomSheetContentContainer>
        <View
          style={[t.pY2, t.flex, t.flexCol, t.itemsCenter, t.justifyCenter]}
        >
          <Avatar pfpUrl={channelUser.user.pfp?.url} diameter={92} />
          <Text2 weight="semibold" size="2xl" style={[t.mT3]}>
            {channelUser.user.displayName}
          </Text2>
          <Text2 color="secondary" style={[t.mT1]}>
            {resolveUsername(channelUser.user)}
          </Text2>
        </View>
        <View style={[t.pY4]}>
          <ButtonGroup options={options} />
        </View>
      </BottomSheetContentContainer>
    </>
  );
}

export function ConfirmRemoveMemberBottomSheet({
  username,
  onCancel,
  onConfirm,
}: {
  username: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const t = useTheme();

  return (
    <ConfirmActionBottomSheet
      Icon={({ color, size }) => (
        <Octicons name="skip" size={size} color={color} />
      )}
      Body={
        <>
          <Text2>
            By removing <Text2 weight="semibold">{username}</Text2>:
          </Text2>
          <View style={[t.mT1]}>
            <UnorderedListItem>
              <Text2>All previous casts will be removed from the channel</Text2>
            </UnorderedListItem>
            <UnorderedListItem>
              <Text2>They will not be able to cast in the channel</Text2>
            </UnorderedListItem>
          </View>
        </>
      }
      title="Remove from channel"
      onCancel={onCancel}
      onConfirm={onConfirm}
      destructive
    />
  );
}

export function ConfirmRemoveModeratorBottomSheet({
  username,
  onCancel,
  onConfirm,
}: {
  username: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmActionBottomSheet
      Icon={({ color, size }) => <ShieldSlashIcon size={size} color={color} />}
      Body={
        <Text2>
          If you remove <Text2 weight="semibold">{username} </Text2>
          from this channel, they won’t be able to manage members or invite
          links anymore. However, you’ll remain a regular member. from this
          channel, they will:
        </Text2>
      }
      title="Remove moderator"
      onCancel={onCancel}
      onConfirm={onConfirm}
      destructive
    />
  );
}
