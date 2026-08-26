import { ApiCast, isFarcasterApiError } from 'farcaster-client-data';
import { useFlatSearchCastsData, useSearchCasts } from 'farcaster-client-hooks';
import uniqBy from 'lodash/uniqBy';
import { FC, memo, Suspense, useEffect, useMemo } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { Cast } from '~/components/casts/Cast';
import { EmptySearchResultsListView } from '~/components/lists/EmptySearchResultsListView';
import { FlatList } from '~/components/lists/FlatList';
import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { SearchHeader } from '~/components/search/SearchHeader';
import { useCastsWithContext } from '~/hooks/casts/useCastsWithContext';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { useSearchParams } from '~/hooks/navigation/useSearchParams';
import { ApiCastWithContext } from '~/types';
import { castWithContextKeyExtractor } from '~/utils/keyExtractorUtils';

import { SearchPageHeader } from './SearchPageHeader';

// todo: refactor to simplify this copy pasta of CastsSearchPage
// it just has a new query filter sort:recent
const RecentSearchPage = memo(() => {
  const { q } = useSearchParams('recent');
  const navigate = useNavigate();

  const trimmedQ = useMemo(() => {
    return q?.trim();
  }, [q]);

  useEffect(() => {
    if (!trimmedQ) {
      navigate({ to: 'channels', params: {}, searchParams: {} });
    }
  }, [navigate, trimmedQ]);

  if (!trimmedQ) {
    return null;
  }

  return <RecentSearchPageContent q={trimmedQ} />;
});

RecentSearchPage.displayName = 'RecentSearchPage';

type RecentSearchPageContentProps = {
  q: string;
};

const RecentSearchPageContent: FC<RecentSearchPageContentProps> = memo(
  ({ q }) => {
    return (
      <Page meta={{ title: 'Search / Farcaster' }}>
        <BorderedMainContent>
          <PageHeader
            footer={<SearchPageHeader focusedTab="recent" q={q} />}
            hideCastButton={true}
          >
            <SearchHeader
              q={q}
              showFilterIcon={true}
              showClearIcon={false}
              focusedTab={'recent'}
            />
          </PageHeader>
          <Suspense fallback={<FullScreenLoadingIndicator />}>
            <RecentSearchResults q={q} />
          </Suspense>
        </BorderedMainContent>
      </Page>
    );
  },
);

const renderCastItem = ({ item }: { item: ApiCastWithContext }) => (
  <Cast castWithContext={item} />
);

RecentSearchPageContent.displayName = 'RecentSearchPageContent';

type SearchResultsProps = {
  q: string;
};

const RecentSearchResults: FC<SearchResultsProps> = memo(({ q }) => {
  const recentQ = q ? q + ' sort:recent' : '';
  const { data, onEndReached, isFetchingNextPage, isFetching, error } =
    useSearchCasts({ q: recentQ });
  const casts = useFlatSearchCastsData({ data });
  const castsWithContext = useCastsWithContext(casts || ([] as ApiCast[]), {
    forceThreadPosition: 'start_and_end',
    forceCastHeaderLabelHidden: true,
  });

  const uniqueCastsWithContext = useMemo(
    () => uniqBy(castsWithContext, castWithContextKeyExtractor),
    [castsWithContext],
  );

  if (isFetching) {
    return <FullScreenLoadingIndicator />;
  }

  const { message: errMessage, subMessage: errSubMessage } =
    fetchEmptyViewMessage(error);

  return (
    <FlatList
      data={uniqueCastsWithContext}
      renderItem={renderCastItem}
      keyExtractor={castWithContextKeyExtractor}
      onEndReached={onEndReached}
      isFetchingNextPage={isFetchingNextPage}
      emptyView={
        <EmptySearchResultsListView
          message={errMessage}
          subMessage={errSubMessage}
        />
      }
    />
  );
});

const fetchEmptyViewMessage = (
  error: unknown,
): { message: string; subMessage?: string } => {
  const defaultMessage = {
    message: 'No casts match your search',
  };

  if (error && isFarcasterApiError(error)) {
    //@ts-ignore
    const errorMessage = error.responseData.errors[0].message ?? '';
    if (errorMessage.endsWith('not found')) {
      const errorComponents = errorMessage.split(' ');
      const searchTerm = errorComponents[0];
      return {
        message: `We couldn't find a ${searchTerm.toLowerCase()} named ${searchTerm === 'Channel' ? '/' : '@'}${errorComponents[1].toLowerCase()}`,
        subMessage: `Make sure everything is spelled correctly or try a different ${searchTerm.toLowerCase()}`,
      };
    } else {
      return {
        message: "We couldn't find any matches for your search",
      };
    }
  }

  return defaultMessage;
};

RecentSearchResults.displayName = 'RecentSearchResults';

export { RecentSearchPage };
