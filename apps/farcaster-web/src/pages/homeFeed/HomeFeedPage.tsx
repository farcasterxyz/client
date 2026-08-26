import { EventingProvider } from 'farcaster-client-hooks';
import React, { useState } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { FullScreenErrorBoundary } from '~/components/errors/FullScreenErrorBoundary';
import { FeedHeader } from '~/components/feeds/FeedHeader';
import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { DepositBonusModal } from '~/components/modals/DepositBonusModal';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useHomeLastSelectedTab } from '~/contexts/HomeLastSelectedTabProvider';
import { useStandaloneMode } from '~/contexts/StandaloneModeProvider';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { useSearchParams } from '~/hooks/navigation/useSearchParams';
import { FollowingPage } from '~/lazy/pages';
import {
  openHomeFeedSession,
  scheduleHomeFeedSessionClose,
} from '~/utils/homeFeedSessionTracking';

import { HomeFeedPageContent } from './HomeFeedPageContent';

const HomeFeedPage = React.memo(() => {
  const isSignedIn = useIsSignedIn();

  if (!isSignedIn) {
    return (
      <Page
        meta={{
          title: 'Farcaster / Home',
          description: 'A decentralized social network',
          canonical: 'https://farcaster.xyz',
          twitterCard: 'summary',
        }}
      >
        <BorderedMainContent>
          <PageHeader footer={undefined}>
            <PageTitle>Home</PageTitle>
          </PageHeader>
          <EventingProvider on="home" channel="home">
            <React.Suspense fallback={<FullScreenLoadingIndicator />}>
              <FullScreenErrorBoundary>
                <HomeFeedPageContent />
              </FullScreenErrorBoundary>
            </React.Suspense>
          </EventingProvider>
        </BorderedMainContent>
      </Page>
    );
  }

  return <HomeFeedTabbed />;
});

HomeFeedPage.displayName = 'HomeFeedPage';

function HomeFeedTabbed() {
  const { inStandaloneMode } = useStandaloneMode();

  const { trackEvent } = useAnalytics();

  const { defaultFeed, feedKey } = useHomeLastSelectedTab();

  const searchParams = useSearchParams('homeFeed');
  const [showDepositBonusesModal, setShowDepositBonusesModal] =
    useState<boolean>(searchParams?.launchDepositBonusesInfo === 'true');

  const handleCloseDepositBonusesModal = React.useCallback(() => {
    setShowDepositBonusesModal(false);
  }, []);

  React.useEffect(() => {
    const props = {
      standalone: inStandaloneMode,
    };

    if (feedKey !== 'home') {
      scheduleHomeFeedSessionClose({ trackEvent });
      return;
    }

    const openSession = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      openHomeFeedSession({
        trackEvent,
        props,
      });
    };

    openSession();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        openSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [feedKey, inStandaloneMode, trackEvent]);

  if (feedKey === 'following') {
    return <FollowingPage />;
  }

  return (
    <Page
      meta={{
        title: 'Farcaster / Home',
        description: 'A decentralized social network',
        canonical: 'https://farcaster.xyz',
        twitterCard: 'summary',
      }}
    >
      <BorderedMainContent>
        <PageHeader
          footer={<FeedHeader defaultFeedTab={defaultFeed} tab="home" />}
        >
          <PageTitle>Home</PageTitle>
        </PageHeader>
        <EventingProvider on="home" key="home">
          <React.Suspense fallback={<FullScreenLoadingIndicator />}>
            <FullScreenErrorBoundary>
              <HomeFeedPageContent />
            </FullScreenErrorBoundary>
          </React.Suspense>
        </EventingProvider>
      </BorderedMainContent>
      {showDepositBonusesModal && (
        <DepositBonusModal onClose={handleCloseDepositBonusesModal} />
      )}
    </Page>
  );
}

export { HomeFeedPage };
