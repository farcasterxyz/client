import { SyncIcon } from '@primer/octicons-react';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiRecastNotificationGroup } from 'farcaster-client-data';
import { useTrackEvent } from 'farcaster-client-hooks';
import { FC, memo } from 'react';

import { LinkToConversation } from '~/components/links/LinkToConversation';
import { NotificationAvatars } from '~/components/notifications/shared/NotificationAvatars';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { NotificationGroupUserNames } from '~/components/notifications/shared/NotificationGroupUserNames';
import { NotificationIcon } from '~/components/notifications/shared/NotificationIcon';
import { useNavigateToConversation } from '~/hooks/navigation/useNavigateToConversation';

import { NOTIFICATION_ICON_SIZE } from './NotificationConstants';
import { NotificationGroupCastText } from './shared/NotificationGroupCastText';

type RecastNotificationGroupProps = {
  notificationGroup: ApiRecastNotificationGroup;
};

const RecastNotificationGroup: FC<RecastNotificationGroupProps> = memo(
  ({ notificationGroup }) => {
    const { trackEvent } = useTrackEvent();

    const recastedCast = notificationGroup.previewItems[0].content.recastedCast;
    const navigateToConversation = useNavigateToConversation();

    return (
      <NotificationGroupContainer
        notificationGroup={notificationGroup}
        onClick={() => {
          const cast = notificationGroup.previewItems[0].content.recastedCast;
          navigateToConversation({
            castHash: cast.hash,
            authorUsername: cast.author.username,
          });
        }}
      >
        <LinkToConversation
          className="absolute inset-0"
          cast={recastedCast}
          title="View cast"
          stopPropagation={true}
          onClick={() => {
            trackEvent(AnalyticsEvent.ClickNotification, {
              type: notificationGroup.type,
            });
          }}
        />
        <NotificationIcon variant="green">
          <SyncIcon size={NOTIFICATION_ICON_SIZE} className="mb-px" />
        </NotificationIcon>
        <div className="w-full min-w-0">
          <NotificationAvatars notificationGroup={notificationGroup} />
          <NotificationGroupUserNames
            notificationGroup={notificationGroup}
            predicate="recasted your cast"
          />
          <NotificationGroupCastText cast={recastedCast} />
        </div>
      </NotificationGroupContainer>
    );
  },
);

RecastNotificationGroup.displayName = 'RecastNotificationGroup';

export { RecastNotificationGroup };
