import { FlashList } from '@shopify/flash-list';
import {
  ApiDirectCastConversationViewCategory,
  ApiDirectCastInboxConversationInfoV3,
  ApiMessageSearchResult,
} from 'farcaster-client-data';
import {
  extractDirectCastConversationKey,
  extractDirectCastKey,
  useOptimisticallySwapDirectCastMessagesWithSearchResults,
  usePrefetchDirectCastConversationMessages,
  useSearchDirectCastInbox,
  useSearchDirectCastMessages,
} from 'farcaster-client-hooks';
import React from 'react';
import { TouchableOpacity, ViewToken } from 'react-native';

import { DirectCastConversationAvatar } from '~/components/DirectCasts/DirectCastConversationAvatar';
import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { ImagePile } from '~/components/ImagePile';
import { Text, Text2 } from '~/components/Text';
import { feedOnEndReachedThreshold } from '~/constants/FlatList';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { usePush } from '~/hooks/navigation/usePush';
import { useCommonFlatListExtraData } from '~/hooks/useCommonFlatListExtraData';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

import { EmptyDirectCastsInbox } from './EmptyDirectCastInbox';
import {
  CacheIgnoringPlaintextDirectCastConversationListItem,
  PlaintextDirectCastConversationListItem,
} from './PlaintextDirectCastConversationListItem';

type SearchInboxProps = {
  filter: string;
  category: ApiDirectCastConversationViewCategory;
};

type ConversationItem = {
  type: 'conversation';
  conversation: ApiDirectCastInboxConversationInfoV3;
  last?: boolean;
};
type MessageItem = {
  type: 'message';
  messageResult: ApiMessageSearchResult;
  last?: boolean;
};
type SearchInboxItem =
  | {
      type: 'header';
      title: string;
    }
  | {
      type: 'loadMoreConversations';
      conversations: ApiDirectCastInboxConversationInfoV3[];
    }
  | ConversationItem
  | MessageItem;

const convKeyPrefix = 'conv_';
const messKeyPrefix = 'mess_';

const getItemType = (item: SearchInboxItem) => item.type;

const keyExtractor = (item: SearchInboxItem) => {
  if (item.type === 'header') {
    return item.title;
  } else if (item.type === 'loadMoreConversations') {
    return 'loadMoreConversations';
  } else if (item.type === 'conversation') {
    return `${convKeyPrefix}${extractDirectCastConversationKey(item.conversation)}`;
  } else {
    return `${messKeyPrefix}${extractDirectCastKey(item.messageResult.result)}`;
  }
};

