import { AnalyticsEvent } from 'farcaster-analytics';
import {
  apiChainToViemChainOrThrow,
  ApiEthFungibleTokenPosition,
  ApiWalletSendTarget,
  chainIdToChainOrThrow,
  ETHER_DECIMALS,
  GASLESS_CHAINS,
} from 'farcaster-client-data';
import {
  formatTokenQuantity,
  tokenQuantityToFloat,
  usePrefetchWalletChainNativeAsset,
} from 'farcaster-client-hooks';
import { XCircleIcon } from 'lucide-react-native';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { zeroAddress } from 'viem';

import {
  useSharedNavigationContext,
  useSharedTelemetry,
  useTheme,
} from '../../../../contexts';
import { useExecuteSwapForGas, useHaptics } from '../../../../hooks';
import { useSafeFocusEffect } from '../../../../hooks/useSafeFocusEffect';
import { SendTargetWithAddress } from '../../../../types';
import { ButtonV2, Text2 } from '../../../design-system';
import { GaslessSwapMonitor } from '../../../wallet/SwapForGasMessage';
import { WalletScreenHeader } from '../../../wallet/WalletScreenHeader';
import { TokenIcon } from '../TokenIcon';
import { SendTokensEnterAmount } from './SendTokensEnterAmount';
import { SendTokensEnterAmountWeb } from './SendTokensEnterAmountWeb';
import { SendTokensMonitor } from './SendTokensMonitor';
import { EthTransactionData, useSendTokens } from './SendTokensProvider';
import { SendTokensReview } from './SendTokensReview';
import { SendTokensSelectTarget } from './SendTokensSelectTarget';
import { SendTokensSelectToken } from './SendTokensSelectToken';
import { SendTokensTargetHeader } from './SendTokensTargetHeader';

function useGaslessSwap(transactionData?: EthTransactionData) {
  const { getWalletClient, executeSend, sendToken, sendQuantity } =
    useSendTokens();

  const isNFT = sendToken && 'interface' in sendToken;

  const swapForGas = useExecuteSwapForGas({
    chainId: transactionData?.chain.id,
    swapIntent: {
      sellToken:
        sendToken && !isNFT && sendToken.address
          ? sendToken.address
          : zeroAddress,
      sellAmountBaseUnits: sendQuantity?.toString() ?? '0',
    },
    getWalletClient,
    applicationUsage: 'send',
    enabled:
      !isNFT &&
      transactionData &&
      GASLESS_CHAINS.includes(
        chainIdToChainOrThrow(transactionData.chain.id.toString()),
      ),
  });

  useEffect(() => {
    swapForGas.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionData?.chain]);

  // Handle success case after gasless swap
  const hasSentTransactionAfterGaslessSwap = useRef(false);
  useEffect(() => {
    if (hasSentTransactionAfterGaslessSwap.current) {
      return;
    }

    if (swapForGas.status.state === 'success') {
      hasSentTransactionAfterGaslessSwap.current = true;
      executeSend();
      swapForGas.reset();
    }
  }, [swapForGas, executeSend]);

  return swapForGas;
}

