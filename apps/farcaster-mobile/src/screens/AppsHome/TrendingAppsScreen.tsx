import { LegendList, LegendListRenderItemProps } from '@legendapp/list';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiFrame } from 'farcaster-client-data';
import { frameKeyExtractor, useTrackEvent } from 'farcaster-client-hooks';
import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import {
  AppListItem,
  AppListItemSkeleton,
} from '~/components/Apps/AppListItem';
import { DefaultEmptyListView } from '~/components/DefaultEmptyListView';
import { onEndReachedThreshold } from '~/constants/FlatList';
import { useTheme } from '~/contexts/ThemeProvider';

const SkeletonList = ({ numItems = 10 }: { numItems?: number }) => {
  const t = useTheme();

  return (
    <View style={[t.flex1]}>
      {Array.from({ length: numItems }).map((_, i) => (
        <View key={i}>
          <AppListItemSkeleton height={72} />
        </View>
      ))}
    </View>
  );
};

export function AppsListInner({
  flatData,
  onEndReached,
  hasNextPage,
  isLoading,
  refetch,
  refreshControl,
  descriptionFn,
  keyExtractorFn = frameKeyExtractor,
  listKey,
}: {
  flatData: ApiFrame[];
  onEndReached: () => void;
  hasNextPage: boolean;
  isLoading: boolean;
  refetch: () => void;
  refreshControl: React.ComponentProps<typeof LegendList>['refreshControl'];
  descriptionFn?: (frame: ApiFrame) => string | React.ReactElement;
  keyExtractorFn?: (frame: ApiFrame, index: number) => string;
  listKey?: string;
}) {
  const t = useTheme();
  const { trackEvent } = useTrackEvent();
  const [hasScrolled, setHasScrolled] = useState(false);

  const renderAppListItem = useCallback(
    ({ item, index }: LegendListRenderItemProps<ApiFrame>) => {
      const description = descriptionFn ? descriptionFn(item) : undefined;
      const enteringAnim =
        !hasScrolled && index < 12
          ? FadeInDown.duration(220).delay(Math.min(index * 30, 300))
          : undefined;
      return (
        <Animated.View entering={enteringAnim}>
          <AppListItem
            frame={item}
            rank={index + 1}
            style={[t.pX4, t.pY3]}
            description={description}
            onBeforeLaunch={() => {
              trackEvent(AnalyticsEvent.AppsHomeTrendingAppsClickApp, {
                domain: item.domain,
                index: index,
              });
            }}
            onBeforeAuthorPress={() => {
              trackEvent(AnalyticsEvent.AppsHomeTrendingAppsClickAppAuthor, {
                authorFid: item.author?.fid,
                index: index,
              });
            }}
          />
        </Animated.View>
      );
    },
    [t.pX4, t.pY3, trackEvent, descriptionFn, hasScrolled],
  );

  const ListFooterComponent = useMemo(() => {
    return hasNextPage ? <SkeletonList numItems={4} /> : null;
  }, [hasNextPage]);

  const ListEmptyComponent = useMemo(() => {
    return isLoading ? (
      <SkeletonList />
    ) : (
      <DefaultEmptyListView
        message="Failed to fetch trending apps, try again later"
        refresh={refetch}
      />
    );
  }, [isLoading, refetch]);

  // Guard against undefined entries during category switches or intermediate states
  const safeData = useMemo(() => {
    return (flatData ?? []).filter(Boolean) as ApiFrame[];
  }, [flatData]);

  const safeKeyExtractor = useCallback(
    (item: ApiFrame | undefined, index: number) => {
      if (!item) {
        return `missing-${index}`;
      }
      try {
        return keyExtractorFn(item, index);
      } catch {
        return `fallback-${index}`;
      }
    },
    [keyExtractorFn],
  );

  return (
    <LegendList
      key={listKey}
      style={[t.mB1]}
      data={safeData}
      keyExtractor={safeKeyExtractor}
      renderItem={renderAppListItem}
      showsVerticalScrollIndicator={false}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      onScrollBeginDrag={() => setHasScrolled(true)}
      onMomentumScrollBegin={() => setHasScrolled(true)}
      ListEmptyComponent={ListEmptyComponent}
      ListFooterComponent={ListFooterComponent}
      refreshControl={refreshControl ?? undefined}
      recycleItems
    />
  );
}
