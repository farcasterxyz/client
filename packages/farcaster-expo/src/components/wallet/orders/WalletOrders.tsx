import { useQueryClient } from '@tanstack/react-query';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiLimitOrder } from 'farcaster-client-data';
import { buildWalletActivityKey, useLimitOrders } from 'farcaster-client-hooks';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { formatUnits } from 'viem';

import { useSharedTelemetry, useTheme } from '../../../contexts';
import { useSafeFocusEffect } from '../../../hooks';
import {
  computeLimitOrderProgressPct,
  formatLimitOrderExpiryDisplay,
  formatLimitOrderValueStr,
  isActiveLimitOrderStatus,
} from '../../../utils';
import { TokenIcon } from '../../crypto/tokens/TokenIcon';
import { Text2 } from '../../design-system';
import { CircularProgress, DottedCircle, RedCircle } from './OrderStatusIcons';
import { WalletOrderDetailModal } from './WalletOrderDetailModal';

const AnimatedFlatList = Animated.FlatList;

interface WalletOrdersListProps {
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onLayout?: () => void;
  ListHeaderComponent?:
    | React.ComponentType<unknown>
    | React.ReactElement
    | null;
  contentOffset?: { x: number; y: number };
  listRef?: React.Ref<FlatList<ApiLimitOrder>>;
  dismissSelectedOrderRef?: React.MutableRefObject<(() => void) | null>;
  setIsRefreshing?: (isRefreshing: boolean) => void;
  onSeeAllFills?: (order: ApiLimitOrder) => void;
}

