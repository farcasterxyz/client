import { Image } from 'expo-image';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiChain,
  apiChainDisplayName,
  ApiEthFungibleTokenPosition,
  ApiEthNonFungibleToken,
  ApiSwapQuote,
  ApiWalletSendTarget,
  chainIdToChainOrThrow,
  ETHER_DECIMALS,
  formatDecimal,
  RELAY_SOLANA_CHAIN_ID,
} from 'farcaster-client-data';
import {
  formatTokenQuantity,
  resolveUsernameShort,
  tokenAnalyticsName,
  tokenQuantityToFloat,
  tokenQuantityToUsdFloat,
  useUserPreferences,
} from 'farcaster-client-hooks';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { Path, Svg } from 'react-native-svg';

import { hitSlop, largeTransactionUsd } from '../../../../constants';
import {
  useSharedNavigationContext,
  useSharedTelemetry,
  useTheme,
} from '../../../../contexts';
import {
  useAttemptBiometricAuth,
  useEstimateGasQuery,
  UseExecuteSwapForGasResults,
} from '../../../../hooks';
import { useOptionalSafeAreaInsets } from '../../../../hooks/useOptionalSafeAreaInsets';
import { formatAddress } from '../../../../utils';
import { Avatar } from '../../../Avatar';
import {
  ButtonV2,
  SkeletonPlaceholder,
  Text,
  Text2,
  TextInput,
} from '../../../design-system';
import { GaslessConversionText } from '../../../wallet/GaslessConversionText';
import { InsufficientFundsForGas } from '../../../wallet/InsufficientFundsForGas';
import { WalletScreenHeader } from '../../../wallet/WalletScreenHeader';
import { ChainImage } from '../../chains/ChainImage';
import {
  EthTransactionData,
  SolanaTransactionData,
  useSendTokens,
} from './SendTokensProvider';

