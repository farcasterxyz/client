import { Octicons } from '@expo/vector-icons';
import { ApiChannelRoleAcceptNotificationGroup } from 'farcaster-client-data';
import React, { FC, memo, useMemo } from 'react';

import { PersonCircleIcon } from '~/components/images/PersonCircleIcon';
import { NotificationGroupHeading } from '~/components/NotificationGroup/shared/NotificationGroupHeading';
import { Text2 } from '~/components/Text';
import { usePush } from '~/hooks/navigation/usePush';

import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';
import { NotificationIcon } from './shared/NotificationIcon';

type ChannelRoleAcceptNotificationGroupProps = {
  group: ApiChannelRoleAcceptNotificationGroup;
};

const ChannelRoleAcceptNotificationGroup: FC<ChannelRoleAcceptNotificationGroupProps> =
  memo(({ group }) => {
    const push = usePush();

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

      return (
        <>
          {isAre} now {roleString} of{' '}
          <Text2 weight="bold">/{channel.key}</Text2>
        </>
      );
    }, [channel.key, group.totalItemCount, role]);

    return (
      <NotificationGroupOuterContainer
        group={group}
        onPress={() => {
          push('ChannelManageMembers', {
            channelKey: channel.key,
          });
        }}
      >
        <NotificationIcon variant="purple">
          {(iconColor) =>
            role === 'member' ? (
              <PersonCircleIcon color={iconColor} size={18} />
            ) : (
              <Octicons
                name="shield-check"
                size={17}
                color={iconColor}
                style={{ marginTop: 2 }}
              />
            )
          }
        </NotificationIcon>
        <NotificationGroupInnerContainer>
          <NotificationGroupHeading
            actors={group.previewItems.map(({ actor }) => actor)}
            groupId={group.id}
            predicate={headerSuffix}
            totalItemCount={group.totalItemCount}
            type={group.type}
          />
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  });
ChannelRoleAcceptNotificationGroup.displayName =
  'ChannelRoleAcceptNotificationGroup';

export { ChannelRoleAcceptNotificationGroup };
