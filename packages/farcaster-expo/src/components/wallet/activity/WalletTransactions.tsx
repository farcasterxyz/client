import { openBrowserAsync } from 'expo-web-browser';
import {
  apiChainToChainIdOrThrow,
  getTransactionExplorerUrl,
} from 'farcaster-client-data';
import {
  formatAmount,
  formatPrice,
  formatTokenName,
  formatTokenSymbol,
  tokenQuantityToFloat,
} from 'farcaster-client-hooks';
import * as React from 'react';
import { useCallback, useMemo } from 'react';
import { Linking, Platform, View } from 'react-native';

import { TokenIcon } from '../../../components/crypto';
import { AnimatedPressable, Text2 } from '../../../components/design-system';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  useWalletTransactions,
  WalletTransaction,
} from '../../../contexts/WalletTransactionsProvider';
import { formatAddress, formatValue } from '../../../utils';
import {
  ActivityTypeBadge,
  determineSwapBuySell,
  getTypeText,
  truncateString,
} from './WalletActivityItem';

export const WalletTransactions = ({
  transactions,
}: {
  transactions?: WalletTransaction[];
}) => {
  const { walletTransactions: contextTransactions } = useWalletTransactions();
  const txs = transactions ?? contextTransactions;

  return (
    <View>
      {txs
        .sort((a, b) => {
          if (!a.timestamp) {
            return -1;
          }

          if (!b.timestamp) {
            return 1;
          }

          return b.timestamp - a.timestamp;
        })
        .map((tx, i) => (
          <WalletTransactionItem key={i} item={tx} />
        ))}
    </View>
  );
};

