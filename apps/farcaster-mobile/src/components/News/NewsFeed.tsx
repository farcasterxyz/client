import { useFocusEffect } from '@react-navigation/native';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiArticle } from 'farcaster-client-data';
import { useNews } from 'farcaster-client-hooks';
import { Text2 } from 'farcaster-expo';
import React from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { ArticleCard } from '~/components/News/ArticleCard';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePullToRefreshInfinite } from '~/hooks/data/usePullToRefreshInfinite';

const FlatList = Animated.FlatList;

export function NewsFeed() {
  const t = useTheme();

  const { data, hasNextPage, fetchNextPage, refetch } = useNews();

  const articles = React.useMemo(() => {
    return data.pages.flatMap((o) => o.result.news);
  }, [data.pages]);

  const handleOnEndReached = React.useCallback(() => {
    if (hasNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage]);

  const handleRefresh = React.useCallback(async () => {
    refetch();
  }, [refetch]);

  const { refreshControl } = usePullToRefreshInfinite({
    refetch: handleRefresh,
  });

  const { trackEvent } = useAnalytics();

  useFocusEffect(
    React.useCallback(() => {
      trackEvent(AnalyticsEvent.ViewNews, undefined);
    }, [trackEvent]),
  );

  const contentContainerStyle = React.useMemo(
    () => [t.p3, { gap: 12 }],
    [t.p3],
  );

  const ListHeaderComponent = React.useMemo(() => {
    return (
      <View style={[t.pB2]}>
        <Text2 color="brand" size="2xl" weight="bold">
          Top Stories
        </Text2>
      </View>
    );
  }, [t.pB2]);

  return (
    <View style={[t.hFull, t.flexCol]}>
      <FlatList
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={true}
        data={articles}
        renderItem={renderArticleItem}
        onEndReached={handleOnEndReached}
        onEndReachedThreshold={0.1}
        refreshControl={refreshControl}
        ListHeaderComponent={ListHeaderComponent}
      />
    </View>
  );
}

function renderArticleItem({ item }: { item: ApiArticle }) {
  return <ArticleCard article={item} />;
}
