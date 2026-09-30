import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiChannel, ApiUserChannelsCategory } from 'farcaster-client-data';
import {
  usePrefetchUserChannelsForCategory,
  useUserChannelsForCategoryWithRefreshOnMount,
} from 'farcaster-client-hooks';
import { Text } from 'farcaster-expo';
import React from 'react';
import { View } from 'react-native';

import { ChannelForCategory } from '~/components/ChannelsV3/ChannelForCategory';
import { makePillTab } from '~/components/CollapsibleTab/PillTab';
import {
  TabViewInner,
  TabViewItem,
} from '~/components/CollapsibleTab/TabViewInner';
import { buildScreen } from '~/components/Screen';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { ChannelMenuProvider } from '~/contexts/ChannelMenuProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { CommonStackParamList } from '~/types';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

const TABS = [
  { id: 'favorites', name: 'Favorites' },
  {
    id: 'moderate',
    name: 'Moderator',
  },
  { id: 'member', name: 'Member' },
  { id: 'follow', name: 'Follower' },
];

type ManageChannelsScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'ManageChannels'
>;

const ManageChannelsScreen = buildScreen<ManageChannelsScreenProps>(
  {
    name: 'ManageChannels',
    insetTop: false,
    insetBottom: false,
  },
  () => {
    const t = useTheme();
    const { fid: currentUserFid } = useCurrentUser_UNSAFE();
    const { trackEvent } = useAnalytics();

    const [selectedTab, setSelectedTab] =
      React.useState<ApiUserChannelsCategory>('favorites');

    const onKeyChanged = React.useCallback((id: string) => {
      setSelectedTab(id as ApiUserChannelsCategory);
    }, []);

    const prefetchUserChannelsForCategory =
      usePrefetchUserChannelsForCategory();

    React.useEffect(() => {
      trackEvent(AnalyticsEvent.ViewManageChannels, {});
    }, [trackEvent]);

    useFocusEffect(
      React.useCallback(() => {
        prefetchUserChannelsForCategory({
          fid: currentUserFid,
          category: 'moderate',
        });
        prefetchUserChannelsForCategory({
          fid: currentUserFid,
          category: 'member',
        });
        prefetchUserChannelsForCategory({
          fid: currentUserFid,
          category: 'follow',
        });
        prefetchUserChannelsForCategory({
          fid: currentUserFid,
          category: 'favorites',
        });
      }, [currentUserFid, prefetchUserChannelsForCategory]),
    );

    const tabItems = React.useMemo(
      () =>
        TABS.map(
          (tab) =>
            ({
              key: tab.id,
              Tab: makePillTab({
                name: tab.name,
              }),
              DeprecatedPreRenderedBody: undefined,
            }) satisfies TabViewItem,
        ),
      [],
    );

    return (
      <TabViewInner.Navigator
        items={tabItems}
        tabBarWrapperStyle={[
          t.borderBHairline,
          t.borderDefault,
          {
            paddingBottom: 16,
          },
        ]}
        tabBarStyle={{
          // Needs to be at least PillTab red dot's `top` so it doesn't get cut off
          paddingTop: 4,
          paddingLeft: 16,
          paddingRight: 6,
        }}
        onKeyChanged={onKeyChanged}
      >
        {tabItems.map((item) => {
          return (
            <TabViewInner.Screen
              key={item.key}
              name={item.key}
              navigationKey={item.key}
            >
              {() => (
                <ManageChannelsForCategory
                  key={selectedTab}
                  category={selectedTab}
                />
              )}
            </TabViewInner.Screen>
          );
        })}
      </TabViewInner.Navigator>
    );
  },
);

const ManageChannelsForCategory: React.FC<{
  category: ApiUserChannelsCategory;
}> = ({ category }) => {
  const t = useTheme();

  const tabBarHeight = useBottomTabBarHeight();
  const { fid: currentUserFid } = useCurrentUser_UNSAFE();

  const { flatData, onEndReached } =
    useUserChannelsForCategoryWithRefreshOnMount({
      fid: currentUserFid,
      category,
    });

  const channels = React.useMemo(() => {
    return flatData || [];
  }, [flatData]);

  const renderItem = React.useCallback(
    ({ item, index }: { item: ApiChannel; index: number }) => {
      return (
        <ChannelMenuProvider channel={item}>
          <ChannelForCategory
            channel={item}
            category={category}
            skipSeperator={index === (channels.length ?? 0) - 1}
          />
        </ChannelMenuProvider>
      );
    },
    [category, channels.length],
  );

  const ListEmptyComponent = React.useCallback(() => {
    return (
      <View style={[t.p4]}>
        <Text style={[t.texts.secondary, t.textSm, t.textCenter]}>
          Channels you favorite will show up here.
        </Text>
      </View>
    );
  }, [t.p4, t.textCenter, t.texts.secondary, t.textSm]);

  return (
    <FlashList
      data={channels}
      keyExtractor={(item) => item.key}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.15}
      contentContainerStyle={{ paddingBottom: tabBarHeight }}
      ListEmptyComponent={ListEmptyComponent}
      {...STANDARD_FLASHLIST_PERF_PROPS}
      renderItem={renderItem}
    />
  );
};

ManageChannelsForCategory.displayName = 'ManageChannelsForCategory';

ManageChannelsScreen.displayName = 'ManageChannelsScreen';

export { ManageChannelsScreen };
