import {
  ArchiveIcon,
  BellIcon,
  BellSlashIcon,
  CheckIcon,
  ClockIcon,
  SignOutIcon,
  TrashIcon,
} from '@primer/octicons-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  ApiDirectCastConversationInfoV3,
  ApiDirectCastConversationMessageTTLDays,
} from 'farcaster-client-data';
import {
  resolveUsername,
  useChangeMemberInPlaintextDirectCastGroup,
  useTrackEvent,
} from 'farcaster-client-hooks';
import React, { ReactNode, useMemo } from 'react';

import { MarkAsUnreadIcon } from '~/components/casts/actions/icons/MarkAsUnreadIcon';
import { DropdownMenuItem } from '~/components/dropdownMenu/DropdownMenuItem';
import { DollarCircleIcon } from '~/components/icons/DollarCircleIcon';
import { CantLeaveGroupModal } from '~/components/modals/CantLeaveGroupModal';
import { ChangeMessageTLLModal } from '~/components/modals/ChangeMessageTLLModal';
import { ConfirmationModal } from '~/components/modals/ConfirmationModal';
import { useDirectCastConversationContext } from '~/contexts/ManageDirectCastConversationProvider';
import { useMuteUser } from '~/contexts/MuteUserProvider';
import { usePayUser } from '~/contexts/PayUserProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useCurrentUserLevel } from '~/hooks/data/useUserLevel';
import { useNavigateToDirectCastsInbox } from '~/hooks/navigation/useNavigateToDirectCastsInbox';

import { DirectCastConversationAutoDeleteMenu } from './DirectCastConversationAutoDeleteMenu';
import {
  InboxPinnedIconEmpty,
  InboxPinnedSlashIcon,
} from './DirectCastListConversation';

type DirectCastConversationDropdownMenuProps = Pick<
  DropdownMenu.DropdownMenuProps,
  'onOpenChange'
> & {
  trigger: ReactNode;
};

