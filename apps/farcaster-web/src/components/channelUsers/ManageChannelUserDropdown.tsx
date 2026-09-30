import { ShieldSlashIcon } from '@primer/octicons-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ApiChannelUser, ApiUser } from 'farcaster-client-data';
import {
  resolveUsername,
  resolveUsernameShort,
  useChannelUserAbilities,
  useInviteToModerateChannel,
  useRemoveChannelMember,
  useRemoveChannelModerator,
  useUnbanUserFromChannel,
} from 'farcaster-client-hooks';
import { ReactElement, useCallback, useMemo, useState } from 'react';

import { InviteToChannelMenuItem } from '~/components/channels/InviteToChannelDropdownMenuItem';
import { DropdownMenuItem } from '~/components/dropdownMenu/DropdownMenuItem';
import { PersonXIcon } from '~/components/icons/PersonXIcon';
import { ConfirmationModal } from '~/components/modals/ConfirmationModal';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useNavigateToProfile } from '~/hooks/navigation/useNavigateToProfile';
import { useSendMessageToUser } from '~/hooks/useSendMessageToUser';
import { useChannelModOrOwner } from '~/hooks/useUserChannelRole';
import { trackError } from '~/utils/errorUtils';
import { toast } from '~/utils/toast';

export function ManageChannelUserDropdown({
  channelKey,
  channelUser,
  children,
}: {
  channelKey: string;
  channelUser: ApiChannelUser;
  children: ReactElement;
}) {
  const [showRemoveModerator, setShowRemoveModerator] = useState(false);
  const [showRemoveMember, setShowRemoveMember] = useState(false);
  const [showUnbanUser, setShowUnbanUser] = useState(false);

  const currentUser = useCurrentUser();
  const viewerRole = useChannelModOrOwner(channelKey);
  const isSelf = currentUser.fid === channelUser.user.fid;
  const abilities = useChannelUserAbilities({
    viewerFid: currentUser.fid,
    viewerRole,
    targetFid: channelUser.user.fid,
    targetRole: channelUser.channelContext.role,
    targetBanned: channelUser.channelContext.banned,
  });

  const navigateToProfile = useNavigateToProfile();
  const sendMessage = useSendMessageToUser();

  const inviteToModerate = useInviteToModerateChannel();
  const inviteToMod = useCallback(async () => {
    try {
      await inviteToModerate({
        channelKey,
        fid: channelUser.user.fid,
      });
    } catch (e) {
      trackError(new Error('Failed to invite to moderate', { cause: e }));
      toast({
        message: 'Failed to invite user to moderate',
        type: 'error',
      });
    }
  }, [inviteToModerate, channelKey, channelUser.user.fid]);

  const confirmRemoveModerator = useCallback(() => {
    setShowRemoveModerator(true);
    setShowRemoveMember(false);
    setShowUnbanUser(false);
  }, []);

  const confirmRemoveMember = useCallback(() => {
    setShowRemoveModerator(false);
    setShowRemoveMember(true);
    setShowUnbanUser(false);
  }, []);

  const confirmUnbanUser = useCallback(() => {
    setShowRemoveModerator(false);
    setShowRemoveMember(false);
    setShowUnbanUser(true);
  }, []);

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="cursor-pointer">
          {children}
        </DropdownMenu.Trigger>

        <DropdownMenu.Content
          side="bottom"
          align="end"
          className="outline-hidden z-20 min-w-32 rounded-md border p-1 shadow-lg bg-app border-default"
          // prevent focus from returning to kebab, outline looks weird after action is taken
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DropdownMenuItem
            onSelect={() => {
              navigateToProfile({ user: channelUser.user });
            }}
          >
            View profile
          </DropdownMenuItem>
          {!isSelf && (
            <>
              <DropdownMenuItem
                onSelect={() => sendMessage({ user: channelUser.user })}
              >
                Message
              </DropdownMenuItem>
              {abilities.canAddAsMember && (
                <InviteToChannelMenuItem
                  invited={channelUser.channelContext.pendingRole === 'member'}
                  fid={channelUser.user.fid}
                  channelKey={channelKey}
                  username={resolveUsernameShort(channelUser.user)}
                  restricted={channelUser.channelContext.restricted}
                  noIcon
                />
              )}
              {abilities.canAddAsModerator && (
                <DropdownMenuItem onSelect={inviteToMod}>
                  Add as moderator
                </DropdownMenuItem>
              )}
              {abilities.canRemoveAsModerator && (
                <DropdownMenuItem onSelect={confirmRemoveModerator} destructive>
                  Remove moderator
                </DropdownMenuItem>
              )}
              {abilities.canRemoveAsMember && (
                <DropdownMenuItem onSelect={confirmRemoveMember} destructive>
                  Remove member
                </DropdownMenuItem>
              )}
              {abilities.canUnbanFromChannel && (
                <DropdownMenuItem onSelect={confirmUnbanUser}>
                  Unban
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
      {showRemoveModerator && (
        <ConfirmRemoveModeratorModal
          channelKey={channelKey}
          user={channelUser.user}
          close={() => setShowRemoveModerator(false)}
        />
      )}
      {showRemoveMember && (
        <ConfirmRemoveMemberModal
          channelKey={channelKey}
          user={channelUser.user}
          close={() => setShowRemoveMember(false)}
        />
      )}
      {showUnbanUser && (
        <ConfirmUnbanUserModal
          channelKey={channelKey}
          user={channelUser.user}
          close={() => setShowUnbanUser(false)}
        />
      )}
    </>
  );
}

export function ConfirmRemoveMemberModal({
  channelKey,
  user,
  close,
}: {
  channelKey: string;
  user: ApiUser;
  close: () => void;
}) {
  const currentUser = useCurrentUser();
  const removeChannelMember = useRemoveChannelMember();
  const removeMember = useCallback(async () => {
    try {
      close();
      await removeChannelMember({
        channelKey,
        removeFid: user.fid,
        actorFid: currentUser.fid,
      });
    } catch (e) {
      trackError(new Error('Failed to remove member', { cause: e }));
      toast({
        message: 'Failed to remove member',
        type: 'error',
      });
    }
  }, [close, removeChannelMember, channelKey, user.fid, currentUser.fid]);

  return (
    <ConfirmationModal
      onBackdropClose={() => {
        close();
      }}
      onCancel={() => {
        close();
      }}
      onConfirm={removeMember}
      title="Remove member"
      confirmText="Remove"
      destructive
      icon={({ size }) => <ShieldSlashIcon size={size} />}
      body={
        <>
          By removing{' '}
          <span className="font-semibold">{resolveUsername(user)}</span>:
          <ul className="bullets">
            <li>All previous casts will be removed from the channel</li>
            <li>They will not be able to cast in the channel</li>
          </ul>
        </>
      }
    />
  );
}

function ConfirmRemoveModeratorModal({
  channelKey,
  user,
  close,
}: {
  channelKey: string;
  user: ApiUser;
  close: () => void;
}) {
  const currentUser = useCurrentUser();
  const removeChannelModerator = useRemoveChannelModerator();
  const removeModerator = useCallback(async () => {
    try {
      close();
      await removeChannelModerator({
        channelKey,
        fid: user.fid,
        actorFid: currentUser.fid,
      });
    } catch (e) {
      trackError(new Error('Failed to remove moderator', { cause: e }));
      toast({
        message: 'Failed to remove moderator',
        type: 'error',
      });
    }
  }, [close, removeChannelModerator, channelKey, user.fid, currentUser.fid]);

  return (
    <ConfirmationModal
      onBackdropClose={() => {
        close();
      }}
      onCancel={() => {
        close();
      }}
      onConfirm={removeModerator}
      title="Remove moderator"
      confirmText="Remove"
      destructive
      icon={({ size }) => <ShieldSlashIcon size={size} />}
      body={
        <>
          If you remove{' '}
          <span className="font-semibold">{resolveUsername(user)}</span> as a
          moderator, they will no longer be able to manage channel members or
          invite links. They will still have access to the channel as a regular
          member.
        </>
      }
    />
  );
}

function ConfirmUnbanUserModal({
  channelKey,
  user,
  close,
}: {
  channelKey: string;
  user: ApiUser;
  close: () => void;
}) {
  const unbanUserFromChannel = useUnbanUserFromChannel();
  const username = useMemo(() => resolveUsername(user), [user]);
  const unbanUser = useCallback(async () => {
    try {
      close();
      await unbanUserFromChannel({
        channelKey,
        unbanFid: user.fid,
      });
      toast({ message: `${username} was unbanned` });
    } catch (e) {
      trackError(new Error('Failed to unban user', { cause: e }));
      toast({
        message: 'Failed to unban user',
        type: 'error',
      });
    }
  }, [close, unbanUserFromChannel, channelKey, user.fid, username]);

  return (
    <ConfirmationModal
      onBackdropClose={() => {
        close();
      }}
      onCancel={() => {
        close();
      }}
      onConfirm={unbanUser}
      title="Unban from channel"
      confirmText="Unban"
      icon={PersonXIcon}
      body={
        <>
          <span className="font-semibold">{username}</span> will be able to
          reply to casts and all existing replies will be unhidden
        </>
      }
    />
  );
}