export function WalletOrdersList({
  onScroll,
  onLayout,
  ListHeaderComponent,
  contentOffset,
  listRef,
  dismissSelectedOrderRef,
  setIsRefreshing,
  onSeeAllFills,
}: WalletOrdersListProps) {
  const t = useTheme();
  const { trackEvent } = useSharedTelemetry();
  const queryClient = useQueryClient();
  const { flatData, isPending, isFetchingNextPage, refetch, onEndReached } =
    useLimitOrders();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ApiLimitOrder | null>(
    null,
  );

  useEffect(() => {
    if (!dismissSelectedOrderRef) {
      return;
    }

    dismissSelectedOrderRef.current = () => setSelectedOrder(null);
    return () => {
      dismissSelectedOrderRef.current = null;
    };
  }, [dismissSelectedOrderRef]);

  useSafeFocusEffect(
    useCallback(() => {
      trackEvent(AnalyticsEvent.ViewWalletLimitOrders);
    }, [trackEvent]),
  );

  const onRefresh = useCallback(async () => {
    trackEvent(AnalyticsEvent.RefreshWalletLimitOrders, {
      count: flatData?.length ?? 0,
    });
    setRefreshing(true);
    setIsRefreshing?.(true);
    try {
      await refetch();
      await queryClient.invalidateQueries({
        queryKey: buildWalletActivityKey(),
      });
    } finally {
      setRefreshing(false);
      setIsRefreshing?.(false);
    }
  }, [flatData?.length, queryClient, refetch, setIsRefreshing, trackEvent]);

  const orders = flatData ?? [];
  const isInitialLoad = isPending && orders.length === 0;

  const renderItem = useCallback(
    ({ item }: { item: ApiLimitOrder }) => {
      const isBuy = item.kind === 'buy';
      const primaryToken = isBuy ? item.buyToken : item.sellToken;
      const quoteToken = isBuy ? item.sellToken : item.buyToken;

      const sellDecimals = item.sellToken.decimals ?? 18;
      const buyDecimals = item.buyToken.decimals ?? 18;

      const totalSellFormatted = formatUnits(
        BigInt(item.sellAmount),
        sellDecimals,
      );
      const totalBuyFormatted = formatUnits(
        BigInt(item.buyAmount),
        buyDecimals,
      );

      const executedSellFormatted = item.executedSellAmount
        ? formatUnits(BigInt(item.executedSellAmount), sellDecimals)
        : '0';
      const executedBuyFormatted = item.executedBuyAmount
        ? formatUnits(BigInt(item.executedBuyAmount), buyDecimals)
        : '0';

      const progressPct = computeLimitOrderProgressPct({
        isBuy,
        buyAmount: item.buyAmount,
        sellAmount: item.sellAmount,
        executedBuyAmount: item.executedBuyAmount,
        executedSellAmount: item.executedSellAmount,
      });

      const valueStr = formatLimitOrderValueStr({
        quoteTokenCa: quoteToken.ca,
        quoteTokenSymbol: quoteToken.symbol,
        isBuy,
        totalSellFormatted,
        totalBuyFormatted,
        executedSellFormatted,
        executedBuyFormatted,
        showPartialProgress: isActiveLimitOrderStatus(item.status),
      });

      const timeLeft = formatLimitOrderExpiryDisplay(item);

      // Status indicator elements
      let statusLabel = '';
      let statusIcon: React.ReactNode = null;

      if (item.status === 'open' || item.status === 'submitted') {
        statusLabel = `${Math.round(progressPct)}% complete`;
        statusIcon = <CircularProgress progress={progressPct} size={14} />;
      } else if (item.status === 'cancel_pending') {
        statusLabel = 'Cancelling...';
        statusIcon = (
          <ActivityIndicator
            size="small"
            style={{ transform: [{ scale: 0.7 }] }}
          />
        );
      } else if (item.status === 'filled') {
        statusLabel = 'Filled';
        statusIcon = <CircularProgress progress={100} size={14} />;
      } else if (item.status === 'cancelled') {
        statusLabel = 'Cancelled';
        // Cancelled has no icon next to the label in the mock
      } else if (item.status === 'expired') {
        statusLabel = 'Expired';
        statusIcon = <DottedCircle size={14} />;
      } else if (item.status === 'failed') {
        statusLabel = 'Failed';
        statusIcon = <RedCircle size={14} />;
      }

      const showTimeLeft = isActiveLimitOrderStatus(item.status);

      return (
        <TouchableOpacity
          onPress={() => {
            trackEvent(AnalyticsEvent.OpenWalletLimitOrderDetail, {
              orderId: item.id,
              kind: item.kind,
              status: item.status,
              chain: item.chain,
            });
            setSelectedOrder(item);
          }}
          style={[
            t.flexRow,
            t.itemsCenter,
            t.justifyBetween,
            { paddingVertical: 12, paddingHorizontal: 16 },
          ]}
        >
          {/* Left Block: Icon and details */}
          <View style={[t.flexRow, t.itemsCenter, { gap: 12, flex: 1 }]}>
            <TokenIcon
              iconUrl={primaryToken.imageUrl}
              diameter={40}
              symbol={primaryToken.symbol}
              chain={item.chain}
            />
            <View style={[t.flexCol, { gap: 2, flex: 1 }]}>
              <Text2 weight="semibold" color="primary">
                {primaryToken.symbol} ({isBuy ? 'Buy' : 'Sell'})
              </Text2>
              <View style={[t.flexRow, t.itemsCenter, { gap: 6 }]}>
                {statusIcon}
                <Text2
                  size="sm"
                  color={item.status === 'failed' ? 'danger' : 'secondary'}
                  weight="medium"
                >
                  {statusLabel}
                </Text2>
              </View>
            </View>
          </View>

          {/* Right Block: Amount and expiry */}
          <View style={[t.flexCol, t.itemsEnd, { gap: 2 }]}>
            <Text2
              weight="semibold"
              color={
                item.status === 'cancelled' || item.status === 'expired'
                  ? 'secondary'
                  : 'primary'
              }
            >
              {valueStr}
            </Text2>
            {showTimeLeft ? (
              <Text2
                size="sm"
                color={timeLeft === 'Expired' ? 'secondary' : 'warning'}
                weight="medium"
              >
                {timeLeft}
              </Text2>
            ) : null}
          </View>
        </TouchableOpacity>
      );
    },
    [t, trackEvent],
  );

  return (
    <View style={[t.flex1]}>
      <AnimatedFlatList
        ref={listRef}
        data={orders}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        onScroll={onScroll}
        onLayout={onLayout}
        scrollEventThrottle={16}
        contentOffset={contentOffset}
        ListHeaderComponent={ListHeaderComponent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={t.colors.text.primary}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.2}
        ListEmptyComponent={
          <View
            style={[
              t.itemsCenter,
              t.justifyCenter,
              { paddingTop: 60, paddingHorizontal: 32 },
            ]}
          >
            {isInitialLoad ? (
              <ActivityIndicator size="large" color={t.colors.text.brand} />
            ) : (
              <Text2 color="secondary" weight="semibold">
                No limit orders yet.
              </Text2>
            )}
          </View>
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={[t.itemsCenter, { paddingVertical: 16 }]}>
              <ActivityIndicator size="small" color={t.colors.text.brand} />
            </View>
          ) : null
        }
      />
      {selectedOrder && (
        <WalletOrderDetailModal
          order={selectedOrder}
          onDismiss={() => setSelectedOrder(null)}
          onSeeAllFills={onSeeAllFills}
        />
      )}
    </View>
  );
}
