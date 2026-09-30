import { AnalyticsEvent } from 'farcaster-analytics';
import {
  apiChainToChainIdOrThrow,
  ApiEthFungibleTokenPosition,
  ApiWalletSendTarget,
  ETHER_DECIMALS,
  formatDecimal,
} from 'farcaster-client-data';
import {
  tokenQuantityPercentage,
  tokenQuantityToFloat,
  tokenQuantityToUsdFloat,
  usdFloatToTokenQuantity,
} from 'farcaster-client-hooks';
import { Repeat } from 'lucide-react-native';
import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { Pressable, TouchableOpacity, View } from 'react-native';
import { formatUnits, parseUnits } from 'viem';

import { hitSlop } from '../../../../constants';
import {
  useRootToast,
  useSharedTelemetry,
  useTheme,
} from '../../../../contexts';
import {
  useDummySolanaTransactionForFeeEstimate,
  useHaptics,
  useOptionalSafeAreaInsets,
  useSolanaMinBalance,
  useUnifiedFeeEstimate,
} from '../../../../hooks';
import { isNativeAsset } from '../../../../utils';
import { TokenIcon } from '../../../crypto/tokens/TokenIcon';
import { ButtonV2, Text, Text2 } from '../../../design-system';
import { formatNumPadValue, NumPad } from '../../../NumPadInput';
import { useSendTokens } from './SendTokensProvider';

const USDC_ADDRESS = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';

export function SendTokensEnterAmount({
  position,
  target,
  selectQuantity,
  clear,
  quantity,
  setQuantity,
}: {
  position: ApiEthFungibleTokenPosition;
  target: ApiWalletSendTarget;
  selectQuantity: (quantity: bigint) => void;
  clear: () => void;
  quantity: bigint;
  setQuantity: Dispatch<SetStateAction<bigint>>;
}) {
  const t = useTheme();
  const insets = useOptionalSafeAreaInsets();
  const toast = useRootToast();
  const { trackError } = useSharedTelemetry();
  const [inputValue, setInputValue] = useState(
    formatUnits(quantity, position.decimals ?? ETHER_DECIMALS),
  );
  const [denomination, setDenomination] = useState<'token' | 'usd'>(
    position?.price ? 'usd' : 'token',
  );

  const tokenQuantityFloat = tokenQuantityToFloat({
    quantity,
    decimals: position.decimals ?? ETHER_DECIMALS,
    price: position.price,
  });

  const usdValueFloat = tokenQuantityToUsdFloat({
    quantity,
    decimals: position.decimals ?? ETHER_DECIMALS,
    price: position.price ?? 0,
    isStablecoin: position.address?.toLowerCase() === USDC_ADDRESS,
  });

  const switchToUsd = useCallback(() => {
    if (position.price === undefined) {
      toast.show('Target token price not available', { type: 'danger' });
      trackError(new Error('USD not supported without price'));
      return;
    }

    setInputValue(
      tokenQuantityToUsdFloat({
        quantity,
        price: position.price,
        decimals: position.decimals ?? ETHER_DECIMALS,
        round: true,
        isStablecoin: position.address?.toLowerCase() === USDC_ADDRESS,
      }).toString(),
    );
    setDenomination('usd');
  }, [
    position.decimals,
    position.price,
    quantity,
    position.address,
    toast,
    trackError,
  ]);

  const switchToToken = useCallback(() => {
    if (position.price === undefined) {
      toast.show('Target token price not available', {
        type: 'danger',
      });
      trackError(new Error('switchToToken not supported without price'));
      return;
    }

    setDenomination('token');
    setInputValue(
      tokenQuantityToFloat({
        quantity,
        price: position.price,
        decimals: position.decimals ?? ETHER_DECIMALS,
      }).toString(),
    );
  }, [position.decimals, position.price, quantity, toast, trackError]);

  const maxDecimals = (() => {
    switch (denomination) {
      case 'token':
        return position.decimals ?? 18;
      case 'usd':
        return 2;
    }
  })();

  const insufficientFunds = quantity > BigInt(position.quantity.int);
  const disabled = insufficientFunds || quantity === 0n;
  const buttonText = insufficientFunds
    ? 'Insufficient balance'
    : disabled
      ? 'Enter amount'
      : 'Review';

  const Available = useMemo(() => {
    switch (denomination) {
      case 'usd':
        return formatDecimal(
          tokenQuantityToUsdFloat({
            quantity: BigInt(position.quantity.int),
            decimals: position.decimals ?? ETHER_DECIMALS,
            price: position.price ?? 0,
            isStablecoin: position.address?.toLowerCase() === USDC_ADDRESS,
          }),
        );
      case 'token':
        return `${tokenQuantityToFloat({
          quantity: BigInt(position.quantity.int),
          decimals: position.decimals ?? ETHER_DECIMALS,
          price: position.price,
        })} ${position.symbol ?? 'tokens'}`;
    }
  }, [
    denomination,
    position.decimals,
    position.price,
    position.quantity.int,
    position.symbol,
    position.address,
  ]);

  const Input = useMemo(() => {
    switch (denomination) {
      case 'usd':
        return (
          <UsdDenominatedInput
            switchDenomination={switchToToken}
            inputVal={formatNumPadValue(inputValue)}
            tokens={tokenQuantityFloat}
            symbol={position.symbol ?? position.name ?? 'tokens'}
          />
        );
      case 'token':
        return (
          <TokenDenominatedInput
            switchDenomination={switchToUsd}
            inputVal={formatNumPadValue(inputValue)}
            usdVal={usdValueFloat}
            symbol={position.symbol ?? position.name ?? 'tokens'}
          />
        );
    }
  }, [
    denomination,
    inputValue,
    position.name,
    position.symbol,
    switchToToken,
    switchToUsd,
    tokenQuantityFloat,
    usdValueFloat,
  ]);

  const updateValuePerDenominator = React.useCallback(
    ({ val }: { val: string }) => {
      setInputValue(val);

      const valNum = isNaN(parseFloat(val)) ? 0 : parseFloat(val);
      if (denomination === 'token') {
        setQuantity(parseUnits(val, position.decimals ?? ETHER_DECIMALS));
      } else {
        if (position.price === undefined) {
          // usd denomation not supported
          return;
        }

        setQuantity(
          usdFloatToTokenQuantity({
            value: valNum,
            price: position.price,
            decimals: position.decimals ?? ETHER_DECIMALS,
          }),
        );
      }
    },
    [denomination, position.decimals, position.price, setQuantity],
  );

  return (
    <View style={[t.flex1]}>
      <View
        style={[t.flex1, t.justifyCenter, t.itemsCenter, t.p3, { gap: 12 }]}
      >
        {Input}
        <Text2
          color="danger"
          weight="regular"
          size="sm"
          style={[t.h6, t.itemsCenter, t.justifyCenter]}
        >
          {insufficientFunds ? `Insufficient balance` : ''}
        </Text2>
      </View>
      <View style={[t.pY3, t.pT0, { paddingBottom: insets.bottom }]}>
        <View
          style={[t.borderDefault, t.borderTHairline, t.borderBHairline, t.mB3]}
        >
          <Pressable
            style={[t.p3, t.flexRow, t.itemsCenter, { gap: 8 }]}
            onPress={clear}
          >
            <TokenIcon
              iconUrl={position.iconUrl}
              diameter={48}
              chain={position.chain}
              symbol={position.symbol}
              features={position.features}
            />
            <View style={[t.flex1, t.justifyCenter]}>
              <Text2 weight="medium" numberOfLines={1}>
                {position.name ?? position.symbol ?? '?'}
              </Text2>
              <Text2
                size="sm"
                color="secondary"
                style={{ marginTop: 2 }}
                numberOfLines={1}
                ellipsizeMode="head"
              >
                {Available} available
              </Text2>
            </View>
            <QuickSendSelectors
              position={position}
              target={target}
              denomination={denomination}
              setQuantity={setQuantity}
              setInputValue={setInputValue}
            />
          </Pressable>
        </View>
        <NumPad
          value={inputValue}
          maxDecimals={maxDecimals}
          onChange={(val) => {
            updateValuePerDenominator({ val });
          }}
        />
        <View style={[t.pX3, t.pT3]}>
          <ButtonV2
            title={buttonText}
            onPress={() => {
              selectQuantity(quantity);
            }}
            variant={insufficientFunds ? 'destructive' : undefined}
            textSize="lg"
            disabled={disabled}
          />
        </View>
      </View>
    </View>
  );
}

