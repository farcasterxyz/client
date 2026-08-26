import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiCollectibleCastWatchAvailableNotificationGroup,
  ApiNotificationCollectibleCastWatchAvailable,
  CastHashPrefix,
} from 'farcaster-client-data';
import { formatTimeAgo, useTrackEvent } from 'farcaster-client-hooks';
import { Sparkle } from 'lucide-react';
import React, { FC, memo, useCallback } from 'react';

import { useNavigate } from '~/hooks/navigation/useNavigate';

import { NOTIFICATION_ICON_SIZE } from './NotificationConstants';
import { NotificationGroupCastText } from './shared/NotificationGroupCastText';
import { NotificationGroupContainer } from './shared/NotificationGroupContainer';
import { NotificationIcon } from './shared/NotificationIcon';

type CollectibleCastWatchAvailableNotificationGroupProps = {
  group: ApiCollectibleCastWatchAvailableNotificationGroup;
};

const CollectibleCastWatchAvailableNotificationGroup: FC<CollectibleCastWatchAvailableNotificationGroupProps> =
  memo(({ group }) => {
    const navigate = useNavigate();
    const { trackEvent } = useTrackEvent();

    const firstPreviewItem = group
      .previewItems[0] as ApiNotificationCollectibleCastWatchAvailable;

    const handlePress = useCallback(() => {
      trackEvent(AnalyticsEvent.ClickNotification, {
        type: group.id,
        action: 'cast',
      });
      navigate({
        to: 'conversationWithUsername',
        params: {
          username: firstPreviewItem.content.cast.author.username ?? '',
          castHashPrefix: firstPreviewItem.content.cast.hash.slice(
            0,
            10,
          ) as CastHashPrefix,
        },
      });
    }, [
      firstPreviewItem.content.cast.author.username,
      firstPreviewItem.content.cast.hash,
      group.id,
      navigate,
      trackEvent,
    ]);

    let creatorUsername = firstPreviewItem.content.cast.author.username;
    if (creatorUsername) {
      creatorUsername = creatorUsername.endsWith('s')
        ? `${creatorUsername}'`
        : `${creatorUsername}'s`;
    }
    const label = `${creatorUsername} cast is now available for auction`;

    return (
      <NotificationGroupContainer
        notificationGroup={group}
        onClick={() => handlePress()}
      >
        <NotificationIcon variant="green">
          <Sparkle size={NOTIFICATION_ICON_SIZE} className="fill-green" />
        </NotificationIcon>
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex w-full flex-row items-start justify-between gap-x-1">
            <div className="font-semibold text-default">{label}</div>
            <div className="text-faint">
              {formatTimeAgo(firstPreviewItem.timestamp, 'floor')}
            </div>
          </div>
          <NotificationGroupCastText cast={firstPreviewItem.content.cast} />
        </div>
      </NotificationGroupContainer>
    );
  });

CollectibleCastWatchAvailableNotificationGroup.displayName =
  'CollectibleCastWatchAvailableNotificationGroup';

export { CollectibleCastWatchAvailableNotificationGroup };