const SearchInbox: React.FC<SearchInboxProps> = React.memo(
  ({ filter, category }) => {
    const { fid } = useCurrentUser_UNSAFE();

    const {
      flatData: conversationResults,
      onEndReached: onEndReachedConversations,
      hasNextPage: hasNextConversationPage,
      isPending: conversationsArePending,
    } = useSearchDirectCastInbox({
      q: filter,
      category: category,
    });

    const {
      flatData: messageResults,
      onEndReached: onEndReachedMessages,
      isPending: messagesArePending,
    } = useSearchDirectCastMessages({
      query: filter,
    });

    const prefetch = usePrefetchDirectCastConversationMessages();

    const messages = React.useMemo(
      () =>
        messageResults?.map(
          (messageResult): MessageItem => ({
            type: 'message',
            messageResult,
          }),
        ) || [],
      [messageResults],
    );

    const [
      conversationsToShowIfNonzeroMessageResults,
      setConversationsToShowIfNonzeroMessageResults,
    ] = React.useState(5);

    const listData = React.useMemo(() => {
      const conversations =
        conversationResults?.map(
          (conversation): ConversationItem => ({
            type: 'conversation',
            conversation,
          }),
        ) || [];
      const listItems: SearchInboxItem[] = [];
      if (conversations.length > 0) {
        listItems.push({
          type: 'header',
          title: 'Conversations',
        });
        const includedConversations =
          messages.length === 0
            ? conversations
            : conversations.slice(
                0,
                conversationsToShowIfNonzeroMessageResults,
              );
        const lastItem = includedConversations.pop()!;
        listItems.push(...includedConversations);
        if (
          messages.length === 0 ||
          (conversations.length <= conversationsToShowIfNonzeroMessageResults &&
            !hasNextConversationPage)
        ) {
          listItems.push({ ...lastItem, last: true });
        } else {
          listItems.push(lastItem);
          listItems.push({
            type: 'loadMoreConversations',
            conversations: conversations
              .slice(conversationsToShowIfNonzeroMessageResults)
              .map(({ conversation }) => conversation),
          });
        }
      }
      if (messages.length > 0) {
        listItems.push({
          type: 'header',
          title: 'Messages',
        });
        const lastItem = messages.pop()!;
        listItems.push(...messages);
        listItems.push({ ...lastItem, last: true });
      }
      return listItems;
    }, [
      conversationResults,
      messages,
      conversationsToShowIfNonzeroMessageResults,
      hasNextConversationPage,
    ]);

    const extraData = useCommonFlatListExtraData();

    const swapWithSearchResults =
      useOptimisticallySwapDirectCastMessagesWithSearchResults();

    const push = usePush();
    const t = useTheme();
    const numConversationResults = conversationResults?.length ?? 0;
    const renderItem = React.useCallback(
      ({ item }: { item: SearchInboxItem }) => {
        if (item.type === 'header') {
          return (
            <Text style={t.p4}>
              <Text2 size="base" weight="medium" color="secondary">
                {item.title}
              </Text2>
            </Text>
          );
        } else if (item.type === 'loadMoreConversations') {
          const images = item.conversations.map((conversation) => ({
            node: (
              <DirectCastConversationAvatar
                conversation={conversation}
                diameter={31}
              />
            ),
            key: conversation.conversationId,
          }));
          const onPress = () => {
            if (
              conversationsToShowIfNonzeroMessageResults <
              numConversationResults
            ) {
              setConversationsToShowIfNonzeroMessageResults(
                (prevNumToShow) => prevNumToShow + 10,
              );
            } else {
              onEndReachedConversations();
            }
          };
          return (
            <TouchableOpacity
              style={[t.pX4, t.pY2, t.flexRow, t.itemsCenter]}
              onPress={onPress}
            >
              <ImagePile images={images} />
              <Text2 size="sm" weight="medium" color="tertiary">
                Show more conversations
              </Text2>
            </TouchableOpacity>
          );
        } else if (item.type === 'conversation') {
          return (
            <PlaintextDirectCastConversationListItem
              currentUserFid={fid}
              conversation={item.conversation}
              borderStyle={item.last ? 'none' : 'bottom'}
              shouldShowConversationTag={false}
            />
          );
        }
        const {
          result,
          conversation,
          messagesBefore,
          messagesAfter,
          surroundingMessagesCursor,
          highlights,
        } = item.messageResult;
        const messages = [...messagesAfter, result, ...messagesBefore];
        const onPress = () => {
          swapWithSearchResults({
            conversationId: conversation.conversationId,
            searchResults: messages,
            cursor: surroundingMessagesCursor,
          });
          push('PlaintextDirectCastsConversation', {
            conversationId: conversation.conversationId,
            counterParty: conversation.viewerContext.counterParty,
            create: false,
            intentText: undefined,
            focusOnMessageId: result.messageId,
          });
        };
        const hackedConversation = {
          ...conversation,
          lastMessage: {
            ...result,
            message: highlights[0],
          },
        };
        return (
          <CacheIgnoringPlaintextDirectCastConversationListItem
            currentUserFid={fid}
            conversation={hackedConversation}
            borderStyle="bottom"
            shouldShowConversationTag={false}
            onPress={onPress}
            parseMatchedSearchTermsFromLastMessage={true}
          />
        );
      },
      [
        fid,
        push,
        swapWithSearchResults,
        onEndReachedConversations,
        numConversationResults,
        conversationsToShowIfNonzeroMessageResults,
        t.p4,
        t.pX4,
        t.pY2,
        t.flexRow,
        t.itemsCenter,
      ],
    );

    const onViewableItemsChanged = React.useCallback(
      ({ viewableItems }: { viewableItems: ViewToken[] }) => {
        for (const { key } of viewableItems) {
          if (!key.startsWith(convKeyPrefix)) {
            continue;
          }
          const conversationId = key.slice(convKeyPrefix.length);
          prefetch({ conversationId, messageId: undefined });
        }
      },
      [prefetch],
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

    const listEmptyComponent = React.useMemo(
      () =>
        messagesArePending || conversationsArePending ? (
          <FullScreenLoadingIndicator debugName="SearchInbox" />
        ) : (
          <EmptyDirectCastsInbox text={`No results for "${filter}"`} />
        ),
      [messagesArePending, conversationsArePending, filter],
    );

    const onEndReached = React.useCallback(() => {
      if (messages.length === 0) {
        onEndReachedConversations();
      } else {
        onEndReachedMessages();
      }
    }, [messages.length, onEndReachedMessages, onEndReachedConversations]);

    return (
      <FlashList
        data={listData}
        extraData={extraData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        onEndReached={onEndReached}
        onEndReachedThreshold={feedOnEndReachedThreshold}
        contentContainerStyle={contentContainerStyle}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        ListEmptyComponent={listEmptyComponent}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="always"
        {...STANDARD_FLASHLIST_PERF_PROPS}
      />
    );
  },
);

SearchInbox.displayName = 'SearchInbox';

export { SearchInbox };
