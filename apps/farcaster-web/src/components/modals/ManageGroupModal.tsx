import {
  ArchiveIcon,
  BellIcon,
  BellSlashIcon,
  GearIcon,
  KebabHorizontalIcon,
  PersonIcon,
  SignOutIcon,
} from '@primer/octicons-react';
import * as Popover from '@radix-ui/react-popover';
import classNames from 'classnames';
import type {
  ApiDirectCastConversationInfoV3,
  ApiUser,
  ApiUserMinimal,
} from 'farcaster-client-data';
import {
  resolveUsernameShort,
  useChangeMemberInPlaintextDirectCastGroup,
  useDirectCastConversation,
  useGetDirectCastGroupInvites,
  usePlaintextDirectCastGroupInvite,
  userKeyExtractor,
} from 'farcaster-client-hooks';
import React, { useEffect } from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { MarkAsUnreadIcon } from '~/components/casts/actions/icons/MarkAsUnreadIcon';
import { GroupConversationImage } from '~/components/directCasts/GroupConversationImage';
import { GroupInviteLink } from '~/components/groupChat/GroupInviteLink';
import { FlatList } from '~/components/lists/FlatList';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { Modal } from '~/components/modals/Modal';
import { MenuItem } from '~/components/popovers/MenuItem';
import { useDirectCastConversationContext } from '~/contexts/ManageDirectCastConversationProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useNavigateToDirectCastsInbox } from '~/hooks/navigation/useNavigateToDirectCastsInbox';

import { CantLeaveGroupModal } from './CantLeaveGroupModal';
import { ConfirmationModal } from './ConfirmationModal';
import { DefaultModalContent } from './DefaultModalContent';
import { DefaultModalHeader } from './DefaultModalHeader';
import { EditGroupModalContent } from './EditGroupModal';
import { ManageGroupAddUsersModal } from './ManageGroupAddUsersModal';

type ManageGroupModalUserProps = {
  conversation: ApiDirectCastConversationInfoV3;
  user: ApiUser | ApiUserMinimal;
  isInvitee?: boolean;
};

