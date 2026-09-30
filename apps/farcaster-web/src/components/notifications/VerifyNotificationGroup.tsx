import { LinkIcon } from '@primer/octicons-react';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiVerifyNotificationGroup } from 'farcaster-client-data';
import { useTrackEvent } from 'farcaster-client-hooks';
import { FC, memo, useCallback } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { NotificationGroupContainer } from '~/components/notifications/shared/NotificationGroupContainer';
import { NotificationIcon } from '~/components/notifications/shared/NotificationIcon';
import { useExternalNavigate } from '~/hooks/navigation/useExternalNavigate';
import { useComposeVerificationUrl } from '~/hooks/verifications/useComposeVerificationUrl';

import { NOTIFICATION_ICON_SIZE } from './NotificationConstants';

type VerifyNotificationGroupProps = {
  notificationGroup: ApiVerifyNotificationGroup;
};

const VerifyNotificationGroup: FC<VerifyNotificationGroupProps> = memo(
  ({ notificationGroup }) => {
    const { trackEvent } = useTrackEvent();

    const navigate = useExternalNavigate();

    const composeVerificationUrl = useComposeVerificationUrl();

    const onConnectClick = useCallback(async () => {
      const url = await composeVerificationUrl();
      navigate({ to: url, openInNewTab: true });
    }, [composeVerificationUrl, navigate]);

    return (
      <NotificationGroupContainer
        notificationGroup={notificationGroup}
        onClick={() => {
          onConnectClick();
        }}
      >
        <NotificationIcon variant="blue">
          <LinkIcon size={NOTIFICATION_ICON_SIZE} />
        </NotificationIcon>
        <div className="flex flex-col self-center">
          <span className="mb-1 font-semibold">
            1 day remaining to re-connect your Ethereum address!
          </span>
          <span className="mb-2">
            Please re-connect your Ethereum address to ensure you're eligible
            for the Active Badge, ENS, DAO notifications and other upcoming
            onchain features.
          </span>
          <DefaultButton
            className="w-min"
            variant="normal"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              trackEvent(AnalyticsEvent.ClickNotification, {
                type: notificationGroup.type,
                action: 'connect',
              });

              onConnectClick();
            }}
          >
            Connect
          </DefaultButton>
        </div>
      </NotificationGroupContainer>
    );
  },
);

VerifyNotificationGroup.displayName = 'VerifyNotificationGroup';

export { VerifyNotificationGroup };