export function SendTokensReview({
  target,
  token,
  quantity,
  transactionData,
  back,
  swapForGas,
}: {
  token: ApiEthFungibleTokenPosition | ApiEthNonFungibleToken;
  target: ApiWalletSendTarget;
  quantity: bigint;
  transactionData: EthTransactionData | SolanaTransactionData;
  back: () => void;
  swapForGas?: UseExecuteSwapForGasResults;
}) {
  const t = useTheme();
  const insets = useOptionalSafeAreaInsets();
  const { pop } = useSharedNavigationContext();
  const { trackEvent } = useSharedTelemetry();
  const { evmAddress, sendNote, setSendNote, executeSend } = useSendTokens();

  const {
    estimatedFee,
    estimatedFeeShortfall,
    estimatedFeeUsd,
    insufficientFunds,
    isPending,
    nativeAsset,
  } = useEstimateGasQuery(
    transactionData.protocol === 'ethereum'
      ? {
          account: evmAddress,
          chainId: transactionData.chain.id,
          to: transactionData.to,
          data: transactionData.data,
          value: transactionData.value,
        }
      : {
          enabled: false,
        },
  );

  const isNFT = 'interface' in token;

  const { data: prefsData } = useUserPreferences();
  const { biometricAuthLargeTransactions } = prefsData.result.preferences;

  const attemptBiometricAuth = useAttemptBiometricAuth();

  const canSwapForGas =
    swapForGas &&
    swapForGas.status.state === 'idle' &&
    !!swapForGas.gaslessQuote;
  const gaslessQuoteIsLoading =
    swapForGas &&
    swapForGas.status.state === 'loading' &&
    swapForGas.status.what === 'quote';
  const shouldSwapForGas =
    transactionData.protocol === 'ethereum' &&
    insufficientFunds &&
    canSwapForGas;
  const canSendUsingGas = !insufficientFunds;

  const buttonText = useMemo(() => {
    if (canSendUsingGas || shouldSwapForGas) {
      return 'Send';
    }
    if (swapForGas?.status.state === 'loading' || isPending) {
      return 'Loading';
    }
    return 'Insufficient gas';
  }, [shouldSwapForGas, swapForGas?.status, isPending, canSendUsingGas]);

  const isEnabled = useMemo(() => {
    // User has insufficient funds and gasless is loading a quote -> pause until quote is loaded
    if (insufficientFunds && gaslessQuoteIsLoading) {
      return false;
    }

    // Golden path: user has enough funds to pay for gas
    if (!isPending && !insufficientFunds) {
      return true;
    }

    // Gasless swap is available
    if (canSwapForGas) {
      return true;
    }

    // Otherwise, reject
    return false;
  }, [isPending, insufficientFunds, canSwapForGas, gaslessQuoteIsLoading]);

  const chainId =
    transactionData.protocol === 'ethereum'
      ? transactionData.chain.id
      : Number(RELAY_SOLANA_CHAIN_ID);

  const handlePress = useCallback(async () => {
    const usdValue = isNFT
      ? (token.usdPrice ?? 0)
      : tokenQuantityToUsdFloat({
          quantity,
          price: token.price ?? 0,
          decimals: token.decimals ?? ETHER_DECIMALS,
        });

    if (usdValue >= largeTransactionUsd && biometricAuthLargeTransactions) {
      const { success } = await attemptBiometricAuth();
      if (!success) {
        pop();
        return;
      }
    }

    if (shouldSwapForGas) {
      swapForGas.executeQuote();
      return;
    }

    if (insufficientFunds) {
      pop();
      return;
    }

    if (isNFT) {
      trackEvent(AnalyticsEvent.SendNftWalletTransaction, {
        chainId,
        target: target.type,
        token: tokenAnalyticsName({
          symbol: token.name,
          chainId,
          address: token.contractAddress,
        }),
        usdValue: token.usdPrice,
      });
    } else {
      trackEvent(AnalyticsEvent.SendWalletTransaction, {
        chainId,
        target: target.type,
        token: tokenAnalyticsName({
          symbol: token.symbol,
          chainId,
          address: token.address,
        }),
        usdValue: tokenQuantityToUsdFloat({
          quantity,
          decimals: token.decimals ?? ETHER_DECIMALS,
          price: token.price ?? 0,
          round: true,
        }),
      });
    }

    await executeSend();

    pop();
  }, [
    insufficientFunds,
    trackEvent,
    target.type,
    token,
    quantity,
    executeSend,
    swapForGas,
    pop,
    biometricAuthLargeTransactions,
    attemptBiometricAuth,
    shouldSwapForGas,
    isNFT,
    chainId,
  ]);

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      },
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding' })}
      keyboardVerticalOffset={32 + insets.bottom + 12}
      style={[t.flex1]}
    >
      <WalletScreenHeader title="Review" onBackCallback={back} />
      <ScrollView
        ref={scrollViewRef}
        style={[t.flex1]}
        contentContainerStyle={[
          t.p3,
          t.flexGrow,
          {
            paddingBottom: Platform.OS === 'web' ? undefined : insets.bottom,
          },
        ]}
      >
        <View style={[t.flex1, t.flexGrow, t.justifyBetween]}>
          <View style={[t.pY3, { gap: 12 }]}>
            <View style={[{ gap: 24 }]}>
              {isNFT ? (
                <NonFungibleTokenDetailsPanel data={token} />
              ) : (
                <FungibleTokenDetailsPanel token={token} quantity={quantity} />
              )}

              {/* Show banner when user has no funds and it's certin we cannot swap for gas */}
              {insufficientFunds &&
                !canSwapForGas &&
                !gaslessQuoteIsLoading &&
                transactionData.protocol === 'ethereum' && (
                  <InsufficientFundsForGas
                    fee={estimatedFee}
                    feeShortfall={estimatedFeeShortfall}
                    feeAsset={nativeAsset}
                    action="send"
                    assetBeingSent={
                      isNFT
                        ? token.name
                        : tokenAnalyticsName({
                            symbol: token.symbol,
                            chainId: transactionData.chain.id,
                            address: token.address,
                          })
                    }
                    chain={transactionData.chain}
                  />
                )}
              <DetailsPanel
                target={target}
                chain={chainIdToChainOrThrow(chainId.toString())}
                estimatedTxFeeValue={estimatedFeeUsd}
                gaslessQuote={
                  shouldSwapForGas
                    ? (swapForGas.gaslessQuote ?? undefined)
                    : undefined
                }
              />
            </View>
            <View style={[t.wFull, { gap: 8 }]}>
              <Text2 color="secondary">Send a direct message (optional)</Text2>
              <TextInput
                placeholder="e.g. For brunch on Sunday"
                style={[
                  t.textBase,
                  t.texts.primary,
                  t.bgTransparent,
                  t.p3,
                  t.bgSwap,
                  { borderRadius: 12 },
                ]}
                placeholderTextColor={t.colors.text.tertiary}
                value={sendNote}
                onChangeText={setSendNote}
              />
            </View>
          </View>
          <ButtonV2
            title={buttonText}
            textSize="lg"
            disabled={!isEnabled}
            onPress={handlePress}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FungibleTokenDetailsPanel({
  token,
  quantity,
}: {
  token: ApiEthFungibleTokenPosition;
  quantity: bigint;
}) {
  const t = useTheme();

  const usdValue = tokenQuantityToUsdFloat({
    quantity,
    price: token.price ?? 0,
    decimals: token.decimals ?? ETHER_DECIMALS,
  });

  const positionOfSend = {
    ...token,
    quantity: {
      float: tokenQuantityToFloat({
        quantity,
        price: token.price,
        decimals: token.decimals ?? ETHER_DECIMALS,
      }),
      int: quantity,
    },
    value: usdValue,
  };

  return (
    <>
      <View style={[t.justifyCenter, t.itemsCenter]}>
        <View
          style={[
            t.justifyCenter,
            t.itemsCenter,
            t.bgSwap,
            t.roundedFull,
            Platform.OS === 'web'
              ? { height: 64, width: 64 }
              : { height: 80, width: 80 },
          ]}
        >
          <Svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <Path
              d="M19.3814 28.9147C19.4321 29.0409 19.5201 29.1486 19.6338 29.2234C19.7474 29.2981 19.8812 29.3363 20.0172 29.3328C20.1532 29.3294 20.2848 29.2844 20.3945 29.2039C20.5042 29.1234 20.5866 29.0113 20.6307 28.8827L29.2974 3.54933C29.3401 3.43118 29.3482 3.30333 29.3209 3.18073C29.2935 3.05813 29.2319 2.94585 29.143 2.85703C29.0542 2.76821 28.9419 2.70652 28.8193 2.67918C28.6967 2.65184 28.5689 2.65999 28.4507 2.70266L3.1174 11.3693C2.98873 11.4135 2.87663 11.4959 2.79616 11.6056C2.71569 11.7152 2.67069 11.8469 2.66721 11.9829C2.66373 12.1189 2.70193 12.2526 2.77668 12.3663C2.85143 12.4799 2.95916 12.568 3.0854 12.6187L13.6587 16.8587C13.993 16.9925 14.2967 17.1926 14.5515 17.447C14.8063 17.7013 15.007 18.0047 15.1414 18.3387L19.3814 28.9147Z"
              stroke="#7C65C1"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M29.1387 2.86267L14.552 17.448"
              stroke="#7C65C1"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      </View>
      <TokenDenominatedInputDisabled
        symbol={positionOfSend.symbol!}
        inputVal={formatTokenQuantity({
          quantity: BigInt(positionOfSend.quantity.int),
          decimals: positionOfSend.decimals ?? ETHER_DECIMALS,
          price: positionOfSend.price,
        })}
        displayAmount={formatDecimal(positionOfSend.value!)}
      />
    </>
  );
}

