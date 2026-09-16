import { useIsFocused } from '@react-navigation/native';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import {
  ApiDirectCastConversationFilter,
  ApiDirectCastInboxConversationInfoV3,
} from 'farcaster-client-data';
import {
  usePrefetchDirectCastConversation,
  usePrefetchDirectCastConversationMessages,
  usePrefetchDirectCastConversationRecentMessages,
} from 'farcaster-client-hooks';
import uniqBy from 'lodash/uniqBy';
import React, { useCallback } from 'react';
import { ViewToken } from 'react-native';

import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { NewVersionAvailableDirectCastsIndicator } from '~/components/NewVersionAvailableDirectCastsIndicator';
import { feedOnEndReachedThreshold } from '~/constants/FlatList';
import { useDirectCasts } from '~/contexts/DirectCastsProvider';
import { useCommonFlatListExtraData } from '~/hooks/useCommonFlatListExtraData';
import { useHaptics } from '~/hooks/useHaptics';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';
import {
  useForceZeroScrollInsets,
  ZERO_SCROLL_INSET_PROPS,
} from '~/utils/ScrollInsetUtils';

import { EmptyDirectCastsInbox } from './EmptyDirectCastInbox';
import { InboxFilter, InboxHeaderFilters } from './InboxHeaderFilters';
import { InboxNavigationTabs } from './InboxNavigationTabs';
import { PlaintextDirectCastConversationListItem } from './PlaintextDirectCastConversationListItem';

const DefaultInbox: React.FC = React.memo(() => {
  const { triggerImpactAsync } = useHaptics();

  const {
    currentUserFid,
    conversations: conversationsFromContext,
    isPending,
    filter,
    setFilter: setDirectCastsContextListFilter,
    onEndReached,
  } = useDirectCasts();

  const uniqueConversations = React.useMemo(
    () => uniqBy(conversationsFromContext, keyExtractor),
    [conversationsFromContext],
  );

  const handleEndReached = useCallback(() => {
    onEndReached();
  }, [onEndReached]);

  const onFilterChange = React.useCallback(
    ({ filter }: { filter: InboxFilter }) => {
      triggerImpactAsync();

      if (filter === 'all') {
        setDirectCastsContextListFilter(undefined);
      } else {
        setDirectCastsContextListFilter(
          filter as ApiDirectCastConversationFilter,
        );
      }
    },
    [setDirectCastsContextListFilter, triggerImpactAsync],
  );

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

  const extraData = useCommonFlatListExtraData();
  const isFocused = useIsFocused();
  const listRef =
    React.useRef<FlashListRef<ApiDirectCastInboxConversationInfoV3>>(null);
  useForceZeroScrollInsets({
    ref: listRef,
    enabled: isFocused,
  });

  const renderItem = React.useCallback(
    ({ item }: { item: ApiDirectCastInboxConversationInfoV3 }) => {
      return (
        <PlaintextDirectCastConversationListItem
          currentUserFid={currentUserFid}
          conversation={item}
          borderStyle={'none'}
          shouldShowConversationTag={false}
        />
      );
    },
    [currentUserFid],
  );

  const onViewableItemsChanged = React.useCallback(
    ({ viewableItems: conversations }: { viewableItems: ViewToken[] }) => {
      for (const { key: conversationId } of conversations) {
        prefetch({ conversationId });
      }
    },
    [prefetch],
  );

  const emptyMessage = React.useMemo(() => {
    switch (filter) {
      case 'group':
        return 'No group direct casts';
      case 'unread':
        return 'No unread direct casts';
      default:
        return 'No direct casts';
    }
  }, [filter]);

  const ListHeaderComponent = React.useMemo(() => {
    return (
      <>
        {typeof filter === 'undefined' && (
          <NewVersionAvailableDirectCastsIndicator />
        )}
        <InboxNavigationTabs activeTab="inbox" />
        <InboxHeaderFilters onFilterChange={onFilterChange} />
      </>
    );
  }, [filter, onFilterChange]);

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
    return isPending && uniqueConversations.length === 0 ? (
      <FullScreenLoadingIndicator debugName="DefaultInbox" />
    ) : !isPending ? (
      <EmptyDirectCastsInbox text={emptyMessage} />
    ) : undefined;
  }, [emptyMessage, isPending, uniqueConversations.length]);

  return (
    <FlashList
      data={uniqueConversations}
      extraData={extraData}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ref={listRef}
      {...ZERO_SCROLL_INSET_PROPS}
      {...STANDARD_FLASHLIST_PERF_PROPS}
      onEndReached={handleEndReached}
      onEndReachedThreshold={feedOnEndReachedThreshold}
      contentContainerStyle={contentContainerStyle}
      viewabilityConfig={viewabilityConfig}
      onViewableItemsChanged={onViewableItemsChanged}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
    />
  );
});

const keyExtractor = (item: ApiDirectCastInboxConversationInfoV3) => {
  return item.conversationId;
};

DefaultInbox.displayName = 'DefaultInbox';

export { DefaultInbox };
