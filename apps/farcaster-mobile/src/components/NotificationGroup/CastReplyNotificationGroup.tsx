import { Ionicons } from '@expo/vector-icons';
import {
  ApiCastReplyNotificationGroup,
  ApiNotificationCastReply,
} from 'farcaster-client-data';
import React, { FC, memo } from 'react';

import { Cast } from '~/components/casts/Cast';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { usePush } from '~/hooks/navigation/usePush';

import { NotificationGroupCastText } from './shared/NotificationGroupCastText';
import { NotificationGroupHeading } from './shared/NotificationGroupHeading';
import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';
import { NotificationIcon } from './shared/NotificationIcon';

type CastReplyNotificationGroupProps = {
  group: ApiCastReplyNotificationGroup;
};

const CastReplyNotificationGroup: FC<CastReplyNotificationGroupProps> = memo(
  ({ group }) => {
    const { fid: currentUserFid } = useCurrentUser_UNSAFE();
    const push = usePush();
    const firstPreviewItem = group.previewItems[0] as ApiNotificationCastReply;

    const replyCast = React.useMemo(
      () =>
        firstPreviewItem.type === 'cast-reply'
          ? firstPreviewItem.content.cast
          : undefined,
      [firstPreviewItem],
    );

    if (replyCast) {
      const notADirectReply = replyCast.parentAuthor?.fid !== currentUserFid;

      return (
        <Cast
          cast={replyCast}
          omitMenuActions={true}
          prefixReplyingToWithYou={notADirectReply}
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
        <NotificationIcon variant="purple">
          {(iconColor) => (
            <Ionicons
              name="chatbox-outline"
              size={18}
              style={[{ color: iconColor, marginTop: 2 }]}
            />
          )}
        </NotificationIcon>
        <NotificationGroupInnerContainer>
          <NotificationGroupHeading
            actors={group.previewItems.map(({ actor }) => actor)}
            groupId={group.id}
            predicate="replied to your cast"
            totalItemCount={group.totalItemCount}
            type={group.type}
          />
          <NotificationGroupCastText cast={firstPreviewItem.content.cast} />
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  },
);

CastReplyNotificationGroup.displayName = 'CastReplyNotificationGroup';

export { CastReplyNotificationGroup };