export function DirectCastConversationDropdownMenu({
  onOpenChange,
  trigger,
}: DirectCastConversationDropdownMenuProps) {
  const { trackEvent } = useTrackEvent();
  const { muteUser } = useMuteUser();
  const {
    conversation,
    markUnread,
    markRead,
    endSnooze,
    snooze,
    archive,
    unarchive,
    deleteConversation,
    pin,
    unpin,
  } = useDirectCastConversationContext();
  const currentUser = useCurrentUser();
  const navigateToInbox = useNavigateToDirectCastsInbox();
  const changeMembershipInPlaintextDirectCastGroup =
    useChangeMemberInPlaintextDirectCastGroup();

  const [menuOpen, setMenuOpen] = React.useState<boolean | undefined>(
    undefined,
  );
  const { launchPayUser } = usePayUser();
  const [autoDeleteMenuOpen, setAutoDeleteMenuOpen] = React.useState(false);
  const [newMessageTTL, setNewMessageTTL] = React.useState<
    ApiDirectCastConversationMessageTTLDays | undefined
  >(undefined);
  const isProUser = useCurrentUserLevel() === 'pro';

  const openAutoDeleteMenu = () => {
    setAutoDeleteMenuOpen(true);
  };

  const autoDeleteMenuEligible = 'messageTTLDays' in conversation;
  const showNeverOption = useMemo(() => {
    if (!autoDeleteMenuEligible) {
      return false;
    }
    if (conversation.messageTTLDays === 'Infinity') {
      return true;
    }
    return isProUser && !conversation.isGroup;
  }, [autoDeleteMenuEligible, conversation, isProUser]);

  const wrappedMuteUser = async () => {
    if (conversation.viewerContext.counterParty) {
      // implicit assumption is that requests can only be created for 1:1
      // conversations
      const requester = conversation.viewerContext.counterParty;

      const { muted } = await muteUser({
        targetFid: requester.fid,
        username: resolveUsername({
          username: requester.username,
          fid: requester.fid,
        }),
        source: 'direct-cast-request',
      });

      if (muted) {
        trackEvent({
          name: 'reject direct cast request',
          props: {
            conversationId: conversation.conversationId,
            via: 'inbox view',
            action: 'mute',
          },
        });
      }
    }
  };

  const [anotherVisibleModal, setAnotherVisibleModal] = React.useState<
    'leave' | 'cant-leave' | 'change-ttl' | undefined
  >(undefined);

  const onLeaveClick = React.useCallback(() => {
    if (
      conversation.adminFids.length === 1 &&
      conversation.adminFids.includes(currentUser.fid)
    ) {
      setAnotherVisibleModal('cant-leave');
      return;
    }
    setAnotherVisibleModal('leave');
  }, [conversation.adminFids, currentUser.fid]);

  const wrappedDeleteConversation = async () => {
    const { deleted } = await deleteConversation();

    if (deleted) {
      trackEvent({
        name: 'reject direct cast request',
        props: {
          conversationId: conversation.conversationId,
          via: 'inbox view',
          action: 'delete',
        },
      });
      navigateToInbox();
    }
  };

  const wrappedLeaveConversation = React.useCallback(async () => {
    await changeMembershipInPlaintextDirectCastGroup({
      senderContext: {
        fid: currentUser.fid,
        displayName: currentUser.displayName,
        username: currentUser.username ?? '',
      },
      conversationId: conversation.conversationId,
      action: 'remove',
      participants: [currentUser],
    });
    navigateToInbox();
  }, [
    changeMembershipInPlaintextDirectCastGroup,
    conversation.conversationId,
    navigateToInbox,
    currentUser,
  ]);

  const markConversationRead = React.useCallback(async () => {
    await markRead();
  }, [markRead]);

  const counterParty = conversation.viewerContext.counterParty;

  return (
    <DropdownMenu.Root
      onOpenChange={(open) => {
        onOpenChange?.(open);
        setMenuOpen(undefined);
      }}
      open={menuOpen}
    >
      <DropdownMenu.Trigger onClick={(e) => e.stopPropagation()}>
        {trigger}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        side="bottom"
        align="end"
        sideOffset={4}
        onClick={(e) => e.stopPropagation()}
        className="outline-hidden z-20 m-1 w-[192px] rounded-lg border shadow-lg bg-app border-default"
        // On close Dropdown trigger gets a focus making it work a bit wierd, disabling it for now.
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {(conversation.viewerContext.category === 'request' ||
          conversation.viewerContext.category === 'void') && (
          <>
            <DropdownMenuItem
              className="border-b px-4 py-3 border-default"
              onSelect={wrappedDeleteConversation}
              destructive
            >
              <div className="flex w-full items-center justify-between">
                <span>Delete</span>
                <TrashIcon size={16} />
              </div>
            </DropdownMenuItem>
            {!conversation.isGroup && (
              <DropdownMenuItem
                className="px-4 py-3"
                onSelect={wrappedMuteUser}
                destructive
              >
                <div className="flex w-full items-center justify-between">
                  <span>Mute user</span>
                  <BellSlashIcon size={16} />
                </div>
              </DropdownMenuItem>
            )}
          </>
        )}
        {conversation.viewerContext.category === 'default' && (
          <>
            {conversation.viewerContext.pinned ? (
              <DropdownMenuItem
                className="border-b px-4 py-3 border-default"
                onSelect={unpin}
              >
                <div className="flex w-full items-center justify-between">
                  <span>Unpin</span>
                  <InboxPinnedSlashIcon className="!fill-[#24292e] dark:!fill-white" />
                </div>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="border-b px-4 py-3 border-default"
                onSelect={pin}
              >
                <div className="flex w-full items-center justify-between">
                  <span>Pin</span>
                  <InboxPinnedIconEmpty className="!fill-[#24292e] dark:!fill-white" />
                </div>
              </DropdownMenuItem>
            )}
            {!conversation.isGroup && counterParty && (
              <DropdownMenuItem
                className="border-b px-4 py-3 border-default"
                onSelect={() => {
                  launchPayUser({
                    user: counterParty,
                    via: 'direct-cast-conversation',
                  });
                }}
              >
                <div className="flex w-full items-center justify-between">
                  <span>Pay</span>
                  <DollarCircleIcon size={16} />
                </div>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="border-b px-4 py-3 border-default"
              onSelect={archive}
            >
              <div className="flex w-full items-center justify-between">
                <span>Archive</span>
                <ArchiveIcon size={16} />
              </div>
            </DropdownMenuItem>
            {autoDeleteMenuEligible && (
              <DirectCastConversationAutoDeleteMenu
                selection={conversation.messageTTLDays}
                open={autoDeleteMenuOpen}
                onSelect={(ttl) => {
                  if (ttl === conversation.messageTTLDays) {
                    setNewMessageTTL(undefined);
                  } else {
                    setNewMessageTTL(ttl);
                    setAnotherVisibleModal('change-ttl');
                  }
                  setMenuOpen(false);
                }}
                onOpenChange={(open) => {
                  setAutoDeleteMenuOpen(open);
                }}
                trigger={
                  <DropdownMenuItem
                    className="border-b px-4 py-3 border-default"
                    onSelect={openAutoDeleteMenu}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span>Auto-delete</span>
                      <ClockIcon size={14} />
                    </div>
                  </DropdownMenuItem>
                }
                showNeverOption={showNeverOption}
              />
            )}
            {conversation.viewerContext.muted ? (
              <DropdownMenuItem
                className="border-b px-4 py-3 border-default"
                onSelect={endSnooze}
              >
                <div className="flex w-full items-center justify-between">
                  <span>Unmute chat</span>
                  <BellIcon size={16} />
                </div>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="border-b px-4 py-3 border-default"
                onSelect={snooze}
              >
                <div className="flex w-full items-center justify-between">
                  <span>Mute chat</span>
                  <BellSlashIcon size={16} />
                </div>
              </DropdownMenuItem>
            )}
            {!conversation.viewerContext.manuallyMarkedUnread && (
              <DropdownMenuItem
                className="border-b px-4 py-3 border-default"
                onSelect={markUnread}
              >
                <div className="flex w-full items-center justify-between">
                  <span>Mark unread</span>
                  <MarkAsUnreadIcon className="ml-0.5 mt-1" />
                </div>
              </DropdownMenuItem>
            )}
            {(conversation.viewerContext.unreadCount > 0 ||
              conversation.viewerContext.manuallyMarkedUnread) && (
              <DropdownMenuItem
                className="border-b px-4 py-3 border-default"
                onSelect={markConversationRead}
              >
                <div className="flex w-full items-center justify-between">
                  <span>Mark read</span>
                  <CheckIcon size={16} />
                </div>
              </DropdownMenuItem>
            )}
            {conversation.isGroup ? (
              <DropdownMenuItem className="px-4 py-3" onSelect={onLeaveClick}>
                <div className="flex w-full items-center justify-between">
                  <span>Leave</span>
                  <SignOutIcon className="ml-0.5 text-danger" />
                </div>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="px-4 py-3"
                onSelect={wrappedDeleteConversation}
                destructive
              >
                <div className="flex w-full items-center justify-between">
                  <span>Delete</span>
                  <TrashIcon size={16} />
                </div>
              </DropdownMenuItem>
            )}
          </>
        )}
        {conversation.viewerContext.category === 'archived' && (
          <>
            <DropdownMenuItem
              className="border-b px-4 py-3 border-default"
              onSelect={unarchive}
            >
              <div className="flex w-full items-center justify-between">
                <span>Unarchive</span>
                <ArchiveIcon size={14} />
              </div>
            </DropdownMenuItem>
            {conversation.isGroup ? (
              <DropdownMenuItem
                className="px-4 py-3"
                onSelect={onLeaveClick}
                destructive
              >
                <div className="flex w-full items-center justify-between">
                  <span>Leave</span>
                  <SignOutIcon className="ml-0.5 text-danger" />
                </div>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="px-4 py-3"
                onSelect={wrappedDeleteConversation}
                destructive
              >
                <div className="flex w-full items-center justify-between">
                  <span>Delete</span>
                  <TrashIcon size={16} />
                </div>
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenu.Content>
      {anotherVisibleModal === 'leave' && (
        <ConfirmationModal
          onCancel={() => {
            setAnotherVisibleModal(undefined);
          }}
          onConfirm={wrappedLeaveConversation}
          title="Leave conversation"
          icon={({ size }) => <SignOutIcon size={size} />}
          body="Are you sure you want to leave? You'll need a new invite to rejoin the conversation."
          confirmText="Leave"
          hideAreYouSure
          destructive
        />
      )}
      {anotherVisibleModal === 'cant-leave' && (
        <CantLeaveGroupModal
          onClose={() => setAnotherVisibleModal(undefined)}
        />
      )}
      {anotherVisibleModal === 'change-ttl' && (
        <ChangeMessageTLLModal
          conversation={conversation as ApiDirectCastConversationInfoV3}
          newMessageTTL={
            newMessageTTL as ApiDirectCastConversationMessageTTLDays
          }
          onClose={() => {
            setAnotherVisibleModal(undefined);
            setNewMessageTTL(undefined);
          }}
        />
      )}
    </DropdownMenu.Root>
  );
}
