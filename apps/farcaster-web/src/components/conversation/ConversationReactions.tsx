import { ApiUser } from 'farcaster-client-data';
import {
  useCastLikesWithRefreshOnMount,
  userKeyExtractor,
} from 'farcaster-client-hooks';
import { FC, memo, useMemo } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { DebugLogger } from '~/components/debug/DebugLogger';
import { BackButton } from '~/components/forms/buttons/BackButton';
import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { User } from '~/components/users/User';

type ConversationReactionsProps = {
  castHash: string;
};

const ConversationReactions: FC<ConversationReactionsProps> = memo(
  ({ castHash }) => {
    const { data, onEndReached, isFetchingNextPage } =
      useCastLikesWithRefreshOnMount({
        castHash,
      });

    const users: ApiUser[] = useMemo(
      () =>
        data?.pages.flatMap((page) =>
          page.result.likes.map((like) => like.reactor),
        ) || [],
      [data?.pages],
    );

    return (
      <Page
        meta={{
          title: `Reactions to ${castHash}`,
        }}
      >
        <BorderedMainContent>
          <DebugLogger
            name="ConversationReactions"
            data={{ castHash, users }}
            position="top-left"
          />
          <PageHeader hideCastButton>
            <PageTitle>
              <BackButton />
              Liked by
            </PageTitle>
          </PageHeader>
          <FlatList
            data={users}
            onEndReached={onEndReached}
            isFetchingNextPage={isFetchingNextPage}
            keyExtractor={userKeyExtractor}
            emptyView={
              <DefaultEmptyListView message="No users liked the cast, yet." />
            }
            renderItem={renderItem}
          />
        </BorderedMainContent>
      </Page>
    );
  },
);

const renderItem = ({ item }: { item: ApiUser }) => {
  return <User user={item} withDetailsPopover={true} />;
};

ConversationReactions.displayName = 'ConversationReactions';

export { ConversationReactions };
