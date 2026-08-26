import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiCast } from 'farcaster-client-data';
import { useBookmarkedCastsWithRefreshOnMount } from 'farcaster-client-hooks';
import React from 'react';
import { View } from 'react-native';

import { Cast } from '~/components/casts/Cast';
import { Empty } from '~/components/Empty';
import { buildScreen } from '~/components/Screen';
import { onEndReachedThreshold } from '~/constants/FlatList';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import {
  AnimatedImageViewabilityScopeProvider,
  useVideoFeedViewablilityPairs,
} from '~/contexts/VideoFeedViewablilityProvider';
import { usePullToRefreshBookmarkedCasts } from '~/hooks/data/usePullToRefreshBookmarkedCasts';
import { useCommonFlatListExtraData } from '~/hooks/useCommonFlatListExtraData';
import { CommonStackParamList } from '~/types';
import { extractCastKey } from '~/utils/CastUtils';
import { getCastItemType } from '~/utils/FeedUtils';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';
import {
  useForceZeroScrollInsets,
  ZERO_SCROLL_INSET_PROPS,
} from '~/utils/ScrollInsetUtils';

type BookmarksScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'Bookmarks'
>;

const BookmarksScreen = buildScreen<BookmarksScreenProps>(
  { name: 'Bookmarks' },
  () => {
    const t = useTheme();

    const { trackEvent } = useAnalytics();

    const { data, refetch, onEndReached } =
      useBookmarkedCastsWithRefreshOnMount();
    const { refreshControl } = usePullToRefreshBookmarkedCasts({
      refetch,
    });
    const extraData = useCommonFlatListExtraData();
    const flatListRef = React.useRef<FlashListRef<ApiCast>>(null);
    const isFocused = useIsFocused();
    useForceZeroScrollInsets({
      ref: flatListRef,
      enabled: isFocused,
    });
    const viewabilityConfigCallbackPairs = useVideoFeedViewablilityPairs();

    const casts = React.useMemo(
      () => data?.pages.flatMap((page) => page.result.bookmarks) || [],
      [data],
    );

    useFocusEffect(
      React.useCallback(() => {
        trackEvent(AnalyticsEvent.ViewBookmarks, {});
      }, [trackEvent]),
    );

    if (casts.length === 0) {
      return (
        <View style={[t.hFull]}>
          <Empty
            message="You'll see your bookmarked casts here."
            refresh={refetch}
          />
        </View>
      );
    }

    return (
      <View style={[t.hFull]}>
        <AnimatedImageViewabilityScopeProvider>
          <FlashList
            data={casts}
            extraData={extraData}
            refreshControl={refreshControl}
            renderItem={renderItem}
            keyExtractor={extractCastKey}
            getItemType={getCastItemType}
            ref={flatListRef}
            {...ZERO_SCROLL_INSET_PROPS}
            {...STANDARD_FLASHLIST_PERF_PROPS}
            onEndReached={onEndReached}
            onEndReachedThreshold={onEndReachedThreshold}
            viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
          />
        </AnimatedImageViewabilityScopeProvider>
      </View>
    );
  },
);

const renderItem = ({ item }: { item: ApiCast }) => <Cast cast={item} />;

BookmarksScreen.displayName = 'BookmarksScreen';

export { BookmarksScreen };
