import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronUpIcon,
  SearchIcon,
  XIcon,
} from '@primer/octicons-react';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiFrame } from 'farcaster-client-data';
import {
  frameKeyExtractor,
  useFavoriteFrames,
  useNewFrames,
  useSearchMiniApps,
  useTopMiniApps,
} from 'farcaster-client-hooks';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { TopFramesFrameCard } from '~/components/frames/TopFramesFrameCard';
import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { MiniAppResults } from '~/components/miniApp/MiniAppResults';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { FrameTile } from '~/components/rightSidebar/MiniApps';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { FavoriteFrameProvider } from '~/contexts/FavoriteFrameProvider';
import { useMinimizableWindowContext } from '~/contexts/MinimizableWindowProvider';
import { useSearchParams } from '~/hooks/navigation/useSearchParams';

function EditorsListMiniApps() {
  const { flatData } = useNewFrames();
  return (
    <div>
      <div className="font-semibold text-muted">Editor's Choice</div>
      <FlatList
        data={flatData}
        keyExtractor={frameKeyExtractor}
        renderItem={({ item: frame }) => (
          <TopFramesFrameCard key={frame.domain} frame={frame} />
        )}
        emptyView={<DefaultEmptyListView message="No mini apps available" />}
        containerClassName="grid grid-cols-2 gap-y-4 gap-x-3"
      />
    </div>
  );
}

const EditorsChoicePage: React.FC = React.memo(() => {
  return (
    <Page meta={{ title: 'Mini Apps' }}>
      <BorderedMainContent>
        <PageHeader hideCastButton>
          <PageTitle>Mini Apps</PageTitle>
        </PageHeader>
        <FavoriteFrameProvider>
          <div className="p-4">
            <div className="space-y-3">
              <EditorsListMiniApps />
            </div>
          </div>
        </FavoriteFrameProvider>
      </BorderedMainContent>
    </Page>
  );
});

function MiniAppsSearchPage({
  onClose,
  passedInSearchQuery,
}: {
  onClose: () => void;
  passedInSearchQuery?: string;
}) {
  const [searchQuery, setSearchQuery] = useState(passedInSearchQuery ?? '');
  const { launchMiniApp } = useMinimizableWindowContext();

  const { isLoading, flatData } = useSearchMiniApps({
    query: searchQuery,
  });

  const searchResults = React.useMemo(() => {
    return flatData ?? [];
  }, [flatData]);

  // In case query parameters change
  useEffect(() => {
    if (passedInSearchQuery) {
      setSearchQuery(passedInSearchQuery);
    }
  }, [passedInSearchQuery]);

  const openAppButton = React.useCallback(
    (item: ApiFrame) => {
      const handleClick = () => {
        launchMiniApp({
          context: { type: 'launcher' },
          launchConfig: {
            type: 'standalone',
            name: item.name || '',
            url: item.homeUrl || '',
            splashImageUrl: item.splashImageUrl || '',
            splashBackgroundColor: item.splashBackgroundColor || '',
            author: item.author,
          },
        });
      };

      return (
        <DefaultButton variant="secondary" size="sm" onClick={handleClick}>
          Open App
        </DefaultButton>
      );
    },
    [launchMiniApp],
  );

  const emptyText = isLoading
    ? 'Loading...'
    : searchQuery
      ? `No results found for "${searchQuery}"`
      : 'Type to search for mini apps';

  return (
    <div className="flex flex-col">
      <div className="flex w-full items-center py-4">
        <DefaultButton
          variant="muted"
          size="sm"
          className="mx-1 size-10 border-none"
          aria-label="Close search"
          onClick={onClose}
        >
          <ChevronLeftIcon className="size-6" />
        </DefaultButton>
        <div className="relative mr-2 grow">
          <input
            autoFocus
            className="border-faded focus-visible:outline-hidden flex h-10 w-full rounded-md border bg-background px-3 py-2 pr-10 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Search all mini apps..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && !isLoading && (
            <DefaultButton
              variant="muted"
              size="sm"
              className="absolute right-1 top-1/2 size-8 -translate-y-1/2 border-none"
              aria-label="Clear search term"
              onClick={() => setSearchQuery('')}
            >
              <XIcon className="size-4" />
            </DefaultButton>
          )}
          {isLoading && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <LoadingIndicator size="sm" />
            </div>
          )}
        </div>
      </div>
      <div className="px-4">
        <MiniAppResults
          results={searchResults}
          emptyViewText={emptyText}
          rightSectionFn={openAppButton}
        />
      </div>
    </div>
  );
}