function NonFungibleTokenDetailsPanel({
  data,
}: {
  data: ApiEthNonFungibleToken;
}) {
  const t = useTheme();

  return (
    <View
      style={[
        t.flex1,
        t.pT12,
        t.flexCol,
        t.justifyCenter,
        t.itemsCenter,
        { gap: 20 },
        t.relative,
      ]}
    >
      <View>
        <Image
          source={{ uri: data.imageUrl }}
          style={[
            t.roundedLg,
            t.overflowHidden,
            {
              width: 80,
              height: 80,
              backgroundColor: t.colors.bgFaint,
            },
          ]}
          contentFit="cover"
        />
        <View
          style={[
            t.justifyCenter,
            t.itemsCenter,
            t.bgActionPrimary,
            t.roundedFull,
            t.border2,
            t.borderBackground,
            { height: 32, width: 32 },
            t.absolute,
            { bottom: -6, right: -6 },
          ]}
        >
          <Svg width="17" height="16" viewBox="0 0 17 16" fill="none">
            <Path
              d="M4.10795 8.00471C4.10777 7.80218 4.06657 7.60178 3.98685 7.4156L1.46766 1.52335C1.4376 1.45299 1.42977 1.37511 1.44525 1.30017C1.46072 1.22523 1.49874 1.15682 1.55422 1.10411C1.60969 1.05141 1.67996 1.01694 1.75559 1.00532C1.83123 0.993707 1.9086 1.00551 1.97733 1.03914L15.5014 7.66858C15.5654 7.6986 15.6195 7.74621 15.6573 7.80585C15.6952 7.86549 15.7154 7.93469 15.7154 8.00535C15.7154 8.07601 15.6952 8.14521 15.6573 8.20485C15.6195 8.26449 15.5654 8.31211 15.5014 8.34213L1.97733 14.9716C1.9086 15.0052 1.83123 15.017 1.75559 15.0054C1.67996 14.9938 1.60969 14.9593 1.55422 14.9066C1.49874 14.8539 1.46072 14.7855 1.44525 14.7105C1.42978 14.6356 1.4376 14.5577 1.46766 14.4874L3.98791 8.59405C4.0673 8.40772 4.10813 8.20725 4.10795 8.00471ZM4.10795 8.00471L15.7114 8.00589"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      </View>
      <Text2 size="3xl" weight="semibold" numberOfLines={1}>
        {data.name}
      </Text2>
    </View>
  );
}