export function SendTokens() {
  const { triggerImpactAsync } = useHaptics();
  const { trackEvent } = useSharedTelemetry();
  const [query, setQuery] = useState('');
  const prefetchWalletChainNativeAsset = usePrefetchWalletChainNativeAsset();
  const {
    onError,
    txState,
    transactionData,
    sendTarget,
    sendToken,
    sendQuantity,
    setSendTarget,
    setSendToken,
    setSendQuantity,
  } = useSendTokens();

  const swapForGas = useGaslessSwap(
    transactionData?.protocol === 'ethereum' ? transactionData : undefined,
  );

  const [review, setReview] = useState(false);

  const isNFT = sendToken && 'interface' in sendToken;

  useEffect(() => {
    if (isNFT) {
      setSendQuantity(BigInt(1));
    }
  }, [isNFT, setSendQuantity]);

  useEffect(() => {
    return () => {
      if (onError && txState && txState !== 'pending') {
        onError('rejected_by_user');
      }
    };
  }, [onError, txState]);

  const selectTarget = useCallback(
    (target: SendTargetWithAddress) => {
      triggerImpactAsync();
      setSendTarget(target);
      setQuery('');
      if (isNFT) {
        setReview(true);
      }
    },
    [triggerImpactAsync, setSendTarget, isNFT, setReview],
  );

  const clearTarget = useCallback(() => {
    setSendTarget(undefined);
  }, [setSendTarget]);

  const selectToken = useCallback(
    (position: ApiEthFungibleTokenPosition) => {
      triggerImpactAsync();
      setSendToken(position);
      prefetchWalletChainNativeAsset({
        chainId: apiChainToViemChainOrThrow(position.chain).id,
      }).catch(() => {});
    },
    [prefetchWalletChainNativeAsset, triggerImpactAsync, setSendToken],
  );

  const clearToken = useCallback(() => {
    setSendToken(undefined);
  }, [setSendToken]);

  const selectQuantity = useCallback(
    (quantity: bigint) => {
      triggerImpactAsync();
      setReview(true);
      setSendQuantity(quantity);
    },
    [triggerImpactAsync, setSendQuantity, setReview],
  );

  const reviewBack = useCallback(() => {
    setReview(false);
  }, []);

  useSafeFocusEffect(
    useCallback(() => {
      trackEvent(AnalyticsEvent.ViewWalletSend, {});
    }, [trackEvent]),
  );

  if (txState && sendToken && sendTarget && sendQuantity) {
    const label = isNFT
      ? sendToken.name
      : `${formatTokenQuantity({
          quantity: sendQuantity,
          decimals: sendToken.decimals ?? ETHER_DECIMALS,
          price: sendToken.price,
        })} ${sendToken.symbol ?? sendToken.name ?? 'unknown'}`;

    return (
      <SendTokensMonitor
        target={sendTarget}
        txState={txState}
        tokenLabel={label}
        popCount={isNFT ? 2 : undefined}
      />
    );
  }

  if (swapForGas?.gaslessQuote) {
    if (swapForGas.status.state === 'loading') {
      return <GaslessSwapMonitor gaslessQuote={swapForGas.gaslessQuote} />;
    }
    if (swapForGas.status.state === 'error') {
      return (
        <GaslessSwapMonitor
          gaslessQuote={swapForGas.gaslessQuote}
          error={swapForGas.status.error}
        />
      );
    }
  }

  if (review && sendToken && sendTarget && sendQuantity && transactionData) {
    return (
      <SendTokensReview
        target={sendTarget}
        token={sendToken}
        quantity={sendQuantity}
        transactionData={transactionData}
        back={reviewBack}
        swapForGas={swapForGas}
      />
    );
  }

  if (isNFT) {
    return (
      <BuildCollectible
        query={query}
        setQuery={setQuery}
        sendTarget={sendTarget}
        clearTarget={clearTarget}
        selectTarget={selectTarget}
      />
    );
  }

  const BuildComponent = Platform.OS === 'web' ? BuildWeb : Build;

  return (
    <BuildComponent
      query={query}
      token={sendToken}
      target={sendTarget}
      setQuery={setQuery}
      clearToken={clearToken}
      clearTarget={clearTarget}
      selectToken={selectToken}
      selectQuantity={selectQuantity}
      selectTarget={selectTarget}
    />
  );
}

function Build({
  target,
  token,
  query,
  clearTarget,
  clearToken,
  setQuery,
  selectTarget,
  selectToken,
  selectQuantity,
}: {
  target?: ApiWalletSendTarget;
  token?: ApiEthFungibleTokenPosition;
  query: string;
  clearTarget: () => void;
  clearToken: () => void;
  setQuery: (q: string) => void;
  selectTarget: (target: SendTargetWithAddress) => void;
  selectToken: (token: ApiEthFungibleTokenPosition) => void;
  selectQuantity: (quantity: bigint) => void;
}) {
  const t = useTheme();
  const { sendIntent } = useSendTokens();
  const [quantity, setQuantity] = useState<bigint>(
    sendIntent?.amount ? BigInt(sendIntent.amount) : 0n,
  );

  const Component = useMemo(() => {
    if (!token) {
      return <SendTokensSelectToken selectToken={selectToken} />;
    }

    if (!target) {
      return (
        <KeyboardAvoidingView
          style={[t.flex1]}
          behavior="padding"
          keyboardVerticalOffset={100}
        >
          <View style={[t.mX3, t.pB3]}>
            <SendTokensTargetHeader
              query={query}
              setQuery={setQuery}
              selection={target}
              clear={clearTarget}
            />
          </View>
          <SendTokensSelectTarget
            selectTarget={selectTarget}
            query={query}
            protocol={token.chain === 'solana' ? 'solana' : 'ethereum'}
          />
        </KeyboardAvoidingView>
      );
    }

    return (
      <>
        <View style={[t.mX3, t.pB3]}>
          <SendTokensTargetHeader
            query={query}
            setQuery={setQuery}
            selection={target}
            clear={clearTarget}
          />
        </View>
        <SendTokensEnterAmount
          selectQuantity={selectQuantity}
          position={token}
          target={target}
          clear={clearToken}
          quantity={quantity}
          setQuantity={setQuantity}
        />
      </>
    );
  }, [
    clearToken,
    clearTarget,
    query,
    selectQuantity,
    selectTarget,
    selectToken,
    target,
    token,
    quantity,
    t.mX3,
    setQuery,
    t.flex1,
    t.pB3,
  ]);

  return (
    <View style={[t.flex1]}>
      <WalletScreenHeader title="Send" />
      <View style={[t.flex1]}>{Component}</View>
    </View>
  );
}

