import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiRankedMiniApp } from 'farcaster-client-data';
import { useTopMiniApps } from 'farcaster-client-hooks';
import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import { DiscoverHeader } from '~/components/apps/AppsHeader';
import { TrendingMiniAppListItem } from '~/components/apps/TrendingMiniAppListItem';
import { TrendingMiniApps } from '~/components/apps/TrendingMiniApps';
import { YourAppsContent } from '~/components/apps/YourAppsContent';
import { BorderedMainContent } from '~/components/BorderedMainContent';
import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { Page } from '~/components/page/Page';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
type AppsTab = 'trending' | 'your-apps';

const AppsPage = () => {
  const { trackEvent } = useAnalytics();
  const location = useLocation();

  const currentTab: AppsTab = useMemo(() => {
    if (location.pathname.endsWith('/your-apps')) {
      return 'your-apps';
    }
    return 'trending';
  }, [location.pathname]);

  useEffect(() => {
    trackEvent(AnalyticsEvent.ViewAppsPage, {});
  }, [trackEvent]);

  useEffect(() => {
    if (currentTab === 'your-apps') {
      trackEvent(AnalyticsEvent.ViewAppsYourAppsTab, {});
    } else {
      trackEvent(AnalyticsEvent.ViewAppsTrendingTab, {});
    }
  }, [currentTab, trackEvent]);

  const {
    data: topMiniAppsData,
    onEndReached: onEndReachedTopFrames,
    isLoading: isLoadingTopFrames,
  } = useTopMiniApps({
    limit: 50,
  });

  const topMiniAppsFlat = useMemo(
    () => topMiniAppsData as unknown as ApiRankedMiniApp[],
    [topMiniAppsData],
  );

  const trendingContent = (
    <div className="flex flex-col">
      <TrendingMiniApps
      // period={trendingPeriod}
      // onPeriodChange={setTrendingPeriod}
      />
      <div className="flex flex-col">
        <FlatList
          data={topMiniAppsFlat}
          keyExtractor={(item) => item.miniApp.domain.toString()}
          renderItem={({ item, index }) => (
            <TrendingMiniAppListItem
              key={item.miniApp.domain}
              item={item}
              index={index}
              noBorder={index === topMiniAppsFlat.length - 1}
            />
          )}
          emptyView={<DefaultEmptyListView message="No mini apps available" />}
          onEndReached={onEndReachedTopFrames}
          isFetchingNextPage={isLoadingTopFrames}
        />
      </div>
    </div>
  );

  return (
    <Page meta={{ title: 'Farcaster / Apps' }}>
      <BorderedMainContent>
        <DiscoverHeader currentTab={currentTab} />
        {currentTab === 'trending' && trendingContent}
        {currentTab === 'your-apps' && <YourAppsContent />}
      </BorderedMainContent>
    </Page>
  );
};

export { AppsPage };
