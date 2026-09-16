import { Ionicons } from '@expo/vector-icons';
import {
  ApiCastMentionNotificationGroup,
  ApiNotificationCastMention,
} from 'farcaster-client-data';
import React, { FC, memo } from 'react';

import { Cast } from '~/components/casts/Cast';
import { usePush } from '~/hooks/navigation/usePush';

import { NotificationAccessoryBackground } from './shared/NotificationAccessoryBackground';
import { NotificationGroupCastText } from './shared/NotificationGroupCastText';
import { NotificationGroupHeading } from './shared/NotificationGroupHeading';
import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';
import { NotificationIcon } from './shared/NotificationIcon';

type CastMentionNotificationGroupProps = {
  group: ApiCastMentionNotificationGroup;
};

const CastMentionNotificationGroup: FC<CastMentionNotificationGroupProps> =
  memo(({ group }) => {
    const push = usePush();
    const firstPreviewItem = group
      .previewItems[0] as ApiNotificationCastMention;

    const mentionCast = React.useMemo(
      () =>
        firstPreviewItem.type === 'cast-mention'
          ? firstPreviewItem.content.cast
          : undefined,
      [firstPreviewItem],
    );

    if (mentionCast) {
      return (
        <Cast
          cast={mentionCast}
          omitMenuActions={true}
          isHighlighted={group.isUnread}
        />
      );
    }

    return (
      <NotificationGroupOuterContainer
        group={group}
        onPress={() => {
          push('Cast', {
            castHash: firstPreviewItem.content.cast.hash,
          });
        }}
      >
        <NotificationIcon variant="blue">
          {(iconColor, backgroundColor) => (
            <NotificationAccessoryBackground backgroundColor={backgroundColor}>
              <Ionicons
                name="at-outline"
                size={18}
                style={[{ color: iconColor }]}
              />
            </NotificationAccessoryBackground>
          )}
        </NotificationIcon>
        <NotificationGroupInnerContainer>
          <NotificationGroupHeading
            actors={group.previewItems.map(({ actor }) => actor)}
            groupId={group.id}
            predicate="mentioned you in a cast"
            totalItemCount={group.totalItemCount}
            type={group.type}
          />
          <NotificationGroupCastText cast={firstPreviewItem.content.cast} />
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  });

CastMentionNotificationGroup.displayName = 'CastMentionNotificationGroup';

export { CastMentionNotificationGroup };
