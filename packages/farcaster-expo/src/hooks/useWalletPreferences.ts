import { useCachedOnboardingState } from 'farcaster-client-hooks';
import {
  useMMKVBoolean,
  useMMKVObject,
  useMMKVString,
} from 'react-native-mmkv';

import { SlippageSettings } from '../types';
import { useCurrentUserFid } from './useCurrentUser';

export const useWalletForceShowRewards = () => {
  return useMMKVBoolean('wallet-force-show-rewards');
};

export const useWalletForceGeoRestricted = () => {
  return useMMKVBoolean('wallet-force-geo-restricted');
};

export const useWalletAltDataProvider = () => {
  return useMMKVBoolean('wallet-alt-data-provider');
};

export const useWalletShowRewardsEligble = () => {
  return useMMKVBoolean('wallet-show-rewards-eligible');
};

export const useWalletGeoRestricted = () => {
  const [forceGeoRestricted] = useWalletForceGeoRestricted();

  return (
    useCachedOnboardingState().result.state.geoRestricted || forceGeoRestricted
  );
};

export const useWalletFidOverride = () => {
  const [fidOverride, setFidOverride] = useMMKVString('wallet-fid-override');

  return [
    fidOverride ? parseInt(fidOverride) : undefined,
    setFidOverride,
  ] as const;
};

export const useWalletLastChain = () => {
  return useMMKVString('wallet-last-chain');
};

export const useWalletSlippageSettings = () => {
  return useMMKVObject<SlippageSettings>('wallet-slippage-settings');
};

export const useWalletActivityHideSpam = () => {
  return useMMKVBoolean('wallet-activity-hide-spam');
};

export const useWalletActivityHideMicrotransactions = () => {
  return useMMKVBoolean('wallet-activity-hide-microtransactions');
};

export const useWalletBalancesHidden = () => {
  return useMMKVBoolean('wallet-balances-hidden');
};

export const useWalletIncludePrivateBalances = () => {
  const fid = useCurrentUserFid();
  return useMMKVBoolean(`wallet-include-private-balances-${fid}`);
};

export const useWalletShowPrivateActivity = () => {
  const fid = useCurrentUserFid();
  return useMMKVBoolean(`wallet-show-private-activity-${fid}`);
};

export const useWalletQuickSwap = () => {
  const fid = useCurrentUserFid();
  return useMMKVBoolean(`wallet-quick-swap-${fid}`);
};

export const useWalletUsdcDenominatedValues = () => {
  return useMMKVBoolean('wallet-usdc-denominated-values');
};

export const useWalletShowTokenCastsCta = () => {
  const fid = useCurrentUserFid();
  return useMMKVBoolean(`wallet-show-token-casts-cta-${fid}`);
};

export const useChartTypePreference = () => {
  return useMMKVString('chart-type-preference');
};

export const useCandlestickPeriodPreference = () => {
  return useMMKVString('candlestick-period-preference');
};

export const useWalletAssetPickerType = () => {
  return useMMKVString('wallet-asset-picker-type');
};
