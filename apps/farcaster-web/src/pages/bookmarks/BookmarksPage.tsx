import { useBookmarkedCastsWithRefreshOnMount } from 'farcaster-client-hooks';
import uniqBy from 'lodash/uniqBy';
import React from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { Cast } from '~/components/casts/Cast';
import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { Page } from '~/components/page/Page';
import { useCastsWithContext } from '~/hooks/casts/useCastsWithContext';
import { ApiCastWithContext } from '~/types';
import { castWithContextKeyExtractor } from '~/utils/keyExtractorUtils';

const BookmarksPage: React.FC = React.memo(() => {
  const { data, onEndReached, isFetchingNextPage } =
    useBookmarkedCastsWithRefreshOnMount();

  const casts = React.useMemo(
    () => data?.pages.flatMap((page) => page.result.bookmarks) || [],
    [data],
  );

  const castsWithContext = useCastsWithContext(casts, {
    forceThreadPosition: 'start_and_end',
    forceCastHeaderLabelHidden: true,
  });

  const uniqueCastsWithContext = React.useMemo(
    () => uniqBy(castsWithContext, castWithContextKeyExtractor),
    [castsWithContext],
  );

  return (
    <Page meta={{ title: 'Bookmarks' }}>
      <BorderedMainContent>
        <div className="flex w-full items-center justify-between px-4 pb-4 pt-5">
          <span className="text-lg font-semibold">Bookmarks</span>
        </div>
        <FlatList
          data={uniqueCastsWithContext}
          emptyView={
            <DefaultEmptyListView message="You'll see your bookmarked casts here." />
          }
          renderItem={renderItem}
          keyExtractor={castWithContextKeyExtractor}
          onEndReached={onEndReached}
          isFetchingNextPage={isFetchingNextPage}
        />
      </BorderedMainContent>
    </Page>
  );
});

const renderItem = ({ item }: { item: ApiCastWithContext }) => (
  <Cast castWithContext={item} />
);

BookmarksPage.displayName = 'BookmarksPage';

export { BookmarksPage };