export const WalletTransactionItem = ({
  item,
}: {
  item: WalletTransaction;
  onPress?: (tx: WalletTransaction) => void;
}) => {
  const t = useTheme();
  const handlePress = useCallback(() => {
    if (!item.txHash) {
      return;
    }

    const explorerUrl = getTransactionExplorerUrl({
      type: 'tx',
      hash: item.txHash,
      chainId: apiChainToChainIdOrThrow(item.chain),
    });

    if (explorerUrl) {
      if (Platform.OS === 'web') {
        Linking.openURL(explorerUrl);
      } else {
        openBrowserAsync(explorerUrl);
      }
    }
  }, [item]);

  const status = useMemo(() => {
    if (item.status === 'pending' || item.status === 'processing') {
      return 'pending';
    } else if (item.status === 'reverted') {
      return 'failed';
    } else {
      return 'succeeded';
    }
  }, [item]);

  if (item.metadata.type === 'send') {
    return (
      <AnimatedPressable
        key={item.txHash}
        onPress={handlePress}
        style={[
          t.flex,
          t.flexRow,
          t.itemsCenter,
          t.wFull,
          t.justifyCenter,
          t.pY3,
          t.pX4,
          { gap: 12 },
        ]}
      >
        <TokenIcon
          iconUrl={item.metadata.token.iconUrl}
          diameter={36}
          symbol={item.metadata.token.symbol}
          badge={
            <ActivityTypeBadge type={item.metadata.type} status={status} />
          }
        />
        <View style={[t.flex1, t.flexCol]}>
          <View style={[t.flexRow, t.flex1, t.justifyBetween, t.itemsCenter]}>
            <Text2 color="primary" size="base" weight="medium">
              {getTypeText(item.metadata.type, status)}
            </Text2>
            <Text2 color={'primary'} weight="medium" size="base">
              {`-${formatValue(
                tokenQuantityToFloat({
                  quantity: BigInt(item.metadata.quantity),
                  decimals:
                    item.metadata.token.decimals ??
                    (item.chain === 'solana' ? 9 : 18),
                }),
              )} ${truncateString(formatTokenSymbol(item.metadata.token.symbol))}`}
            </Text2>
          </View>
          <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
            <Text2 color="secondary" size="sm" numberOfLines={1}>
              To
            </Text2>
            <Text2 color="secondary" size="sm" numberOfLines={1}>
              {item.metadata.target.type === 'user'
                ? item.metadata.target.user?.username
                : formatAddress(item.metadata.target.address)}
            </Text2>
          </View>
        </View>
      </AnimatedPressable>
    );
  }

  if (item.metadata.type === 'swap' || item.metadata.type === 'swap-v2') {
    const sellIconUrl =
      item.metadata.type === 'swap-v2'
        ? item.metadata.sellToken.imageUrl
        : item.metadata.quote.price.sell.token.iconUrl;
    const buyIconUrl =
      'buyToken' in item.metadata
        ? item.metadata.buyToken.imageUrl
        : item.metadata.quote.price.buy.token.iconUrl;
    const sellSymbol =
      item.metadata.type === 'swap-v2'
        ? item.metadata.sellToken.symbol
        : item.metadata.quote.price.sell.token.symbol;
    const buySymbol =
      'buyToken' in item.metadata
        ? item.metadata.buyToken.symbol
        : item.metadata.quote.price.buy.token.symbol;
    const buyAmount =
      'buyToken' in item.metadata
        ? item.metadata.quote.buyAmount
        : item.metadata.quote.price.buy.amount;
    const sellAmount =
      item.metadata.type === 'swap-v2'
        ? item.metadata.quote.sellAmount
        : item.metadata.quote.price.sell.amount;
    const buyDecimals =
      'buyToken' in item.metadata
        ? item.metadata.buyToken.decimals
        : item.metadata.quote.price.buy.token.decimals;
    const sellDecimals =
      item.metadata.type === 'swap-v2'
        ? item.metadata.sellToken.decimals
        : item.metadata.quote.price.sell.token.decimals;
    const buyName =
      'buyToken' in item.metadata
        ? item.metadata.buyToken.name
        : item.metadata.quote.price.buy.token.name;
    const sellName =
      item.metadata.type === 'swap-v2'
        ? item.metadata.sellToken.name
        : item.metadata.quote.price.sell.token.name;

    // Determine buy/sell using the same logic as WalletActivityItem
    const sellCa =
      item.metadata.type === 'swap-v2'
        ? item.metadata.sellToken.ca
        : item.metadata.quote.price.sell.token.address;
    const buyCa =
      'buyToken' in item.metadata
        ? item.metadata.buyToken.ca
        : item.metadata.quote.price.buy.token.address;

    const { isSell, tokenToShow } = determineSwapBuySell(
      { assetMetadata: { ca: buyCa, symbol: buySymbol } },
      { assetMetadata: { ca: sellCa, symbol: sellSymbol } },
    );

    const tokenToDisplay = tokenToShow === 'IN' ? buySymbol : sellSymbol;
    const tokenIconUrl = tokenToShow === 'IN' ? buyIconUrl : sellIconUrl;
    const tokenName = truncateString(formatTokenSymbol(tokenToDisplay), 8);

    // Calculate USD price for IN token (buy token) to match WalletActivityItem
    const buyTokenPrice =
      'buyToken' in item.metadata
        ? item.metadata.buyToken.priceUsd
        : item.metadata.quote.price.buy.token.price;
    const buyTokenFloat = buyAmount
      ? tokenQuantityToFloat({
          quantity: BigInt(buyAmount),
          decimals: buyDecimals ?? (item.chain === 'solana' ? 9 : 18),
        })
      : 0;
    const buyUsdPrice =
      buyTokenPrice && buyTokenFloat
        ? buyTokenPrice * buyTokenFloat
        : undefined;

    // OUT token amount (sell token) - matching WalletActivityItem format
    const sellTokenFloat = sellAmount
      ? tokenQuantityToFloat({
          quantity: BigInt(sellAmount),
          decimals: sellDecimals ?? (item.chain === 'solana' ? 9 : 18),
        })
      : 0;

    return (
      <AnimatedPressable
        key={item.txHash}
        onPress={handlePress}
        style={[
          t.flex,
          t.flexRow,
          t.itemsCenter,
          t.wFull,
          t.justifyCenter,
          t.pY3,
          t.pX4,
          { gap: 12 },
        ]}
      >
        <View style={[t.relative, { width: 36, height: 36 }]}>
          <TokenIcon
            iconUrl={tokenIconUrl}
            diameter={36}
            symbol={tokenToDisplay}
            badge={
              status === 'pending' || status === 'failed' ? (
                <ActivityTypeBadge type={item.metadata.type} status={status} />
              ) : null
            }
          />
        </View>
        <View style={[t.flex1, t.flexCol]}>
          <View style={[t.flexRow, t.flex1, t.justifyBetween, t.itemsCenter]}>
            <Text2 color="primary" size="base" weight="medium">
              {getTypeText(item.metadata.type, status, tokenName, isSell)}
            </Text2>
            <View
              style={[
                t.absolute,
                t.right0,
                { top: Platform.OS === 'web' ? 0 : 5, gap: 4 },
                t.flexCol,
                t.itemsEnd,
              ]}
            >
              {buyUsdPrice && (
                <Text2 color="primary" weight="medium" size="base">
                  {formatPrice(buyUsdPrice)}
                </Text2>
              )}
              {sellTokenFloat > 0 && (
                <Text2
                  color="secondary"
                  weight="medium"
                  size="sm"
                  style={{ textAlign: 'right' }}
                  numberOfLines={1}
                >
                  {`-${formatAmount(sellTokenFloat)} ${truncateString(formatTokenSymbol(sellSymbol), 8)}`}
                </Text2>
              )}
            </View>
          </View>
          <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
            <Text2 color="secondary" size="sm" numberOfLines={1}>
              {`${truncateString(formatTokenName(sellName), 16)} -> ${truncateString(formatTokenName(buyName), 16)}`}
            </Text2>
          </View>
        </View>
      </AnimatedPressable>
    );
  }

  return null;
};
