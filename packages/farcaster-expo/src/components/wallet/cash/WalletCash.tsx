import { useQueryClient } from '@tanstack/react-query';
import { ApiOnchainYieldOverview } from 'farcaster-client-data';
import {
  buildOnchainYieldOverviewKey,
  formatAmount,
  formatPrice,
  useOnchainYieldDeposit,
  useOnchainYieldWithdraw,
} from 'farcaster-client-hooks';
import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { parseUnits } from 'viem';

import {
  useEmbeddedWallet,
  useSharedNavigationContext,
  useTheme,
  useWalletTransactions,
} from '../../../contexts';
import {
  useCashBalance,
  useWalletBalancesHidden,
  useWalletRefresh,
} from '../../../hooks';
import { parseTokenAmount, tokenPositionToTokenLink } from '../../../utils';
import { TokenIcon, TokenListItem } from '../../crypto';
import {
  AnimatedBalanceDisplay,
  AnimatedPressable,
  LoadingIndicator,
  Text2,
} from '../../design-system';
import { WalletScreenHeader } from '../WalletScreenHeader';

export function WalletCash() {
  const t = useTheme();
  const { goBack } = useSharedNavigationContext();
  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 8 }}>
        <WalletScreenHeader
          title="Cash"
          onBackCallback={goBack}
          style={t.pB0}
        />
        <WalletCashBalance />
      </View>
      <View style={[t.flexRow, t.itemsCenter, t.pX3, t.pY2, { gap: 12 }]}>
        <WalletCashDepositButton />
        <WalletCashWithdrawButton />
      </View>
      <WalletCashEarning />
      <WalletCashNotEarning />
    </View>
  );
}

function WalletCashBalance() {
  const t = useTheme();
  const { cashTotalUsd, cashYieldOverview } = useCashBalance();
  const [balancesHidden] = useWalletBalancesHidden();

  return (
    <View style={t.pX3}>
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
        <AnimatedBalanceDisplay size="5xl" amount={cashTotalUsd} />
      )}
      <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
        <Text2 size="sm" weight="semibold" color="tertiary">
          {cashYieldOverview
            ? balancesHidden
              ? 'Deposited *****'
              : `Deposited ${formatPrice(cashYieldOverview.amount.assets.quantity.float * cashYieldOverview.vault.token.priceUsd)} `
            : ''}
        </Text2>
      </View>
    </View>
  );
}

