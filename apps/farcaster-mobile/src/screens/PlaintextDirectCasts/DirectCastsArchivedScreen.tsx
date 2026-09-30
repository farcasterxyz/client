import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiDirectCastInboxConversationInfoV3 } from 'farcaster-client-data';
import {
  useDirectCastInboxByAccount,
  useFlatPaginatedResults,
  usePrefetchDirectCastConversation,
  usePrefetchDirectCastConversationMessages,
  usePrefetchDirectCastConversationRecentMessages,
} from 'farcaster-client-hooks';
import React, { useCallback } from 'react';
import { View, ViewToken } from 'react-native';

import { Empty } from '~/components/Empty';
import { LoadingIndicator } from '~/components/LoadingIndicator';
import { buildScreen } from '~/components/Screen';
import { feedOnEndReachedThreshold } from '~/constants/FlatList';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useCommonFlatListExtraData } from '~/hooks/useCommonFlatListExtraData';
import { PlaintextDirectCastsStackParamList } from '~/types';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';
import {
  useForceZeroScrollInsets,
  ZERO_SCROLL_INSET_PROPS,
} from '~/utils/ScrollInsetUtils';

import { PlaintextDirectCastConversationListItem } from './PlaintextDirectCastConversationListItem';

type DirectCastsArchivedScreenProps = NativeStackScreenProps<
  PlaintextDirectCastsStackParamList,
  'DirectCastsArchived'
>;

const DirectCastsArchivedScreen = buildScreen<DirectCastsArchivedScreenProps>(
  { name: 'DirectCastsArchived' },
  () => {
    const t = useTheme();
    const { trackEvent } = useAnalytics();

    const { fid } = useCurrentUser_UNSAFE();

    const { data, onEndReached, isPending, isFetchingNextPage, refetch } =
      useDirectCastInboxByAccount({
        fid,
        category: 'archived',
      });

    const conversationRequests = useFlatPaginatedResults({
      data,
      key: 'conversations',
    }) as ApiDirectCastInboxConversationInfoV3[];

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
        trackEvent(AnalyticsEvent.ViewDirectCastsInbox, {
          inbox: 'archived',
        });
      }, [trackEvent]),
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
            shouldShowConversationTag={false}
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
        paddingBottom: 72,
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
                    style={[t.dark ? { color: '#ffffff' } : t.texts.brand]}
                  />
                </View>
              }
              message="No archived direct casts"
              subMessage="Archived direct casts will appear here."
            />
          )}
        </View>
      );
    }, [
      isPending,
      t.bgIconUnderlay,
      t.bgDefault,
      t.dark,
      t.itemsCenter,
      t.justifyCenter,
      t.pT10,
      t.roundedFull,
      t.texts.brand,
    ]);

    return (
      <View style={[t.hFull, t.borderTHairline, t.borderDefault]}>
        <FlashList
          ref={listRef}
          data={conversationRequests}
          extraData={extraData}
          renderItem={renderItem}
          refreshing={refreshing}
          keyExtractor={keyExtractor}
          {...ZERO_SCROLL_INSET_PROPS}
          {...STANDARD_FLASHLIST_PERF_PROPS}
          onRefresh={refetch}
          onEndReached={onEndReached}
          onEndReachedThreshold={feedOnEndReachedThreshold}
          ListEmptyComponent={ListEmptyComponent}
          contentContainerStyle={contentContainerStyle}
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
        />
      </View>
    );
  },
);

const keyExtractor = (item: ApiDirectCastInboxConversationInfoV3) => {
  return item.conversationId;
};

DirectCastsArchivedScreen.displayName = 'DirectCastsArchived';

export { DirectCastsArchivedScreen };
