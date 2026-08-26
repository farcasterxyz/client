import {
  ApiSwapPrice,
  ApiSwapQuote,
  ApiSwapRoute,
  ApiSwapToken,
} from 'farcaster-client-data';
import { useMemo } from 'react';
import { formatUnits } from 'viem';

import { isNativeAsset } from '../utils';
import { useWalletBalances } from './useWalletBalances';

export function parseTokenAmountSwap(token: ApiSwapToken, amount?: string) {
  if (!amount) {
    return 0;
  }
  const decimals = token.decimals ?? 18;
  return parseFloat(formatUnits(BigInt(amount), decimals));
}

function formatRoute(route?: ApiSwapRoute): string {
  switch (route) {
    case '0x-permit2':
    case '0x-gasless':
      return '0x';
    case 'relay':
      return 'Relay';
    default:
      return 'Unknown';
  }
}

export function useSwapCalculations({
  swap,
}: {
  swap: ApiSwapPrice | ApiSwapQuote;
}) {
  const { balances } = useWalletBalances();

  // Native Solana price isn't always returned from the API
  const nativeSolana = balances?.find(
    (b) => b.chain === 'solana' && isNativeAsset(b.address),
  );

  // Native Hype price isn't always returned from the API
  const nativeHype = balances?.find(
    (b) => b.chain === 'hyperevm' && isNativeAsset(b.address),
  );

  const nativeBnb = balances?.find(
    (b) => b.chain === 'bsc' && isNativeAsset(b.address),
  );

  const priceData = swap.price;

  const sellPrice = useMemo(() => {
    if (priceData.sell.token.price) {
      return priceData.sell.token.price;
    }

    const balance = balances?.find((b) => {
      if (b.chain !== priceData.sell.token.chain) {
        return false;
      }
      if (
        isNativeAsset(b.address) &&
        isNativeAsset(priceData.sell.token.address)
      ) {
        return true;
      }

      return (
        b.address?.toLowerCase() === priceData.sell.token.address?.toLowerCase()
      );
    });
    return balance?.price;
  }, [priceData, balances]);

  const sellQuantity = useMemo(() => {
    return parseTokenAmountSwap(priceData.sell.token, priceData.sell.amount);
  }, [priceData]);

  const sellValue = useMemo(() => {
    return sellQuantity * (sellPrice ?? 0);
  }, [sellQuantity, sellPrice]);

  const buyQuantity = useMemo(() => {
    return parseTokenAmountSwap(priceData.buy.token, priceData.buy.amount);
  }, [priceData]);

  const buyValue = useMemo(() => {
    const value = buyQuantity * (priceData.buy.token.price ?? 0);
    if (!value && priceData.buy.value) {
      return priceData.buy.value / 100;
    }
    return value;
  }, [buyQuantity, priceData]);

  const route = useMemo(() => {
    return formatRoute(swap.route);
  }, [swap]);

  const priceImpactPct = useMemo(() => {
    const buyTokenUsdPrice = priceData.buy.token.price ?? 0;
    const sellTokenUsdPrice = priceData.sell.token.price ?? 0;

    if (!buyTokenUsdPrice || !sellTokenUsdPrice || !sellQuantity) {
      return undefined;
    }

    const executionPrice = buyQuantity / sellQuantity;
    const midPrice = sellTokenUsdPrice / buyTokenUsdPrice;

    const impact = (1 - executionPrice / midPrice) * 100;
    return Number.isFinite(impact) ? impact : undefined;
  }, [buyQuantity, sellQuantity, priceData]);

  const slippagePct = useMemo(() => {
    const { buy } = priceData;
    if (!buy.minAmount) {
      return undefined;
    }
    const quotedQty = parseTokenAmountSwap(buy.token, buy.amount);
    const minQty = parseTokenAmountSwap(buy.token, buy.minAmount);
    if (quotedQty <= 0) {
      return undefined;
    }
    const slip = ((quotedQty - minQty) / quotedQty) * 100;
    return Number.isFinite(slip) ? slip : undefined;
  }, [priceData]);

  const estimatedTime = useMemo(() => {
    const chain = priceData.sell.token.chain;

    switch (chain) {
      case 'base':
      case 'arbitrum':
      case 'optimism':
      case 'zora':
      case 'polygon':
      case 'degen':
      case 'unichain':
        return 2;
      case 'gnosis':
        return 5;
      case 'ethereum':
      default:
        return 12;
    }
  }, [priceData]);

  const fees = useMemo(() => {
    const swapFees = priceData.fees;
    if (!swapFees) {
      return undefined;
    }

    const { app, service, gas, relayGas } = swapFees;
    const items = [app, service, gas, relayGas].filter((i) => i !== undefined);
    return items.reduce((acc, feeItem) => {
      let price = feeItem.token.price;
      if (feeItem.token.chain === 'solana' && nativeSolana) {
        price = nativeSolana.price;
      }

      if (feeItem.token.chain === 'hyperevm' && nativeHype) {
        price = nativeHype.price;
      }

      if (feeItem.token.chain === 'bsc' && nativeBnb) {
        price = nativeBnb.price;
      }

      if (!price) {
        return acc;
      }

      const feeAmount = parseTokenAmountSwap(feeItem.token, feeItem.amount);
      return acc + price * feeAmount;
    }, 0);
  }, [priceData, nativeSolana, nativeHype, nativeBnb]);

  return {
    sellQuantity,
    buyQuantity,
    sellValue,
    buyValue,
    route,
    priceImpactPct,
    slippagePct,
    estimatedTime,
    fees,
  };
}
