import { AlertIcon } from '@primer/octicons-react';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiChannelWarningNotificationGroup } from 'farcaster-client-data';
import { useTrackEvent } from 'farcaster-client-hooks';
import React, { FC, memo } from 'react';

import { LinkToChannel } from '~/components/links/LinkToChannel';
import { NOTIFICATION_ICON_SIZE } from '~/components/notifications/NotificationConstants';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { NotificationIcon } from '~/components/notifications/shared/NotificationIcon';
import { useNavigateToConversation } from '~/hooks/navigation/useNavigateToConversation';

import { NotificationGroupCastText } from './shared/NotificationGroupCastText';

type ChannelWarningNotificationGroupProps = {
  notificationGroup: ApiChannelWarningNotificationGroup;
};

const ChannelWarningNotificationGroup: FC<ChannelWarningNotificationGroupProps> =
  memo(({ notificationGroup }) => {
    const { trackEvent } = useTrackEvent();

    const body = notificationGroup.previewItems[0].content.cast;

    const navigateToCast = useNavigateToConversation();

    const channelKey =
      notificationGroup.previewItems[0].content.cast.channel?.key ?? '';

    return (
      <NotificationGroupContainer
        notificationGroup={notificationGroup}
        onClick={() => {
          navigateToCast({
            castHash: body.hash,
            authorUsername: body.author.username,
          });
        }}
      >
        <NotificationIcon variant="red">
          <AlertIcon size={NOTIFICATION_ICON_SIZE} />
        </NotificationIcon>
        <div className="w-full min-w-0">
          <div className="flex flex-row flex-wrap space-x-1">
            <div className="text-default">
              Your cast does not follow the norms for
            </div>
            <LinkToChannel
              title={channelKey}
              channelKey={channelKey}
              onClick={() => {
                trackEvent(AnalyticsEvent.ClickNotification, {
                  type: notificationGroup.type,
                  action: 'channel',
                });
              }}
            >
              <span className="font-semibold text-default hover:underline">
                /{channelKey}
              </span>
            </LinkToChannel>
          </div>
          <NotificationGroupCastText cast={body} />
        </div>
      </NotificationGroupContainer>
    );
  });

ChannelWarningNotificationGroup.displayName = 'ChannelWarningNotificationGroup';

export { ChannelWarningNotificationGroup };
