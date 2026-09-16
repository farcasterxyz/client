import { AnalyticsEvent } from 'farcaster-analytics';
import React, { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { Tab } from '~/components/tabs/Tab';
import { Tabs } from '~/components/tabs/Tabs';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { BookmarksPage, StarterPacksPage } from '~/lazy/pages';
type SavedTab = 'bookmarks' | 'starter-packs';

const SavedPage: React.FC = React.memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();

  const activeTab: SavedTab = useMemo(() => {
    if (location.pathname.endsWith('/starter-packs')) {
      return 'starter-packs';
    }
    return 'bookmarks';
  }, [location.pathname]);

  useEffect(() => {
    if (activeTab === 'starter-packs') {
      trackEvent(AnalyticsEvent.ViewSavedStarterPacksTab, {});
    } else {
      trackEvent(AnalyticsEvent.ViewSavedBookmarksTab, {});
    }
  }, [activeTab, trackEvent]);

  return (
    <Page meta={{ title: 'Saved' }}>
      <BorderedMainContent>
        <PageHeader hideCastButton>
          <PageTitle>Saved</PageTitle>
        </PageHeader>
        <Tabs>
          <button
            type="button"
            className="flex size-full items-center justify-center text-inherit"
            onClick={() => navigate({ to: 'saved', params: {} })}
          >
            <Tab isFocused={activeTab === 'bookmarks'}>Bookmarks</Tab>
          </button>
          <button
            type="button"
            className="flex size-full items-center justify-center text-inherit"
            onClick={() => navigate({ to: 'savedStarterPacks', params: {} })}
          >
            <Tab isFocused={activeTab === 'starter-packs'}>Starter Packs</Tab>
          </button>
        </Tabs>
        {activeTab === 'bookmarks' && <BookmarksPage />}
        {activeTab === 'starter-packs' && <StarterPacksPage />}
      </BorderedMainContent>
    </Page>
  );
});

export { SavedPage };
