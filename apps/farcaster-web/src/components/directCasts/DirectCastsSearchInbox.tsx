import {
  ApiDirectCastConversationViewCategory,
  ApiDirectCastInboxConversationInfoV3,
  ApiMessageSearchResult,
} from 'farcaster-client-data';
import {
  extractDirectCastConversationKey,
  extractDirectCastKey,
  useOptimisticallySwapDirectCastMessagesWithSearchResults,
  useSearchDirectCastInbox,
  useSearchDirectCastMessages,
} from 'farcaster-client-hooks';
import React from 'react';

import { FlatList } from '~/components/lists/FlatList';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { useNavigateToDirectCastsConversation } from '~/hooks/navigation/useNavigateToDirectCastsConversation';

import {
  CacheIgnoringDirectCastListConversation,
  DirectCastListConversation,
} from './DirectCastListConversation';
import { EmptyDirectCastsInbox } from './EmptyDirectCastsInbox';

type DirectCastsSearchInboxProps = {
  filter: string;
  category: ApiDirectCastConversationViewCategory;
  activeConversationId: string | undefined;
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

const DirectCastsSearchInbox: React.FC<DirectCastsSearchInboxProps> =
  React.memo(({ filter, category, activeConversationId }) => {
    const {
      flatData: conversationResults,
      onEndReached: onEndReachedConversations,
      hasNextPage: hasNextConversationPage,
      isFetchingNextPage: isFetchingNextConversationPage,
      isLoading: conversationsAreLoading,
    } = useSearchDirectCastInbox({
      q: filter,
      category: category,
    });

    const {
      flatData: messageResults,
      onEndReached: onEndReachedMessages,
      isFetchingNextPage: isFetchingNextMessagePage,
      isLoading: messagesAreLoading,
    } = useSearchDirectCastMessages({
      query: filter,
    });

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
        listItems.push({ ...lastItem, last: true });
        if (
          messages.length !== 0 &&
          (conversations.length > conversationsToShowIfNonzeroMessageResults ||
            hasNextConversationPage)
        ) {
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

    const swapWithSearchResults =
      useOptimisticallySwapDirectCastMessagesWithSearchResults();

    const navigateToDirectCastsConversation =
      useNavigateToDirectCastsConversation();

    const numConversationResults = conversationResults?.length ?? 0;
    const renderItem = React.useCallback(
      ({ item }: { item: SearchInboxItem }) => {
        if (item.type === 'header') {
          return (
            <div className="px-4 py-2 text-sm font-medium text-muted">
              {item.title}
            </div>
          );
        } else if (item.type === 'loadMoreConversations') {
          const onClick = () => {
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
            <div
              onClick={onClick}
              className="cursor-pointer px-4 py-2 text-xs text-faint hover:bg-overlay-faint"
            >
              Load more conversations
            </div>
          );
        } else if (item.type === 'conversation') {
          const { conversation } = item;
          return (
            <DirectCastListConversation
              active={conversation.conversationId === activeConversationId}
              conversation={conversation}
              borderStyle={item.last ? 'none' : 'bottom'}
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
        const itemKey = extractDirectCastKey(result);
        const onClick = () => {
          swapWithSearchResults({
            conversationId: conversation.conversationId,
            searchResults: messages,
            cursor: surroundingMessagesCursor,
          });
          navigateToDirectCastsConversation({ conversationId: itemKey });
        };
        const hackedConversation = {
          ...conversation,
          lastMessage: {
            ...result,
            message: highlights[0],
          },
        };
        return (
          <CacheIgnoringDirectCastListConversation
            active={itemKey === activeConversationId}
            conversation={hackedConversation}
            borderStyle={item.last ? 'none' : 'bottom'}
            onClick={onClick}
            parseMatchedSearchTermsFromLastMessage={true}
          />
        );
      },
      [
        activeConversationId,
        swapWithSearchResults,
        navigateToDirectCastsConversation,
        onEndReachedConversations,
        numConversationResults,
        conversationsToShowIfNonzeroMessageResults,
      ],
    );

    const emptyView = React.useMemo(
      () => <EmptyDirectCastsInbox message={`No results for "${filter}"`} />,
      [filter],
    );

    const onEndReached = React.useCallback(() => {
      if (messages.length === 0) {
        onEndReachedConversations();
      } else {
        onEndReachedMessages();
      }
    }, [messages.length, onEndReachedMessages, onEndReachedConversations]);

    if (conversationsAreLoading || messagesAreLoading) {
      return (
        <div className="flex size-full flex-col items-center justify-start pt-48">
          <LoadingIndicator />
        </div>
      );
    }

    return (
      <FlatList
        containerClassName="w-full w-max-full"
        data={listData}
        renderItem={renderItem}
        onEndReached={onEndReached}
        isFetchingNextPage={
          isFetchingNextConversationPage || isFetchingNextMessagePage
        }
        keyExtractor={keyExtractor}
        emptyView={emptyView}
      />
    );
  });

export { DirectCastsSearchInbox };
