import { AnalyticsEvent } from 'farcaster-analytics';
import { EventingProvider } from 'farcaster-client-hooks';
import React, { Suspense } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { useEmbeddedWalletBridge } from '~/components/EmbeddedWallet';
import { FeedHeader } from '~/components/feeds/FeedHeader';
import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useSearchParams } from '~/hooks/navigation/useSearchParams';
import { HomeFeedPageContent } from '~/lazy/pages';

const ProUpsellPage: React.FC = React.memo(() => {
  const { navigate: navigateInWallet } = useEmbeddedWalletBridge();

  const { trackEvent } = useAnalytics();

  const { ref } = useSearchParams('proUpsell');

  React.useEffect(() => {
    trackEvent(AnalyticsEvent.FarcasterProUpsellRefTrigger, { ref });

    navigateInWallet({
      path: 'FarcasterProFullScreenUpsell',
      params: {},
    });
  }, [navigateInWallet, ref, trackEvent]);

  return (
    <Page meta={{ title: 'Farcaster / Home' }}>
      <BorderedMainContent>
        <PageHeader footer={<FeedHeader defaultFeedTab="home" tab="home" />}>
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

ProUpsellPage.displayName = 'ProUpsellPage';

export { ProUpsellPage };
