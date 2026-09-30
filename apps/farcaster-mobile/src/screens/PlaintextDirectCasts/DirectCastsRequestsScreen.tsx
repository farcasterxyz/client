import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiDirectCastConversationViewCategory,
  ApiDirectCastInboxConversationInfoV3,
} from 'farcaster-client-data';
import {
  useDirectCastInboxByAccount,
  useFlatPaginatedResults,
  useOptimisticallyMarkRequestsAsRead,
  usePrefetchDirectCastConversation,
  usePrefetchDirectCastConversationMessages,
  usePrefetchDirectCastConversationRecentMessages,
} from 'farcaster-client-hooks';
import React, { useCallback, useState } from 'react';
import { View, ViewToken } from 'react-native';

import { Empty } from '~/components/Empty';
import { FilterPills } from '~/components/FilterPills';
import { LoadingIndicator } from '~/components/LoadingIndicator';
import { buildScreen } from '~/components/Screen';
import { topBarHeight } from '~/components/TopBar';
import { feedOnEndReachedThreshold } from '~/constants/FlatList';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useCommonFlatListExtraData } from '~/hooks/useCommonFlatListExtraData';
import { useDisplayLimit } from '~/hooks/useDisplayLimit';
import { PlaintextDirectCastsStackParamList } from '~/types';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';
import {
  useForceZeroScrollInsets,
  ZERO_SCROLL_INSET_PROPS,
} from '~/utils/ScrollInsetUtils';

import { PlaintextDirectCastConversationListItem } from './PlaintextDirectCastConversationListItem';
import { RequestsHeader } from './RequestsHeader';

type RequestsTab = 'request' | 'void';

const requestsFilterPills = [
  { id: 'request', label: 'You may know' },
  { id: 'void', label: 'Low priority' },
];

const LIST_BATCH_SIZE = 10;

type DirectCastsRequestsScreenProps = NativeStackScreenProps<
  PlaintextDirectCastsStackParamList,
  'DirectCastsRequests'
>;

