import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { ApiChannelUser } from 'farcaster-client-data';
import {
  useChannelFollowers,
  useChannelMembers,
  useDebouncedValue,
} from 'farcaster-client-hooks';
import React, { FC, memo, Suspense, useMemo, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { TabView } from 'react-native-tab-view';

import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { buildScreen } from '~/components/Screen';
import { SearchInput } from '~/components/SearchInput';
import { buildTabBar } from '~/components/TabBar';
import { ChannelUserListItem } from '~/components/users/ChannelUserListItem';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePullToRefreshChannelFollowers } from '~/hooks/data/usePullToRefreshChannelFollowers';
import { ChannelUsersScreenParams, FullParamList } from '~/types';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

type ChannelUsersScreenProps = NativeStackScreenProps<
  FullParamList,
  'ChannelUsers'
>;

const ChannelMembersTabContent: FC<ChannelUsersScreenParams> = memo(
  ({ channelKey }) => {
    const t = useTheme();

    const [query, setQuery] = useState('');
    const debouncedQuery = useDebouncedValue({
      value: query,
      debounceDuration: query.length < 3 ? 250 : 125,
    });

    const { onEndReached, refetch, isPending, flatData } = useChannelMembers({
      channelKey,
      query: debouncedQuery,
    });

    const { refreshControl } = usePullToRefreshChannelFollowers({
      channelKey,
      query,
      refetch,
    });

    const extraData = useMemo(
      () => ({
        channelKey,
      }),
      [channelKey],
    );

    return (
      <>
        <View style={[t.p3, t.borderBHairline, t.borderDefault]}>
          <SearchInput
            align="left"
            onChangeText={(text) => setQuery(text)}
            value={query}
            placeholder="Search"
            autoCorrect={false}
            width="100%"
            autoCapitalize="none"
          />
        </View>
        {isPending ? (
          <FullScreenLoadingIndicator
            debugName="ChannelManageMembers"
            style={[t.mT6]}
            justify="start"
          />
        ) : (
          <FlashList
            data={flatData}
            extraData={extraData}
            keyExtractor={keyExtractor}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            contentContainerStyle={{ ...t.pX3, ...t.pB3 }}
            keyboardShouldPersistTaps="handled"
            refreshControl={refreshControl}
            {...STANDARD_FLASHLIST_PERF_PROPS}
            renderItem={renderMemberItem}
          />
        )}
      </>
    );
  },
);

const ChannelFollowersTabContent: FC<ChannelUsersScreenParams> = memo(
  ({ channelKey }) => {
    const t = useTheme();

    const [query, setQuery] = useState('');
    const debouncedQuery = useDebouncedValue({
      value: query,
      debounceDuration: query.length < 3 ? 250 : 125,
    });

    const { onEndReached, refetch, isPending, flatData } = useChannelFollowers({
      channelKey,
      query: debouncedQuery,
    });

    const { refreshControl } = usePullToRefreshChannelFollowers({
      channelKey,
      query,
      refetch,
    });

    const extraData = useMemo(
      () => ({
        channelKey,
      }),
      [channelKey],
    );

    return (
      <>
        <View style={[t.p3, t.borderBHairline, t.borderDefault]}>
          <SearchInput
            align="left"
            onChangeText={(text) => setQuery(text)}
            value={query}
            placeholder="Search"
            autoCorrect={false}
            width="100%"
            autoCapitalize="none"
          />
        </View>
        {isPending ? (
          <FullScreenLoadingIndicator
            debugName="ChannelManageMembers"
            style={[t.mT6]}
            justify="start"
          />
        ) : (
          <FlashList
            data={flatData}
            extraData={extraData}
            keyExtractor={keyExtractor}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            contentContainerStyle={{ ...t.pX3, ...t.pB3 }}
            keyboardShouldPersistTaps="handled"
            refreshControl={refreshControl}
            {...STANDARD_FLASHLIST_PERF_PROPS}
            renderItem={renderFollowerItem}
          />
        )}
      </>
    );
  },
);

const scenes = {
  members: ChannelMembersTabContent,
  followers: ChannelFollowersTabContent,
};

type Route = {
  key: keyof typeof scenes;
  title: string;
};

const routes: Route[] = [
  { key: 'members', title: 'Members' },
  { key: 'followers', title: 'Followers' },
];

const resolveTabIndex = (initialTab: undefined | keyof typeof scenes) => {
  const index = routes.findIndex((route) => route.key === initialTab);
  return index === -1 ? 0 : index;
};

const ChannelUsersScreen = buildScreen<ChannelUsersScreenProps>(
  { name: 'ChannelUsers', insetTop: false },
  ({ route: { params } }) => {
    const layout = useWindowDimensions();
    const [tabIndex, setTabIndex] = useState(
      resolveTabIndex(params.initialTab),
    );

    return (
      <TabView
        lazy={true}
        navigationState={{ index: tabIndex, routes }}
        renderScene={({ route }) => {
          const Scene = scenes[route.key];
          return (
            <Suspense
              fallback={
                <FullScreenLoadingIndicator debugName="ChannelFollowersScreen" />
              }
            >
              <Scene channelKey={params.channelKey} />
            </Suspense>
          );
        }}
        onIndexChange={(index) => {
          setTabIndex(index);
        }}
        initialLayout={{ width: layout.width }}
        renderTabBar={buildTabBar()}
      />
    );
  },
);

const renderMemberItem: ListRenderItem<ApiChannelUser> = ({
  item,
  extraData,
}) => {
  return (
    <ChannelUserListItem
      channelUser={item}
      channelKey={extraData.channelKey}
      skipSeperator={false}
    />
  );
};

const renderFollowerItem: ListRenderItem<ApiChannelUser> = ({
  item,
  extraData,
}) => {
  return (
    <ChannelUserListItem
      channelUser={item}
      channelKey={extraData.channelKey}
      skipSeperator={false}
    />
  );
};

const keyExtractor = (item: ApiChannelUser) => {
  return item.user.fid.toString();
};

ChannelUsersScreen.displayName = 'ChannelUsersScreen';

export { ChannelUsersScreen };
