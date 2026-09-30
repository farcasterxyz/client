import { useFeatureFlag } from 'farcaster-client-hooks';

export function useLimitOrdersEnabled() {
  return useFeatureFlag('limit-orders');
}
