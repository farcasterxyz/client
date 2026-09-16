import { ApiUser } from 'farcaster-client-data';
import {
  useNotificationActorsInGroup,
  userKeyExtractor,
} from 'farcaster-client-hooks';
import { memo, useMemo } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { DebugLogger } from '~/components/debug/DebugLogger';
import { BackButton } from '~/components/forms/buttons/BackButton';
import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { User } from '~/components/users/User';
import { useParams } from '~/hooks/navigation/useParams';
import { useSearchParams } from '~/hooks/navigation/useSearchParams';

const NotificationGroupUsersPage = memo(() => {
  const { groupId, type } = useParams('notificationGroupUsers');
  const { title: titleProp } = useSearchParams('notificationGroupUsers');

  const { data, onEndReached, isFetchingNextPage } =
    useNotificationActorsInGroup({
      groupId,
      type,
    });

  const users = useMemo(
    () => data?.pages.flatMap((page) => page.result.actors),
    [data?.pages],
  );

  const title = useMemo(() => {
    if (titleProp) {
      return titleProp;
    }

    switch (type) {
      case 'cast-mention':
        return 'Mentioned By';
      case 'cast-reaction':
        return 'Liked By';
      case 'cast-reply':
        return 'Replies From';
      case 'follow':
        return 'Followed By';
      case 'nearby':
        return 'Nearby';
      case 'recast':
        return 'Recasted By';
      default:
        return 'Users';
    }
  }, [titleProp, type]);

  return (
    <Page meta={{ title: `Farcaster / ${title}` }}>
      <BorderedMainContent>
        <PageHeader hideCastButton>
          <PageTitle>
            <BackButton />
            {title}
          </PageTitle>
        </PageHeader>
        <DebugLogger
          name="Notification Users"
          data={users}
          position="top-left"
        />
        <FlatList
          data={users}
          emptyView={
            <DefaultEmptyListView message="Could not find any notifications" />
          }
          renderItem={renderItem}
          keyExtractor={userKeyExtractor}
          onEndReached={onEndReached}
          isFetchingNextPage={isFetchingNextPage}
        />
      </BorderedMainContent>
    </Page>
  );
});

const renderItem = ({ item }: { item: ApiUser }) => <User user={item} />;

NotificationGroupUsersPage.displayName = 'NotificationGroupUsersPage';

export { NotificationGroupUsersPage };
