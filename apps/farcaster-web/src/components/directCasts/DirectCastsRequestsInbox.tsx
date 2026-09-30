import { ApiDirectCastInboxConversationInfoV3 } from 'farcaster-client-data';
import {
  extractDirectCastConversationKey,
  useDirectCastInboxByAccount,
  useFlatPaginatedResults,
  useOptimisticallyMarkRequestsAsRead,
} from 'farcaster-client-hooks';
import React from 'react';

import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';

import { DirectCastListConversation } from './DirectCastListConversation';

type DirectCastsRequestsInboxProps = {
  activeConversationId: string | undefined;
  category?: 'request' | 'void';
};

const DirectCastsRequestsInbox: React.FC<DirectCastsRequestsInboxProps> =
  React.memo(({ activeConversationId, category = 'request' }) => {
    const { fid } = useCurrentUser();

    const optimisticallyMarkRequestsAsRead =
      useOptimisticallyMarkRequestsAsRead();

    // Only mark requests as read when viewing requests tab
    if (category === 'request') {
      optimisticallyMarkRequestsAsRead({ fid });
    }

    const { data, onEndReached, isPending, isFetchingNextPage } =
      useDirectCastInboxByAccount({
        fid,
        category,
      });

    const conversations = useFlatPaginatedResults({
      data,
      key: 'conversations',
    });

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

    const emptyMessage =
      category === 'void' ? 'No hidden direct casts.' : 'No requests.';

    return (
      <FlatList
        containerClassName="w-full w-max-full"
        data={conversations}
        renderItem={renderItem}
        onEndReached={onEndReached}
        isFetchingNextPage={isPending || isFetchingNextPage}
        keyExtractor={(item) =>
          `${category}-${extractDirectCastConversationKey(item)}`
        }
        emptyView={<DefaultEmptyListView message={emptyMessage} />}
      />
    );
  });

export { DirectCastsRequestsInbox };
