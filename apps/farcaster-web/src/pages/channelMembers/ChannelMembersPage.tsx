import { ApiChannelUser } from 'farcaster-client-data';
import { useChannelMembers, useDebouncedValue } from 'farcaster-client-hooks';
import { FC, memo, useCallback, useRef, useState } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { ChannelFollowersHeader } from '~/components/channels/ChannelFollowersHeader';
import { ChannelUserListItem } from '~/components/channelUsers/ChannelUserListItem';
import { BackButton } from '~/components/forms/buttons/BackButton';
import { SearchInput } from '~/components/forms/SearchInput';
import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { useParams } from '~/hooks/navigation/useParams';

const ChannelMembersPage: FC = memo(() => {
  const { channelKey } = useParams('channelMembers');

  const lastKeyDownCodeRef = useRef<string>(undefined);
  const lastKeyDownQueryRef = useRef<string>(undefined);

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue({
    value: query,
    debounceDuration: query.length < 3 ? 250 : 125,
  });

  const { flatData, onEndReached, isFetchingNextPage, isPending } =
    useChannelMembers({
      channelKey,
      query: debouncedQuery,
    });

  const renderItem = useCallback(
    ({ item }: { item: ApiChannelUser }) => (
      <ChannelUserListItem channelKey={channelKey} channelUser={item} />
    ),
    [channelKey],
  );

  return (
    <Page meta={{ title: `Members of /${channelKey}` }}>
      <BorderedMainContent>
        <PageHeader
          hideCastButton
          dynamicFooterHeight
          footer={
            <div>
              <ChannelFollowersHeader
                channelKey={channelKey}
                focusedTab="channelMembers"
              />
              <div className="p-3">
                <SearchInput
                  placeholder="Search"
                  className="!rounded-md border border-default"
                  variant="muted"
                  value={query}
                  maxLength={64}
                  onKeyDown={(e) => {
                    lastKeyDownCodeRef.current = e.code;
                    lastKeyDownQueryRef.current = query;
                  }}
                  onKeyUp={(e) => {
                    if (
                      lastKeyDownCodeRef.current === 'Escape' &&
                      lastKeyDownQueryRef.current &&
                      !query
                    ) {
                      e.stopPropagation();
                    }
                  }}
                  onChange={(e) => {
                    const newQuery = e.target.value;
                    setQuery(newQuery);
                  }}
                  onClear={() => {
                    setQuery('');
                  }}
                />
              </div>
            </div>
          }
        >
          <PageTitle>
            <BackButton />/{channelKey}
          </PageTitle>
        </PageHeader>
        <FlatList
          data={flatData}
          renderItem={renderItem}
          keyExtractor={(item) => item.user.fid.toString()}
          onEndReached={onEndReached}
          isFetchingNextPage={isFetchingNextPage || isPending}
          emptyView={<DefaultEmptyListView message="No members found" />}
        />
      </BorderedMainContent>
    </Page>
  );
});

ChannelMembersPage.displayName = 'ChannelMembersPage';

export { ChannelMembersPage };
