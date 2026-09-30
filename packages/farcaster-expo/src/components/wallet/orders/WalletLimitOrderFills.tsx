import { FlashList, ListRenderItem } from '@shopify/flash-list';
import {
  apiChainToChainIdOrThrow,
  ApiLimitOrder,
  ApiLimitOrderFill,
  formatDisplayDollars,
  getTransactionExplorerUrl,
} from 'farcaster-client-data';
import { formatAmount, useLimitOrderFills } from 'farcaster-client-hooks';
import moment from 'moment';
import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  TouchableOpacity,
  View,
} from 'react-native';

import { hitSlop } from '../../../constants';
import { useTheme } from '../../../contexts';
import {
  formatLimitOrderExpiryDisplay,
  truncateLimitOrderTxHash,
} from '../../../utils';
import { TokenIcon } from '../../crypto/tokens/TokenIcon';
import { ButtonV2, Text2 } from '../../design-system';
import { LoadFailureIndicator } from '../../LoadFailureIndicator';
import { WalletScreenHeader } from '../WalletScreenHeader';

const formatFillTimestamp = (timestamp: number) =>
  moment(timestamp).utc().format('MMM D, HH:mm [(GMT)]');

export function WalletLimitOrderFills({
  order,
  onBack,
}: {
  order: ApiLimitOrder;
  onBack: () => void;
}) {
  const t = useTheme();
  const isBuy = order.kind === 'buy';
  const primaryToken = isBuy ? order.buyToken : order.sellToken;

  const { data, isPending, isError, refetch } = useLimitOrderFills({
    orderId: order.id,
  });

  const fills = data?.fills ?? [];

  const timeLeft = useMemo(() => formatLimitOrderExpiryDisplay(order), [order]);

  const handleOpenExplorer = useCallback(
    (txHash: string) => {
      const chainId = apiChainToChainIdOrThrow(order.chain);
      const explorerUrl = getTransactionExplorerUrl({
        type: 'tx',
        chainId,
        hash: txHash,
      });

      if (explorerUrl) {
        Linking.openURL(explorerUrl).catch(() => {});
      }
    },
    [order.chain],
  );

  const renderItem = useCallback<ListRenderItem<ApiLimitOrderFill>>(
    ({ item }) => {
      const tokenAmount = formatAmount(Number(item.tokenAmount));
      const valueLabel =
        item.valueUsd !== undefined ? formatDisplayDollars(item.valueUsd) : '—';

      return (
        <View
          style={[
            t.flexRow,
            t.itemsCenter,
            t.justifyBetween,
            { paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
          ]}
        >
          <View style={[t.flexCol, { gap: 4, flex: 1 }]}>
            <Text2 weight="semibold" color="primary">
              {tokenAmount} {primaryToken.symbol}
            </Text2>
            <TouchableOpacity
              onPress={() => handleOpenExplorer(item.txHash)}
              hitSlop={hitSlop}
            >
              <Text2 size="sm" style={t.texts.brand} weight="medium">
                {truncateLimitOrderTxHash(item.txHash)}
              </Text2>
            </TouchableOpacity>
          </View>
          <View style={[t.flexCol, t.itemsEnd, { gap: 4, flex: 1 }]}>
            <Text2 weight="semibold" color="primary">
              {valueLabel}
            </Text2>
            <Text2 size="sm" color="secondary" weight="medium">
              {formatFillTimestamp(item.createdAt)}
            </Text2>
          </View>
        </View>
      );
    },
    [handleOpenExplorer, primaryToken.symbol, t],
  );

  const ListEmptyComponent = useMemo(() => {
    if (isPending) {
      return (
        <View style={[t.itemsCenter, t.justifyCenter, { paddingTop: 60 }]}>
          <ActivityIndicator size="large" color={t.colors.text.brand} />
        </View>
      );
    }

    if (isError) {
      return <LoadFailureIndicator retry={refetch} />;
    }

    return (
      <View style={[t.itemsCenter, t.justifyCenter, { paddingTop: 60 }]}>
        <Text2 color="secondary" align="center">
          No settlement transactions yet.
        </Text2>
      </View>
    );
  }, [isError, isPending, refetch, t]);

  return (
    <View style={[t.flex1, t.bgDefault]}>
      <WalletScreenHeader
        title=""
        onBackCallback={onBack}
        style={Platform.OS !== 'web' ? [t.pT2] : undefined}
      />
      <View
        style={[
          t.flexRow,
          t.itemsCenter,
          t.justifyBetween,
          { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
        ]}
      >
        <View style={[t.flexRow, t.itemsCenter, { gap: 12, flex: 1 }]}>
          <TokenIcon
            iconUrl={primaryToken.imageUrl}
            diameter={42}
            symbol={primaryToken.symbol}
            chain={order.chain}
          />
          <View style={[t.flexCol, { gap: 2, flex: 1 }]}>
            <Text2 size="lg" weight="semibold" color="primary">
              {primaryToken.symbol} ({isBuy ? 'Buy' : 'Sell'})
            </Text2>
            <Text2 size="sm" color="secondary" weight="medium">
              All transactions
            </Text2>
          </View>
        </View>
        <Text2
          size="sm"
          color={timeLeft === 'Expired' ? 'secondary' : 'warning'}
          weight="medium"
        >
          {timeLeft}
        </Text2>
      </View>
      <FlashList
        data={fills}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={ListEmptyComponent}
      />
      <View style={[t.p3, t.pB4]}>
        <ButtonV2
          variant="secondary"
          title="Back"
          onPress={onBack}
          width="full"
        />
      </View>
    </View>
  );
}
