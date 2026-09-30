import { ApiFollowNotificationGroup } from 'farcaster-client-data';
import React, { FC, memo } from 'react';

import ActionFollowIcon from '~/assets/icons/action-follow.svg';
import { usePush } from '~/hooks/navigation/usePush';

import { NotificationGroupHeading } from './shared/NotificationGroupHeading';
import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';
import { NotificationIcon } from './shared/NotificationIcon';

type FollowNotificationGroupProps = {
  group: ApiFollowNotificationGroup;
};

const FollowNotificationGroup: FC<FollowNotificationGroupProps> = memo(
  ({ group }) => {
    const push = usePush();

    return (
      <NotificationGroupOuterContainer
        group={group}
        onPress={() => {
          push('NotificationActorsInGroup', {
            groupId: group.id,
            type: group.type,
          });
        }}
      >
        <NotificationIcon variant="blue">
          {(iconColor) => (
            <ActionFollowIcon
              color={iconColor}
              fill={iconColor}
              style={{
                color: iconColor,
                fill: iconColor,
                transform: [{ rotateY: '180deg' }],
              }}
              size={24}
            />
          )}
        </NotificationIcon>
        <NotificationGroupInnerContainer>
          <NotificationGroupHeading
            actors={group.previewItems.map(({ actor }) => actor)}
            groupId={group.id}
            predicate="followed you"
            totalItemCount={group.totalItemCount}
            type={group.type}
          />
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  },
);

FollowNotificationGroup.displayName = 'FollowNotificationGroup';

export { FollowNotificationGroup };
