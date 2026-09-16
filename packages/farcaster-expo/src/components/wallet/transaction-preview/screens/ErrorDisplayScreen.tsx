import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiChain,
  ApiWalletActionErrorInsuficientFundsDetails,
  ApiWalletActionErrorType,
  chainIdToChain,
  chainIdToChainOrThrow,
  RELAY_SOLANA_CHAIN_ID,
} from 'farcaster-client-data';
import {
  formatTokenQuantity,
  tokenAnalyticsName,
  useFetchWalletPositions,
} from 'farcaster-client-hooks';
import { CopyIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, TouchableOpacity, View } from 'react-native';

import { ChainImage } from '../../../../components/crypto';
import { useSharedTelemetry, useTheme } from '../../../../contexts';
import { ConnectionContext } from '../../../../types';
import {
  formatAddress,
  isNativeAsset,
  NATIVE_ASSET_SYMBOLS,
} from '../../../../utils';
import { ButtonV2, Text2, TextPlaceholder } from '../../../design-system';
import { getEvmChainId, useCopyAddress } from '../utils';

type ErrorEthSendTransactionType =
  | ApiWalletActionErrorType
  | 'INSUFFICIENT_GAS'
  | 'UNKNOWN';

/**
 * Screen component for displaying various error states
 */
export function ErrorDisplayScreen({
  chain,
  type,
  connectionContext,
  message,
  details,
  onCancel,
  isCancelling,
}: {
  chain: ApiChain | undefined;
  type: ErrorEthSendTransactionType;
  connectionContext: ConnectionContext;
  message: string;
  details?: ApiWalletActionErrorInsuficientFundsDetails;
  onCancel: () => void;
  isCancelling?: boolean;
}) {
  const t = useTheme();
  const copyAddress = useCopyAddress();
  const fetchWalletPositions = useFetchWalletPositions();
  const [balance, setBalance] = useState<string | undefined>();
  const [symbol, setSymbol] = useState<string | undefined>();
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  let chainIdAsEip155: number | undefined;
  if (chain === 'solana') {
    chainIdAsEip155 = Number(RELAY_SOLANA_CHAIN_ID);
  } else if (chain) {
    chainIdAsEip155 = getEvmChainId(chain);
  }

  // Prefer NATIVE_ASSET_SYMBOLS over scan metadata (can be wrong, e.g. ETH on HyperEVM).
  const knownSymbol =
    details?.assetMetadata.assetType === 'NATIVE' && chain
      ? NATIVE_ASSET_SYMBOLS[chain]
      : details?.assetMetadata.symbol || undefined;
  const displaySymbol = knownSymbol ?? symbol;

  useEffect(() => {
    const getBalance = async () => {
      if (details?.currentBalance !== undefined) {
        setBalance(
          formatTokenQuantity({
            quantity: BigInt(details.currentBalance),
            decimals: details.assetMetadata.decimals ?? 18,
          }),
        );
        setSymbol(
          details.assetMetadata.assetType === 'NATIVE' && chain
            ? NATIVE_ASSET_SYMBOLS[chain]
            : details.assetMetadata.symbol === ''
              ? undefined
              : details.assetMetadata.symbol,
        );
        return;
      }

      setIsLoadingBalance(true);
      try {
        if (details?.address) {
          const positions = await fetchWalletPositions({
            address: details.address,
          });
          if (
            chainIdAsEip155 &&
            details?.assetMetadata.assetType === 'NATIVE'
          ) {
            const nativeSymbol = chain
              ? NATIVE_ASSET_SYMBOLS[chain]
              : undefined;
            const nativeBalance = positions.positions.find(
              (position) =>
                position.chain ===
                  chainIdToChainOrThrow(chainIdAsEip155.toString()) &&
                isNativeAsset(position.address),
            );
            setBalance(
              nativeBalance
                ? formatTokenQuantity({
                    quantity: BigInt(nativeBalance.quantity.int),
                    decimals: nativeBalance.decimals ?? 18,
                    price: nativeBalance.price,
                  })
                : undefined,
            );
            setSymbol(
              nativeSymbol ??
                (nativeBalance ? nativeBalance.symbol : 'Unknown'),
            );
          } else if (
            chainIdAsEip155 &&
            details?.assetMetadata.assetType === 'TOKEN'
          ) {
            const tokenBalance = positions.positions.find(
              (position) =>
                position.address === details?.assetMetadata.ca &&
                position.chain === chainIdToChain(chainIdAsEip155.toString()),
            );
            setBalance(
              tokenBalance
                ? formatTokenQuantity({
                    quantity: BigInt(tokenBalance?.quantity.int),
                    decimals: tokenBalance?.decimals ?? 18,
                    price: tokenBalance?.price,
                  })
                : undefined,
            );
            setSymbol(tokenBalance ? tokenBalance.symbol : 'Unknown');
          } else {
            setSymbol('Unknown');
          }
        }
      } finally {
        setIsLoadingBalance(false);
      }
    };

    void getBalance();
  }, [
    details?.currentBalance,
    details?.address,
    details?.assetMetadata.symbol,
    details?.assetMetadata.assetType,
    details?.assetMetadata.ca,
    details?.assetMetadata.decimals,
    fetchWalletPositions,
    chainIdAsEip155,
    chain,
  ]);

  const { trackEvent } = useSharedTelemetry();

  useEffect(() => {
    if (!chainIdAsEip155) {
      return;
    }
    const chainName = chainIdToChainOrThrow(chainIdAsEip155.toString());
    if (type === 'INSUFFICIENT_FUNDS') {
      trackEvent(AnalyticsEvent.TransactionPreviewInsufficientFunds, {
        action: 'frameTx',
        chain: chainName,
        connectionContext,
        domain: connectionContext.domain,
        version: 'v1',
        assetBeingSent: tokenAnalyticsName({
          symbol: details?.assetMetadata.symbol ?? 'N/A',
          chainId: chainIdAsEip155,
          address: details?.address ?? 'N/A',
        }),
      });
    } else if (type === 'INSUFFICIENT_GAS') {
      trackEvent(AnalyticsEvent.TransactionPreviewInsufficientFunds, {
        action: 'frameTx',
        chain: chainName,
        connectionContext,
        domain: connectionContext.domain,
        version: 'v1',
        assetBeingSent: tokenAnalyticsName({
          symbol: details?.assetMetadata.symbol ?? 'N/A',
          chainId: chainIdAsEip155,
          address: details?.address ?? 'N/A',
        }),
      });
    }
  }, [
    connectionContext,
    trackEvent,
    type,
    chainIdAsEip155,
    details?.address,
    details?.assetMetadata.symbol,
  ]);

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} nestedScrollEnabled>
      <View style={[t.flex1, t.flexCol, { gap: 12 }]}>
        {(type === 'INSUFFICIENT_FUNDS' || type === 'INSUFFICIENT_GAS') &&
          details && (
            <View style={[t.flex, t.flexCol]}>
              <View style={[t.flex, t.flexRow, t.justifyBetween]}>
                <Text2 style={[t.textSm, t.texts.tertiary]}>Your wallet</Text2>
                <Text2 style={[t.textSm, t.texts.tertiary]}>Balance</Text2>
              </View>
              <View style={[t.flex, t.flexRow, t.justifyBetween]}>
                <View style={[t.flex, t.flexRow, t.itemsCenter, t.gap1]}>
                  <ChainImage chain={chain} />
                  <Text2 style={[t.textBase, t.texts.primary]}>
                    {formatAddress(details.address)}
                  </Text2>
                  <TouchableOpacity
                    style={[t.roundedFull, t.bgMuted, { padding: 6 }]}
                    onPress={() => copyAddress(details.address)}
                  >
                    <CopyIcon size={10} color={t.colors.text.primary} />
                  </TouchableOpacity>
                </View>
                {isLoadingBalance ? (
                  <TextPlaceholder width={80} />
                ) : (
                  <Text2 style={[t.textBase, t.texts.primary]}>
                    {balance} {symbol}
                  </Text2>
                )}
              </View>
            </View>
          )}
        {message && (
          <View
            style={[
              t.flex,
              t.flexCol,
              t.p3,
              t.bgFaint,
              t.roundedLg,
              {
                backgroundColor: '#F43F5E1A',
                gap: 4,
              },
            ]}
          >
            <Text2 weight="semibold" size="base" color="danger">
              {type === 'INSUFFICIENT_FUNDS'
                ? 'Insufficient balance'
                : type === 'INSUFFICIENT_GAS'
                  ? 'Insufficient gas'
                  : type === 'BLOCK'
                    ? 'Transaction blocked'
                    : 'Transaction failure'}
            </Text2>
            <Text2 weight="medium" size="base" color="primary">
              {type === 'INSUFFICIENT_FUNDS'
                ? `You don't have enough ${displaySymbol ?? 'funds'} in your wallet for this transaction.`
                : type === 'INSUFFICIENT_GAS'
                  ? `You don't have enough ${displaySymbol ?? 'funds'} in your wallet to pay for gas fees.`
                  : type === 'BLOCK'
                    ? message
                    : 'The transaction submitted by the mini app would fail. Please contact its developer or try again.'}
            </Text2>
            {type !== 'INSUFFICIENT_FUNDS' &&
              type !== 'INSUFFICIENT_GAS' &&
              type !== 'BLOCK' && (
                <>
                  <Text2
                    size="sm"
                    weight="medium"
                    color="primary"
                    style={[t.mT4]}
                  >
                    Error message
                  </Text2>
                  <Text2 size="sm" color="primary">
                    {message}
                  </Text2>
                </>
              )}
          </View>
        )}
        <View
          style={[
            t.flex,
            t.flexRow,
            t.justifyBetween,
            { gap: 10 },
            Platform.OS === 'web' ? undefined : t.mB8,
          ]}
        >
          <View style={[t.flex1]}>
            {type === 'INSUFFICIENT_FUNDS' || type === 'INSUFFICIENT_GAS' ? (
              <ButtonV2
                variant="primary"
                title="Copy address to fund"
                onPress={() => {
                  copyAddress(details?.address ?? '');
                  onCancel();
                }}
                width="flex1"
              />
            ) : (
              <ButtonV2
                variant="secondary"
                title="Cancel"
                onPress={onCancel}
                width="flex1"
                disabled={isCancelling}
                loading={isCancelling}
              />
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