const MiniAppsPage: React.FC = React.memo(() => {
  const { trackEvent } = useAnalytics();
  const { q } = useSearchParams('miniApps');

  const { flatData: installedData, onEndReached: onEndReachedInstalled } =
    useFavoriteFrames();

  const {
    data: topMiniAppsData,
    onEndReached: onEndReachedTopFrames,
    isLoading: isLoadingTopFrames,
  } = useTopMiniApps({
    limit: 50,
  });

  const topMiniAppsDataExtracted = useMemo(() => {
    return topMiniAppsData.map((item) => item.miniApp);
  }, [topMiniAppsData]);

  const [showAllInstalled, setShowAllInstalled] = React.useState(false);

  React.useEffect(() => {
    trackEvent(AnalyticsEvent.ViewFramesHome, undefined);
  }, [trackEvent]);

  const visibleInstalledData = React.useMemo(() => {
    if (!installedData) {
      return [];
    }
    return showAllInstalled ? installedData : installedData.slice(0, 12);
  }, [installedData, showAllInstalled]);

  const hasMoreInstalled = React.useMemo(
    () => (installedData?.length || 0) > 12,
    [installedData],
  );

  const renderFrameTile = useCallback(({ item: frame }: { item: ApiFrame }) => {
    return <FrameTile key={frame.domain} frame={frame} variant="large" />;
  }, []);

  // If there is a search query, we want to show the search page
  const [isSearchMode, setIsSearchMode] = useState(!!q);
  const searchIcon = React.useMemo(() => {
    return (
      <div
        onClick={() => setIsSearchMode(!isSearchMode)}
        className="cursor-pointer rounded text-muted"
      >
        <SearchIcon size={16} />
      </div>
    );
  }, [isSearchMode]);

  const rightIconsHeader = React.useMemo(() => {
    return <div className="flex items-center space-x-3">{searchIcon}</div>;
  }, [searchIcon]);

  const rightSectionFn = React.useCallback((_item: ApiFrame, index: number) => {
    return (
      <div className="w-max text-center font-semibold [font-variant-numeric:tabular-nums]">
        #{index + 1}
      </div>
    );
  }, []);

  const pageContent = React.useMemo(() => {
    if (isSearchMode) {
      return (
        <MiniAppsSearchPage
          onClose={() => setIsSearchMode(false)}
          passedInSearchQuery={q}
        />
      );
    }
    return (
      <div className="p-4">
        {installedData && installedData.length > 0 && (
          <div className="space-y-3">
            <div className="font-semibold text-muted">Your mini apps</div>
            <FlatList
              data={visibleInstalledData}
              keyExtractor={frameKeyExtractor}
              renderItem={renderFrameTile}
              emptyView={<DefaultEmptyListView message="No mini apps added." />}
              onEndReached={onEndReachedInstalled}
              containerClassName="grid grid-cols-6 gap-1"
            />
            {hasMoreInstalled ? (
              <div className="flex justify-center px-4 pb-2 pt-3">
                <DefaultButton
                  onClick={() => setShowAllInstalled(!showAllInstalled)}
                  variant="link"
                  className="flex items-center space-x-1 text-xs !font-normal text-link hover:underline"
                >
                  <span>{showAllInstalled ? 'Show Less' : 'View All'}</span>
                  {showAllInstalled ? (
                    <ChevronUpIcon size={16} />
                  ) : (
                    <ChevronDownIcon size={16} />
                  )}
                </DefaultButton>
              </div>
            ) : (
              <div className="mb-4" />
            )}
          </div>
        )}

        <MiniAppResults
          results={topMiniAppsDataExtracted}
          title="Top mini apps"
          emptyViewText="No mini apps available"
          onEndReached={onEndReachedTopFrames}
          isFetchingNextPage={isLoadingTopFrames}
          rightSectionFn={rightSectionFn}
        />
      </div>
    );
  }, [
    isSearchMode,
    installedData,
    visibleInstalledData,
    renderFrameTile,
    onEndReachedInstalled,
    hasMoreInstalled,
    showAllInstalled,
    topMiniAppsDataExtracted,
    onEndReachedTopFrames,
    isLoadingTopFrames,
    rightSectionFn,
    q,
  ]);

  return (
    <Page meta={{ title: 'Mini Apps' }}>
      <BorderedMainContent>
        <PageHeader hideCastButton iconRight={rightIconsHeader}>
          <PageTitle>Mini Apps</PageTitle>
        </PageHeader>
        <FavoriteFrameProvider>{pageContent}</FavoriteFrameProvider>
      </BorderedMainContent>
    </Page>
  );
});

MiniAppsPage.displayName = 'MiniAppsPage';
EditorsChoicePage.displayName = 'EditorsChoicePage';

export { EditorsChoicePage, MiniAppsPage };
