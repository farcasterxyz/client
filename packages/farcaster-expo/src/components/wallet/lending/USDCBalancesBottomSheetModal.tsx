import { LinearGradient } from 'expo-linear-gradient';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiEthFungibleTokenPosition, isUsdc } from 'farcaster-client-data';
import {
  formatPrice,
  useOnchainMorphoFarcasterVault,
} from 'farcaster-client-hooks';
import { ArrowRightIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { AutoDisplayingBottomSheetModal } from '../../../components/bottom-sheet/AutoDisplayingBottomSheetModal';
import {
  AnimatedBalanceDisplay,
  AnimatedPressable,
  Text2,
} from '../../../components/design-system';
import { useSharedTelemetry, useTheme } from '../../../contexts';
import { useWalletBalances, useWalletBalancesHidden } from '../../../hooks';
import { TokenIcon } from '../../crypto';
import { USDCLendingIcon } from '../../icons/USDCLendingIcon';

export function USDCBalancesBottomSheetModal({
  onEarnPress,
  onDismiss,
}: {
  onEarnPress: () => void;
  onDismiss: () => void;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { trackEvent } = useSharedTelemetry();
  const [balancesHidden] = useWalletBalancesHidden();

  React.useEffect(() => {
    trackEvent(AnalyticsEvent.ViewUSDCBalances);
  }, [trackEvent]);

  const { balances } = useWalletBalances();
  const { data: vault } = useOnchainMorphoFarcasterVault();

  const vaultBalance = React.useMemo(() => {
    return balances.find((b) => b.token?.ca === vault?.token.ca);
  }, [balances, vault]);

  const usdcBalances = React.useMemo(() => {
    return balances.filter((b) => !!b.token?.ca && isUsdc(b.token?.ca));
  }, [balances]);

  const totalUsdcBalanceUsd = React.useMemo(() => {
    return usdcBalances.reduce((acc, b) => acc + (b.value ?? 0), 0);
  }, [usdcBalances]);

  const renderUsdc = React.useCallback(
    (token: ApiEthFungibleTokenPosition) => {
      if (token.quantity.float < 0.01) {
        return null;
      }

      return (
        <View
          key={`${token.chain}:${token.address}`}
          style={[t.flexRow, t.p3, { gap: 8 }]}
        >
          <TokenIcon
            iconUrl={token.iconUrl}
            diameter={40}
            symbol={token.symbol}
            chain={token.chain}
          />
          <View style={[t.flex1, t.flexRow, t.justifyBetween]}>
            <View style={[t.flexCol]}>
              <Text2 weight="semibold" color="primary">
                {token.symbol}
              </Text2>
              <Text2 size="sm" weight="semibold" color="tertiary">
                {balancesHidden
                  ? `*** ${token.symbol}`
                  : `${token.quantity.float.toFixed(2)} ${token.symbol}`}
              </Text2>
            </View>
            <Text2 color="primary" weight="semibold" numberOfLines={1}>
              {balancesHidden ? '*****' : formatPrice(token.value ?? 0)}
            </Text2>
          </View>
        </View>
      );
    },
    [t, balancesHidden],
  );

  const UsdcLendingCardComponent = React.useMemo(() => {
    const isLightMode = t.scheme === 'light';

    const DarkModeBackground = (
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="lendingCardGradient" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#866AFF" stopOpacity={0.2} />
            <Stop offset="100%" stopColor="#7959FF" stopOpacity={0.1} />
          </RadialGradient>
        </Defs>
        <Rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="url(#lendingCardGradient)"
        />
      </Svg>
    );

    const LightModeBackground = (
      <LinearGradient
        colors={['rgba(98, 126, 234, 0.15)', 'rgba(220, 31, 255, 0.05)']}
        locations={[0.0778, 0.8277]}
        start={{ x: 0, y: 0.6 }}
        end={{ x: 1, y: 0.4 }}
        style={StyleSheet.absoluteFill}
      />
    );

    return (
      <View style={[t.mX3, { borderRadius: 12, overflow: 'hidden' }]}>
        {isLightMode ? LightModeBackground : DarkModeBackground}
        <View style={[t.pY3]}>
          <View style={[t.pB2]}>
            <View
              style={[
                t.flexRow,
                t.justifyBetween,
                t.itemsCenter,
                t.borderB,
                t.borders.primary,
              ]}
            >
              <View
                style={[
                  t.pX3,
                  t.pB2,
                  t.pT1,
                  t.flexRow,
                  t.itemsCenter,
                  { gap: 8 },
                ]}
              >
                <USDCLendingIcon size={24} />
                <Text2 weight="semibold" color="primary">
                  USDC Lending
                </Text2>
              </View>
              <ArrowRightIcon
                size={16}
                color={t.colors.text.primary}
                style={[t.mR3]}
              />
            </View>
            <View style={[t.flexRow, t.pX3, t.itemsCenter, { gap: 8 }]}>
              {balancesHidden ? (
                <Text2
                  size="2xl"
                  weight="semibold"
                  color="tertiary"
                  style={{ marginTop: 12 }}
                >
                  *****
                </Text2>
              ) : (
                <AnimatedBalanceDisplay
                  size="2xl"
                  maximumFractionDigits={2}
                  amount={vaultBalance?.quantity.float ?? 0}
                />
              )}
              <View
                style={[
                  t.flexRow,
                  t.itemsCenter,
                  t.roundedLg,
                  t.backgrounds.success,
                  {
                    gap: 4,
                    marginTop: 12,
                    paddingVertical: 2,
                    paddingHorizontal: 6,
                  },
                ]}
              >
                <Text2 size="sm" weight="semibold" color="success">
                  {((vault?.vault.avgApy ?? 0) * 100).toFixed(2)}% APY
                </Text2>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }, [t, vault, vaultBalance, balancesHidden]);

  return (
    <AutoDisplayingBottomSheetModal
      name="usdc-balances-bottom-sheet"
      handleIndicatorStyle={{ backgroundColor: t.colors.text.tertiary }}
      onDismiss={onDismiss}
      snapPoints={['100%']}
      enableDynamicSizing={false}
      disableBottomSheetContentContainer
      backgroundStyle={[
        t.borderHairline,
        t.borderDefault,
        t.bgDefault,
        { borderTopLeftRadius: 24, borderTopRightRadius: 24 },
      ]}
    >
      <View style={[t.flex1, t.flexCol, { paddingBottom: insets.bottom }]}>
        <View style={[t.flexRow, t.p3, t.itemsCenter, { gap: 8 }]}>
          <TokenIcon diameter={40} symbol="USDC" />
          <View style={[t.flexCol, { gap: 2 }]}>
            <Text2 size="lg" weight="semibold">
              USDC
            </Text2>
          </View>
        </View>
        <View style={[t.p3]}>
          {balancesHidden ? (
            <Text2
              size="5xl"
              weight="semibold"
              color="tertiary"
              style={{ paddingTop: 14 }}
            >
              *****
            </Text2>
          ) : (
            <AnimatedBalanceDisplay
              size="5xl"
              maximumFractionDigits={2}
              amount={totalUsdcBalanceUsd}
            />
          )}
        </View>
        <View style={[t.p3]}>
          <Text2 weight="semibold" color="tertiary">
            Chains
          </Text2>
        </View>
        {usdcBalances.map((balance) => renderUsdc(balance))}
        <AnimatedPressable onPress={onEarnPress} style={[t.pT3]}>
          {UsdcLendingCardComponent}
        </AnimatedPressable>
      </View>

      <View style={[t.p3, t.mB6]}>
        <AnimatedPressable
          onPress={onEarnPress}
          style={[
            t.p3,
            t.itemsCenter,
            t.justifyCenter,
            t.roundedFull,
            t.backgrounds.brand,
          ]}
        >
          <Text2 size="lg" weight="semibold" color="light">
            Earn
          </Text2>
        </AnimatedPressable>
      </View>
    </AutoDisplayingBottomSheetModal>
  );
}
