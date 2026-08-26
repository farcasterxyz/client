import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { AnalyticsEvent } from 'farcaster-analytics';
import { useExploreFeed } from 'farcaster-client-hooks';
import {
  Text2,
  useSharedNavigationContext,
  WalletScreenHeader,
} from 'farcaster-expo';
import React, { useCallback } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TradeRow } from '~/components/ExploreFeed/TradeRow';
import { buildScreen } from '~/components/Screen';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePullToRefreshInfinite } from '~/hooks/data/usePullToRefreshInfinite';
import { CommonStackParamList } from '~/types/navigation';

function RecentTradesScreenContent() {
  const t = useTheme();
  const { data, refetch } = useExploreFeed();
  const { refreshControl } = usePullToRefreshInfinite({ refetch });

  const recentTrades = React.useMemo(() => {
    if (
      typeof data.feed.recentTrades === 'undefined' ||
      data.feed.recentTrades.length === 0
    ) {
      return [];
    }

    return data.feed.recentTrades;
  }, [data.feed.recentTrades]);

  return (
    <ScrollView
      style={[t.flex1]}
      contentContainerStyle={[t.pB2, recentTrades.length === 0 && t.flex1]}
      refreshControl={refreshControl}
    >
      {recentTrades.length === 0 ? (
        <View style={[t.flex1, t.itemsCenter, t.justifyCenter, t.pX6]}>
          <Text2 size="lg" weight="medium" color="secondary" align="center">
            No recent trades
          </Text2>
          <Text2
            size="base"
            weight="regular"
            color="tertiary"
            align="center"
            style={[t.mT2]}
          >
            Pull to refresh.
          </Text2>
        </View>
      ) : (
        recentTrades.map((trade, index) => (
          <TradeRow
            key={`${trade.user.fid}-${index}`}
            trade={trade}
            via="recent_trades_screen"
          />
        ))
      )}
    </ScrollView>
  );
}

type RecentTradesScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'RecentTrades'
>;

const RecentTradesScreen = buildScreen<RecentTradesScreenProps>(
  { name: 'RecentTrades', insetTop: true, themeV2: true },
  () => {
    const t = useTheme();
    const { goBack } = useSharedNavigationContext();
    const { trackEvent } = useAnalytics();
    const insets = useSafeAreaInsets();

    useFocusEffect(
      useCallback(() => {
        trackEvent(AnalyticsEvent.ViewRecentTrades, undefined);
      }, [trackEvent]),
    );

    return (
      <View style={[t.flex1]}>
        <LinearGradient
          colors={['#633FF533', '#F76CE333', '#FFC0F633', '#FFFFFF00']}
          locations={[0, 0.05, 0.2, 0.4]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[
            {
              position: 'absolute',
              left: 0,
              right: 0,
              top: -insets.top,
              bottom: 0,
            },
          ]}
        />
        <WalletScreenHeader title="" onBackCallback={goBack} />
        <View style={[t.pX3, t.pB3]}>
          <Text2 size="2xl" weight="semibold" style={{ color: '#F77DE6' }}>
            Recent trades
          </Text2>
        </View>
        <RecentTradesScreenContent />
      </View>
    );
  },
);

RecentTradesScreen.displayName = 'RecentTradesScreen';

export { RecentTradesScreen };
