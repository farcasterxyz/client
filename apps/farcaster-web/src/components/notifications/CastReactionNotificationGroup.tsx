import { HeartFillIcon } from '@primer/octicons-react';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiCastReactionNotificationGroup } from 'farcaster-client-data';
import { useTrackEvent } from 'farcaster-client-hooks';
import { FC, memo } from 'react';

import { LinkToConversation } from '~/components/links/LinkToConversation';
import { NOTIFICATION_ICON_SIZE } from '~/components/notifications/NotificationConstants';
import { NotificationAvatars } from '~/components/notifications/shared/NotificationAvatars';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { NotificationGroupUserNames } from '~/components/notifications/shared/NotificationGroupUserNames';
import { NotificationIcon } from '~/components/notifications/shared/NotificationIcon';
import { useNavigateToConversation } from '~/hooks/navigation/useNavigateToConversation';

import { NotificationGroupCastText } from './shared/NotificationGroupCastText';

type CastReactionyNotificationGroupProps = {
  notificationGroup: ApiCastReactionNotificationGroup;
};

const CastReactionNotificationGroup: FC<CastReactionyNotificationGroupProps> =
  memo(({ notificationGroup }) => {
    const { trackEvent } = useTrackEvent();

    const navigateToConversation = useNavigateToConversation();

    const cast = notificationGroup.previewItems[0].content.cast;

    return (
      <NotificationGroupContainer
        notificationGroup={notificationGroup}
        onClick={() => {
          navigateToConversation({
            castHash: cast.hash,
            authorUsername: cast.author.username,
          });
        }}
      >
        <LinkToConversation
          className="absolute inset-0"
          cast={cast}
          title="View cast"
          stopPropagation={true}
          onClick={() => {
            trackEvent(AnalyticsEvent.ClickNotification, {
              type: notificationGroup.type,
            });
          }}
        />
        <NotificationIcon variant="red">
          <HeartFillIcon size={NOTIFICATION_ICON_SIZE} />
        </NotificationIcon>
        <div className="w-full min-w-0">
          <NotificationAvatars notificationGroup={notificationGroup} />
          <NotificationGroupUserNames
            notificationGroup={notificationGroup}
            predicate="liked your cast"
          />
          <NotificationGroupCastText cast={cast} />
        </div>
      </NotificationGroupContainer>
    );
  });

CastReactionNotificationGroup.displayName = 'CastReactionNotificationGroup';

export { CastReactionNotificationGroup };
