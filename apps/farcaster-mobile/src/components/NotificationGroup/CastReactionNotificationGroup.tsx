import {
  ApiCastReactionNotificationGroup,
  ApiNotificationCastReaction,
} from 'farcaster-client-data';
import React, { FC, memo } from 'react';

import ActionLikeIcon from '~/assets/icons/action-like.svg';
import { usePush } from '~/hooks/navigation/usePush';

import { NotificationGroupCastText } from './shared/NotificationGroupCastText';
import { NotificationGroupHeading } from './shared/NotificationGroupHeading';
import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';
import { NotificationIcon } from './shared/NotificationIcon';

type CastReactionNotificationGroupProps = {
  group: ApiCastReactionNotificationGroup;
};

const CastReactionNotificationGroup: FC<CastReactionNotificationGroupProps> =
  memo(({ group }) => {
    const push = usePush();
    const firstPreviewItem = group
      .previewItems[0] as ApiNotificationCastReaction;
    return (
      <NotificationGroupOuterContainer
        group={group}
        onPress={() => {
          push('Cast', {
            castHash: firstPreviewItem.content.reaction.castHash,
          });
        }}
      >
        <NotificationIcon variant="red">
          {(iconColor) => (
            <ActionLikeIcon size={24} fill={iconColor} color={iconColor} />
          )}
        </NotificationIcon>
        <NotificationGroupInnerContainer>
          <NotificationGroupHeading
            actors={group.previewItems.map(({ actor }) => actor)}
            groupId={group.id}
            predicate="liked your cast"
            totalItemCount={group.totalItemCount}
            type={group.type}
          />
          <NotificationGroupCastText cast={firstPreviewItem.content.cast} />
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  });

CastReactionNotificationGroup.displayName = 'CastReactionNotificationGroup';

export { CastReactionNotificationGroup };