export function TokenDenominatedInput({
  switchDenomination,
  symbol,
  inputVal,
  usdVal,
}: {
  switchDenomination: () => void;
  symbol: string;
  inputVal: string;
  usdVal: number;
}) {
  const t = useTheme();
  const displayAmount = formatDecimal(usdVal);

  return (
    <View style={[{ gap: 8 }, t.itemsCenter]}>
      <Text
        style={[t.flex, t.flexRow, t.itemsCenter, { gap: 4 }]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        <Text2
          size="6xl"
          weight="semibold"
          color={inputVal !== '0' ? 'primary' : 'tertiary'}
        >
          {inputVal}{' '}
        </Text2>
        <Text2 size="6xl" weight="semibold">
          {symbol}
        </Text2>
      </Text>
      <Pressable
        style={[t.flexRow, t.itemsCenter, { gap: 8 }]}
        hitSlop={hitSlop}
        onPress={switchDenomination}
      >
        <Text2
          align="center"
          color="secondary"
          numberOfLines={1}
          ellipsizeMode="tail"
          size="lg"
        >
          {displayAmount}
        </Text2>
        <DenominationToggleIcon />
      </Pressable>
    </View>
  );
}

export function UsdDenominatedInput({
  switchDenomination,
  symbol,
  inputVal,
  tokens,
}: {
  switchDenomination: () => void;
  symbol: string;
  inputVal: string;
  tokens: number;
}) {
  const t = useTheme();
  const displayAmount = tokens;

  return (
    <View style={[{ gap: 8 }, t.itemsCenter]}>
      <Text
        style={[t.flex, t.flexRow, t.itemsCenter, { gap: 4 }]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        <Text2 size="6xl" weight="semibold">
          $
        </Text2>
        <Text2
          size="6xl"
          weight="semibold"
          ellipsizeMode="tail"
          color={inputVal !== '0' ? 'primary' : 'tertiary'}
        >
          {inputVal}
        </Text2>
      </Text>
      <Pressable
        style={[t.flexRow, t.itemsCenter, { gap: 8 }]}
        hitSlop={hitSlop}
        onPress={switchDenomination}
      >
        <Text2
          numberOfLines={1}
          ellipsizeMode="tail"
          color="secondary"
          align="center"
          size="lg"
        >
          {displayAmount} {symbol}
        </Text2>
        <DenominationToggleIcon />
      </Pressable>
    </View>
  );
}

function DenominationToggleIcon() {
  const t = useTheme();

  return (
    <View
      style={[
        t.bgFaint,
        t.roundedFull,
        t.p1,
        { transform: [{ rotate: '90deg' }] },
      ]}
    >
      <Repeat size={10} color={t.colors.text.primary} />
    </View>
  );
}

function QuickSendSelectors({
  position,
  target,
  denomination,
  setQuantity,
  setInputValue,
}: {
  position: ApiEthFungibleTokenPosition;
  target: ApiWalletSendTarget;
  denomination: 'token' | 'usd';
  setQuantity: React.Dispatch<React.SetStateAction<bigint>>;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
}) {
  const t = useTheme();

  const { trackEvent } = useSharedTelemetry();

  const { triggerImpactAsync } = useHaptics();
  const { evmAddress, solanaAddress } = useSendTokens();

  const chainId = useMemo(
    () => Number(apiChainToChainIdOrThrow(position.chain)),
    [position.chain],
  );

  const dummySolanaTransaction = useDummySolanaTransactionForFeeEstimate({
    enabled: position.chain === 'solana',
    toAddress: target.address,
    fromAddress: solanaAddress,
  });
  const dummyTransactionForFeeEstimate = useMemo(() => {
    if (position.chain === 'solana') {
      if (!dummySolanaTransaction) {
        return { protocol: 'solana' as const, params: { enabled: false } };
      }
      return {
        protocol: 'solana' as const,
        params: { transaction: dummySolanaTransaction },
      };
    }
    return {
      protocol: 'evm' as const,
      params: {
        account: evmAddress,
        chainId,
        to: target.address as `0x${string}`,
        data: undefined,
        value: BigInt(1),
      },
    };
  }, [
    position.chain,
    dummySolanaTransaction,
    target.address,
    evmAddress,
    chainId,
  ]);
  const { estimatedFee } = useUnifiedFeeEstimate(
    dummyTransactionForFeeEstimate,
  );

  const solanaMinBalance = useSolanaMinBalance({
    enabled: position.chain === 'solana',
  });

  const nativeAsset = isNativeAsset(position.address);

  const onSelectPct = React.useCallback(
    ({ pct }: { pct: number }) => {
      triggerImpactAsync();
      trackEvent(AnalyticsEvent.PressQuickSwapSelectorPct, { pct });

      const decimals = position.decimals || 6;

      let quantity = tokenQuantityPercentage({
        percentage: pct,
        decimals,
        quantity: BigInt(position.quantity.int),
        price: position.price,
      });

      if (isNativeAsset(position.address)) {
        if (estimatedFee && nativeAsset) {
          const estimatedFeeWithBuffer =
            (estimatedFee * BigInt(110)) / BigInt(100);
          quantity -= estimatedFeeWithBuffer;
        }
        if (position.chain === 'solana') {
          quantity -= solanaMinBalance;
        }
        if (quantity < 0) {
          quantity = 0n;
        }
      }

      setInputValue(() => {
        switch (denomination) {
          case 'token':
            return tokenQuantityToFloat({
              quantity: quantity,
              price: position.price,
              decimals: position.decimals ?? ETHER_DECIMALS,
            }).toString();
          case 'usd':
            if (position.price === undefined) {
              return '0';
            }

            return tokenQuantityToUsdFloat({
              quantity: quantity,
              price: position.price,
              decimals: position.decimals ?? ETHER_DECIMALS,
              round: true,
              isStablecoin: position.address?.toLowerCase() === USDC_ADDRESS,
            }).toString();
        }
      });

      setQuantity(quantity);
    },
    [
      denomination,
      position.chain,
      position.decimals,
      position.price,
      position.quantity.int,
      setInputValue,
      setQuantity,
      trackEvent,
      triggerImpactAsync,
      estimatedFee,
      position.address,
      nativeAsset,
      solanaMinBalance,
    ],
  );

  return (
    <TouchableOpacity
      style={[
        t.flexRow,
        t.justifyCenter,
        t.itemsCenter,
        t.bgSwap,
        t.roundedFull,
        t.pY2,
        t.pX5,
      ]}
      onPress={() => onSelectPct({ pct: 100 })}
      activeOpacity={0.75}
    >
      <Text2 weight="semibold">Max</Text2>
    </TouchableOpacity>
  );
}
