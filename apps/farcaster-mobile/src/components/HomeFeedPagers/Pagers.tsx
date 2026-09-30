import {
  NavigationProp,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiDefaultFeedPreference } from 'farcaster-client-data';
import {
  EventingProvider,
  useUnseen,
  useUserChannelsForCategory,
  useUserPreferences,
} from 'farcaster-client-hooks';
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useAnimatedScrollHandler } from 'react-native-reanimated';

import { KNOWN_NON_CHANNEL_FEEDS } from '~/components/DrawerContent/DrawerFeedsFavorites';
import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useDrawer } from '~/contexts/DrawerProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { FeedRoute } from '~/hooks/useFeedRoutes';
import { Feed } from '~/screens/Feed/Feed';
import {
  emitResetFeedShellState,
  MainScrollProvider,
  useHeaderOffset,
  useHomeScreenSelectedFeed,
  useMinimalShellHeaderToastTransform,
  useScrollHandlers,
  useSetMinimalShellMode,
} from '~/screens/Feed/HomeScreenScrollHandlers';

import { HomeHeader } from './HomeHeader';
import { Pager, PagerRef, RenderTabBarFnProps } from './Pager';

const HOME_FEED: FeedRoute = {
  key: 'home',
  name: 'Home',
  sectionRank: 0,
  type: 'default',
  viewerContext: {
    favoritePosition: 0,
    hasUnseenItems: false,
  },
};

const FOLLOWING_FEED: FeedRoute = {
  key: 'following',
  name: 'Following',
  sectionRank: 0,
  type: 'default',
  viewerContext: {
    favoritePosition: 0,
    hasUnseenItems: false,
  },
};

function useGenerateDrawerFeedSections(): (
  defaultFeed: ApiDefaultFeedPreference,
  feeds: FeedRoute[],
) => FeedRoute[] {
  return useCallback((defaultFeed, feeds) => {
    const defaultSections: FeedRoute[] =
      defaultFeed === 'following'
        ? [FOLLOWING_FEED, HOME_FEED]
        : [HOME_FEED, FOLLOWING_FEED];

    const sections: FeedRoute[] = defaultSections;

    feeds.forEach((f) => {
      const feed = {
        ...f,
        name: f.key,
      };

      if (sections.findIndex((s) => s.key === f.key) === -1) {
        sections.push(feed);
      }
    });

    return sections;
  }, []);
}

type PagersProps = {
  scrollableBanner?: React.ReactElement;
  homeFeedBanner?: React.ReactElement;
};

export function Pagers({ scrollableBanner, homeFeedBanner }: PagersProps) {
  const { fid } = useCurrentUser_UNSAFE();

  // Both of these hooks are suspending but they are both prefetched on app load
  const { data: userPreferences } = useUserPreferences();
  const { data } = useUserChannelsForCategory({
    fid,
    category: 'favorites',
  });

  const feeds = React.useMemo(() => {
    const routes: FeedRoute[] = [];

    (data.pages.flatMap((p) => p.items) || []).forEach((summary) => {
      if (
        summary.type !== 'channel' &&
        !KNOWN_NON_CHANNEL_FEEDS.includes(summary.key)
      ) {
        return;
      }

      routes.push({
        type: summary.type,
        key: summary.key,
        name: summary.name,
        imageUrl: summary.imageUrl,
        sectionRank: summary.sectionRank,
        viewerContext: {
          hasUnseenItems: summary.viewerContext.hasUnseenItems,
          favoritePosition:
            // -1 with sorting above would result feeds to appear at the top. That is not what we want to
            // do here as users will have something at the top for home feed tab arrangement
            typeof summary.viewerContext.favoritePosition === 'undefined' ||
            summary.viewerContext.favoritePosition === -1
              ? 10_000
              : summary.viewerContext.favoritePosition,
          activityRank: summary.viewerContext.activityRank,
        },
      });
    });

    return routes;
  }, [data.pages]);

  const generateDrawerFeedSections = useGenerateDrawerFeedSections();

  const defaultFeed = React.useMemo(() => {
    return userPreferences.result.preferences.defaultFeed || 'home';
  }, [userPreferences.result.preferences.defaultFeed]);

  const sections = generateDrawerFeedSections(defaultFeed, feeds);

  if (sections) {
    return (
      <MainScrollProvider>
        <PagersReady
          defaultFeed={defaultFeed}
          pinnedFeedInfos={sections}
          scrollableBanner={scrollableBanner}
          homeFeedBanner={homeFeedBanner}
        />
      </MainScrollProvider>
    );
  } else {
    return <FullScreenLoadingIndicator debugName="Pagers" />;
  }
}

