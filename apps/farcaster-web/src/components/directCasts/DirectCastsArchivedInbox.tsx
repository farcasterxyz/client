import { ApiDirectCastInboxConversationInfoV3 } from 'farcaster-client-data';
import {
  extractDirectCastConversationKey,
  useDirectCastInboxByAccount,
} from 'farcaster-client-hooks';
import React from 'react';

import { FlatList } from '~/components/lists/FlatList';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';

import { DirectCastListConversation } from './DirectCastListConversation';
import { EmptyDirectCastsInbox } from './EmptyDirectCastsInbox';

type DirectCastsArchivedInboxProps = {
  activeConversationId: string | undefined;
};

const DirectCastsArchivedInbox: React.FC<DirectCastsArchivedInboxProps> =
  React.memo(({ activeConversationId }) => {
    const { fid } = useCurrentUser();

    const { data, onEndReached, isPending, isFetchingNextPage } =
      useDirectCastInboxByAccount({
        fid,
        category: 'archived',
      });

    const archivedConversations = React.useMemo(() => {
      return data?.pages.flatMap((page) => page.result.conversations) || [];
    }, [data?.pages]);

    const renderItem = React.useCallback(
      ({ item }: { item: ApiDirectCastInboxConversationInfoV3 }) => {
        return (
          <DirectCastListConversation
            active={item.conversationId === activeConversationId}
            conversation={item}
            viewingArchived={true}
          />
        );
      },
      [activeConversationId],
    );

    return (
      <FlatList
        containerClassName="w-full w-max-full"
        data={archivedConversations}
        renderItem={renderItem}
        onEndReached={onEndReached}
        isFetchingNextPage={isPending || isFetchingNextPage}
        keyExtractor={(item) =>
          `archived-${extractDirectCastConversationKey(item)}`
        }
        emptyView={
          <EmptyDirectCastsInbox message="No archived direct casts." />
        }
      />
    );
  });

export { DirectCastsArchivedInbox };