function DetailsPanel({
  target,
  chain,
  estimatedTxFeeValue,
  gaslessQuote,
}: {
  target: ApiWalletSendTarget;
  chain: ApiChain;
  estimatedTxFeeValue: number | undefined;
  gaslessQuote?: ApiSwapQuote;
}) {
  const t = useTheme();

  return (
    <View>
      <View style={[t.flex, t.flexCol, t.bgSwap, { borderRadius: 12 }]}>
        <View
          style={[
            t.flexRow,
            t.itemsCenter,
            t.justifyBetween,
            t.pX4,
            t.pY3,
            t.borderB,
            { borderColor: t.colors.bgDefault },
          ]}
        >
          <Text2 color="secondary" size="base" weight="regular">
            To
          </Text2>
          <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
            {target.type === 'user' &&
              typeof target.user.pfp !== 'undefined' && (
                <Avatar
                  pfpUrl={target.user.pfp.url}
                  diameter={20}
                  blockAnimated={true}
                />
              )}
            <Text2 size="base" weight="regular">
              {target.type === 'user'
                ? resolveUsernameShort({
                    username: target.user.username,
                    fid: target.user.fid,
                  })
                : formatAddress(target.address)}
            </Text2>
          </View>
        </View>
        <View
          style={[
            t.flexRow,
            t.itemsCenter,
            t.justifyBetween,
            t.pX4,
            t.pY3,
            t.borderB,
            { borderColor: t.colors.bgDefault },
          ]}
        >
          <Text2 color="secondary" size="base" weight="regular">
            Chain
          </Text2>
          <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
            <ChainImage chain={chain} />
            <Text2 size="base" weight="regular">
              {apiChainDisplayName(chain)}
            </Text2>
          </View>
        </View>
        {chain !== 'solana' && (
          <View
            style={[t.flexRow, t.itemsCenter, t.justifyBetween, t.pX4, t.pY3]}
          >
            <Text2 color="secondary" size="base" weight="regular">
              Fees
            </Text2>
            <View style={[t.flexRow, t.itemsCenter]}>
              {estimatedTxFeeValue !== undefined ? (
                <Text2 size="base" weight="regular">
                  {formatDecimal(estimatedTxFeeValue)}
                </Text2>
              ) : (
                <SkeletonPlaceholder
                  style={{ height: 16, width: 54, borderRadius: 16 }}
                />
              )}
            </View>
          </View>
        )}
      </View>
      <View
        style={[
          t.flex,
          t.p3,
          t.itemsStart,
          t.justifyStart,
          gaslessQuote ? { minHeight: 52 } : { minHeight: 16 },
        ]}
      >
        {gaslessQuote && <GaslessConversionText gaslessQuote={gaslessQuote} />}
      </View>
    </View>
  );
}

function TokenDenominatedInputDisabled({
  symbol,
  inputVal,
  displayAmount,
}: {
  symbol: string;
  inputVal: string;
  displayAmount: string;
}) {
  const t = useTheme();

  return (
    <View style={[{ gap: 8 }, t.itemsCenter]}>
      <Text
        style={[t.flex, t.flexRow, t.itemsCenter, { gap: 4 }]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        <Text2
          size="4xl"
          weight="semibold"
          color={inputVal !== '0' ? 'primary' : 'tertiary'}
        >
          {inputVal}{' '}
        </Text2>
        <Text2 size="4xl" weight="semibold">
          {symbol}
        </Text2>
      </Text>
      <View style={[t.flexRow, t.itemsCenter, { gap: 8 }]} hitSlop={hitSlop}>
        <Text2
          align="center"
          color="secondary"
          numberOfLines={1}
          ellipsizeMode="tail"
          size="lg"
        >
          {displayAmount}
        </Text2>
      </View>
    </View>
  );
}
