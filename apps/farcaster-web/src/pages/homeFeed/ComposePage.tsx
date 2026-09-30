import { AnalyticsEvent } from 'farcaster-analytics';
import { EventingProvider } from 'farcaster-client-hooks';
import { memo, Suspense, useEffect } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { FeedHeader } from '~/components/feeds/FeedHeader';
import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { useSearchParams } from '~/hooks/navigation/useSearchParams';

import { HomeFeedPageContent } from './HomeFeedPageContent';

const ComposePage = memo(() => {
  const isSignedIn = useIsSignedIn();

  const { trackEvent } = useAnalytics();

  const params = useSearchParams('compose');

  useEffect(() => {
    trackEvent(AnalyticsEvent.ComposeCast, undefined);
  }, [trackEvent]);

  const headerFooter = isSignedIn ? (
    <FeedHeader defaultFeedTab="home" tab="home" />
  ) : undefined;

  return (
    <Page
      meta={{
        title: 'Farcaster / Home',
        canonical: 'https://farcaster.xyz',
      }}
    >
      <BorderedMainContent>
        <PageHeader footer={headerFooter} composeSearchParams={params}>
          <PageTitle>Home</PageTitle>
        </PageHeader>
        <EventingProvider on="home" channel="home">
          <Suspense fallback={<FullScreenLoadingIndicator />}>
            <HomeFeedPageContent />
          </Suspense>
        </EventingProvider>
      </BorderedMainContent>
    </Page>
  );
});

ComposePage.displayName = 'ComposePage';

export { ComposePage };
