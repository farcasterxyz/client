import {
  BellIcon,
  PlusCircleIcon,
  ShieldSlashIcon,
  SignOutIcon,
  StarFillIcon,
  StarIcon,
  XCircleIcon,
} from '@primer/octicons-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ApiChannel } from 'farcaster-client-data';
import {
  useChannelActions,
  useGloballyCachedChannel,
} from 'farcaster-client-hooks';
import { ReactNode, useCallback, useState } from 'react';

import { DropdownMenuItem } from '~/components/dropdownMenu/DropdownMenuItem';
import { BellCheckFillIcon } from '~/components/icons/BellCheckFillIcon';
import { ShieldCheckFillIcon } from '~/components/icons/ShieldCheckFillIcon';
import { ConfirmationModal } from '~/components/modals/ConfirmationModal';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { useUserChannelRole } from '~/hooks/useUserChannelRole';
import { toast } from '~/utils/toast';

type Action = 'notify';

interface ChannelDropdownMenuProps {
  channel: ApiChannel;
  children: ReactNode;
  relationOnly?: boolean;
  hideActions?: Action[];
}

const ChannelDropdownMenu: React.FC<ChannelDropdownMenuProps> = ({
  channel: propsChannel,
  children,
  relationOnly,
  hideActions = [],
}) => {
  const channel = useGloballyCachedChannel({ fallback: propsChannel });
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmRemoveSelfMod, setConfirmRemoveSelfMod] = useState(false);

  const {
    favorited,
    toggleFavorited,
    notified,
    toggleNotified,
    following,
    toggleFollowing,
    removeModerator,
    removeMember,
  } = useChannelActions({
    channel,
    fid: currentUser.fid,
    location: 'channel header drop down',
  });

  const shouldShow = (action: Action) => !hideActions.includes(action);
  const onConfirmLeaveChannel = useCallback(async () => {
    try {
      setConfirmLeave(false);
      await removeMember();
    } catch (e) {
      toast({ message: 'Failed to leave channel', type: 'error' });
    }
  }, [removeMember]);

  const onConfirmRemoveSelfAsMod = useCallback(async () => {
    try {
      setConfirmRemoveSelfMod(false);
      await removeModerator();
    } catch (e) {
      toast({ message: 'Failed to remove self as moderator', type: 'error' });
    }
  }, [removeModerator]);

  const channelRole = useUserChannelRole(channel);

  const isOwner = channelRole === 'owner';
  const isMod = channelRole === 'moderator';
  const isMember = channelRole !== null;
  const canLeaveAsMember = isMember && !(isOwner || isMod);
  const canLeaveAsMod = isMod && !isOwner;
  const canManageChannel = isMod || isOwner;

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger onClick={(e) => e.stopPropagation()} asChild>
          {children}
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            side="bottom"
            sideOffset={10}
            align="end"
            onClick={(e) => e.stopPropagation()}
            className="outline-hidden z-10 w-[240px] divide-y divide-border-gray-light overflow-hidden rounded-lg shadow-lg bg-app dark:divide-border-gray-dark"
            // On close Dropdown trigger gets a focus making it work a bit wierd, disabling it for now.
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            {!relationOnly && (
              <>
                {favorited ? (
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      toggleFavorited();
                    }}
                    name="Unfavorite"
                    icon={<StarFillIcon size={20} />}
                  />
                ) : (
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      toggleFavorited();
                    }}
                    name="Favorite"
                    icon={<StarIcon size={20} />}
                  />
                )}
                {shouldShow('notify') && (
                  <>
                    {notified ? (
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          toggleNotified();
                        }}
                        name="Do not notify"
                        icon={<BellCheckFillIcon size={20} />}
                      />
                    ) : (
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          toggleNotified();
                        }}
                        name="Notify"
                        icon={<BellIcon size={20} />}
                      />
                    )}
                  </>
                )}
              </>
            )}
            {following ? (
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  toggleFollowing();
                }}
                name="Unfollow"
                icon={<XCircleIcon size={20} />}
              />
            ) : (
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  toggleFollowing();
                }}
                name="Follow"
                icon={<PlusCircleIcon size={20} />}
              />
            )}
            {!relationOnly && canManageChannel && (
              <DropdownMenuItem
                onSelect={() => {
                  navigate({
                    to: 'channelSettings',
                    params: { channelKey: channel.key },
                  });
                }}
                name="Manage"
                icon={<ShieldCheckFillIcon size={20} />}
              />
            )}
            {canLeaveAsMember && (
              <DropdownMenuItem
                onSelect={() => {
                  setConfirmLeave(true);
                }}
                name="Leave as member"
                icon={<SignOutIcon size={20} className="text-danger" />}
                destructive
              />
            )}
            {canLeaveAsMod && (
              <DropdownMenuItem
                onSelect={() => {
                  setConfirmRemoveSelfMod(true);
                }}
                name="Remove self as moderator"
                icon={<ShieldSlashIcon size={20} className="text-danger" />}
                destructive
              />
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      {confirmLeave && (
        <ConfirmLeaveAsMember
          close={() => {
            setConfirmLeave(false);
          }}
          confirm={onConfirmLeaveChannel}
        />
      )}
      {confirmRemoveSelfMod && (
        <ConfirmRemoveSelfAsMod
          close={() => {
            setConfirmRemoveSelfMod(false);
          }}
          confirm={onConfirmRemoveSelfAsMod}
        />
      )}
    </>
  );
};

ChannelDropdownMenu.displayName = 'ChannelDropdownMenu';

function ConfirmLeaveAsMember({
  close,
  confirm,
}: {
  confirm: () => void;
  close: () => void;
}) {
  return (
    <ConfirmationModal
      onBackdropClose={() => {
        close();
      }}
      onCancel={() => {
        close();
      }}
      onConfirm={confirm}
      title="Leave channel"
      confirmText="Leave"
      destructive
      icon={({ size }) => <SignOutIcon size={size} />}
      body={
        <>
          By removing yourself from this channel, you will lose access to
          casting in this channel, and any replies you've made will be hidden
          from other members.
        </>
      }
    />
  );
}

function ConfirmRemoveSelfAsMod({
  close,
  confirm,
}: {
  confirm: () => void;
  close: () => void;
}) {
  return (
    <ConfirmationModal
      onBackdropClose={() => {
        close();
      }}
      onCancel={() => {
        close();
      }}
      onConfirm={confirm}
      title="Remove self as moderator"
      confirmText="Remove"
      destructive
      icon={({ size }) => <ShieldSlashIcon size={size} />}
      body={
        <>
          You will no longer be able to manage channel members or invite links.
          You will still have access to the channel as a regular member.
        </>
      }
    />
  );
}

export { ChannelDropdownMenu };
