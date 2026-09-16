import { useIsFocused } from '@react-navigation/native';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { ApiCastFeedItem } from 'farcaster-client-data';
import { useAdminFeed } from 'farcaster-client-hooks';
import uniqBy from 'lodash/uniqBy';
import React, { FC, memo, RefObject, useMemo, useRef } from 'react';
import { View } from 'react-native';

import { CastFeedItem } from '~/components/CastFeedItem/CastFeedItem';
import { Text } from '~/components/Text';
import { feedOnEndReachedThreshold } from '~/constants/FlatList';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePullToRefreshAdminFeed } from '~/hooks/data/usePullToRefreshAdminFeed';
import { useCommonFlatListExtraData } from '~/hooks/useCommonFlatListExtraData';
import { useReportErrorOnDuplicateKeys } from '~/hooks/useReportErrorOnDuplicateKeys';
import { useScrollToTopWithOffset } from '~/hooks/useScrollToTopWithOffset';
import { extractCastFeedItemKey, getCastItemType } from '~/utils/FeedUtils';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';
import {
  useForceZeroScrollInsets,
  ZERO_SCROLL_INSET_PROPS,
} from '~/utils/ScrollInsetUtils';

import { FeedTabProps } from './types';

const AdminFeed: FC<FeedTabProps> = memo(({ onScroll, headerHeight }) => {
  const { data, fetchNextPage, refetch } = useAdminFeed({});
  const { refreshControl } = usePullToRefreshAdminFeed({
    refetch,
    offset: headerHeight,
  });
  const t = useTheme();

  const flatListRef = useRef<FlashListRef<ApiCastFeedItem>>(null);
  const isFocused = useIsFocused();
  useForceZeroScrollInsets({
    ref: flatListRef,
    enabled: isFocused,
  });

  useScrollToTopWithOffset(flatListRef, -headerHeight);

  const extraData = useCommonFlatListExtraData();

  const feedItems = useMemo(
    () =>
      uniqBy(
        data?.pages.flatMap((page) => page.result.feed) || [],
        extractCastFeedItemKey,
      ),
    [data],
  );

  const description = React.useMemo(
    () =>
      (data?.pages.flatMap((page) => page.result.description) || [
        'Unknown feed',
      ])[0],
    [data],
  );

  useReportErrorOnDuplicateKeys('AdminFeed', feedItems, extractCastFeedItemKey);

  const headerComponent = (
    <View
      style={[
        t.itemsCenter,
        t.justifyCenter,
        t.pY2,
        t.borderBHairline,
        t.borderDefault,
      ]}
    >
      <Text
        style={[t.texts.secondary, t.textXs, t.textCenter, t.pX1]}
        numberOfLines={2}
      >
        {description}
      </Text>
    </View>
  );

  return (
    <FlashList
      data={feedItems}
      extraData={extraData}
      renderItem={renderItem}
      ref={flatListRef as RefObject<FlashListRef<ApiCastFeedItem>>}
      keyExtractor={extractCastFeedItemKey}
      getItemType={getAdminFeedItemType}
      refreshControl={refreshControl}
      {...ZERO_SCROLL_INSET_PROPS}
      {...STANDARD_FLASHLIST_PERF_PROPS}
      onEndReached={() => fetchNextPage()}
      onEndReachedThreshold={feedOnEndReachedThreshold}
      contentContainerStyle={{
        paddingTop: headerHeight,
        paddingBottom: headerHeight,
      }}
      onScroll={onScroll}
      ListHeaderComponent={headerComponent}
    />
  );
});

const renderItem = ({
  item,
  index,
}: {
  item: ApiCastFeedItem;
  index: number;
}) => <CastFeedItem feedItem={item} index={index} />;

const getAdminFeedItemType = (item: ApiCastFeedItem) =>
  getCastItemType(item.cast);

export { AdminFeed };
