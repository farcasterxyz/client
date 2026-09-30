import { ApiChannelFeedTab } from 'farcaster-client-data';
import React, { FC, memo, useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { SharedValue } from 'react-native-reanimated';
import { TabView } from 'react-native-tab-view';

import { buildTabBar } from '~/components/TabBar';
import { ChannelFeed } from '~/screens/Channel/ChannelFeed';

interface ChannelScreenContentProps {
  feedKey: string;
  scrollOffset: SharedValue<number>;
  fixedHeaderHeight: SharedValue<number>;
  stickyHeaderHeight: SharedValue<number>;
  offsetToContent: boolean;
  Header: React.ReactElement;
  feeds?: ApiChannelFeedTab[];
  showCastSourceLabels?: boolean; // ignored for home feed
}

const ChannelScreenContent: FC<ChannelScreenContentProps> = memo(
  ({ feeds, ...rest }) => {
    return (
      <ChannelFeed feedType={(feeds || [])[0]?.type ?? 'default'} {...rest} />
    );

    // not currently supporting multiple feeds
    // as we need some extra UI work to make this work
    //
    // if (feeds && feeds.length > 1) {
    //   return (
    //     <ChannelFeedTabs
    //       feedKey={feedKey}
    //       feeds={feeds}
    //       Header={Header}
    //       scrollOffset={scrollOffset}
    //       showCastSourceLabels={showCastSourceLabels}
    //       showCastTags={showCastTags}
    //     />
    //   );
    // } else {
    //   return (
    //     <ChannelFeed
    //       feedKey={feedKey}
    //       feedType={(feeds || [])[0]?.type ?? 'default'}
    //       Header={Header}
    //       scrollOffset={scrollOffset}
    //       showCastSourceLabels={showCastSourceLabels}
    //       showCastTags={showCastTags}
    //     />
    //   );
    // }
  },
);

ChannelScreenContent.displayName = 'ChannelFeedContent';

interface ChannelFeedTabsProps {
  feedKey: string;
  feeds: ApiChannelFeedTab[];
  Header: React.ReactElement;
  scrollOffset: SharedValue<number>;
  fixedHeaderHeight: SharedValue<number>;
  stickyHeaderHeight: SharedValue<number>;
  offsetToContent: boolean;
  showCastSourceLabels?: boolean; // ignored for home feed
  showCastTags?: boolean; // ignored for home feed
}

const ChannelFeedTabs: FC<ChannelFeedTabsProps> = memo(({ feeds, ...rest }) => {
  const routes = useMemo(
    () =>
      feeds.map((feed) => ({
        key: feed.type,
        title: feed.name,
      })),
    [feeds],
  );

  const layout = useWindowDimensions();
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <TabView
      lazy={true}
      navigationState={{ index: tabIndex, routes }}
      renderScene={({ route }) => {
        return <ChannelFeed feedType={route.key} {...rest} />;
      }}
      onIndexChange={(index) => {
        setTabIndex(index);
      }}
      initialLayout={{ width: layout.width }}
      renderTabBar={buildTabBar()}
    />
  );
});

ChannelFeedTabs.displayName = 'ChannelFeedTabs';

export { ChannelScreenContent };
