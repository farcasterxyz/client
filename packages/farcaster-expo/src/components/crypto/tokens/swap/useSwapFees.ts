import { ApiOnchainSwapFees } from 'farcaster-client-data';
import { useMemo } from 'react';

export function useSwapFees({
  fees,
  isPro,
  isNoFeeAllowlisted,
  priceImpact,
}: {
  fees?: ApiOnchainSwapFees;
  isPro: boolean;
  isNoFeeAllowlisted: boolean;
  priceImpact: number;
}) {
  const others = useMemo(() => {
    if (!fees) {
      return {
        walletFee: 0,
        marketFee: 0,
        totalFee: 0,
        referralFee: 0,
      };
    }
    const providerFee = fees.farcasterPro.value;
    const walletFee = fees.others.value - providerFee;
    const marketFee = fees.chain.value + providerFee + priceImpact;
    const totalFee = walletFee + marketFee;
    const referralFee = fees.farcaster.value - fees.farcasterReferral.value;
    return {
      walletFee,
      marketFee,
      totalFee,
      referralFee,
    };
  }, [fees, priceImpact]);

  const farcaster = useMemo(() => {
    if (!fees) {
      return {
        walletFee: 0,
        marketFee: 0,
        totalFee: 0,
        referralFee: 0,
      };
    }
    if (isNoFeeAllowlisted) {
      const providerFee = fees.farcasterNoFeeAllowlisted.value;
      const walletFee = 0;
      const marketFee = fees.chain.value + providerFee + priceImpact;
      const totalFee = marketFee;
      const referralFee = fees.farcaster.value - fees.farcasterReferral.value;
      return {
        walletFee,
        marketFee,
        totalFee,
        referralFee,
      };
    }
    if (isPro) {
      const providerFee = fees.farcasterPro.value;
      const walletFee = 0;
      const marketFee = fees.chain.value + providerFee + priceImpact;
      const totalFee = marketFee;
      const referralFee = fees.farcaster.value - fees.farcasterReferral.value;
      return {
        walletFee,
        marketFee,
        totalFee,
        referralFee,
      };
    }
    const providerFee = fees.farcasterPro.value;
    const walletFee = fees.farcaster.value - providerFee;
    const marketFee = fees.chain.value + providerFee;
    const totalFee = walletFee + marketFee;
    const referralFee = fees.farcaster.value - fees.farcasterReferral.value;
    return {
      walletFee,
      marketFee,
      totalFee,
      referralFee,
    };
  }, [fees, isNoFeeAllowlisted, isPro, priceImpact]);

  const pro = useMemo(() => {
    if (!fees) {
      return {
        walletFee: 0,
        marketFee: 0,
        totalFee: 0,
        referralFee: 0,
      };
    }
    const providerFee = fees.farcasterPro.value;
    const walletFee = 0;
    const marketFee = fees.chain.value + providerFee + priceImpact;
    const totalFee = marketFee;
    const referralFee = fees.farcaster.value - fees.farcasterReferral.value;
    return {
      walletFee,
      marketFee,
      totalFee,
      referralFee,
    };
  }, [fees, priceImpact]);

  return {
    others,
    farcaster,
    pro,
  };
}
