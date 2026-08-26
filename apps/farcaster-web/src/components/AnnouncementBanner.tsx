import { LinkExternalIcon } from '@primer/octicons-react';
import { AnalyticsEvent } from 'farcaster-analytics';
import React from 'react';

import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useExternalNavigate } from '~/hooks/navigation/useExternalNavigate';

import { DefaultButton } from './forms/buttons/DefaultButton';

const AnnouncementBanner: React.FC = React.memo(() => {
  const { trackEvent } = useAnalytics();
  const navigate = useExternalNavigate();

  const onLearnMoreClick = React.useCallback(() => {
    trackEvent(AnalyticsEvent.ClickAd, { campaign: 'farcon' });

    navigate({ to: 'https://farcon.xyz/', openInNewTab: true });
  }, [navigate, trackEvent]);

  return (
    <div className="mt-3 hidden rounded-lg px-2 py-3 pt-1.5 bg-overlay-light mdlg:block">
      <div className="px-2 py-1 text-lg font-semibold">FarCon 2024</div>
      <div className="mb-1 px-2 py-1 text-sm text-muted">
        Moving Farcaster from URL to IRL. May 2-5, 2024 in Venice Beach, CA.
      </div>
      <DefaultButton
        variant="muted"
        className="flex w-full flex-row items-center justify-center"
        onClick={onLearnMoreClick}
      >
        Learn More <LinkExternalIcon size={12} className="ml-1 text-faint" />
      </DefaultButton>
    </div>
  );
});

AnnouncementBanner.displayName = 'AnnouncementBanner';

export { AnnouncementBanner };
