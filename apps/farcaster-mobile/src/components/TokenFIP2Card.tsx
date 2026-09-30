import { Octicons } from '@expo/vector-icons';
import {
  ApiOnchainTokenMinimal,
  ApiOnchainTransactionSwapEmbed,
  buildCaip19TokenUri,
} from 'farcaster-client-data';
import { formatPrice, formatTokenStat } from 'farcaster-client-hooks';
import {
  hitSlopLg,
  parseTokenAmount,
  TokenIcon,
  Typography,
  useHaptics,
  useTheme,
} from 'farcaster-expo';
import { Triangle } from 'lucide-react-native';
import React from 'react';
import { Pressable, View } from 'react-native';

export const FIXED_TOKEN_FIP2_CARD_HEIGHT = 64;

export type TokenCardOnDismiss = (() => void) | undefined;

function TokenFIP2Card({
  token,
  tx,
  tokenCardOnDismiss,
}: {
  token: ApiOnchainTokenMinimal;
  tx: ApiOnchainTransactionSwapEmbed | undefined;
  tokenCardOnDismiss: TokenCardOnDismiss;
}) {
  return (
    <TokenFIP2CardContent
      token={token}
      tx={tx}
      tokenCardOnDismiss={tokenCardOnDismiss}
    />
  );
}

function TokenFIP2CardContent({
  token,
  tx,
  tokenCardOnDismiss,
}: {
  token: ApiOnchainTokenMinimal;
  tx: ApiOnchainTransactionSwapEmbed | undefined;
  tokenCardOnDismiss: TokenCardOnDismiss;
}) {
  const t = useTheme();

  const { triggerImpactAsync } = useHaptics();

  const tokenKey = buildCaip19TokenUri(token.chain, token.ca);

  const buy = React.useMemo(() => {
    if (typeof tx === 'undefined') {
      return undefined;
    }

    const buyTokenKey = buildCaip19TokenUri(tx.buyToken.chain, tx.buyToken.ca);

    if (tokenKey === buyTokenKey) {
      try {
        const buyUsdValue =
          parseTokenAmount(tx.buyAmount, tx.buyToken.decimals) *
          tx.buyToken.priceUsd;

        const formattedMarketCap = formatTokenStat(tx.buyToken.marketCap);
        const formattedMarketCapString =
          formattedMarketCap.indexOf('$') !== -1
            ? `at ${formattedMarketCap.split('$')[1]}`
            : '';

        return `Buy ${formatPrice(buyUsdValue)} ${formattedMarketCapString}`.trim();
      } catch {
        return undefined;
      }
    }
  }, [tokenKey, tx]);

  const sell = React.useMemo(() => {
    if (typeof tx === 'undefined') {
      return undefined;
    }

    const sellTokenKey = buildCaip19TokenUri(
      tx.sellToken.chain,
      tx.sellToken.ca,
    );

    if (tokenKey === sellTokenKey) {
      try {
        const sellUsdValue =
          parseTokenAmount(tx.sellAmount, tx.sellToken.decimals) *
          tx.sellToken.priceUsd;

        const formattedMarketCap = formatTokenStat(tx.sellToken.marketCap);
        const formattedMarketCapString =
          formattedMarketCap.indexOf('$') !== -1
            ? `at ${formattedMarketCap.split('$')[1]}`
            : '';

        return `Sell ${formatPrice(sellUsdValue)} ${formattedMarketCapString}`.trim();
      } catch {
        return undefined;
      }
    }
  }, [tokenKey, tx]);

  const tokenSubContextFormatted = React.useMemo(() => {
    if (typeof buy !== 'undefined') {
      return (
        <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 4 }]}>
          <Typography label="Body/Medium/Strong" color="tertiary">
            {buy}
          </Typography>
        </View>
      );
    }

    if (typeof sell !== 'undefined') {
      return (
        <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 4 }]}>
          <Typography label="Body/Medium/Strong" color="tertiary">
            {sell}
          </Typography>
        </View>
      );
    }

    if (typeof token.volumeH6 !== 'undefined') {
      return (
        <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 4 }]}>
          <Typography label="Body/Medium/Strong" color="tertiary">
            {`${formatTokenStat(token.volumeH6)} 6h vol`.trim()}
          </Typography>
        </View>
      );
    }

    return null;
  }, [buy, sell, t.flex, t.flexRow, t.itemsCenter, token.volumeH6]);

  const onDismissPress = React.useCallback(() => {
    if (typeof tokenCardOnDismiss === 'undefined') {
      return;
    }

    triggerImpactAsync();

    tokenCardOnDismiss();
  }, [tokenCardOnDismiss, triggerImpactAsync]);

  return (
    <View
      style={[
        t.flex,
        t.flexRow,
        t.justifyBetween,
        t.itemsCenter,
        t.p3,
        t.border,
        t.dark ? t.backgrounds.secondary : t.backgrounds.default,
        {
          borderRadius: 12,
          height: FIXED_TOKEN_FIP2_CARD_HEIGHT,
          borderColor: t.colors.gray250,
        },
        t.relative,
      ]}
    >
      <View style={[t.flex1, t.flexRow, t.itemsCenter, { gap: 8 }]}>
        <TokenIcon
          iconUrl={token.imageUrl}
          diameter={30}
          imageBordered={false}
        />
        <View style={[t.flex1, t.flexCol, { gap: 4 }]}>
          <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 4 }]}>
            <Typography
              label="Body/Large/Strong"
              color="primary"
              numberOfLines={1}
            >
              ${token.symbol}
            </Typography>
          </View>
          {tokenSubContextFormatted}
        </View>
      </View>
      <View style={[t.flex, t.flexRow, { gap: 8 }]}>
        <View style={[t.flex, t.flexCol, t.itemsEnd, { gap: 4 }]}>
          {typeof token.marketCap !== 'undefined' && (
            <Typography label="Body/Large/Strong" color="secondary">
              {`${formatTokenStat(token.marketCap)}`}
            </Typography>
          )}
          {typeof token.priceChangePct !== 'undefined' &&
            typeof token.priceChangePct !== 'undefined' && (
              <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 4 }]}>
                <Triangle
                  size={6}
                  color={
                    token.priceChangePct < 0
                      ? t.colors.red500
                      : t.colors.green450
                  }
                  fill={
                    token.priceChangePct < 0
                      ? t.colors.red500
                      : t.colors.green450
                  }
                  style={{
                    transform: [
                      { rotate: token.priceChangePct > 0 ? '0deg' : '180deg' },
                    ],
                  }}
                />
                <Typography label="Body/Medium/Strong" color="tertiary">
                  {`${Math.abs(token.priceChangePct).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}%`}
                </Typography>
              </View>
            )}
        </View>
        {typeof tokenCardOnDismiss !== 'undefined' && (
          <Pressable
            style={[
              t.itemsCenter,
              t.roundedFull,
              { marginTop: -4, marginRight: -4 },
            ]}
            hitSlop={hitSlopLg}
            onPress={onDismissPress}
          >
            <Octicons name="x" size={16} color={t.colors.text.tertiary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

export { TokenFIP2Card, TokenFIP2CardContent };
