import { AnalyticsEvent } from 'farcaster-analytics';
import {
  useFlatSearchCastsData,
  useTrendingTopicCasts,
} from 'farcaster-client-hooks';
import React from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { Cast } from '~/components/casts/Cast';
import { BackButton } from '~/components/forms/buttons/BackButton';
import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCastsWithContext } from '~/hooks/casts/useCastsWithContext';
import { useParams } from '~/hooks/navigation/useParams';
import { useSearchParams } from '~/hooks/navigation/useSearchParams';
import { ApiCastWithContext } from '~/types';
import { castWithContextKeyExtractor } from '~/utils/keyExtractorUtils';

const TrendingTopicPage: React.FC = React.memo(() => {
  const { trackEvent } = useAnalytics();
  const { topicId } = useParams('trendingTopic');
  const { displayName } = useSearchParams('trendingTopic');

  React.useEffect(() => {
    trackEvent(AnalyticsEvent.ViewTrendingTopicFeed, {
      id: topicId,
      name: displayName,
    });
  }, [displayName, topicId, trackEvent]);

  const { data, onEndReached, isLoading, isFetchingNextPage } =
    useTrendingTopicCasts({
      topicId: topicId,
      sort: 'top',
    });

  const casts = useFlatSearchCastsData({ data });

  const castsWithContext = useCastsWithContext(casts ?? [], {
    forceThreadPosition: 'start_and_end',
  });

  if (isLoading) {
    return <FullScreenLoadingIndicator />;
  }

  return (
    <Page
      meta={{
        title: displayName ?? '',
      }}
    >
      <BorderedMainContent>
        <PageHeader hideCastButton={true} showBack={true}>
          <BackButton />
          <div className="w-full">
            <PageTitle>{displayName ?? ''}</PageTitle>
          </div>
        </PageHeader>
        <React.Suspense fallback={<FullScreenLoadingIndicator />}>
          <FlatList
            data={castsWithContext}
            renderItem={renderItem}
            keyExtractor={castWithContextKeyExtractor}
            onEndReached={onEndReached}
            isFetchingNextPage={isFetchingNextPage}
            emptyView={<DefaultEmptyListView message={`No casts yet.`} />}
          />
        </React.Suspense>
      </BorderedMainContent>
    </Page>
  );
});

const renderItem = ({ item }: { item: ApiCastWithContext }) => {
  return <Cast castWithContext={item} />;
};

TrendingTopicPage.displayName = 'TrendingTopicPage';

export { TrendingTopicPage };
