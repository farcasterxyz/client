import { useFeatureFlag } from 'farcaster-client-hooks';

import { useUserAppContextGate } from './useUserAppContextGate';

const useIsWalletLinksEnabled = (): boolean => {
  const featureFlagEnabled = useFeatureFlag('wallet-defi-links');
  const { checkUserAppContextGate } = useUserAppContextGate();
  const reviewGateEnabled = checkUserAppContextGate('wallet-links').value;

  return featureFlagEnabled && reviewGateEnabled;
};

export { useIsWalletLinksEnabled };
