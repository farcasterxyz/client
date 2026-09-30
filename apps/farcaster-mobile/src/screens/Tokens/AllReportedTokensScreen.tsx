import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApiReportedToken } from 'farcaster-client-data';
import { useReportedTokens } from 'farcaster-client-hooks';
import { TokenIcon } from 'farcaster-expo';
import React, { useCallback } from 'react';
import { FlatList, ListRenderItem, TouchableOpacity, View } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useIsAdmin } from '~/hooks/data/useIsAdmin';
import { usePullToRefreshInfinite } from '~/hooks/data/usePullToRefreshInfinite';
import { usePush } from '~/hooks/navigation/usePush';
import { CommonStackParamList } from '~/types';

type AllReportedTokensScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'AllReportedTokens'
>;

const AllReportedTokensContent: React.FC = () => {
  const t = useTheme();
  const push = usePush();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useReportedTokens();

  const { refreshControl } = usePullToRefreshInfinite({ refetch });

  const reportedTokens =
    data?.pages.flatMap((page) => page.result.tokens) ?? [];

  const renderTokenItem: ListRenderItem<ApiReportedToken> = useCallback(
    ({ item }) => {
      return (
        <TouchableOpacity
          onPress={() => {
            push('TokenReportsSummary', {
              chain: item.token.chain,
              ca: item.token.ca,
            });
          }}
          style={[
            t.flexRow,
            t.itemsCenter,
            t.pX4,
            t.pY3,
            t.borderB,
            t.borders.secondary,
            { gap: 12 },
          ]}
        >
          <TokenIcon
            iconUrl={item.token.imageUrl}
            chain={item.token.chain}
            diameter={48}
            chainImageSize={16}
            symbol={item.token.symbol ?? ''}
            features={item.token.features}
            badgeOffset={{ top: -2, right: -2 }}
            imageBordered
          />
          <View style={[t.flex1, { gap: 4 }]}>
            <Text
              style={[t.fontSemibold, t.textBase, t.texts.primary]}
              numberOfLines={1}
            >
              {item.token.name || item.token.symbol}
            </Text>
            <Text style={[t.texts.secondary, t.textSm]} numberOfLines={1}>
              ${item.token.symbol}
            </Text>
          </View>
          <View style={[{ gap: 4, alignItems: 'flex-end' }]}>
            <View
              style={[
                {
                  backgroundColor: t.colors.red500,
                  borderRadius: 12,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  minWidth: 32,
                  alignItems: 'center',
                },
              ]}
            >
              <Text
                style={[t.fontSemibold, t.textSm, { color: t.colors.white }]}
              >
                {item.totalReports}
              </Text>
            </View>
            <View style={[t.flexRow, { gap: 8 }]}>
              {item.reportsByCategory.fraudulent > 0 && (
                <Text style={[t.texts.secondary, t.textXs]}>
                  🚨 {item.reportsByCategory.fraudulent}
                </Text>
              )}
              {item.reportsByCategory.offensive > 0 && (
                <Text style={[t.texts.secondary, t.textXs]}>
                  👎 {item.reportsByCategory.offensive}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [push, t],
  );

  const keyExtractor = useCallback((item: ApiReportedToken) => {
    return `${item.token.chain}-${item.token.ca}`;
  }, []);

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <View style={[t.flex1, t.itemsCenter, t.justifyCenter]}>
        <Text style={[t.texts.secondary, t.textBase]}>Loading...</Text>
      </View>
    );
  }

  if (reportedTokens.length === 0) {
    return (
      <View style={[t.flex1, t.itemsCenter, t.justifyCenter, { gap: 12 }]}>
        <Text style={[t.text2xl]}>✅</Text>
        <Text style={[t.texts.secondary, t.textBase]}>No reported tokens</Text>
      </View>
    );
  }

  return (
    <View style={[t.flex1]}>
      <View style={[t.pX4, t.pY2, t.borderB, t.borders.secondary]}>
        <Text style={[t.fontSemibold, t.textLg, t.texts.primary]}>
          Reported Tokens
        </Text>
        <Text style={[t.texts.secondary, t.textSm]}>
          Ordered by report count
        </Text>
      </View>
      <FlatList
        data={reportedTokens}
        renderItem={renderTokenItem}
        keyExtractor={keyExtractor}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={refreshControl}
        style={[t.flex1]}
      />
    </View>
  );
};

const AllReportedTokensScreen = buildScreen<AllReportedTokensScreenProps>(
  { name: 'AllReportedTokens', themeV2: true },
  () => {
    const isAdmin = useIsAdmin();

    if (!isAdmin) {
      return null;
    }

    return <AllReportedTokensContent />;
  },
);

AllReportedTokensScreen.displayName = 'AllReportedTokensScreen';

export { AllReportedTokensScreen };
