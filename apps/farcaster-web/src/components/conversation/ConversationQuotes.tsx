import { useCastQuotesWithRefreshOnMount } from 'farcaster-client-hooks';
import uniqBy from 'lodash/uniqBy';
import { FC, memo, useMemo } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { Cast } from '~/components/casts/Cast';
import { BackButton } from '~/components/forms/buttons/BackButton';
import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { useCastsWithContext } from '~/hooks/casts/useCastsWithContext';
import { ApiCastWithContext } from '~/types';
import { castWithContextKeyExtractor } from '~/utils/keyExtractorUtils';

type ConversationQuotesProps = {
  castHash: string;
};

const ConversationQuotes: FC<ConversationQuotesProps> = memo(({ castHash }) => {
  const { data, onEndReached, isFetchingNextPage } =
    useCastQuotesWithRefreshOnMount({
      castHash,
    });

  const casts = useMemo(
    () => data?.pages.flatMap((page) => page.result.quotes) || [],
    [data],
  );

  const castsWithContext = useCastsWithContext(casts, {
    forceThreadPosition: 'start_and_end',
    forceCastHeaderLabelHidden: true,
  });

  const uniqueCastsWithContext = useMemo(
    () => uniqBy(castsWithContext, castWithContextKeyExtractor),
    [castsWithContext],
  );

  return (
    <Page
      meta={{
        title: `Recasters for ${castHash}`,
      }}
    >
      <BorderedMainContent>
        <PageHeader hideCastButton>
          <PageTitle>
            <BackButton />
            Quotes
          </PageTitle>
        </PageHeader>
        <FlatList
          data={uniqueCastsWithContext}
          emptyView={<DefaultEmptyListView message="No quotes, yet." />}
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

ConversationQuotes.displayName = 'ConversationQuotes';

export { ConversationQuotes };