const ManageGroupModalUser: React.FC<ManageGroupModalUserProps> = ({
  conversation,
  user,
  isInvitee,
}) => {
  const currentUser = useCurrentUser();
  const currentUserFid = currentUser.fid;

  const [adminActionsVisible, setAdminActionsVisible] =
    React.useState<boolean>(false);

  const [userIsGroupAdmin, setUserIsGroupAdmin] =
    React.useState<boolean>(false);

  useEffect(() => {
    setUserIsGroupAdmin(conversation.adminFids.indexOf(user.fid) !== -1);
  }, [conversation.adminFids, user.fid]);

  const changeMembers = useChangeMemberInPlaintextDirectCastGroup();

  const onPromoteMemberClick = React.useCallback(
    async ({ user }: { user: ApiUser }) => {
      setAdminActionsVisible(false);

      setUserIsGroupAdmin(true);

      await changeMembers({
        action: 'promote',
        conversationId: conversation.conversationId,
        senderContext: {
          fid: currentUserFid,
          displayName: currentUser.displayName,
          username: currentUser.username ?? '',
        },
        participants: [user],
      });
    },
    [
      conversation.conversationId,
      currentUser.displayName,
      currentUser.username,
      currentUserFid,
      changeMembers,
    ],
  );

  const onDemoteMemberClick = React.useCallback(
    async ({ user }: { user: ApiUser }) => {
      setAdminActionsVisible(false);
      setUserIsGroupAdmin(false);

      await changeMembers({
        action: 'demote',
        conversationId: conversation.conversationId,
        senderContext: {
          fid: currentUserFid,
          displayName: currentUser.displayName,
          username: currentUser.username ?? '',
        },
        participants: [user],
      });
    },
    [
      conversation.conversationId,
      currentUserFid,
      changeMembers,
      currentUser.displayName,
      currentUser.username,
    ],
  );

  const onRemoveMemberClick = React.useCallback(
    async ({ user }: { user: ApiUser }) => {
      if (userIsGroupAdmin) {
        await onDemoteMemberClick({ user });
      }
      setAdminActionsVisible(false);

      await changeMembers({
        action: 'remove',
        conversationId: conversation.conversationId,
        senderContext: {
          fid: currentUserFid,
          displayName: currentUser.displayName,
          username: currentUser.username ?? '',
        },
        participants: [user],
      });
    },
    [
      conversation.conversationId,
      currentUserFid,
      changeMembers,
      userIsGroupAdmin,
      onDemoteMemberClick,
      currentUser.displayName,
      currentUser.username,
    ],
  );

  const shouldRenderModifyMembershipActions = React.useMemo(() => {
    return (
      user.fid !== currentUserFid &&
      conversation.viewerContext.access === 'admin'
    );
  }, [conversation.viewerContext.access, currentUserFid, user.fid]);

  const meChip = React.useMemo(() => {
    return user.fid === currentUserFid ? (
      <div className="inline-flex h-5 items-center justify-center gap-2.5 rounded-3xl px-1.5 py-0.5 bg-overlay-medium">
        <div className="text-xs font-medium leading-none text-default">Me</div>
      </div>
    ) : null;
  }, [user.fid, currentUserFid]);

  return (
    <div className="flex flex-row items-center justify-between pb-3 pr-3">
      <div className="flex-row- flex items-center">
        <Avatar user={user as ApiUser} size="sm" />
        <div className="ml-2 flex flex-col">
          {resolveUsernameShort({
            fid: user.fid,
            username: user.username,
          })}
        </div>
      </div>
      <div
        className={classNames(
          'flex flex-row items-center gap-1',
          !shouldRenderModifyMembershipActions && 'pr-3',
        )}
      >
        {!userIsGroupAdmin && !shouldRenderModifyMembershipActions && meChip}
        {userIsGroupAdmin && (
          <span className="text-sm text-faint">
            {user.fid === currentUserFid ? <>{meChip} Admin</> : 'Admin'}
          </span>
        )}
        {isInvitee && (
          <span className="pr-[10px] text-sm text-faint">Invited</span>
        )}
        {shouldRenderModifyMembershipActions && !isInvitee && (
          <Popover.Root
            modal={true}
            open={adminActionsVisible}
            onOpenChange={setAdminActionsVisible}
          >
            <Popover.Trigger>
              <div
                className={classNames(
                  'group flex w-9 cursor-pointer flex-row items-center text-sm text-faint',
                )}
                onClick={(e) => {
                  e.stopPropagation();

                  setAdminActionsVisible(true);
                }}
                onBlur={(e) => {
                  e.stopPropagation();

                  setAdminActionsVisible(false);
                }}
              >
                <div className="group flex flex-row items-center justify-center rounded-full p-2 transition-colors hover:bg-gray-200 group-hover:bg-gray-200 dark:hover:bg-overlay-medium dark:group-hover:bg-overlay-medium">
                  <KebabHorizontalIcon className="text-default" />
                </div>
              </div>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                className="outline-hidden z-20 flex w-48 flex-col rounded-md border p-1 shadow-lg bg-app border-default"
                side="bottom"
                sideOffset={4}
                align="start"
              >
                {userIsGroupAdmin ? (
                  <MenuItem
                    name="Dismiss as admin"
                    icon={<></>}
                    onClick={() =>
                      onDemoteMemberClick({ user: user as ApiUser })
                    }
                  />
                ) : (
                  <MenuItem
                    name="Make group admin"
                    icon={<></>}
                    onClick={() =>
                      onPromoteMemberClick({ user: user as ApiUser })
                    }
                  />
                )}
                <MenuItem
                  name="Remove from group"
                  icon={<></>}
                  onClick={() => onRemoveMemberClick({ user: user as ApiUser })}
                />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        )}
      </div>
    </div>
  );
};

type ManageGroupModalProps = {
  onClose: () => void;
};