function WalletCashDepositButton() {
  const t = useTheme();
  const { evmAddress } = useEmbeddedWallet();
  const { prepareAction } = useWalletTransactions();
  const queryClient = useQueryClient();
  const refreshWallet = useWalletRefresh();

  const amount = '1000000';

  const { data } = useOnchainYieldDeposit({
    address: evmAddress!,
    amount,
    enabled: !!evmAddress,
  });

  const [isDepositing, setIsDepositing] = React.useState(false);
  const onPress = React.useCallback(async () => {
    if (!data) {
      return;
    }

    const action = prepareAction({
      protocol: 'actions',
      chain: data.vault.chain,
      actions: data.actions,
      metadata: {
        type: 'yield-deposit',
        vault: data.vault,
        amount,
        actions: data.actions,
      },
      onExecute: () => setIsDepositing(true),
      onSuccess: () => {
        setIsDepositing(false);

        const key = buildOnchainYieldOverviewKey({
          address: evmAddress!,
        });

        queryClient.setQueryData<ApiOnchainYieldOverview>(key, (prev) => {
          if (!prev) {
            return prev;
          }
          const assetsFloat =
            prev.amount.assets.quantity.float +
            parseTokenAmount(amount, data.vault.token.decimals);
          const assets = parseUnits(
            assetsFloat.toString(),
            data.vault.token.decimals,
          );
          const sharesFloat = assetsFloat / data.vault.sharePrice;
          const shares = parseUnits(
            sharesFloat.toString(),
            data.vault.token.decimals,
          );
          const valueUsd = assetsFloat * data.vault.token.priceUsd;
          return {
            ...prev,
            amount: {
              assets: {
                quantity: {
                  float: assetsFloat,
                  int: assets.toString(),
                },
                valueUsd,
              },
              shares: {
                quantity: {
                  float: sharesFloat,
                  int: shares.toString(),
                },
                valueUsd,
              },
            },
          };
        });

        refreshWallet([
          {
            chain: data.vault.chain,
            ca: data.vault.token.ca,
            decimals: data.vault.token.decimals,
            delta: `-${amount}`,
          },
        ]);
      },
      onError: () => setIsDepositing(false),
    });

    action.submit();
  }, [prepareAction, data, evmAddress, queryClient, refreshWallet]);

  return (
    <AnimatedPressable
      style={[
        t.flexRow,
        t.itemsCenter,
        t.justifyCenter,
        t.backgrounds.secondary,
        t.pX3,
        t.pY2,
        t.flex1,
        { gap: 6, borderRadius: 16, height: 40 },
      ]}
      onPress={onPress}
      disabled={isDepositing}
    >
      <View
        style={[
          t.itemsCenter,
          t.justifyCenter,
          t.roundedFull,
          { width: 20, height: 20 },
        ]}
      >
        {isDepositing ? (
          <LoadingIndicator color={t.colors.text.light} />
        ) : (
          <Svg width="21" height="20" viewBox="0 0 21 20" fill="none">
            <Path
              d="M10.5 18.3334C15.1023 18.3334 18.8333 14.6025 18.8333 10.0001C18.8333 5.39771 15.1023 1.66675 10.5 1.66675C5.89759 1.66675 2.16663 5.39771 2.16663 10.0001C2.16663 14.6025 5.89759 18.3334 10.5 18.3334Z"
              fill={t.colors.background.inverted}
              stroke={t.colors.background.inverted}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M10.5 6.66675V13.3334"
              stroke={t.colors.background.tertiary}
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M7.16663 10L10.5 13.3333L13.8333 10"
              stroke={t.colors.background.tertiary}
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        )}
      </View>
      <Text2 weight="semibold" size="sm">
        {isDepositing ? 'Depositing' : 'Deposit $1'}
      </Text2>
    </AnimatedPressable>
  );
}

function WalletCashWithdrawButton() {
  const t = useTheme();
  const { evmAddress } = useEmbeddedWallet();
  const { prepareAction } = useWalletTransactions();
  const queryClient = useQueryClient();
  const refreshWallet = useWalletRefresh();

  const { data } = useOnchainYieldWithdraw({
    address: evmAddress!,
    enabled: !!evmAddress,
  });

  const [isWithdrawing, setIsWithdrawing] = React.useState(false);
  const onPress = React.useCallback(async () => {
    if (!data) {
      return;
    }

    const action = prepareAction({
      protocol: 'actions',
      chain: data.vault.chain,
      actions: data.actions,
      metadata: {
        type: 'yield-withdraw',
        vault: data.vault,
        amount: '0',
        actions: data.actions,
      },
      onExecute: () => setIsWithdrawing(true),
      onSuccess: () => {
        setIsWithdrawing(false);

        const key = buildOnchainYieldOverviewKey({
          address: evmAddress!,
        });

        let amount = '0';
        queryClient.setQueryData<ApiOnchainYieldOverview>(key, (prev) => {
          if (!prev) {
            return prev;
          }
          amount = prev.amount.assets.quantity.int;
          const assetsFloat = 0;
          const assets = parseUnits(
            assetsFloat.toString(),
            data.vault.token.decimals,
          );
          const sharesFloat = assetsFloat / data.vault.sharePrice;
          const shares = parseUnits(
            sharesFloat.toString(),
            data.vault.token.decimals,
          );
          const valueUsd = assetsFloat * data.vault.token.priceUsd;

          return {
            ...prev,
            amount: {
              assets: {
                quantity: {
                  float: assetsFloat,
                  int: assets.toString(),
                },
                valueUsd,
              },
              shares: {
                quantity: {
                  float: sharesFloat,
                  int: shares.toString(),
                },
                valueUsd,
              },
            },
          };
        });

        refreshWallet([
          {
            chain: data.vault.chain,
            ca: data.vault.token.ca,
            decimals: data.vault.token.decimals,
            delta: amount,
          },
        ]);
      },
      onError: () => setIsWithdrawing(false),
    });
    action.submit();
  }, [prepareAction, data, evmAddress, queryClient, refreshWallet]);

  return (
    <AnimatedPressable
      style={[
        t.flexRow,
        t.itemsCenter,
        t.justifyCenter,
        t.backgrounds.secondary,
        t.pX3,
        t.pY2,
        t.flex1,
        { gap: 6, borderRadius: 16, height: 40 },
      ]}
      onPress={onPress}
      disabled={isWithdrawing}
    >
      <View
        style={[
          t.itemsCenter,
          t.justifyCenter,
          t.roundedFull,
          { width: 20, height: 20 },
        ]}
      >
        {isWithdrawing ? (
          <LoadingIndicator color={t.colors.text.light} />
        ) : (
          <Svg width="21" height="20" viewBox="0 0 21 20" fill="none">
            <Path
              d="M10.25 1.66634C5.64767 1.66634 1.91671 5.3973 1.91671 9.99967C1.91671 14.602 5.64767 18.333 10.25 18.333C14.8524 18.333 18.5834 14.602 18.5834 9.99968C18.5834 5.3973 14.8524 1.66634 10.25 1.66634Z"
              fill={t.colors.background.inverted}
              stroke={t.colors.background.inverted}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M10.25 13.333L10.25 6.66634"
              stroke={t.colors.background.tertiary}
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M13.5834 10L10.25 6.66667L6.91671 10"
              stroke={t.colors.background.tertiary}
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        )}
      </View>
      <Text2 weight="semibold" size="sm">
        {isWithdrawing ? 'Withdrawing' : 'Withdraw All'}
      </Text2>
    </AnimatedPressable>
  );
}