const DirectCastsRequestsScreen = buildScreen<DirectCastsRequestsScreenProps>(
  {
    name: 'DirectCastsRequests',
    insetTop: true,
  },
  () => {
    const t = useTheme();
    const { trackEvent } = useAnalytics();

    const { fid } = useCurrentUser_UNSAFE();

    const [activeTab, setActiveTab] = useState<RequestsTab>('request');

    // Cast needed until API types are regenerated with 'void' category
    const category = activeTab as ApiDirectCastConversationViewCategory;

    const {
      data,
      fetchNextPage,
      isPending,
      isFetchingNextPage,
      refetch,
      hasNextPage,
    } = useDirectCastInboxByAccount({
      fid,
      category,
    });

    const conversationRequests = useFlatPaginatedResults({
      data,
      key: 'conversations',
    }) as ApiDirectCastInboxConversationInfoV3[];

    const {
      displayedItems: displayedConversationRequests,
      handleEndReached,
      resetDisplayLimit,
    } = useDisplayLimit({
      data: conversationRequests ?? [],
      batchSize: LIST_BATCH_SIZE,
      hasNextPage: hasNextPage ?? false,
      isFetching: isFetchingNextPage,
      fetchNextPage,
    });

    const extraData = useCommonFlatListExtraData();
    const listRef =
      React.useRef<FlashListRef<ApiDirectCastInboxConversationInfoV3>>(null);
    const isFocused = useIsFocused();
    useForceZeroScrollInsets({
      ref: listRef,
      enabled: isFocused,
    });

    const prefetchConversation = usePrefetchDirectCastConversation();
    const prefetchMessages = usePrefetchDirectCastConversationMessages();
    const prefetchRecentMessages =
      usePrefetchDirectCastConversationRecentMessages();
    const optimisticallyMarkRequestsAsRead =
      useOptimisticallyMarkRequestsAsRead();

    const prefetch = useCallback(
      async ({ conversationId }: { conversationId: string }) => {
        await Promise.all([
          prefetchConversation({
            conversationId: conversationId,
          }),
          prefetchMessages({
            conversationId: conversationId,
            messageId: undefined,
            // This should match to the DirectCastsConversationMessagesProvider fetching limit target
            // so users are prefetching the same thing they are going to see on load. Mis-match on counts
            // likely to cause other headaches.
            limit: 50,
          }),
          prefetchRecentMessages({
            conversationId: conversationId,
          }),
        ]);
      },
      [prefetchConversation, prefetchMessages, prefetchRecentMessages],
    );

    useFocusEffect(
      useCallback(() => {
        if (activeTab === 'request') {
          optimisticallyMarkRequestsAsRead({ fid });
        }
        trackEvent(AnalyticsEvent.ViewDirectCastsInbox, {
          inbox: activeTab,
        });
      }, [optimisticallyMarkRequestsAsRead, trackEvent, fid, activeTab]),
    );

    useFocusEffect(
      useCallback(() => {
        refetch();
      }, [refetch]),
    );

    const renderItem = React.useCallback(
      ({ item }: { item: ApiDirectCastInboxConversationInfoV3 }) => {
        return (
          <PlaintextDirectCastConversationListItem
            currentUserFid={fid}
            conversation={item}
            borderStyle="bottom"
            shouldShowConversationTag={true}
          />
        );
      },
      [fid],
    );

    const onViewableItemsChanged = React.useCallback(
      ({ viewableItems: conversations }: { viewableItems: ViewToken[] }) => {
        for (const { key: conversationId } of conversations) {
          prefetch({ conversationId });
        }
      },
      [prefetch],
    );

    const refreshing = React.useMemo(
      () => isPending || isFetchingNextPage,
      [isFetchingNextPage, isPending],
    );

    const contentContainerStyle = React.useMemo(
      () => ({
        // This is the size of each Direct Cast List item.
        paddingBottom: 80,
      }),
      [],
    );

    const viewabilityConfig = React.useMemo(
      () => ({
        // Let's be aggresive on this in case users are scrolling to get the conversations
        itemVisiblePercentThreshold: 15,
      }),
      [],
    );

    const ListEmptyComponent = React.useMemo(() => {
      const emptyMessage =
        activeTab === 'void' ? 'No hidden direct casts' : 'No new requests';
      const emptySubMessage =
        activeTab === 'void'
          ? 'Unwanted or malicious direct casts will appear here.'
          : 'Direct cast requests from unknown senders will appear here.';

      return (
        <View style={[t.pT10]}>
          {isPending ? (
            <LoadingIndicator />
          ) : (
            <Empty
              icon={
                <View
                  style={[
                    { height: 54, width: 54 },
                    t.itemsCenter,
                    t.justifyCenter,
                    t.roundedFull,
                    t.bgDefault,
                    t.bgIconUnderlay,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="message-plus-outline"
                    size={24}
                    style={[
                      t.dark ? { color: t.colors.text.white } : t.texts.brand,
                    ]}
                  />
                </View>
              }
              message={emptyMessage}
              subMessage={emptySubMessage}
            />
          )}
        </View>
      );
    }, [
      isPending,
      activeTab,
      t.bgIconUnderlay,
      t.bgDefault,
      t.colors.text.white,
      t.dark,
      t.itemsCenter,
      t.justifyCenter,
      t.pT10,
      t.roundedFull,
      t.texts.brand,
    ]);

    const onTabChange = useCallback(
      ({ pillId }: { pillId: string }) => {
        if (pillId === 'request' || pillId === 'void') {
          setActiveTab(pillId);
          resetDisplayLimit();
        }
      },
      [resetDisplayLimit],
    );

    return (
      <View style={[t.flex, t.hFull, t.borderTHairline, t.borderDefault]}>
        <RequestsHeader />
        <View style={[t.flex1, t.hFull, t.wFull, { marginTop: topBarHeight }]}>
          <View
            style={[
              t.borderBHairline,
              t.borderDefault,
              t.pX3,
              t.pB2,
              { paddingTop: 6 },
            ]}
          >
            <FilterPills
              pills={requestsFilterPills}
              activePillId={activeTab}
              onActivePillChange={onTabChange}
            />
          </View>
          <View style={[t.flex1, t.hFull, t.wFull]}>
            <FlashList
              ref={listRef}
              data={displayedConversationRequests}
              extraData={extraData}
              renderItem={renderItem}
              refreshing={refreshing}
              keyExtractor={keyExtractor}
              {...ZERO_SCROLL_INSET_PROPS}
              {...STANDARD_FLASHLIST_PERF_PROPS}
              onRefresh={refetch}
              onEndReached={handleEndReached}
              onEndReachedThreshold={feedOnEndReachedThreshold}
              ListEmptyComponent={ListEmptyComponent}
              contentContainerStyle={contentContainerStyle}
              viewabilityConfig={viewabilityConfig}
              onViewableItemsChanged={onViewableItemsChanged}
              ListFooterComponent={
                hasNextPage ? (
                  <View style={[t.h24, t.mT4]}>
                    <LoadingIndicator />
                  </View>
                ) : null
              }
            />
          </View>
        </View>
      </View>
    );
  },
);

const keyExtractor = (item: ApiDirectCastInboxConversationInfoV3) => {
  return item.conversationId;
};

DirectCastsRequestsScreen.displayName = 'DirectCastsRequests';

export { DirectCastsRequestsScreen };
