import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  apiChainToChainIdOrThrow,
  apiChainToViemChainOrThrow,
  ApiLimitOrder,
  getFirstApiErrorBody,
  getTransactionExplorerUrl,
} from 'farcaster-client-data';
import {
  buildLimitOrdersKey,
  formatPrice,
  useFarcasterApiClient,
} from 'farcaster-client-hooks';
import moment from 'moment';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  TouchableOpacity,
  View,
} from 'react-native';
import { formatUnits, hashTypedData, Hex } from 'viem';

import { hitSlop } from '../../../constants';
import { useSharedTelemetry, useTheme } from '../../../contexts';
import { useEmbeddedWallet } from '../../../contexts/EmbeddedWalletContext';
import {
  computeLimitOrderProgressPct,
  formatLimitOrderExpiryDisplay,
  formatLimitOrderValueStr,
  isActiveLimitOrderStatus,
  isNoExpirationLimitOrder,
  truncateLimitOrderTxHash,
} from '../../../utils';
import { getLimitOrderUserErrorMessage } from '../../../utils/LimitOrderUtils';
import { AutoDisplayingBottomSheetModal } from '../../bottom-sheet';
import { TokenIcon } from '../../crypto/tokens/TokenIcon';
import { ButtonV2, Text2 } from '../../design-system';
import { Table, TableRow } from '../../design-system/Table';
import { CircularProgress, DottedCircle, RedCircle } from './OrderStatusIcons';

interface WalletOrderDetailModalProps {
  order: ApiLimitOrder;
  onDismiss: () => void;
  onSeeAllFills?: (order: ApiLimitOrder) => void;
}

const isCancellationAlreadyInProgressError = (error: unknown) => {
  const apiErrorMessage = getFirstApiErrorBody(error)?.message;
  const message =
    apiErrorMessage ?? (error instanceof Error ? error.message : undefined);

  return message?.toLowerCase().includes('cancellation already in progress');
};

const COW_SETTLEMENT_CONTRACT =
  '0x9008D19f58AAbD9eD0D60971565AA8510560ab41' as const;

const buildCowOrderCancellationTypedData = ({
  chainId,
  orderUid,
}: {
  chainId: number;
  orderUid: Hex;
}) => {
  const domain = {
    name: 'Gnosis Protocol',
    version: 'v2',
    chainId,
    verifyingContract: COW_SETTLEMENT_CONTRACT,
  };

  const types = {
    OrderCancellation: [{ name: 'orderUid', type: 'bytes' }],
  } as const;

  const message = { orderUid };

  return { domain, types, message };
};

const buildLocalLimitOrderCancelRequest = ({
  orderId,
  chain,
}: {
  orderId: string;
  chain: ApiLimitOrder['chain'];
}) => {
  const viemChain = apiChainToViemChainOrThrow(chain);
  const placeholderOrderUid = `0x${'00'.repeat(56)}` as Hex;
  const { domain, types, message } = buildCowOrderCancellationTypedData({
    chainId: viemChain.id,
    orderUid: placeholderOrderUid,
  });

  return {
    orderId,
    cancelSignature: `0x${'00'.repeat(65)}` as Hex,
    cancelSignatureHash: `0x${'00'.repeat(32)}` as Hex,
    cancelSignaturePayload: {
      typedData: {
        domain,
        types,
        primaryType: 'OrderCancellation',
        message,
      },
      signingScheme: 'eip712',
    },
  };
};

const getLimitOrderTargetPriceUsd = (metadata: unknown) => {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return undefined;
  }

  const targetPriceUsd = (metadata as { targetPriceUsd?: unknown })
    .targetPriceUsd;
  const parsedTargetPriceUsd =
    typeof targetPriceUsd === 'string'
      ? Number(targetPriceUsd)
      : targetPriceUsd;

  return typeof parsedTargetPriceUsd === 'number' &&
    Number.isFinite(parsedTargetPriceUsd)
    ? parsedTargetPriceUsd
    : undefined;
};