function WalletCashEarning() {
  const t = useTheme();
  const { cashYieldOverview } = useCashBalance();
  const [balancesHidden] = useWalletBalancesHidden();

  if (!cashYieldOverview) {
    return null;
  }

  return (
    <View>
      <Text2 weight="semibold" size="lg" color="primary" style={[t.pX3]}>
        Earning
      </Text2>
      <AnimatedPressable style={[t.flexRow, t.itemsCenter, t.p3, { gap: 8 }]}>
        <TokenIcon
          iconUrl={cashYieldOverview.vault.token.imageUrl}
          diameter={40}
          symbol={cashYieldOverview.vault.token.symbol}
        />
        <View
          style={[
            t.flexRow,
            t.itemsCenter,
            t.justifyBetween,
            t.flex1,
            { gap: 64 },
          ]}
        >
          <View
            style={[
              t.flex,
              t.itemsStart,
              t.justifyCenter,
              t.flexShrink,
              { gap: 2 },
            ]}
          >
            <Text2 weight="semibold" numberOfLines={1}>
              {cashYieldOverview.vault.token.symbol}
            </Text2>
            <Text2 color="tertiary" weight="medium" size="sm" numberOfLines={1}>
              {balancesHidden
                ? `*** ${cashYieldOverview.vault.token.symbol}`
                : `${formatAmount(cashYieldOverview.amount.assets.quantity.float)} ${cashYieldOverview.vault.token.symbol}`}
            </Text2>
          </View>
          <View style={[t.flexCol, t.itemsEnd, { gap: 2 }]}>
            <Text2 weight="medium" color={'primary'}>
              {balancesHidden
                ? '*****'
                : formatPrice(
                    cashYieldOverview.amount.assets.quantity.float *
                      cashYieldOverview.vault.token.priceUsd,
                  )}
            </Text2>
            <Text2
              size="sm"
              weight="medium"
              align="right"
              style={{ color: t.colors.green450 }}
            >
              {`${cashYieldOverview.amount.shares.quantity.float > 0 ? 'Earning' : 'Earn'} ${(cashYieldOverview.vault.apy * 100).toFixed(2)}%`}
            </Text2>
          </View>
        </View>
      </AnimatedPressable>
    </View>
  );
}

function WalletCashNotEarning() {
  const t = useTheme();
  const { cashBalances } = useCashBalance();

  return (
    <View>
      <Text2 weight="semibold" size="lg" color="primary" style={[t.pX3]}>
        Other Cash
      </Text2>
      {cashBalances.map((balance) => (
        <TokenListItem
          key={`${balance.chain}:${balance.address}`}
          token={tokenPositionToTokenLink(balance)}
          variant="balance"
          ownedAmount={balance.quantity.float}
          ownedValue={balance.value}
          green={t.colors.green450}
          hidePriceChange
        />
      ))}
    </View>
  );
}
