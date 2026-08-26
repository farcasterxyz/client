import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiConnectAccountNotificationGroup } from 'farcaster-client-data';
import { useGetXAuthLink } from 'farcaster-client-hooks';
import React from 'react';

import { XTopHatIcon } from '~/components/casts/actions/icons/XTopHatIcon';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { NotificationIcon } from '~/components/notifications/shared/NotificationIcon';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useExternalNavigate } from '~/hooks/navigation/useExternalNavigate';

type ConnectAccountNotificationGroupProps = {
  notificationGroup: ApiConnectAccountNotificationGroup;
};

const ConnectAccountNotificationGroup: React.FC<ConnectAccountNotificationGroupProps> =
  React.memo(({ notificationGroup }) => {
    const { trackEvent } = useAnalytics();

    const externalNavigate = useExternalNavigate();

    const getXAuthLink = useGetXAuthLink();

    const onNotificationClick = React.useCallback(async () => {
      trackEvent(AnalyticsEvent.SendUserToXToAuth, {
        via: 'notification',
      });

      const { result } = await getXAuthLink();

      externalNavigate({ to: result.url, openInNewTab: true });
    }, [externalNavigate, getXAuthLink, trackEvent]);

    return (
      <NotificationGroupContainer
        notificationGroup={notificationGroup}
        onClick={onNotificationClick}
      >
        <NotificationIcon variant="gray">
          <XTopHatIcon />
        </NotificationIcon>
        <div className="group w-full min-w-0">
          <div className="line-clamp-2 font-semibold break-gracefully">
            Connect your X (formerly Twitter) account
          </div>
          <div className="line-clamp-3 text-sm text-muted break-gracefully">
            Reach more users by verifying that you own an X account.
          </div>
        </div>
      </NotificationGroupContainer>
    );
  });

ConnectAccountNotificationGroup.displayName = 'ConnectAccountNotificationGroup';

export { ConnectAccountNotificationGroup };
