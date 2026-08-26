import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiNotificationGroup } from 'farcaster-client-data';
import { resolveUsernameShort, useTrackEvent } from 'farcaster-client-hooks';
import { FC, memo, ReactNode, useMemo } from 'react';

import { FarcasterProBadge } from '~/components/badges/FarcasterProBadge';
import { LinkToNotificationGroupUsers } from '~/components/links/LinkToNotificationGroupUsers';
import { LinkToProfileWithSummaryTooltip } from '~/components/links/LinkToProfileWithSummaryTooltip';
import { useUserLevel } from '~/hooks/data/useUserLevel';
import { useNotificationGroupUsers } from '~/hooks/notifications/useNotificationGroupUsers';

type NotificationGroupUserNamesProps =
  | {
      notificationGroup: ApiNotificationGroup;
      predicate: ReactNode;
      title?: string;
    }
  | {
      notificationGroup: ApiNotificationGroup;
      singularPredicate: ReactNode;
      pluralPredicate: ReactNode;
      title?: string;
    };

const NotificationGroupUserNames: FC<NotificationGroupUserNamesProps> = memo(
  ({ notificationGroup, ...props }) => {
    const { trackEvent } = useTrackEvent();

    const { users, totalCount } = useNotificationGroupUsers({
      notificationGroup,
    });

    const [firstUser] = users;

    const othersText = useMemo(() => {
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
      <div className="flex flex-1 flex-row items-center gap-1">
        <LinkToProfileWithSummaryTooltip
          title={resolveUsernameShort(firstUser)}
          user={firstUser}
          className="relative font-semibold text-default hover:underline"
          onClick={() => {
            trackEvent(AnalyticsEvent.ClickNotification, {
              type: notificationGroup.type,
              action: 'actor',
            });
          }}
        >
          {resolveUsernameShort(firstUser)}
        </LinkToProfileWithSummaryTooltip>
        {userIsProUser && <FarcasterProBadge size={14} />}
        {totalCount > 1 && (
          <>
            and{' '}
            <LinkToNotificationGroupUsers
              notificationGroup={notificationGroup}
              title={props.title || othersText}
              className="cursor-pointer font-semibold text-default hover:underline"
              onClick={() => {
                trackEvent(AnalyticsEvent.ClickNotification, {
                  type: notificationGroup.type,
                  action: 'actors',
                });
              }}
            >
              {othersText}
            </LinkToNotificationGroupUsers>{' '}
          </>
        )}
        {'predicate' in props
          ? props.predicate
          : users.length === 1
            ? props.singularPredicate
            : props.pluralPredicate}
      </div>
    );
  },
);

NotificationGroupUserNames.displayName = 'NotificationGroupUserNames';

export { NotificationGroupUserNames };
