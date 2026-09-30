import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { ApiCast, CastHashPrefix } from 'farcaster-client-data';
import {
  useCastQuotesWithRefreshOnMount,
  useUserCast,
} from 'farcaster-client-hooks';
import React, { FC, memo, useMemo, useRef } from 'react';
import { View } from 'react-native';

import { Cast } from '~/components/casts/Cast';
import { Empty } from '~/components/Empty';
import { buildScreen } from '~/components/Screen';
import { topBarHeight } from '~/components/TopBar';
import { onEndReachedThreshold } from '~/constants/FlatList';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCommonFlatListExtraData } from '~/hooks/useCommonFlatListExtraData';
import { useReportErrorOnDuplicateKeys } from '~/hooks/useReportErrorOnDuplicateKeys';
import { useScrollToTopWithOffset } from '~/hooks/useScrollToTopWithOffset';
import { CommonStackParamList } from '~/types';
import { extractCastKey } from '~/utils/CastUtils';
import { getCastItemType } from '~/utils/FeedUtils';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

type CastQuotesScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'CastQuotes'
>;

const CastQuotesScreen = buildScreen<CastQuotesScreenProps>(
  { name: 'CastQuotes' },
  ({ route: { params } }) => {
    if ('castHash' in params) {
      return <CastQuotesContent castHash={params.castHash} />;
    }

    return (
      <CastQuotesForUsernameAndCastHashPrefix
        username={params.username}
        castHashPrefix={params.castHashPrefix}
      />
    );
  },
);

type CastQuotesForUsernameAndCastHashPrefixProps = {
  username: string;
  castHashPrefix: CastHashPrefix;
};

const CastQuotesForUsernameAndCastHashPrefix: FC<CastQuotesForUsernameAndCastHashPrefixProps> =
  memo(({ username, castHashPrefix }) => {
    const {
      result: { cast },
    } = useUserCast({ username: username, hashPrefix: castHashPrefix }).data!;

    return <CastQuotesContent castHash={cast.hash} />;
  });

type CastQuotesContentProps = {
  castHash: string;
};

const CastQuotesContent: FC<CastQuotesContentProps> = memo(({ castHash }) => {
  const t = useTheme();

  const { data, refetch, onEndReached } = useCastQuotesWithRefreshOnMount({
    castHash,
  });
  const extraData = useCommonFlatListExtraData();
  const flatListRef = useRef<FlashListRef<ApiCast>>(null);

  const casts = useMemo(
    () => data?.pages.flatMap((page) => page.result.quotes) || [],
    [data],
  );

  useReportErrorOnDuplicateKeys('MentionNotifications', casts, extractCastKey);

  useScrollToTopWithOffset(flatListRef, -topBarHeight);

  if (casts.length === 0) {
    return (
      <View style={[t.hFull]}>
        <Empty message="No quotes, yet." refresh={refetch} />
      </View>
    );
  }

  return (
    <View style={[t.hFull]}>
      <FlashList
        data={casts}
        extraData={extraData}
        renderItem={renderItem}
        keyExtractor={extractCastKey}
        getItemType={getCastItemType}
        ref={flatListRef}
        {...STANDARD_FLASHLIST_PERF_PROPS}
        onEndReached={onEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
      />
    </View>
  );
});

const renderItem = ({ item }: { item: ApiCast }) => <Cast cast={item} />;

CastQuotesScreen.displayName = 'CastQuotesScreen';

export { CastQuotesScreen };
