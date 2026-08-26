import { ApiSwapBuy, ApiSwapQuote, ApiSwapSell } from 'farcaster-client-data';
import { tokenQuantityToFloat } from 'farcaster-client-hooks';
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSharedNavigationContext, useTheme } from '../../contexts';
import { ButtonV2, CircleIconBadge, Text2 } from '../design-system';
import { AlertIcon } from '../icons';
import { ActivitySpinner } from './ActivitySpinner';

const toUnitAmountText = (tkn: ApiSwapBuy | ApiSwapSell) => {
  const symbol = tkn.token.symbol;
  if (!tkn.amount || !tkn.token.decimals) {
    return `N/A ${symbol}`;
  }

  const amountFloat = tokenQuantityToFloat({
    quantity: BigInt(tkn.amount),
    decimals: tkn.token.decimals,
  });

  // Convert to a more readable format using Number.parseFloat and toLocaleString
  // This automatically removes insignificant trailing zeros
  const formattedAmount = Number(amountFloat).toLocaleString('en-US', {
    minimumFractionDigits: 0, // Don't require any decimal places
    maximumFractionDigits: 6, // Allow up to 6 decimal places for small values
    useGrouping: false, // Don't use commas for thousands separators
  });

  return `${formattedAmount} ${symbol}`;
};

export function GaslessSwapMonitor({
  gaslessQuote,
  error,
}: {
  gaslessQuote: ApiSwapQuote;
  error?: Error | string;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { pop } = useSharedNavigationContext();

  // Error state
  if (error) {
    const errorMessage =
      typeof error === 'string' ? error : error.message || 'Unknown error';

    return (
      <View style={[t.flex1, t.pX3, { paddingBottom: insets.bottom }]}>
        <View style={[t.flex1, t.pT6]}>
          <View
            style={[{ height: 358, gap: 18 }, t.itemsCenter, t.justifyCenter]}
          >
            <CircleIconBadge
              variant="warn"
              size="80"
              Icon={(props) => <AlertIcon {...props} />}
            />
            <View
              style={[
                { gap: 12 },
                t.textCenter,
                t.itemsCenter,
                t.justifyCenter,
              ]}
            >
              <Text2 weight="semibold" size="3xl" align="center">
                Gas swap failed
              </Text2>
              <Text2 align="center" color="secondary">
                We couldn't swap {toUnitAmountText(gaslessQuote.price.sell)} for
                ETH to cover gas fees.
              </Text2>
              {errorMessage !== 'Unknown error' && (
                <Text2 align="center" color="secondary" size="sm">
                  {errorMessage}
                </Text2>
              )}
            </View>
          </View>
        </View>
        <View style={[t.wFull]}>
          <ButtonV2
            title="Close"
            onPress={() => {
              pop();
            }}
          />
        </View>
      </View>
    );
  }

  // Loading state
  return (
    <View style={[t.flex1, t.pX3, { paddingBottom: insets.bottom }]}>
      <View style={[t.flex1, t.pT6]}>
        <View
          style={[{ height: 358, gap: 18 }, t.itemsCenter, t.justifyCenter]}
        >
          <View style={[t.justifyCenter, { height: 80 }]}>
            <ActivitySpinner />
          </View>
          <View
            style={[{ gap: 12 }, t.textCenter, t.itemsCenter, t.justifyCenter]}
          >
            <Text2 weight="semibold" size="3xl" align="center">
              Sending
            </Text2>
            <Text2 size="lg" color="secondary" align="center">
              Do not close this screen. This may take a few seconds.
            </Text2>
          </View>
        </View>
      </View>
    </View>
  );
}
