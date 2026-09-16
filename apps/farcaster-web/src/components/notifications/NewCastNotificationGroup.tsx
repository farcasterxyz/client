import { BellFillIcon } from '@primer/octicons-react';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiNewCastNotificationGroup } from 'farcaster-client-data';
import { resolveUsernameShort, useTrackEvent } from 'farcaster-client-hooks';
import React from 'react';

import { FarcasterProBadge } from '~/components/badges/FarcasterProBadge';
import { LinkToProfileWithSummaryTooltip } from '~/components/links/LinkToProfileWithSummaryTooltip';
import { NotificationAvatars } from '~/components/notifications/shared/NotificationAvatars';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { NotificationIcon } from '~/components/notifications/shared/NotificationIcon';
import { useUserLevel } from '~/hooks/data/useUserLevel';
import { useNavigateToNotificationGroupCasts } from '~/hooks/navigation/useNavigateToNotificationGroupCasts';
import { useNotificationGroupUsers } from '~/hooks/notifications/useNotificationGroupUsers';

import { NOTIFICATION_ICON_SIZE } from './NotificationConstants';

type NewCastNotificationGroupProps = {
  notificationGroup: ApiNewCastNotificationGroup;
};

const NewCastNotificationGroup: React.FC<NewCastNotificationGroupProps> =
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
        return '';
      }

      if (othersCount === 1) {
        return 'and 1 other';
      }

      return `and ${othersCount} others`;
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
        <NotificationIcon variant="blue">
          <BellFillIcon size={NOTIFICATION_ICON_SIZE} />
        </NotificationIcon>
        <div className="w-full min-w-0">
          <NotificationAvatars notificationGroup={notificationGroup} />
          <div className="line-clamp-2 flex flex-row items-center gap-1 break-gracefully">
            New casts from{' '}
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
            {userIsProUser && (
              <FarcasterProBadge size={14} className="ml-[-2px]" />
            )}
            {othersText}
          </div>
        </div>
      </NotificationGroupContainer>
    );
  });

NewCastNotificationGroup.displayName = 'NewCastNotificationGroup';

export { NewCastNotificationGroup };
