import { ApiDirectCastInboxConversationInfoV3 } from 'farcaster-client-data';
import { extractDirectCastConversationKey } from 'farcaster-client-hooks';
import React from 'react';

import { FlatList } from '~/components/lists/FlatList';
import { useDirectCasts } from '~/contexts/DirectCastsProvider';

import { DirectCastListConversation } from './DirectCastListConversation';
import { EmptyDirectCastsInbox } from './EmptyDirectCastsInbox';

type DirectCastsDefaultInboxProps = {
  activeConversationId: string | undefined;
};

const DirectCastsDefaultInbox: React.FC<DirectCastsDefaultInboxProps> =
  React.memo(({ activeConversationId }) => {
    const {
      conversations: optimisticConversations,
      onEndReached,
      filter,
      isLoading,
    } = useDirectCasts();

    const conversations = React.useMemo(() => {
      return Object.values(optimisticConversations)
        .filter((conversation) => typeof conversation !== 'undefined')
        .map(
          (conversation) =>
            conversation as ApiDirectCastInboxConversationInfoV3,
        );
    }, [optimisticConversations]);

    const renderItem = React.useCallback(
      ({ item }: { item: ApiDirectCastInboxConversationInfoV3 }) => {
        return (
          <DirectCastListConversation
            active={item.conversationId === activeConversationId}
            conversation={item}
            borderStyle={'none'}
          />
        );
      },
      [activeConversationId],
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

    return (
      <FlatList
        containerClassName="w-full w-max-full"
        data={conversations}
        renderItem={renderItem}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        isFetchingNextPage={isLoading}
        keyExtractor={(item) => extractDirectCastConversationKey(item)}
        emptyView={<EmptyDirectCastsInbox message={emptyMessage} />}
      />
    );
  });

export { DirectCastsDefaultInbox };
