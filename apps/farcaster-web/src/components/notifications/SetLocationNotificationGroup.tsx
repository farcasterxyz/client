import { LocationIcon } from '@primer/octicons-react';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiSetLocationNotificationGroup } from 'farcaster-client-data';
import { useTrackEvent } from 'farcaster-client-hooks';
import { FC, memo, useCallback } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { NotificationIcon } from '~/components/notifications/shared/NotificationIcon';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useNavigate } from '~/hooks/navigation/useNavigate';

import { NOTIFICATION_ICON_SIZE } from './NotificationConstants';

type SetLocationNotificationGroupProps = {
  notificationGroup: ApiSetLocationNotificationGroup;
};

const SetLocationNotificationGroup: FC<SetLocationNotificationGroupProps> =
  memo(({ notificationGroup }) => {
    const { trackEvent } = useTrackEvent();
    const currentUser = useCurrentUser();

    const navigate = useNavigate();

    const onSetLocationClick = useCallback(async () => {
      navigate({
        to: 'profileCastsWithUsername',
        params: { username: currentUser.username || '' },
      });
    }, [currentUser.username, navigate]);

    return (
      <NotificationGroupContainer
        notificationGroup={notificationGroup}
        onClick={() => {
          onSetLocationClick();
        }}
      >
        <NotificationIcon variant="blue">
          <LocationIcon size={NOTIFICATION_ICON_SIZE} className="mb-px" />
        </NotificationIcon>
        <div className="flex flex-col self-center">
          <span className="mb-1 font-semibold">
            Find other Farcasters nearby
          </span>
          <span className="mb-2">
            By setting your location, you'll get a list of other Farcasters
            nearby and updates whenever someone you follow comes to your city.
          </span>
          <DefaultButton
            className="w-min"
            variant="normal"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              trackEvent(AnalyticsEvent.ClickNotification, {
                type: notificationGroup.type,
              });

              onSetLocationClick();
            }}
          >
            Set location
          </DefaultButton>
        </div>
      </NotificationGroupContainer>
    );
  });

SetLocationNotificationGroup.displayName = 'SetLocationNotificationGroup';

export { SetLocationNotificationGroup };
