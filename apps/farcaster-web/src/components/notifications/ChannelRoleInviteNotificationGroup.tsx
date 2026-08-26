import { ShieldCheckIcon } from '@primer/octicons-react';
import {
  ApiChannelRoleInviteNotificationGroup,
  ApiChannelUserInviteRole,
  ApiNotificationChannelRoleInvite,
} from 'farcaster-client-data';
import {
  formatChannelFollowerCount,
  renderChannelKey,
} from 'farcaster-client-hooks';
import { FC, memo, useMemo } from 'react';

import { PersonCircleIcon } from '~/components/casts/actions/icons/PersonCircleIcon';
import { ChannelImage } from '~/components/channelsV3/ChannelImage';
import { ChannelMembersYouKnow } from '~/components/channelsV3/ChannelMembersYouKnow';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { NotificationIcon } from '~/components/notifications/shared/NotificationIcon';
import { useNavigateToChannel } from '~/hooks/navigation/useNavigateToChannel';
import { useNavigateToNotificationChannelRoleInvites } from '~/hooks/navigation/useNavigateToNotificationGroupChannelRoleInvites';
import { useRespondToChannelInvite } from '~/hooks/useRespondToChannelInvite';
import { toast } from '~/utils/toast';

import { NOTIFICATION_ICON_SIZE } from './NotificationConstants';

type ChannelRoleInviteNotificationGroupProps = {
  group: ApiChannelRoleInviteNotificationGroup;
};

const ChannelRoleInviteNotificationGroup: FC<ChannelRoleInviteNotificationGroupProps> =
  memo(({ group }) => {
    // We can have a case where we have many total items but only 1 preview item, e.g.
    // if the user has accepted the other (and they were removed) but didn't refresh the
    // notifications feed. Only show a single invite if it's really one, otherwise
    // show the summary which know what to do.
    if (group.previewItems.length === 1 && group.totalItemCount === 1) {
      return (
        <ChannelRoleInviteNotification
          notif={group.previewItems[0]}
          isUnread={group.isUnread}
        />
      );
    } else {
      return <ChannelRoleInviteNotificationsSummary group={group} />;
    }
  });
ChannelRoleInviteNotificationGroup.displayName =
  'ChannelRoleInviteNotificationGroup';

ChannelRoleInviteNotificationGroup.displayName =
  'ChannelRoleInviteNotificationGroup';

const ChannelRoleInviteNotificationsSummary: FC<ChannelRoleInviteNotificationGroupProps> =
  memo(({ group }) => {
    const navigateToNotificationChannelRoleInvites =
      useNavigateToNotificationChannelRoleInvites();

    const invites = useMemo(() => group.previewItems, [group.previewItems]);
    const firstChannel = useMemo(
      () => (invites.length === 0 ? undefined : invites[0].content.channel),
      [invites],
    );

    const role = useMemo(() => {
      if (invites.length === 0) {
        // Being here means the user accepted all the preview invites but we still have some for which
        // we have no preview, which means we don't have a good source for the role. So we take
        // the role from the group id since it's the rollup key
        const idParts = group.id.split(':');
        return idParts[idParts.length - 1] as ApiChannelUserInviteRole;
      } else {
        return invites[0].content.role;
      }
    }, [group.id, invites]);

    const totalInvites = useMemo(
      () => group.totalItemCount,
      [group.totalItemCount],
    );

    const channelsText = useMemo(() => {
      if (invites.length === 2 && totalInvites === 2) {
        return (
          <>
            <span className="font-bold">
              {renderChannelKey(invites[0].content.channel.key)}
            </span>
            {' and '}
            <span className="font-bold">
              {renderChannelKey(invites[1].content.channel.key)}
            </span>
          </>
        );
      } else if (firstChannel) {
        // totalInvites is > 1 otherwise we would have rendered the single invite component
        return (
          <>
            <span className="font-bold">
              {renderChannelKey(firstChannel.key)}
            </span>{' '}
            and {totalInvites - 1} other channels
          </>
        );
      } else if (totalInvites > 1) {
        return <>{totalInvites} channels</>;
      } else {
        return <>{totalInvites} channel</>;
      }
    }, [firstChannel, invites, totalInvites]);

    return (
      <NotificationGroupContainer
        notificationGroup={group}
        onClick={({ openInNewTab }) => {
          navigateToNotificationChannelRoleInvites({
            groupId: group.id,
            openInNewTab,
          });
        }}
      >
        <NotificationIcon variant="purple">
          {role === 'member' ? (
            <PersonCircleIcon size={NOTIFICATION_ICON_SIZE} />
          ) : (
            <ShieldCheckIcon size={NOTIFICATION_ICON_SIZE} />
          )}
        </NotificationIcon>
        <div className="w-full min-w-0">
          <div>
            You are invited to become a {role} of {channelsText}
          </div>
          {firstChannel && (
            <div className="mt-2 rounded-lg border bg-app-light p-3 border-default dark:bg-app-dark">
              <div className="flex flex-row items-start gap-2">
                <ChannelImage
                  channelImageUrl={firstChannel.fastImageUrl}
                  size="notification"
                />
                <div className="flex flex-1 flex-col self-center">
                  <span className="font-semibold">/{firstChannel.key}</span>
                  {firstChannel.followerCount && (
                    <span className="text-xs text-faint">
                      {formatChannelFollowerCount(firstChannel.followerCount)}
                    </span>
                  )}
                </div>
                <div className="flex size-8 items-center justify-center self-start rounded-full text-xs bg-hover">
                  +{totalInvites - 1}
                </div>
              </div>
              {firstChannel.description && (
                <div className="mt-2 text-sm text-muted">
                  {firstChannel.description}
                </div>
              )}
              <ChannelMembersYouKnow channel={firstChannel} />
            </div>
          )}
        </div>
      </NotificationGroupContainer>
    );
  });
