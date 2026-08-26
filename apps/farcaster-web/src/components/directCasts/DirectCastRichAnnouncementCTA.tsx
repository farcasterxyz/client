import { LinkExternalIcon } from '@primer/octicons-react';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiRichAnnouncementDirectCastMessagePayload } from 'farcaster-client-data';
import React from 'react';

import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useExternalNavigate } from '~/hooks/navigation/useExternalNavigate';

type DirectCastRichAnnouncementCTAProps = {
  payload: ApiRichAnnouncementDirectCastMessagePayload['payload'];
};

const DirectCastRichAnnouncementCTA: React.FC<DirectCastRichAnnouncementCTAProps> =
  React.memo(({ payload }) => {
    const { trackEvent } = useAnalytics();

    const navigate = useExternalNavigate();

    const onClick = React.useCallback(() => {
      trackEvent(AnalyticsEvent.ClickDirectCastAnnouncementCTA, {
        title: payload.actionTitle,
        target: payload.actionTarget,
      });

      navigate({ to: payload.actionTarget, openInNewTab: true });
    }, [navigate, payload.actionTarget, payload.actionTitle, trackEvent]);

    return (
      <div
        className="hover:bg-action-primary/95 cursor-pointer items-center justify-center rounded-lg rounded-t-none p-2 text-center bg-action-primary"
        onClick={onClick}
      >
        <span className="flex w-full flex-row items-center justify-center space-x-2 font-semibold text-light">
          <LinkExternalIcon size={12} />
          <span>{payload.actionTitle}</span>
        </span>
      </div>
    );
  });

DirectCastRichAnnouncementCTA.displayName = 'DirectCastRichAnnouncementCTA';

export { DirectCastRichAnnouncementCTA };
