import { getUsdcAddress, isUsdc } from 'farcaster-client-data';
import {
  formatPrice,
  useNonSuspenseToken,
  useOnchainMorphoFarcasterVault,
} from 'farcaster-client-hooks';
import React from 'react';
import { View } from 'react-native';

import { useTheme } from '../../../contexts';
import { useWalletBalances, useWalletBalancesHidden } from '../../../hooks';
import { TokenIcon } from '../../crypto';
import { AnimatedPressable, Text2, TextPlaceholder } from '../../design-system';
import { USDCLendingIcon } from '../../icons/USDCLendingIcon';
import { USDCBalancesBottomSheetModal } from './USDCBalancesBottomSheetModal';
import { USDCLendingBottomSheetModal } from './USDCLendingBottomSheetModal';
import { USDCLendingLearnMoreBottomSheetModal } from './USDCLendingLearnMoreBottomSheelModal';

export function USDCBalances({
  showUsdcLendingLearnMore = false,
}: {
  showUsdcLendingLearnMore?: boolean;
}) {
  const t = useTheme();
  const [balancesHidden] = useWalletBalancesHidden();

  const { data: vault } = useOnchainMorphoFarcasterVault();
  const { data: usdcToken } = useNonSuspenseToken({
    params: {
      ca: getUsdcAddress(vault?.vault.chain ?? 'base') ?? '',
      chain: vault?.vault.chain ?? 'base',
    },
    query: { enabled: !!vault },
  });

  const { balances } = useWalletBalances();

  const usdcBalances = React.useMemo(() => {
    return balances.filter((b) => !!b.token?.ca && isUsdc(b.token?.ca));
  }, [balances]);

  const totalUsdcQuantity = React.useMemo(() => {
    return usdcBalances.reduce((acc, b) => acc + (b.quantity.float ?? 0), 0);
  }, [usdcBalances]);

  const totalUsdcBalanceUsd = React.useMemo(() => {
    return usdcBalances.reduce((acc, b) => acc + (b.value ?? 0), 0);
  }, [usdcBalances]);

  const vaultBalance = React.useMemo(() => {
    return balances.find((b) => b.token?.ca === vault?.token.ca);
  }, [balances, vault]);

  const vaultEarningsUsd = React.useMemo(() => {
    if (!vault) {
      return null;
    } else if (!vaultBalance) {
      return 0;
    }

    const sharePrice = vault.vault.sharePrice || 1;
    return vaultBalance.quantity.float * sharePrice;
  }, [vaultBalance, vault]);

  const learnMoreShowSkipRef = React.useRef(false);
  const [showLearnMoreBottomSheet, setShowLearnMoreBottomSheet] =
    React.useState(false);

  const [showUsdcLendingBottomSheet, setShowUsdcLendingBottomSheet] =
    React.useState(false);

  const [showUsdcBalancesBottomSheet, setShowUsdcBalancesBottomSheet] =
    React.useState(false);

  React.useEffect(() => {
    if (showUsdcLendingLearnMore) {
      learnMoreShowSkipRef.current = true;
      setShowLearnMoreBottomSheet(true);
    }
  }, [showUsdcLendingLearnMore]);

  const AggregateUsdcComponent = React.useCallback(() => {
    if (totalUsdcQuantity < 0.01 || totalUsdcBalanceUsd < 1) {
      return null;
    }

    return (
      <AnimatedPressable onPress={() => setShowUsdcBalancesBottomSheet(true)}>
        <View style={[t.flexRow, t.itemsCenter, t.pX3, t.pY2, { gap: 8 }]}>
          <TokenIcon diameter={40} symbol="USDC" />
          <View
            style={[t.flexRow, t.flexShrink, t.itemsCenter, t.justifyBetween]}
          >
            <View style={[t.flex1, t.flexCol, { gap: 2 }]}>
              <Text2 color="primary" weight="semibold" numberOfLines={1}>
                USDC
              </Text2>
              <Text2 size="sm" color="tertiary" weight="semibold">
                {balancesHidden
                  ? '*** USDC'
                  : `${totalUsdcQuantity.toFixed(2)} USDC`}
              </Text2>
            </View>
            <View style={[t.flexCol, t.itemsEnd, { gap: 4 }]}>
              <Text2 color="primary" weight="semibold" numberOfLines={1}>
                {balancesHidden ? '*****' : formatPrice(totalUsdcBalanceUsd)}
              </Text2>
            </View>
          </View>
        </View>
      </AnimatedPressable>
    );
  }, [t, totalUsdcQuantity, totalUsdcBalanceUsd, balancesHidden]);

  const UsdcLendingComponent = React.useCallback(() => {
    return (
      <AnimatedPressable
        disabled={!vault}
        disableAnimation={!vault}
        onPress={() => setShowUsdcLendingBottomSheet(true)}
      >
        <View style={[t.flexRow, t.itemsCenter, t.pX3, t.pY2, { gap: 8 }]}>
          <USDCLendingIcon />
          <View
            style={[t.flexRow, t.flexShrink, t.itemsCenter, t.justifyBetween]}
          >
            <View style={[t.flex1, t.flexCol, { gap: 2 }]}>
              <Text2 color="primary" weight="semibold" numberOfLines={1}>
                USDC Lending
              </Text2>
              {!vault && <TextPlaceholder width={80} size="sm" />}
              {vault && (
                <Text2 size="sm" color="success" weight="semibold">
                  {(vaultEarningsUsd ?? 0) > 0.01 ? 'Earning' : 'Earn'}{' '}
                  {(vault.vault.avgApy * 100).toFixed(2)}% APY
                </Text2>
              )}
            </View>
            <View style={[t.flexCol, t.itemsEnd, { gap: 4 }]}>
              {vaultEarningsUsd === null && <TextPlaceholder width={50} />}
              {vaultEarningsUsd !== null && (
                <Text2 color="primary" weight="semibold" numberOfLines={1}>
                  {balancesHidden ? '*****' : formatPrice(vaultEarningsUsd)}
                </Text2>
              )}
            </View>
          </View>
        </View>
      </AnimatedPressable>
    );
  }, [
    t,
    vault,
    vaultEarningsUsd,
    setShowUsdcLendingBottomSheet,
    balancesHidden,
  ]);

  return (
    <View>
      <UsdcLendingComponent />
      <AggregateUsdcComponent />

      {showLearnMoreBottomSheet && vault && (
        <USDCLendingLearnMoreBottomSheetModal
          vault={vault?.vault}
          showSkip={learnMoreShowSkipRef.current}
          onDepositNow={() => setShowUsdcLendingBottomSheet(true)}
          onDismiss={() => {
            learnMoreShowSkipRef.current = false;
            setShowLearnMoreBottomSheet(false);
          }}
        />
      )}

      {showUsdcLendingBottomSheet && (
        <USDCLendingBottomSheetModal
          usdcToken={usdcToken?.token}
          onLearnMore={() => setShowLearnMoreBottomSheet(true)}
          onDismiss={() => setShowUsdcLendingBottomSheet(false)}
        />
      )}
      {showUsdcBalancesBottomSheet && (
        <USDCBalancesBottomSheetModal
          onEarnPress={() => setShowUsdcLendingBottomSheet(true)}
          onDismiss={() => setShowUsdcBalancesBottomSheet(false)}
        />
      )}
    </View>
  );
}
