import { BellFillIcon } from '@primer/octicons-react';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiNewCastInChannelNotificationGroup } from 'farcaster-client-data';
import { resolveUsernameShort, useTrackEvent } from 'farcaster-client-hooks';
import React from 'react';

import { FarcasterProBadge } from '~/components/badges/FarcasterProBadge';
import { LinkToChannel } from '~/components/links/LinkToChannel';
import { LinkToProfileWithSummaryTooltip } from '~/components/links/LinkToProfileWithSummaryTooltip';
import { NotificationAvatars } from '~/components/notifications/shared/NotificationAvatars';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { NotificationIcon } from '~/components/notifications/shared/NotificationIcon';
import { useUserLevel } from '~/hooks/data/useUserLevel';
import { useNavigateToNotificationGroupCasts } from '~/hooks/navigation/useNavigateToNotificationGroupCasts';
import { useNotificationGroupUsers } from '~/hooks/notifications/useNotificationGroupUsers';

import { NOTIFICATION_ICON_SIZE } from './NotificationConstants';

type NewCastInChannelNotificationGroupProps = {
  notificationGroup: ApiNewCastInChannelNotificationGroup;
};

const NewCastInChannelNotificationGroup: React.FC<NewCastInChannelNotificationGroupProps> =
  React.memo(({ notificationGroup }) => {
    const { trackEvent } = useTrackEvent();

    const navigateToNotificationGroup = useNavigateToNotificationGroupCasts();
    const { users, totalCount } = useNotificationGroupUsers({
      notificationGroup,
    });

    const firstCast = React.useMemo(() => {
      return notificationGroup.previewItems[0].content.cast;
    }, [notificationGroup.previewItems]);

    const [firstUser] = users;

    const othersText = React.useMemo(() => {
      const othersCount = totalCount - 1;
      if (othersCount <= 0) {
        return '';
      }

      if (othersCount === 1) {
        return '1 other';
      }

      return `${othersCount} others`;
    }, [totalCount]);

    const userIsProUser = useUserLevel(firstUser) === 'pro';

    return (
      <NotificationGroupContainer
        notificationGroup={notificationGroup}
        onClick={() => {
          navigateToNotificationGroup({
            groupId: notificationGroup.id,
            type: notificationGroup.type,
          });
        }}
      >
        <NotificationIcon
          variant="blue"
          channelImageUrl={firstCast.channel?.imageUrl}
        >
          <BellFillIcon size={NOTIFICATION_ICON_SIZE} />
        </NotificationIcon>
        <div className="w-full min-w-0">
          <NotificationAvatars notificationGroup={notificationGroup} />
          <div className="line-clamp-2 flex flex-row items-center gap-1 break-gracefully">
            <LinkToProfileWithSummaryTooltip
              title={resolveUsernameShort(firstUser)}
              user={firstUser}
              className="relative font-semibold text-default hover:underline"
              onClick={() => {
                trackEvent(AnalyticsEvent.ClickNotification, {
                  type: notificationGroup.type,
                  action: 'author',
                });
              }}
            >
              {resolveUsernameShort(firstUser)}
            </LinkToProfileWithSummaryTooltip>
            {userIsProUser && <FarcasterProBadge size={14} />}
            {othersText !== '' ? `and ${othersText} ` : ''}casted in{' '}
            <span className="font-semibold">
              <LinkToChannel
                title={firstCast?.channel?.name ?? ''}
                channelKey={firstCast?.channel?.key ?? ''}
                onClick={() => {
                  trackEvent(AnalyticsEvent.ClickNotification, {
                    type: notificationGroup.type,
                    action: 'channel',
                  });
                }}
              >
                <span className="font-semibold text-default hover:underline">
                  {firstCast?.channel?.name}
                </span>
              </LinkToChannel>
            </span>
          </div>
        </div>
      </NotificationGroupContainer>
    );
  });

NewCastInChannelNotificationGroup.displayName =
  'NewCastInChannelNotificationGroup';

export { NewCastInChannelNotificationGroup };
