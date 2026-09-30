import { ApiUser } from 'farcaster-client-data';
import {
  useChannelFollowersYouKnow,
  userKeyExtractor,
} from 'farcaster-client-hooks';
import { FC, memo, useMemo } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { ChannelFollowersHeader } from '~/components/channels/ChannelFollowersHeader';
import { BackButton } from '~/components/forms/buttons/BackButton';
import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { UserListItem } from '~/components/users/UserListItem';
import { useParams } from '~/hooks/navigation/useParams';

const ChannelFollowersYouKnowPage: FC = memo(() => {
  const { channelKey } = useParams('channelFollowersYouKnow');

  const { data, onEndReached, isFetchingNextPage } = useChannelFollowersYouKnow(
    {
      channelKey,
      limit: 20,
    },
  );

  const users = useMemo(
    () => data!.pages.flatMap((page) => page.result.users),
    [data],
  );

  return (
    <Page meta={{ title: `Users you know following /${channelKey}` }}>
      <BorderedMainContent>
        <PageHeader
          hideCastButton
          footer={
            <ChannelFollowersHeader
              channelKey={channelKey}
              focusedTab="channelFollowersYouKnow"
            />
          }
        >
          <PageTitle>
            <BackButton />/{channelKey}
          </PageTitle>
        </PageHeader>
        <FlatList
          data={users}
          renderItem={renderItem}
          keyExtractor={userKeyExtractor}
          onEndReached={onEndReached}
          isFetchingNextPage={isFetchingNextPage}
          emptyView={
            <DefaultEmptyListView
              message={`/${channelKey} doesn't have any followers you know.`}
            />
          }
        />
      </BorderedMainContent>
    </Page>
  );
});

const renderItem = ({ item }: { item: ApiUser }) => (
  <UserListItem user={item} />
);

ChannelFollowersYouKnowPage.displayName = 'ChannelFollowersYouKnowPage';

export { ChannelFollowersYouKnowPage };