ChannelRoleInviteNotificationsSummary.displayName =
  'ChannelRoleInviteNotificationsSummary';

interface ChannelRoleInviteNotificationProps {
  notif: ApiNotificationChannelRoleInvite;
  isUnread?: boolean;
}

const ChannelRoleInviteNotification: FC<ChannelRoleInviteNotificationProps> =
  memo(({ notif, isUnread }) => {
    const navigateToChannel = useNavigateToChannel();

    const { accept, decline } = useRespondToChannelInvite();

    const channel = notif.content.channel;
    const role = notif.content.role;

    return (
      <NotificationGroupContainer
        notificationGroup={{ type: 'channel-role-invite', isUnread }}
        onClick={({ openInNewTab }) => {
          navigateToChannel({ channelKey: channel.key, openInNewTab });
        }}
      >
        <NotificationIcon variant="purple">
          {role === 'member' ? (
            <PersonCircleIcon size={NOTIFICATION_ICON_SIZE} />
          ) : (
            <ShieldCheckIcon size={NOTIFICATION_ICON_SIZE} />
          )}
        </NotificationIcon>
        <div className="w-full min-w-0">
          You are invited to become a {role}
          <div className="mt-2 rounded-lg border bg-app-light p-3 border-default dark:bg-app-dark">
            <div className="flex flex-row items-start gap-2">
              <ChannelImage
                channelImageUrl={channel.fastImageUrl}
                size="notification"
              />
              <div className="flex flex-1 flex-col self-center">
                <span className="font-semibold">/{channel.key}</span>
                {channel.followerCount && (
                  <span className="text-xs text-faint">
                    {formatChannelFollowerCount(channel.followerCount)}
                  </span>
                )}
              </div>
              <div className="flex flex-row gap-2">
                <DefaultButton
                  variant="inverted"
                  onClick={async (e) => {
                    e.stopPropagation();

                    await decline({
                      channelKey: channel.key,
                      role,
                      location: 'invite notification',
                    });

                    toast({
                      message: `Declined ${role} invitation for ${channel.name}`,
                    });
                  }}
                >
                  Decline
                </DefaultButton>
                <DefaultButton
                  variant="normal"
                  onClick={async (e) => {
                    e.stopPropagation();

                    await accept({
                      channelKey: channel.key,
                      role,
                      location: 'invite notification',
                    });

                    toast({
                      message: `You are now a ${role} of ${channel.name}`,
                    });
                  }}
                >
                  Accept
                </DefaultButton>
              </div>
            </div>
            {channel.description && (
              <div className="mt-2 text-sm text-muted">
                {channel.description}
              </div>
            )}
            <ChannelMembersYouKnow channel={channel} />
          </div>
        </div>
      </NotificationGroupContainer>
    );
  });
ChannelRoleInviteNotification.displayName = 'ChannelRoleInviteNotification';

export { ChannelRoleInviteNotificationGroup };