const ManageGroupModal: React.FC<ManageGroupModalProps> = React.memo(
  ({ onClose }) => {
    const { conversation } = useDirectCastConversationContext() as {
      conversation: ApiDirectCastConversationInfoV3;
    };
    const canEdit = React.useMemo(() => {
      return conversation.viewerContext.access === 'admin';
    }, [conversation.viewerContext.access]);
    const [showEditGroupModal, setShowEditGroupModal] =
      React.useState<boolean>(false);

    const onEditClick = React.useCallback(() => {
      setShowEditGroupModal(true);
    }, []);

    const onBackClick = React.useCallback(() => {
      setShowEditGroupModal(false);
    }, []);

    return (
      <Modal>
        <DefaultModalContainer onClose={onClose}>
          <DefaultModalContent maxHeightPxTarget="678px">
            <DefaultModalHeader
              title={showEditGroupModal ? 'Edit details' : 'Details'}
              onClose={onClose}
              onBackClick={showEditGroupModal ? onBackClick : undefined}
              secondaryButton={
                !showEditGroupModal && canEdit ? (
                  <div
                    className="flex cursor-pointer flex-row items-center text-sm font-semibold leading-tight text-muted hover:text-default"
                    onClick={onEditClick}
                  >
                    <GearIcon size={16} className="mr-[6px]" />
                  </div>
                ) : undefined
              }
            />
            <React.Suspense
              fallback={
                <span className="flex size-full flex-row items-center justify-center py-8">
                  <LoadingIndicator />
                </span>
              }
            >
              {!showEditGroupModal && (
                <ManageGroupModalContent
                  conversationId={conversation.conversationId}
                  onClose={onClose}
                />
              )}
              {showEditGroupModal && (
                <EditGroupModalContent
                  onClose={() => {
                    setShowEditGroupModal(false);
                    onClose();
                  }}
                />
              )}
            </React.Suspense>
          </DefaultModalContent>
        </DefaultModalContainer>
      </Modal>
    );
  },
);

type ManageGroupModalContentProps = {
  conversationId: string;
  onClose: () => void;
};

