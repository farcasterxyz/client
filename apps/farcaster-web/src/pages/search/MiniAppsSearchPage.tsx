import { ApiFrame } from 'farcaster-client-data';
import { useSearchMiniApps } from 'farcaster-client-hooks';
import { FC, memo, Suspense, useEffect, useMemo } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { MiniAppListItem } from '~/components/miniApp/MiniAppLeaderboardListItem';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { SearchHeader } from '~/components/search/SearchHeader';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { useSearchParams } from '~/hooks/navigation/useSearchParams';

import { SearchPageHeader } from './SearchPageHeader';

const MiniAppsSearchPage = memo(() => {
  const { q } = useSearchParams('searchMiniApps');
  const navigate = useNavigate();

  const trimmedQ = useMemo(() => {
    return q?.trim();
  }, [q]);

  useEffect(() => {
    if (!trimmedQ) {
      navigate({ to: 'miniApps', params: {}, searchParams: {} });
    }
  }, [navigate, trimmedQ]);

  if (!trimmedQ) {
    return null;
  }

  return <MiniAppsSearchPageContent q={trimmedQ} />;
});

MiniAppsSearchPage.displayName = 'MiniAppsSearchPage';

type MiniAppsSearchPageContentProps = {
  q: string;
};

const MiniAppsSearchPageContent: FC<MiniAppsSearchPageContentProps> = memo(
  ({ q }) => {
    return (
      <Page meta={{ title: 'Search / Farcaster' }}>
        <BorderedMainContent>
          <PageHeader
            footer={<SearchPageHeader focusedTab="miniApps" q={q} />}
            hideCastButton={true}
          >
            <SearchHeader q={q} showClearIcon={false} focusedTab={'miniApps'} />
          </PageHeader>
          <Suspense fallback={<FullScreenLoadingIndicator />}>
            <MiniAppsSearchResults q={q} />
          </Suspense>
        </BorderedMainContent>
      </Page>
    );
  },
);

MiniAppsSearchPageContent.displayName = 'MiniAppsSearchPageContent';

const MiniAppsSearchResults: FC<{ q: string }> = memo(({ q }) => {
  const { flatData, onEndReached, isFetchingNextPage, isLoading } =
    useSearchMiniApps({ query: q });

  return (
    <div className="pt-2">
      <FlatList
        data={flatData ?? []}
        renderItem={({ item, index }) => (
          <MiniAppListItem
            item={item}
            noBorder={index === (flatData ?? []).length - 1}
          />
        )}
        keyExtractor={(item: ApiFrame) => item.domain}
        emptyView={
          isLoading ? (
            <FullScreenLoadingIndicator />
          ) : (
            <DefaultEmptyListView message="No mini apps found" />
          )
        }
        onEndReached={onEndReached}
        isFetchingNextPage={isFetchingNextPage}
      />
    </div>
  );
});

MiniAppsSearchResults.displayName = 'MiniAppsSearchResults';

export { MiniAppsSearchPage };
