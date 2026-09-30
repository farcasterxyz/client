import { SunIcon } from '@primer/octicons-react';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiDormantUserNewCastNotificationGroup } from 'farcaster-client-data';
import { resolveUsernameShort, useTrackEvent } from 'farcaster-client-hooks';
import React from 'react';

import { LinkToProfileWithSummaryTooltip } from '~/components/links/LinkToProfileWithSummaryTooltip';
import { NotificationAvatars } from '~/components/notifications/shared/NotificationAvatars';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { NotificationIcon } from '~/components/notifications/shared/NotificationIcon';
import { useNavigateToNotificationGroupCasts } from '~/hooks/navigation/useNavigateToNotificationGroupCasts';
import { useNotificationGroupUsers } from '~/hooks/notifications/useNotificationGroupUsers';

type DormantUserNewCastNotificationGroupProps = {
  notificationGroup: ApiDormantUserNewCastNotificationGroup;
};

const DormantUserNewCastNotificationGroup: React.FC<DormantUserNewCastNotificationGroupProps> =
  React.memo(({ notificationGroup }) => {
    const { trackEvent } = useTrackEvent();

    const navigateToNotificationGroup = useNavigateToNotificationGroupCasts();
    const { users, totalCount } = useNotificationGroupUsers({
      notificationGroup,
    });

    const [firstUser] = users;

    const othersText = React.useMemo(() => {
      const othersCount = totalCount - 1;
      if (othersCount <= 0) {
        return ' ';
      }

      if (othersCount === 1) {
        return ' and 1 other ';
      }

      return ` and ${othersCount} others `;
    }, [totalCount]);

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
        <NotificationIcon variant="yellow">
          <SunIcon size="small" />
        </NotificationIcon>
        <div className="w-full min-w-0">
          <NotificationAvatars notificationGroup={notificationGroup} />
          <div className="line-clamp-2 break-gracefully">
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
            {othersText}casted for the first time in a while
          </div>
        </div>
      </NotificationGroupContainer>
    );
  });

DormantUserNewCastNotificationGroup.displayName =
  'DormantUserNewCastNotificationGroup';

export { DormantUserNewCastNotificationGroup };
