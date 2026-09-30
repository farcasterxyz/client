import {
  ApiNotificationRecast,
  ApiRecastNotificationGroup,
} from 'farcaster-client-data';
import React, { FC, memo } from 'react';

import ActionRecastIcon from '~/assets/icons/action-recast.svg';
import { usePush } from '~/hooks/navigation/usePush';

import { NotificationGroupCastText } from './shared/NotificationGroupCastText';
import { NotificationGroupHeading } from './shared/NotificationGroupHeading';
import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';
import { NotificationIcon } from './shared/NotificationIcon';

type RecastNotificationGroupProps = {
  group: ApiRecastNotificationGroup;
};

const RecastNotificationGroup: FC<RecastNotificationGroupProps> = memo(
  ({ group }) => {
    const push = usePush();
    const firstPreviewItem = group.previewItems[0] as ApiNotificationRecast;

    return (
      <NotificationGroupOuterContainer
        group={group}
        onPress={() => {
          push('Cast', {
            castHash: firstPreviewItem.content.recastedCast.hash,
          });
        }}
      >
        <NotificationIcon variant="green">
          {(iconColor) => <ActionRecastIcon size={24} color={iconColor} />}
        </NotificationIcon>
        <NotificationGroupInnerContainer>
          <NotificationGroupHeading
            actors={group.previewItems.map(({ actor }) => actor)}
            groupId={group.id}
            predicate="recasted your cast"
            totalItemCount={group.totalItemCount}
            type={group.type}
          />
          <NotificationGroupCastText
            cast={firstPreviewItem.content.recastedCast}
          />
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  },
);

RecastNotificationGroup.displayName = 'RecastNotificationGroup';

export { RecastNotificationGroup };
