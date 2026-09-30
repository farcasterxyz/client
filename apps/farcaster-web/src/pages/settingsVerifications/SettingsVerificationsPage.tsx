import { AnalyticsEvent } from 'farcaster-analytics';
import React from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { SettingsPageContent } from '~/components/page/SettingsPageContent';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { SettingsNav } from '~/layouts/SettingsNav';

const SettingsVerificationsPage = React.memo(() => {
  const { trackEvent } = useAnalytics();

  React.useEffect(() => {
    trackEvent(AnalyticsEvent.ViewAccountVerificationScreen, {});
  }, [trackEvent]);

  return (
    <Page meta={{ title: 'Starter Packs / Farcaster' }}>
      <div className="border-default sm:border-x">
        <PageHeader hideCastButton>
          <PageTitle>Settings</PageTitle>
        </PageHeader>
      </div>
      <BorderedMainContent className="flex flex-row">
        <SettingsNav />
        <SettingsPageContent>
          <div className="mb-4 flex flex-col">
            <span className="mb-2 font-semibold">Verifications</span>
            <div className="mb-4 text-muted">
              <p className="pb-3">
                Adding verifications improves your score which qualifies you for
                better rewards and boosts in the algorithm.
              </p>
              <p className="pb-3">Available on Farcaster mobile app!</p>
            </div>
          </div>
        </SettingsPageContent>
      </BorderedMainContent>
    </Page>
  );
});

SettingsVerificationsPage.displayName = 'SettingsVerificationsPage';

export { SettingsVerificationsPage };
