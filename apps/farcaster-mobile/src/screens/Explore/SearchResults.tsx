import { AnalyticsEvent } from 'farcaster-analytics';
import React from 'react';

import { TabBar } from '~/components/HomeFeedPagers/HomeHeaderTabBar';
import {
  Pager,
  PagerRef,
  RenderTabBarFnProps,
} from '~/components/HomeFeedPagers/Pager';
import { useAnalytics } from '~/contexts/AnalyticsProvider';

import { SearchCasts } from './SearchCasts';
import { SearchChannels } from './SearchChannels';
import { SearchMiniApps } from './SearchMiniApps';
import { SEARCH_PAGER_INDEX, SEARCH_PAGER_ITEMS } from './searchPagerConstants';
import { SearchTokens } from './SearchTokens';
import { SearchTop } from './SearchTop';
import { SearchUsers } from './SearchUsers';

export const SearchResults = React.memo(
  ({ q, initialIndex }: { q: string; initialIndex: number }) => {
    const [selectedIndex, setSelectedIndex] = React.useState(initialIndex);
    const pagerRef = React.useRef<PagerRef>(null);

    React.useEffect(() => {
      setSelectedIndex(initialIndex);
    }, [initialIndex]);

    const onPageSelected = React.useCallback(
      (index: number) => {
        setSelectedIndex(index);
      },
      [setSelectedIndex],
    );

    const { trackEvent } = useAnalytics();

    const onPageSelecting = React.useCallback(
      (index: number, reason: 'swipe' | 'tab-click') => {
        trackEvent(AnalyticsEvent.ViewSearchPagerTab, {
          tab: SEARCH_PAGER_ITEMS[index],
          reason,
        });
      },
      [trackEvent],
    );

    const onPressSelected = React.useCallback(
      (index: number) => {
        setSelectedIndex(index);
      },
      [setSelectedIndex],
    );

    const renderTabBar = React.useCallback(
      (props: RenderTabBarFnProps) => {
        return (
          <TabBar
            onSelect={props.onSelect}
            selectedPage={props.selectedPage}
            onPressSelected={onPressSelected}
            items={[...SEARCH_PAGER_ITEMS]}
            containerStyle={[]}
          />
        );
      },
      [onPressSelected],
    );

    const onViewTokens = React.useCallback(() => {
      const index = SEARCH_PAGER_INDEX.Tokens;
      setSelectedIndex(index);
      pagerRef.current?.setPage(index, 'tab-click');
    }, [setSelectedIndex]);

    const onViewUsers = React.useCallback(() => {
      const index = SEARCH_PAGER_INDEX.Users;
      setSelectedIndex(index);
      pagerRef.current?.setPage(index, 'tab-click');
    }, [setSelectedIndex]);

    const onViewCasts = React.useCallback(() => {
      const index = SEARCH_PAGER_INDEX.Casts;
      setSelectedIndex(index);
      pagerRef.current?.setPage(index, 'tab-click');
    }, [setSelectedIndex]);

    const onViewMiniApps = React.useCallback(() => {
      const index = SEARCH_PAGER_INDEX['Mini Apps'];
      setSelectedIndex(index);
      pagerRef.current?.setPage(index, 'tab-click');
    }, [setSelectedIndex]);

    return (
      <Pager
        key={'search-pager'}
        ref={pagerRef}
        initialPage={initialIndex}
        onPageSelecting={onPageSelecting}
        onPageSelected={onPageSelected}
        renderTabBar={renderTabBar}
      >
        <SearchTop
          q={q}
          enabled={selectedIndex === SEARCH_PAGER_INDEX.Top}
          onViewTokens={onViewTokens}
          onViewUsers={onViewUsers}
          onViewCasts={onViewCasts}
          onViewMiniApps={onViewMiniApps}
        />
        <SearchMiniApps
          q={q}
          enabled={selectedIndex === SEARCH_PAGER_INDEX['Mini Apps']}
        />
        <SearchCasts
          q={q}
          enabled={selectedIndex === SEARCH_PAGER_INDEX.Casts}
        />
        <SearchUsers
          q={q}
          enabled={selectedIndex === SEARCH_PAGER_INDEX.Users}
        />
        <SearchTokens
          q={q}
          enabled={selectedIndex === SEARCH_PAGER_INDEX.Tokens}
        />
        <SearchChannels
          q={q}
          enabled={selectedIndex === SEARCH_PAGER_INDEX.Channels}
        />
      </Pager>
    );
  },
);

export const WalletSearchResults = React.memo(({ q }: { q: string }) => {
  return <SearchTokens q={q} enabled={true} />;
});
