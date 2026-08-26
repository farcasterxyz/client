import { ApiTokenLink, ApiWalletActivity, isUsdc } from 'farcaster-client-data';
import {
  formatAmount,
  formatPrice,
  formatTokenStat,
} from 'farcaster-client-hooks';
import { Circle } from 'lucide-react-native';
import { useMemo } from 'react';
import { View } from 'react-native';

import { useTheme } from '../../../contexts';
import { AnimatedPressable, Text2, TextPlaceholder } from '../../design-system';

export const TraderTokenActivityItem = ({
  token,
  item,
  onPress,
}: {
  token: ApiTokenLink;
  item: ApiWalletActivity;
  onPress?: () => void;
}) => {
  const t = useTheme();
  const { chain, ca } = token;

  const stateChange = item.stateChanges.find(
    (s) =>
      s.assetMetadata.chain?.toLowerCase() === chain.toLowerCase() &&
      s.assetMetadata.ca?.toLowerCase() === ca.toLowerCase(),
  );

  const typeText = useMemo(() => {
    if (item.type === 'swap' && stateChange?.direction === 'OUT') {
      return 'Sell';
    }
    if (item.type === 'swap' && stateChange?.direction === 'IN') {
      return 'Buy';
    }
    if (item.type === 'send') {
      return 'Send';
    }
    if (item.type === 'receive') {
      return 'Receive';
    }
    return 'Unknown';
  }, [item.type, stateChange?.direction]);

  const content = useMemo(() => {
    if (!stateChange) {
      return null;
    }

    const sign = stateChange.direction === 'OUT' ? -1 : 1;

    // Unit Price -- Clearer when `usdPrice` is renamed
    const priceUsd = stateChange.usdPrice
      ? stateChange.usdPrice / stateChange.value
      : undefined;

    // Total USD Value -- Clearer when `usdPrice` is renamed
    const valueUsd = stateChange.usdPrice ? stateChange.usdPrice : undefined;

    // If available, use the estimated mcp price
    const currPriceUsd = token.priceUsd
      ? parseFloat(token.priceUsd)
      : undefined;

    const priceChangePct =
      priceUsd && currPriceUsd && currPriceUsd !== 0
        ? (currPriceUsd - priceUsd) / priceUsd
        : undefined;

    // Estimated Market Cap at the time of the activity
    const mcap =
      token.marketCap && priceChangePct
        ? token.marketCap / (1 + priceChangePct)
        : undefined;

    const priceColor = sign === -1 ? t.colors.red500 : t.colors.green450;

    return (
      <View
        style={[
          t.flex1,
          t.flexRow,
          t.pY2,
          t.pX3,
          t.itemsCenter,
          t.justifyBetween,
          { borderRadius: 6 },
        ]}
      >
        <View style={[t.flex1, t.flexCol, { gap: 4 }]}>
          <View style={[t.flexRow, t.itemsCenter, { gap: 8 }]}>
            <Circle size={8} color={priceColor} fill={priceColor} />
            <Text2 weight="medium" color="primary">
              {typeText}
            </Text2>
          </View>
          <Text2 size="sm" color="secondary">
            {new Date(item.timestamp).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
            {' at '}
            {new Date(item.timestamp).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text2>
        </View>
        <View style={[t.flex1, t.flexCol, t.itemsEnd, { gap: 4 }]}>
          <Text2 weight="medium" color="primary">
            {!valueUsd && 'N/A'}
            {valueUsd &&
              formatPrice(sign * valueUsd, { showPositiveSign: true })}
          </Text2>
          <Text2 size="sm" color="secondary" numberOfLines={1}>
            {formatAmount(stateChange.value)}
            {isUsdc(ca) || (!mcap && !priceUsd)
              ? ''
              : // price will be available if all the conditions fail. ?? 0 for the typechecker
                ` at ${mcap && (!priceUsd || priceUsd < 0.1) ? formatTokenStat(mcap) : formatPrice(priceUsd ?? 0)}`}
          </Text2>
        </View>
      </View>
    );
  }, [t, token.marketCap, token.priceUsd, item, stateChange, ca, typeText]);

  if (onPress && stateChange) {
    return <AnimatedPressable onPress={onPress}>{content}</AnimatedPressable>;
  }

  return content;
};

export const TraderTokenActivityPlaceHolderItem = () => {
  const t = useTheme();
  return (
    <View
      style={[
        t.flex1,
        t.flexRow,
        t.pY2,
        t.pX3,
        t.itemsCenter,
        t.justifyBetween,
        { borderRadius: 6 },
      ]}
    >
      <View style={[t.flex1, t.flexCol, { gap: 4 }]}>
        <TextPlaceholder width={40} size="base" />
        <TextPlaceholder width={80} size="sm" />
      </View>
      <View style={[t.flex1, t.flexCol, t.itemsEnd, { gap: 4 }]}>
        <TextPlaceholder width={40} size="base" />
        <TextPlaceholder width={80} size="sm" />
      </View>
    </View>
  );
};
