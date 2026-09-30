import { AnalyticsEvent } from 'farcaster-analytics';
import React, { FC, Suspense, useEffect } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';

import { ExplorePageHeader } from './ExplorePageHeader';

const AppsPage: FC = () => {
  const { trackEvent } = useAnalytics();

  const isSignedIn = useIsSignedIn();

  useEffect(() => {
    trackEvent(AnalyticsEvent.ViewAllChannels, undefined);
  }, [trackEvent]);

  return (
    <Page meta={{ title: `Explore Farcaster` }}>
      <BorderedMainContent>
        <PageHeader
          footer={
            isSignedIn ? <ExplorePageHeader focusedTab="apps" /> : undefined
          }
        >
          <PageTitle>{'Explore Farcaster'}</PageTitle>
        </PageHeader>
        <Suspense fallback={<FullScreenLoadingIndicator />}>
          <div className="m-4 flex flex-col items-center space-y-8">
            <span className="text-muted">
              Live on mobile. Coming soon to web.
            </span>
          </div>
        </Suspense>
      </BorderedMainContent>
    </Page>
  );
};

AppsPage.displayName = 'AppsPage';

export { AppsPage };
