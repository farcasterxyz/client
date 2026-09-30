import { ShieldCheckIcon } from '@primer/octicons-react';
import { ApiChannelRoleAcceptNotificationGroup } from 'farcaster-client-data';
import { FC, memo, useMemo } from 'react';

import { PersonCircleIcon } from '~/components/casts/actions/icons/PersonCircleIcon';
import { NotificationAvatars } from '~/components/notifications/shared/NotificationAvatars';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { NotificationGroupUserNames } from '~/components/notifications/shared/NotificationGroupUserNames';
import { NotificationIcon } from '~/components/notifications/shared/NotificationIcon';
import { useNavigate } from '~/hooks/navigation/useNavigate';

type ChannelRoleAcceptNotificationGroupProps = {
  group: ApiChannelRoleAcceptNotificationGroup;
};

const ChannelRoleAcceptNotificationGroup: FC<ChannelRoleAcceptNotificationGroupProps> =
  memo(({ group }) => {
    const navigate = useNavigate();

    const channel = useMemo(
      () => group.previewItems[0].content.channel,
      [group.previewItems],
    );

    const role = useMemo(
      () => group.previewItems[0].content.role,
      [group.previewItems],
    );

    const headerSuffix = useMemo(() => {
      const isAre = group.totalItemCount === 1 ? 'is' : 'are';
      const roleString = group.totalItemCount === 1 ? `a ${role}` : `${role}s`;

      return `${isAre} now ${roleString} of ${channel.name}`;
    }, [channel.name, group.totalItemCount, role]);

    return (
      <NotificationGroupContainer
        notificationGroup={group}
        onClick={() => {
          navigate({
            to: 'channelSettingsSection',
            params: { channelKey: channel.key, section: 'members' },
          });
        }}
      >
        <NotificationIcon variant="purple">
          {role === 'member' ? (
            <PersonCircleIcon size={24} />
          ) : (
            <ShieldCheckIcon size={24} />
          )}
        </NotificationIcon>
        <div className="w-full min-w-0">
          <NotificationAvatars notificationGroup={group} />
          <NotificationGroupUserNames
            notificationGroup={group}
            predicate={headerSuffix}
          />
        </div>
      </NotificationGroupContainer>
    );
  });
ChannelRoleAcceptNotificationGroup.displayName =
  'ChannelRoleAcceptNotificationGroup';

export { ChannelRoleAcceptNotificationGroup };
