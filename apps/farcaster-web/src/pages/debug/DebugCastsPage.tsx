import { useThread } from 'farcaster-client-hooks';
import { FC, memo, useMemo } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { Cast } from '~/components/casts/Cast';
import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { ApiCastWithContext } from '~/types';
import { buildCastsWithContext } from '~/utils/castUtils';
import { castWithContextKeyExtractor } from '~/utils/keyExtractorUtils';

const useDebugCast = ({ castHash }: { castHash: string }) => {
  const { data } = useThread({ castHash });

  return useMemo(
    () =>
      data!.pages
        .flatMap((page) => page.result.casts)
        .find((cast) => cast.hash === castHash)!,
    [castHash, data],
  );
};

const DebugCastsPage: FC = memo(() => {
  const casts = [
    useDebugCast({
      castHash:
        '0x9f517883eb5a5801e7da25b2623cd9d486ba914659f17fbe05249737fc9aa879',
    }),
    useDebugCast({
      castHash:
        '0x8f033d3daf119fca6c378ed6fb061204b51393fb2fc68edaf790c72277462b7c',
    }),
    useDebugCast({
      castHash:
        '0x29a2150e546dad2e9dbeb006c0384e0ca5aba9245966c4ba59d748c8ad919a50',
    }),
    useDebugCast({
      castHash:
        '0xc693cbc26c3512337216969452d4766c551aeac2514f2e777f7b516a7f47273c',
    }),
    useDebugCast({
      castHash:
        '0x3e39b35f1c12802b5cfdb40071401530c9af12ddf33f95a485dfe0f465fdaba0',
    }),
    useDebugCast({
      castHash:
        '0x46f438f40c2c0d667f7d3513017b112fbbe8f3a1ffcc4ef60313e2b697088c94',
    }),
    useDebugCast({
      castHash:
        '0x5dde64205f49fa58aebd9e965ef2553c3f56c09cf258a51367256991490bf9dd',
    }),
    useDebugCast({
      castHash:
        '0xeb9a953220c0147b33b1024b83d34b9594d80fdb4cd4f3c9eb2d78381fdb7315',
    }),
    useDebugCast({
      castHash:
        '0x7aacf091041a8ee711b49d7a80b5fa948476b9781d3e6be3060a70e31f6e28cf',
    }),
    useDebugCast({
      castHash:
        '0xbbb26b7161e22a44de6e9cd6e61c96b79049b73d35f4fe6e05413584695b9d57',
    }),
  ];

  const castsWithContext = buildCastsWithContext(
    casts.map((cast) => ({ cast })),
  );

  return (
    <Page meta={{ title: 'Debug Casts' }}>
      <BorderedMainContent>
        <PageHeader>
          <PageTitle>Debug: Casts</PageTitle>
        </PageHeader>
        <FlatList
          data={castsWithContext}
          renderItem={renderItem}
          keyExtractor={castWithContextKeyExtractor}
          emptyView={<DefaultEmptyListView message="There are no casts" />}
        />
      </BorderedMainContent>
    </Page>
  );
});

const renderItem = ({ item }: { item: ApiCastWithContext }) => (
  <Cast castWithContext={item} />
);

DebugCastsPage.displayName = 'DebugCastsPage';

export { DebugCastsPage };
