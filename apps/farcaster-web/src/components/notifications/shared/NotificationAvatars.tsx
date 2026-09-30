import cn from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiNotificationGroup, ApiUserMinimal } from 'farcaster-client-data';
import { useGloballyCachedUser, useTrackEvent } from 'farcaster-client-hooks';
import uniqBy from 'lodash/uniqBy';
import { FC, memo, useMemo } from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { AvatarImage } from '~/components/avatar/AvatarImage';
import { FollowButton } from '~/components/forms/buttons/FollowButton';
import { LinkToProfileWithSummaryTooltip } from '~/components/links/LinkToProfileWithSummaryTooltip';
import { useNotificationGroupUsers } from '~/hooks/notifications/useNotificationGroupUsers';

const maxNumAvatars = 8;

type NotificationAvatarsProps = {
  notificationGroup: ApiNotificationGroup;
};

const NotificationAvatars: FC<NotificationAvatarsProps> = memo(
  ({ notificationGroup }) => {
    const { trackEvent } = useTrackEvent();

    const { users } = useNotificationGroupUsers({ notificationGroup });

    const globallyCachedCoreUser = useGloballyCachedUser({
      fallback: users[0],
    });

    const visibleUsers = useMemo(
      () => uniqBy(users, ({ fid }) => fid).slice(0, maxNumAvatars),
      [users],
    );

    const shouldShowFollowButton = useMemo(() => {
      return (
        visibleUsers.length === 1 &&
        typeof globallyCachedCoreUser.viewerContext?.following !==
          'undefined' &&
        !globallyCachedCoreUser.viewerContext?.following
      );
    }, [visibleUsers.length, globallyCachedCoreUser.viewerContext?.following]);

    return (
      <div className="flex flex-row items-center justify-between">
        <div className="mb-1 flex flex-row">
          {visibleUsers.map((user, index) => (
            <Avatar
              user={user}
              size="sm"
              className={cn(index > 0 && 'ml-1')}
              key={user.fid}
              withDetailsPopover={true}
              hideFollowButton={true}
              onClick={() => {
                trackEvent(AnalyticsEvent.ClickNotification, {
                  type: notificationGroup.type,
                  action: 'avatar',
                });
              }}
            />
          ))}
        </div>
        {shouldShowFollowButton && (
          <FollowButton user={globallyCachedCoreUser} slim={true} />
        )}
      </div>
    );
  },
);

type NotificationAvatarsMinimalProps = {
  users: ApiUserMinimal[];
  groupType: ApiNotificationGroup['type'];
};

const NotificationAvatarsMinimal: FC<NotificationAvatarsMinimalProps> = memo(
  ({ users, groupType }) => {
    const { trackEvent } = useTrackEvent();

    const visibleUsers = useMemo(
      () => uniqBy(users, ({ fid }) => fid).slice(0, maxNumAvatars),
      [users],
    );

    return (
      <div className="flex flex-row items-center justify-between">
        <div className="mb-1 flex flex-row">
          {visibleUsers.map((user, index) => (
            <LinkToProfileWithSummaryTooltip
              title={user.displayName}
              user={user}
              key={user.fid}
              onClick={() => {
                trackEvent(AnalyticsEvent.ClickNotification, {
                  type: groupType,
                  action: 'avatar',
                });
              }}
            >
              <AvatarImage
                size="sm"
                imgUrl={user.pfp?.url}
                imgAlt={`${user.displayName} avatar`}
                className={cn(index > 0 && 'ml-1')}
              />
            </LinkToProfileWithSummaryTooltip>
          ))}
        </div>
      </div>
    );
  },
);

NotificationAvatars.displayName = 'NotificationAvatars';
NotificationAvatarsMinimal.displayName = 'NotificationAvatarsMinimal';

export { NotificationAvatars, NotificationAvatarsMinimal };