function BuildWeb({
  target,
  token,
  query,
  clearTarget,
  clearToken,
  setQuery,
  selectTarget,
  selectToken,
  selectQuantity,
}: {
  target?: ApiWalletSendTarget;
  token?: ApiEthFungibleTokenPosition;
  query: string;
  clearTarget: () => void;
  clearToken: () => void;
  setQuery: (q: string) => void;
  selectTarget: (target: SendTargetWithAddress) => void;
  selectToken: (token: ApiEthFungibleTokenPosition) => void;
  selectQuantity: (quantity: bigint) => void;
}) {
  const t = useTheme();
  const { goBack } = useSharedNavigationContext();
  const { onError } = useSendTokens();

  const handleBack = useCallback(() => {
    if (onError) {
      onError('rejected_by_user');
    }
    goBack();
  }, [goBack, onError]);

  const { sendIntent } = useSendTokens();
  const [quantity, setQuantity] = useState<bigint>(
    sendIntent?.amount ? BigInt(sendIntent.amount) : 0n,
  );
  const insufficientFunds = quantity > BigInt(token?.quantity.int ?? '0');
  const disabled = insufficientFunds || quantity === 0n;
  const buttonText = insufficientFunds
    ? 'Insufficient balance'
    : disabled
      ? 'Enter amount'
      : 'Review';

  return (
    <View style={[t.flex1]}>
      <WalletScreenHeader title="Send" onBackCallback={handleBack} />
      {token && (
        <View
          style={[
            t.m3,
            ...(!target ? [t.flex1, t.bgMuted, { borderRadius: 12 }] : []),
          ]}
        >
          <SendTokensTargetHeader
            query={query}
            setQuery={setQuery}
            selection={target}
            clear={clearTarget}
          />
          {!target && (
            <View style={[t.flex1, t.borderT, t.borderDefault]}>
              <SendTokensSelectTarget
                selectTarget={selectTarget}
                query={query}
                protocol={token.chain === 'solana' ? 'solana' : 'ethereum'}
              />
            </View>
          )}
        </View>
      )}
      <View
        style={[
          t.m3,
          { marginTop: 0 },
          t.bgMuted,
          { borderRadius: 12 },
          ...(!token ? [t.flex1] : []),
        ]}
      >
        {token && (
          <View
            style={[
              t.flexRow,
              t.itemsCenter,
              t.justifyBetween,
              t.pX4,
              t.pY3,
              t.bgMuted,
              {
                gap: 8,
                borderRadius: 12,
              },
            ]}
          >
            <View style={[t.flexRow, t.itemsCenter, { gap: 8 }]}>
              <TokenIcon
                iconUrl={token.iconUrl}
                diameter={48}
                chain={token.chain}
                symbol={token.symbol}
                features={token.features}
              />
              <View style={[t.flex1, t.justifyCenter]}>
                <Text2 weight="medium" numberOfLines={1}>
                  {token.name ?? token.symbol ?? '?'}
                </Text2>
                <Text2
                  size="sm"
                  color="secondary"
                  style={{ marginTop: 2 }}
                  numberOfLines={1}
                  ellipsizeMode="head"
                >
                  {`${tokenQuantityToFloat({
                    quantity: BigInt(token.quantity.int),
                    decimals: token.decimals ?? ETHER_DECIMALS,
                    price: token.price,
                  })} ${token.symbol ?? 'tokens'}`}
                </Text2>
              </View>
            </View>
            <Pressable onPress={clearToken}>
              <XCircleIcon size={24} color={t.colors.text.secondary} />
            </Pressable>
          </View>
        )}
        {!token && (
          <View style={[t.flex1, t.pT4]}>
            <SendTokensSelectToken selectToken={selectToken} />
          </View>
        )}
        {token && target && (
          <SendTokensEnterAmountWeb
            position={token}
            target={target}
            quantity={quantity}
            setQuantity={setQuantity}
          />
        )}
      </View>
      {token && target && (
        <View
          style={[t.p3, t.wFull, t.flex1, t.flexRow, t.itemsEnd, { gap: 8 }]}
        >
          <ButtonV2
            title="Cancel"
            onPress={handleBack}
            variant="secondary"
            width="flex1"
          />
          <ButtonV2
            title={buttonText}
            onPress={() => {
              selectQuantity(quantity);
            }}
            variant={insufficientFunds ? 'destructive' : undefined}
            disabled={disabled}
            width="flex1"
          />
        </View>
      )}
    </View>
  );
}

function BuildCollectible({
  query,
  setQuery,
  sendTarget,
  clearTarget,
  selectTarget,
}: {
  query: string;
  setQuery: (q: string) => void;
  sendTarget?: ApiWalletSendTarget;
  clearTarget: () => void;
  selectTarget: (target: SendTargetWithAddress) => void;
}) {
  const t = useTheme();

  return (
    <View style={[t.flex1]}>
      <WalletScreenHeader title="Send" />
      <View style={[t.mX3, t.mT3]}>
        <SendTokensTargetHeader
          query={query}
          setQuery={setQuery}
          selection={sendTarget}
          clear={clearTarget}
        />
      </View>
      <View style={[t.flex1]}>
        <SendTokensSelectTarget
          selectTarget={selectTarget}
          query={query}
          protocol="ethereum"
        />
      </View>
    </View>
  );
}