export function WalletOrderDetailModal({
  order,
  onDismiss,
  onSeeAllFills,
}: WalletOrderDetailModalProps) {
  const t = useTheme();
  const { trackEvent } = useSharedTelemetry();
  const queryClient = useQueryClient();
  const { apiClient } = useFarcasterApiClient();
  const { getWalletClient } = useEmbeddedWallet();
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string>();

  const isBuy = order.kind === 'buy';
  const primaryToken = isBuy ? order.buyToken : order.sellToken;
  const quoteToken = isBuy ? order.sellToken : order.buyToken;
  const analyticsProperties = useMemo(
    () => ({
      orderId: order.id,
      kind: order.kind,
      status: order.status,
      chain: order.chain,
    }),
    [order.chain, order.id, order.kind, order.status],
  );

  const sellDecimals = order.sellToken.decimals ?? 18;
  const buyDecimals = order.buyToken.decimals ?? 18;

  const totalSellFormatted = formatUnits(
    BigInt(order.sellAmount),
    sellDecimals,
  );
  const totalBuyFormatted = formatUnits(BigInt(order.buyAmount), buyDecimals);

  const executedSellFormatted = order.executedSellAmount
    ? formatUnits(BigInt(order.executedSellAmount), sellDecimals)
    : '0';
  const executedBuyFormatted = order.executedBuyAmount
    ? formatUnits(BigInt(order.executedBuyAmount), buyDecimals)
    : '0';

  const progressPct = useMemo(
    () =>
      computeLimitOrderProgressPct({
        isBuy,
        buyAmount: order.buyAmount,
        sellAmount: order.sellAmount,
        executedBuyAmount: order.executedBuyAmount,
        executedSellAmount: order.executedSellAmount,
      }),
    [
      isBuy,
      order.buyAmount,
      order.sellAmount,
      order.executedBuyAmount,
      order.executedSellAmount,
    ],
  );

  // Expiration calculation
  const timeLeft = useMemo(() => formatLimitOrderExpiryDisplay(order), [order]);

  const isActiveOrder = isActiveLimitOrderStatus(order.status);

  const showExpiryRow = order.status !== 'filled';

  const showLatestTxRow = !(
    (order.status === 'open' || order.status === 'submitted') &&
    progressPct === 0
  );

  const formattedExpiry = useMemo(() => {
    return moment(order.deadline).format('MMM D [at] h:mm A');
  }, [order.deadline]);

  const { expiryStr, expiryColor } = useMemo(() => {
    if (isNoExpirationLimitOrder(order) && isActiveOrder) {
      return {
        expiryStr: timeLeft,
        expiryColor: 'secondary',
      } as const;
    }
    if (isActiveOrder) {
      return {
        expiryStr: timeLeft,
        expiryColor: timeLeft === 'Expired' ? 'secondary' : 'warning',
      } as const;
    }
    if (order.status === 'expired') {
      return { expiryStr: 'Expired', expiryColor: 'secondary' } as const;
    }
    return { expiryStr: formattedExpiry, expiryColor: 'secondary' } as const;
  }, [isActiveOrder, order, timeLeft, formattedExpiry]);

  const statusText = useMemo(() => {
    if (order.status === 'open' || order.status === 'submitted') {
      return `${Math.round(progressPct)}% Complete`;
    }
    if (order.status === 'cancel_pending') return 'Cancelling...';
    if (order.status === 'filled') return 'Filled';
    if (order.status === 'cancelled') return 'Cancelled';
    if (order.status === 'expired') return 'Expired';
    if (order.status === 'failed') return 'Failed';
    return order.status;
  }, [order.status, progressPct]);

  // Dec 1 at 11:34 AM
  const formattedDate = useMemo(() => {
    return moment(order.submittedAt ?? order.deadline).format(
      'MMM D [at] h:mm A',
    );
  }, [order.submittedAt, order.deadline]);

  // Truncated latest fill tx hash display
  const formattedLatestTx = useMemo(() => {
    if (!order.latestFillTxHash) return undefined;
    return truncateLimitOrderTxHash(order.latestFillTxHash);
  }, [order.latestFillTxHash]);

  const showSeeAllFills = (order.fillCount ?? 0) > 1;

  const handleOpenLatestTxExplorer = useCallback(() => {
    if (!order.latestFillTxHash) return;

    trackEvent(AnalyticsEvent.OpenWalletLimitOrderExplorer, {
      ...analyticsProperties,
      txHash: order.latestFillTxHash,
    });

    const chainId = apiChainToChainIdOrThrow(order.chain);
    const explorerUrl = getTransactionExplorerUrl({
      type: 'tx',
      chainId,
      hash: order.latestFillTxHash,
    });

    if (explorerUrl) {
      Linking.openURL(explorerUrl).catch(() => {});
    }
  }, [analyticsProperties, order.chain, order.latestFillTxHash, trackEvent]);

  const handleSeeAllFills = useCallback(() => {
    onSeeAllFills?.(order);
  }, [onSeeAllFills, order]);

  const formattedProtocolOrderId = useMemo(() => {
    if (!order.protocolOrderId) return undefined;
    return `${order.protocolOrderId.slice(0, 6)}...${order.protocolOrderId.slice(-4)}`;
  }, [order.protocolOrderId]);

  const handleOpenExplorer = useCallback(() => {
    if (!order.protocolOrderId) return;
    trackEvent(AnalyticsEvent.OpenWalletLimitOrderExplorer, {
      ...analyticsProperties,
      protocolOrderId: order.protocolOrderId,
    });
    const url = `https://explorer.cow.fi/orders/${order.protocolOrderId}`;
    Linking.openURL(url).catch(() => {});
  }, [analyticsProperties, order.protocolOrderId, trackEvent]);

  const updateCachedOrder = useCallback(
    (updatedOrder: ApiLimitOrder) => {
      queryClient.setQueriesData<
        InfiniteData<{
          items: ApiLimitOrder[];
          next?: { cursor?: string };
        }>
      >({ queryKey: buildLimitOrdersKey() }, (data) => {
        if (!data) return data;

        return {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.map((cachedOrder) =>
              cachedOrder.id === updatedOrder.id ? updatedOrder : cachedOrder,
            ),
          })),
        };
      });
    },
    [queryClient],
  );

  const handleTerminate = useCallback(async () => {
    if (cancelling) return;

    const isLocalOnlyCancel =
      (order.status === 'open' || order.status === 'submitted') &&
      order.protocolOrderId === undefined;

    if (!isLocalOnlyCancel && !order.protocolOrderId) return;

    setCancelling(true);
    setCancelError(undefined);
    trackEvent(AnalyticsEvent.CancelLimitOrder, analyticsProperties);

    try {
      const cancelRequest = isLocalOnlyCancel
        ? buildLocalLimitOrderCancelRequest({
            orderId: order.id,
            chain: order.chain,
          })
        : await (async () => {
            const viemChain = apiChainToViemChainOrThrow(order.chain);
            const walletClient = await getWalletClient(viemChain);
            const { domain, types, message } =
              buildCowOrderCancellationTypedData({
                chainId: viemChain.id,
                orderUid: order.protocolOrderId as Hex,
              });

            const signature = await walletClient.signTypedData({
              domain,
              types,
              primaryType: 'OrderCancellation',
              message,
            });

            const signatureHash = hashTypedData({
              domain,
              types,
              primaryType: 'OrderCancellation',
              message,
            });

            return {
              orderId: order.id,
              cancelSignature: signature,
              cancelSignatureHash: signatureHash,
              cancelSignaturePayload: {
                typedData: {
                  domain,
                  types,
                  primaryType: 'OrderCancellation',
                  message,
                },
                signingScheme: 'eip712',
              },
            };
          })();

      const response = await apiClient.cancelLimitOrder(cancelRequest);

      updateCachedOrder(response.data.result.order);
      void queryClient.invalidateQueries({
        queryKey: buildLimitOrdersKey(),
      });
      trackEvent(AnalyticsEvent.CancelLimitOrderSucceeded, {
        ...analyticsProperties,
        status: response.data.result.order.status,
      });
      onDismiss();
    } catch (err) {
      if (isCancellationAlreadyInProgressError(err)) {
        updateCachedOrder({
          ...order,
          status: 'cancel_pending',
        });
        void queryClient.invalidateQueries({
          queryKey: buildLimitOrdersKey(),
        });
        trackEvent(AnalyticsEvent.CancelLimitOrderSucceeded, {
          ...analyticsProperties,
          status: 'cancel_pending',
          alreadyInProgress: true,
        });
        onDismiss();
        return;
      }

      trackEvent(AnalyticsEvent.CancelLimitOrderError, {
        ...analyticsProperties,
        error: err instanceof Error ? err.name : 'unknown',
        message:
          err instanceof Error ? err.message : 'Failed to terminate order',
      });
      setCancelError(
        getLimitOrderUserErrorMessage(err, 'Failed to terminate order'),
      );
    } finally {
      setCancelling(false);
    }
  }, [
    analyticsProperties,
    order,
    getWalletClient,
    apiClient,
    queryClient,
    updateCachedOrder,
    onDismiss,
    cancelling,
    trackEvent,
  ]);

  const limitPriceStr = useMemo(() => {
    const targetPriceUsd = getLimitOrderTargetPriceUsd(order.metadata);
    return targetPriceUsd !== undefined ? formatPrice(targetPriceUsd) : '—';
  }, [order.metadata]);

  const failedOrderValueStr = useMemo(
    () =>
      formatLimitOrderValueStr({
        quoteTokenCa: quoteToken.ca,
        quoteTokenSymbol: quoteToken.symbol,
        isBuy,
        totalSellFormatted,
        totalBuyFormatted,
        executedSellFormatted,
        executedBuyFormatted,
        showPartialProgress: true,
      }),
    [
      quoteToken.ca,
      quoteToken.symbol,
      isBuy,
      totalSellFormatted,
      totalBuyFormatted,
      executedSellFormatted,
      executedBuyFormatted,
    ],
  );

  const tableRows: TableRow[] = useMemo(() => {
    let statusIcon: React.ReactNode = null;
    if (order.status === 'open' || order.status === 'submitted') {
      statusIcon = <CircularProgress progress={progressPct} size={14} />;
    } else if (order.status === 'cancel_pending') {
      statusIcon = (
        <ActivityIndicator
          size="small"
          style={{ transform: [{ scale: 0.7 }] }}
        />
      );
    } else if (order.status === 'filled') {
      statusIcon = <CircularProgress progress={100} size={14} />;
    } else if (order.status === 'expired') {
      statusIcon = <DottedCircle size={14} />;
    } else if (order.status === 'failed') {
      statusIcon = <RedCircle size={14} />;
    }

    const valueStr = formatLimitOrderValueStr({
      quoteTokenCa: quoteToken.ca,
      quoteTokenSymbol: quoteToken.symbol,
      isBuy,
      totalSellFormatted,
      totalBuyFormatted,
      executedSellFormatted,
      executedBuyFormatted,
      showPartialProgress: isActiveLimitOrderStatus(order.status),
    });

    // Expiry row
    const amountStr = `${Number(
      isBuy ? totalBuyFormatted : totalSellFormatted,
    ).toLocaleString(undefined, {
      maximumFractionDigits: 6,
    })} ${primaryToken.symbol}`;

    const rows: TableRow[] = [
      {
        label: (
          <Text2 size="base" color="secondary" weight="medium">
            Status
          </Text2>
        ),
        value: (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {statusIcon}
            <Text2 size="sm" color="primary" weight="medium">
              {statusText}
            </Text2>
          </View>
        ),
      },
      {
        label: (
          <Text2 size="base" color="secondary" weight="medium">
            Value
          </Text2>
        ),
        value: (
          <Text2 size="sm" color="primary" weight="medium">
            {valueStr}
          </Text2>
        ),
      },
      ...(showExpiryRow
        ? [
            {
              label: (
                <Text2 size="base" color="secondary" weight="medium">
                  Expiry
                </Text2>
              ),
              value: (
                <Text2 size="sm" color={expiryColor} weight="medium">
                  {expiryStr}
                </Text2>
              ),
            },
          ]
        : []),
      {
        label: (
          <Text2 size="base" color="secondary" weight="medium">
            Amount
          </Text2>
        ),
        value: (
          <Text2 size="sm" color="primary" weight="medium">
            {amountStr}
          </Text2>
        ),
      },
      {
        label: (
          <Text2 size="base" color="secondary" weight="medium">
            Limit price
          </Text2>
        ),
        value: (
          <Text2 size="sm" color="primary" weight="medium">
            {limitPriceStr}
          </Text2>
        ),
      },
      ...(showLatestTxRow
        ? [
            {
              label: (
                <Text2 size="base" color="secondary" weight="medium">
                  Latest Tx
                </Text2>
              ),
              value: formattedLatestTx ? (
                <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
                  <TouchableOpacity
                    onPress={handleOpenLatestTxExplorer}
                    hitSlop={hitSlop}
                  >
                    <Text2 size="sm" style={t.texts.brand} weight="medium">
                      {formattedLatestTx}
                    </Text2>
                  </TouchableOpacity>
                  {showSeeAllFills && onSeeAllFills ? (
                    <TouchableOpacity
                      onPress={handleSeeAllFills}
                      hitSlop={hitSlop}
                    >
                      <Text2 size="xs" color="secondary">
                        (See all)
                      </Text2>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : (
                <Text2 size="sm" color="secondary" weight="medium">
                  —
                </Text2>
              ),
            },
          ]
        : []),
    ];

    return rows;
  }, [
    quoteToken,
    primaryToken,
    isBuy,
    limitPriceStr,
    totalSellFormatted,
    totalBuyFormatted,
    executedSellFormatted,
    executedBuyFormatted,
    order.status,
    showExpiryRow,
    showLatestTxRow,
    expiryStr,
    expiryColor,
    statusText,
    formattedLatestTx,
    handleOpenLatestTxExplorer,
    handleSeeAllFills,
    onSeeAllFills,
    showSeeAllFills,
    t,
    progressPct,
  ]);

  const showTerminateBtn =
    order.status === 'open' || order.status === 'submitted';

  const cancelButtonTitle =
    progressPct > 0 ? 'Terminate order' : 'Cancel order';

  if (order.status === 'failed') {
    return (
      <AutoDisplayingBottomSheetModal
        name="Wallet Limit Order Details"
        displayedInModalPresentationScreen={true}
        onDismiss={onDismiss}
      >
        <View style={[t.flexCol, { gap: 12, paddingBottom: 24 }]}>
          <View style={[t.flexRow, t.itemsCenter, { gap: 10 }]}>
            <TokenIcon
              iconUrl={primaryToken.imageUrl}
              diameter={42}
              symbol={primaryToken.symbol}
              chain={order.chain}
            />
            <View style={[t.flex1, t.itemsCenter, { gap: 2 }]}>
              <Text2 size="base" color="secondary" weight="semibold">
                ({isBuy ? 'Buy' : 'Sell'})
              </Text2>
              <Text2 size="base" color="secondary" weight="medium">
                {formattedDate}
              </Text2>
            </View>
          </View>

          <View style={[t.flexCol, { gap: 10 }]}>
            <View style={[t.flexRow, t.itemsCenter, t.justifyBetween]}>
              <Text2 size="base" color="secondary" weight="medium">
                Status
              </Text2>
              <View style={[t.flexRow, t.itemsCenter, { gap: 6 }]}>
                <RedCircle size={14} />
                <Text2 size="base" color="danger" weight="medium">
                  Failed
                </Text2>
              </View>
            </View>

            <View style={[t.flexRow, t.itemsCenter, t.justifyBetween]}>
              <Text2 size="base" color="secondary" weight="medium">
                Value
              </Text2>
              <Text2 size="base" color="secondary" weight="medium">
                {failedOrderValueStr}
              </Text2>
            </View>

            <View style={[t.flexRow, t.itemsCenter, t.justifyBetween]}>
              <Text2 size="base" color="secondary" weight="medium">
                Limit price
              </Text2>
              <Text2 size="base" color="secondary" weight="medium">
                {limitPriceStr}
              </Text2>
            </View>

            {order.protocolOrderId ? (
              <View style={[t.flexRow, t.itemsCenter, t.justifyBetween]}>
                <Text2 size="base" color="secondary" weight="medium">
                  Failed Tx
                </Text2>
                <TouchableOpacity
                  onPress={handleOpenExplorer}
                  hitSlop={hitSlop}
                >
                  <Text2 size="base" style={t.texts.brand} weight="medium">
                    {formattedProtocolOrderId}
                  </Text2>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>
      </AutoDisplayingBottomSheetModal>
    );
  }

  return (
    <AutoDisplayingBottomSheetModal
      name="Wallet Limit Order Details"
      displayedInModalPresentationScreen={true}
      onDismiss={onDismiss}
    >
      <View style={[t.flexCol, { gap: 16, paddingBottom: 24 }]}>
        {/* Header */}
        <View style={[t.flexRow, t.itemsCenter, { gap: 10 }]}>
          <TokenIcon
            iconUrl={primaryToken.imageUrl}
            diameter={42}
            symbol={primaryToken.symbol}
            chain={order.chain}
          />
          <View style={[t.flexCol, { gap: 2, flex: 1 }]}>
            <Text2 size="base" color="primary" weight="semibold">
              {primaryToken.symbol} ({isBuy ? 'Buy' : 'Sell'})
            </Text2>
            <Text2 size="sm" color="secondary" weight="medium">
              {formattedDate}
            </Text2>
          </View>
        </View>

        <Table rows={tableRows} alternating={false} />

        {cancelError && (
          <Text2 color="danger" size="sm" style={[t.mT2, t.textCenter]}>
            {cancelError}
          </Text2>
        )}

        {showTerminateBtn && (
          <ButtonV2
            variant="tertiary"
            title={cancelButtonTitle}
            onPress={handleTerminate}
            loading={cancelling}
            textStyle={{
              color: t.colors.text.danger,
              fontWeight: 'bold',
              fontSize: 16,
            }}
            width="full"
            margin={{ marginTop: 16 }}
          />
        )}
      </View>
    </AutoDisplayingBottomSheetModal>
  );
}