function PagersReady({
  defaultFeed,
  pinnedFeedInfos,
  scrollableBanner,
  homeFeedBanner,
}: {
  defaultFeed: ApiDefaultFeedPreference;
  pinnedFeedInfos: FeedRoute[];
  scrollableBanner?: React.ReactElement;
  homeFeedBanner?: React.ReactElement;
}) {
  const allFeeds = React.useMemo(
    () => pinnedFeedInfos.map((f) => f.key),
    [pinnedFeedInfos],
  );

  // Stable key for Pager to prevent remounting when channel list changes
  // We use the length as a stable identifier - only remount if the number of feeds changes
  const pagerKey = React.useMemo(
    () => `pager-${allFeeds.length}`,
    [allFeeds.length],
  );

  const { setFeedKey } = useHomeScreenSelectedFeed();
  const [selectedIndex, setSelectedIndex] = React.useState<number>(
    Math.max(allFeeds.indexOf(defaultFeed), 0),
  );
  const selectedFeed = allFeeds[selectedIndex];
  const [mountedFeedIndex, setMountedFeedIndex] = React.useState(selectedIndex);
  const isPagerSwipingRef = React.useRef(false);

  const pagerRef = React.useRef<PagerRef>(null);

  const setMinimalShellMode = useSetMinimalShellMode();
  const { setSwipeEnabled } = useDrawer();
  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false);
      setSwipeEnabled(selectedIndex === 0);
    }, [selectedIndex, setMinimalShellMode, setSwipeEnabled]),
  );

  React.useEffect(() => {
    setFeedKey({ feedKey: selectedFeed });
  }, [selectedFeed, setFeedKey]);

  const onPageSelected = React.useCallback(
    (index: number) => {
      setSwipeEnabled(index === 0);
      setSelectedIndex(index);
    },
    [setSelectedIndex, setSwipeEnabled],
  );

  const scrolledToTopRef = React.useRef<boolean>(false);
  const navigation = useNavigation();
  // This is similar to useScrollToTop but always moves to the first tab and scroll it to the top
  // when not on the current
  useFocusEffect(
    React.useCallback(() => {
      const tabNavigations: NavigationProp<ReactNavigation.RootParamList>[] =
        [];
      let currentNavigation = navigation.getParent();
      while (currentNavigation) {
        if (currentNavigation.getState().type === 'tab') {
          // @ts-ignore
          tabNavigations.push(currentNavigation);
        }

        currentNavigation = currentNavigation.getParent();
      }

      const unsubscribers = tabNavigations.map((tab) => {
        // @ts-ignore
        return tab.addListener('tabPress', (e: EventArg<'tabPress', true>) => {
          if (scrolledToTopRef.current) {
            e.preventDefault();
            pagerRef.current?.setPage(0, 'tab-click');
          } else {
            scrolledToTopRef.current = true;
            setTimeout(() => (scrolledToTopRef.current = false), 3_000);
          }
        });
      });

      return () => {
        unsubscribers.forEach((unsubscribe) => unsubscribe());
      };
    }, [navigation]),
  );

  const { trackEvent } = useAnalytics();

  const { resetFeedUnseenStatus } = useUnseen();

  const onPageSelecting = React.useCallback(
    (index: number, reason: 'swipe' | 'tab-click') => {
      setMountedFeedIndex(index);

      const newSelectedFeed = allFeeds[index];
      trackEvent(AnalyticsEvent.DisplayHomeFeedPager, {
        index,
        reason,
        feed: newSelectedFeed,
      });

      resetFeedUnseenStatus(newSelectedFeed);
    },
    [allFeeds, resetFeedUnseenStatus, trackEvent],
  );

  const onPressSelected = React.useCallback(() => {
    emitResetFeedShellState();
  }, []);

  const onPageScrollStateChanged = React.useCallback(
    (state: 'idle' | 'dragging' | 'settling') => {
      if (state === 'dragging') {
        setMinimalShellMode(false);
      }
      // Treat both 'dragging' and 'settling' as part of the swipe gesture so
      // that viewability callbacks remain suppressed for the full horizontal
      // transition between tabs.
      isPagerSwipingRef.current = state !== 'idle';
    },
    [setMinimalShellMode],
  );

  const renderTabBar = React.useCallback(
    (props: RenderTabBarFnProps) => {
      return (
        <HomeHeader
          key="FEEDS_TAB_BAR"
          {...props}
          onPressSelected={onPressSelected}
          feeds={pinnedFeedInfos}
        />
      );
    },
    [onPressSelected, pinnedFeedInfos],
  );

  const {
    onBeginDrag: onBeginDragFromContext,
    onEndDrag: onEndDragFromContext,
    onScroll: onScrollFromContext,
    onMomentumEnd: onMomentumEndFromContext,
  } = useScrollHandlers();

  const scrollHandler = useAnimatedScrollHandler({
    onBeginDrag(e, ctx) {
      onBeginDragFromContext?.(e, ctx);
    },
    onEndDrag(e, ctx) {
      onEndDragFromContext?.(e, ctx);
    },
    onScroll(e, ctx) {
      onScrollFromContext?.(e, ctx);
    },
    onMomentumEnd(e, ctx) {
      onMomentumEndFromContext?.(e, ctx);
    },
  });

  const headerOffset = useHeaderOffset();
  const headerTransform = useMinimalShellHeaderToastTransform();
  const mountedFeed = allFeeds[mountedFeedIndex];

  return (
    <Pager
      key={pagerKey}
      ref={pagerRef}
      initialPage={selectedIndex}
      onPageSelecting={onPageSelecting}
      onPageSelected={onPageSelected}
      onPageScrollStateChanged={onPageScrollStateChanged}
      renderTabBar={renderTabBar}
    >
      {pinnedFeedInfos.map((feedInfo) => {
        const feed = feedInfo.key;
        const filterPinnedItems = feed !== 'home';
        const enabled =
          feed === mountedFeed || feed === selectedFeed || feed === defaultFeed;

        if (!enabled) {
          return <View key={feed} style={{ flex: 1 }} />;
        }

        const hasScrollableBanner = typeof scrollableBanner !== 'undefined';
        const hasHomeFeedBanner =
          feed === 'home' && typeof homeFeedBanner !== 'undefined';

        const banner =
          defaultFeed && (hasScrollableBanner || hasHomeFeedBanner) ? (
            feed === 'home' ? (
              <>
                {scrollableBanner}
                {homeFeedBanner}
              </>
            ) : (
              scrollableBanner
            )
          ) : undefined;

        return (
          <PagerSwipeController
            key={feed}
            setScrollEnabled={
              typeof pagerRef.current !== 'undefined' &&
              pagerRef.current !== null
                ? pagerRef.current.setScrollEnabled
                : ({ enabled: _ }: { enabled: boolean }) => {}
            }
          >
            <EventingProvider on={feed === 'home' ? 'home' : 'following'}>
              <Feed
                feedKey={feed}
                feedType="default"
                enabled={enabled}
                isSelectedTab={selectedFeed === feed}
                isPagerSwipingRef={isPagerSwipingRef}
                banner={banner}
                onScroll={scrollHandler}
                filterPinnedItems={filterPinnedItems}
                headerHeight={headerOffset}
                headerTransform={headerTransform}
              />
            </EventingProvider>
          </PagerSwipeController>
        );
      })}
    </Pager>
  );
}

type PagerSwipeControllerContextValue = {
  setScrollEnabled: ({ enabled }: { enabled: boolean }) => void;
};

const PagerSwipeControllerContext =
  React.createContext<PagerSwipeControllerContextValue>({} as never);

function PagerSwipeController({
  children,
  setScrollEnabled,
}: React.PropsWithChildren<{
  setScrollEnabled: ({ enabled }: { enabled: boolean }) => void;
}>) {
  const value = React.useMemo(() => ({ setScrollEnabled }), [setScrollEnabled]);

  return (
    <PagerSwipeControllerContext value={value}>
      {children}
    </PagerSwipeControllerContext>
  );
}

export const usePagerSwipeController = () => {
  return React.useContext(PagerSwipeControllerContext);
};
