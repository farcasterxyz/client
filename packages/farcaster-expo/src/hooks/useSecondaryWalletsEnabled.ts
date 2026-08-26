import { useFeatureFlag } from 'farcaster-client-hooks';
import { Platform } from 'react-native';

export function useSecondaryWalletsEnabled() {
  const enabled = useFeatureFlag('secondary-wallets');
  // The secondary-wallet feature is mobile-only. Keep web primary-only for all
  // users so the positions query stays fid-scoped (both protocols).
  if (Platform.OS === 'web') {
    return false;
  }
  return enabled;
}