const ManageGroupModalContent: React.FC<ManageGroupModalContentProps> = ({
  conversationId,
  onClose,
}) => {
  const currentUser = useCurrentUser();
  const currentUserFid = currentUser.fid;

  const { markUnread, snooze, endSnooze, archive, unarchive } =
    useDirectCastConversationContext();

  const { data: conversation } = useDirectCastConversation({
    conversationId,
  });

  const { data: groupInvites } = useGetDirectCastGroupInvites({
    conversationId,
    enabled: conversation?.viewerContext.access === 'admin',
  });

  const isGroupInviteRequest =
    conversation?.viewerContext.category === 'request' && conversation?.isGroup;

  const changeMembershipInPlaintextDirectCastGroup =
    useChangeMemberInPlaintextDirectCastGroup();

  const [anotherVisibleModal, setAnotherVisibleModal] = React.useState<
    'leave' | 'add-members' | 'cant-leave' | undefined
  >(undefined);

  const { data: invite } = usePlaintextDirectCastGroupInvite({
    fid: currentUserFid,
    conversationId,
  });

  const navigateToInbox = useNavigateToDirectCastsInbox();

  const groupInviteLink = React.useMemo(() => {
    return typeof invite !== 'undefined' &&
      typeof invite.inviteCode !== 'undefined' &&
      !invite.expired
      ? `https://farcaster.xyz/~/group/${invite.inviteCode}`
      : undefined;
  }, [invite]);

  const members = React.useMemo(() => {
    const currentUserFromParticipants =
      conversation?.participants.find(
        ({ fid }) =>
          fid === currentUserFid && !conversation?.removedFids.includes(fid),
      ) || undefined;

    const adminsFromParticipants = conversation?.participants.filter(
      ({ fid }) =>
        fid !== currentUserFid &&
        conversation?.adminFids.includes(fid) &&
        !conversation?.removedFids.includes(fid),
    );

    const rest = conversation?.participants.filter(
      ({ fid }) =>
        fid !== currentUserFid &&
        !conversation?.removedFids.includes(fid) &&
        !conversation?.adminFids.includes(fid),
    );

    return [
      ...(currentUserFromParticipants ? [currentUserFromParticipants] : []),
      ...(groupInvites?.map((invite) => invite.invitee) || []),
      ...(adminsFromParticipants || []),
      ...(rest || []),
    ].map((user, index) => ({
      ...user,
      index,
    }));
  }, [
    conversation?.participants,
    conversation?.adminFids,
    conversation?.removedFids,
    currentUserFid,
    groupInvites,
  ]);

  const onSnoozeClick = React.useCallback(() => {
    if (conversation?.viewerContext.muted) {
      endSnooze();
    } else {
      snooze();
    }
  }, [conversation?.viewerContext.muted, endSnooze, snooze]);

  const onMarkUnreadClick = React.useCallback(() => {
    markUnread();
  }, [markUnread]);

  const onArchiveClick = React.useCallback(() => {
    if (conversation?.viewerContext.category === 'archived') {
      unarchive();
    } else {
      archive();
    }
  }, [archive, conversation?.viewerContext.category, unarchive]);

  const onAddUsersClick = React.useCallback(() => {
    setAnotherVisibleModal('add-members');
  }, []);

  const onLeaveClick = React.useCallback(() => {
    if (
      conversation?.viewerContext.access === 'admin' &&
      conversation?.adminFids.length === 1 &&
      conversation?.participants.length - conversation?.removedFids.length > 1
    ) {
      setAnotherVisibleModal('cant-leave');
      return;
    }
    setAnotherVisibleModal('leave');
  }, [
    conversation?.adminFids,
    conversation?.participants,
    conversation?.removedFids,
    conversation?.viewerContext.access,
  ]);

  const userCanAddMembers = React.useMemo(() => {
    return (
      conversation?.viewerContext.access === 'admin' ||
      (typeof conversation?.groupPreferences !== 'undefined' &&
        conversation?.groupPreferences.membersCanInvite)
    );
  }, [conversation?.groupPreferences, conversation?.viewerContext.access]);

  const renderUser = React.useCallback(
    ({ item }: { item: ApiUser | ApiUserMinimal }) => (
      <ManageGroupModalUser
        conversation={conversation!}
        user={item}
        isInvitee={groupInvites?.some(
          (invite) => invite.invitee.fid === item.fid,
        )}
      />
    ),
    [conversation, groupInvites],
  );

  return (
    <div
      className={classNames(
        'flex h-full w-full flex-col overflow-y-hidden',
        typeof anotherVisibleModal !== 'undefined' &&
          anotherVisibleModal !== 'leave' &&
          anotherVisibleModal !== 'cant-leave' &&
          '!h-0 opacity-0',
      )}
    >
      <div className="mx-[16px] mb-[12px] mt-[16px]">
        <div className="relative flex flex-col">
          <div className="flex w-full flex-row items-center justify-between">
            <div className="flex grow flex-col items-center gap-y-2 space-x-3">
              <GroupConversationImage
                imageURL={conversation?.photoUrl}
                size="xl2"
              />
              <div className="text-lg text-default">{conversation?.name}</div>
              {typeof conversation?.description !== 'undefined' &&
                conversation?.description.trim() !== '' && (
                  <div className="text-sm text-faint">
                    {conversation?.description}
                  </div>
                )}
            </div>
          </div>
          {!isGroupInviteRequest && (
            <div className="inline-flex items-center justify-start gap-2 py-[16px]">
              {userCanAddMembers && (
                <ActionButton
                  onClick={onAddUsersClick}
                  text="Add user"
                  icon={<PersonIcon />}
                />
              )}
              <ActionButton
                onClick={onSnoozeClick}
                text={
                  conversation?.viewerContext.muted
                    ? 'Unmute chat'
                    : 'Mute chat'
                }
                icon={
                  conversation?.viewerContext.muted ? (
                    <BellIcon />
                  ) : (
                    <BellSlashIcon />
                  )
                }
              />
              {/* Want to cap the actions here to 4 so as a hack hiding this one if we have the add user action visible */}
              {!userCanAddMembers && (
                <ActionButton
                  onClick={onMarkUnreadClick}
                  text="Unread"
                  icon={<MarkAsUnreadIcon className="ml-0.5 mt-1" />}
                  disabled={conversation?.viewerContext.manuallyMarkedUnread}
                />
              )}
              <ActionButton
                onClick={onArchiveClick}
                text={
                  conversation?.viewerContext.category === 'archived'
                    ? 'Unarchive'
                    : 'Archive'
                }
                icon={<ArchiveIcon />}
              />
              <ActionButton
                onClick={onLeaveClick}
                text="Leave"
                icon={<SignOutIcon className="ml-0.5 text-danger" />}
                isDestructive={true}
              />
            </div>
          )}
        </div>
        {typeof groupInviteLink !== 'undefined' && !isGroupInviteRequest && (
          <GroupInviteLink groupInviteLink={groupInviteLink} />
        )}
      </div>
      <div className="flex flex-col pb-4">
        <div className="border-b p-3 text-xs font-medium leading-none text-muted border-default">
          Members ({members.length - (groupInvites?.length || 0)})
        </div>
        <div
          className={classNames(
            'ml-3 mt-3 flex flex-col overflow-y-auto',
            typeof groupInviteLink !== 'undefined'
              ? 'max-h-[217px]'
              : 'max-h-[292px]',
          )}
        >
          <FlatList
            containerClassName={'!animate-none'}
            data={members}
            renderItem={renderUser}
            keyExtractor={userKeyExtractor}
            emptyView={<></>}
          />
        </div>
      </div>
      {anotherVisibleModal === 'leave' && (
        <ConfirmationModal
          onCancel={() => {
            setAnotherVisibleModal(undefined);
          }}
          onConfirm={async () => {
            await changeMembershipInPlaintextDirectCastGroup({
              senderContext: {
                fid: currentUserFid,
                displayName: currentUser.displayName,
                username: currentUser.username ?? '',
              },
              conversationId,
              action: 'remove',
              participants: [currentUser],
            });

            onClose();
            navigateToInbox();
          }}
          confirmText="Leave"
          title="Leave conversation"
          icon={({ size }) => <SignOutIcon size={size} />}
          body="Are you sure you want to leave? You'll need a new invite to rejoin the conversation."
          hideAreYouSure
          destructive
        />
      )}
      {anotherVisibleModal === 'cant-leave' && (
        <CantLeaveGroupModal
          onClose={() => setAnotherVisibleModal(undefined)}
        />
      )}
      {anotherVisibleModal === 'add-members' && (
        <ManageGroupAddUsersModal
          conversation={conversation}
          onClose={() => {
            setAnotherVisibleModal(undefined);
            onClose();
          }}
        />
      )}
    </div>
  );
};

const ActionButton: React.FC<{
  onClick: () => void;
  text: string;
  icon: React.ReactNode;
  isDestructive?: boolean;
  disabled?: boolean;
}> = ({ onClick, text, icon, isDestructive, disabled }) => {
  return (
    <div
      className={classNames(
        'inline-flex shrink grow basis-0 flex-col items-center justify-center gap-2.5 rounded-lg border px-[10px] py-[14px] bg-app border-faint hover:bg-overlay-faint',
        disabled ? 'cursor-default opacity-50' : 'cursor-pointer',
      )}
      onClick={onClick}
    >
      <div className="flex flex-col items-center justify-start gap-0.5">
        <div className="relative size-5">{icon}</div>
        <div
          className={classNames(
            'pt-1 text-center text-xs leading-none text-default',
            isDestructive && 'text-danger',
          )}
        >
          {text}
        </div>
      </div>
    </div>
  );
};

ManageGroupModal.displayName = 'ManageGroupModal';

export { ManageGroupModal };
