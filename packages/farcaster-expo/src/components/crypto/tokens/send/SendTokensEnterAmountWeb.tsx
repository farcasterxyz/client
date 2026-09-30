import { AnalyticsEvent } from 'farcaster-analytics';
import {
  apiChainToChainIdOrThrow,
  ApiEthFungibleTokenPosition,
  ApiWalletSendTarget,
  ETHER_DECIMALS,
} from 'farcaster-client-data';
import {
  tokenQuantityPercentage,
  tokenQuantityToFloat,
  tokenQuantityToUsdFloat,
  usdFloatToTokenQuantity,
} from 'farcaster-client-hooks';
import { ArrowUpDown } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
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
  useSolanaMinBalance,
  useUnifiedFeeEstimate,
} from '../../../../hooks';
import { assertHex, isNativeAsset } from '../../../../utils';
import { Text2, TextInput } from '../../../design-system';
import { useSendTokens } from './SendTokensProvider';

const USDC_ADDRESS = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';

export function SendTokensEnterAmountWeb({
  position,
  target,
  quantity,
  setQuantity,
}: {
  position: ApiEthFungibleTokenPosition;
  target: ApiWalletSendTarget;
  quantity: bigint;
  setQuantity: React.Dispatch<React.SetStateAction<bigint>>;
}) {
  const t = useTheme();
  const toast = useRootToast();
  const { trackError } = useSharedTelemetry();
  const [inputValue, setInputValue] = useState(
    quantity === 0n
      ? ''
      : formatUnits(quantity, position.decimals ?? ETHER_DECIMALS),
  );
  const [denomination, setDenomination] = useState<'token' | 'usd'>('token');

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

  const toggleDenomination = useCallback(() => {
    if (denomination === 'usd') {
      switchToToken();
    } else {
      switchToUsd();
    }
  }, [denomination, switchToToken, switchToUsd]);

  const handleInputChange = useCallback(
    (val: string) => {
      if (val && (Number.isNaN(parseFloat(val)) || !/^\d*\.?\d*$/.test(val))) {
        return;
      }
      setInputValue(val);

      if (!val) {
        setQuantity(0n);
        return;
      }

      const valNum = parseFloat(val);
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
    <View style={[t.wFull, t.p3, { gap: 12 }]}>
      <View
        style={[
          t.flex,
          t.flexRow,
          t.border,
          t.borderDefault,
          t.p3,
          t.itemsCenter,
          t.justifyBetween,
          { borderRadius: 12, gap: 100 },
        ]}
      >
        <View style={[t.flexGrow, t.flexShrink]}>
          <TextInput
            style={[t.textLg, t.fontMedium, t.texts.primary, t.p1]}
            placeholder="0"
            placeholderTextColor={t.colors.text.tertiary}
            value={inputValue}
            onChangeText={handleInputChange}
          />
        </View>
        <View
          style={[t.flex1, t.flexRow, t.itemsCenter, t.justifyEnd, { gap: 8 }]}
        >
          <Text2 size="lg" weight="medium" color="tertiary">
            {denomination === 'usd' ? 'USD' : position.symbol}
          </Text2>
          <QuickSendSelectors
            position={position}
            target={target}
            denomination={denomination}
            setQuantity={setQuantity}
            setInputValue={setInputValue}
          />
        </View>
      </View>
      <View
        style={[
          t.flex,
          t.flexRow,
          t.itemsCenter,
          t.justifyBetween,
          { userSelect: 'none' },
        ]}
      >
        <Text2 size="xs" weight="medium">
          {denomination === 'usd'
            ? `${tokenQuantityFloat} ${position.symbol}`
            : `$${usdValueFloat.toFixed(2)}`}
        </Text2>
        <Pressable
          style={[t.flexRow, t.itemsCenter, { gap: 4 }]}
          hitSlop={hitSlop}
          onPress={toggleDenomination}
        >
          <ArrowUpDown
            size={14}
            color={t.colors.text.tertiary}
            strokeWidth={2.25}
          />
          <Text2 color="tertiary" size="xs" weight="medium">
            {denomination === 'usd'
              ? `Switch to ${position.symbol}`
              : `Switch to USD`}
          </Text2>
        </Pressable>
      </View>
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
        account: assertHex(evmAddress!),
        chainId,
        to: assertHex(target.address),
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
    ata: false,
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
        t.bgMuted,
        t.roundedLg,
        t.pY1,
        t.pX3,
        t.borderHairline,
        t.borderDefault,
      ]}
      onPress={() => onSelectPct({ pct: 100 })}
      activeOpacity={0.75}
    >
      <Text2 weight="semibold" size="sm">
        Max
      </Text2>
    </TouchableOpacity>
  );
}
