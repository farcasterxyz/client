import { Platform } from 'react-native';

import { useHasSecondaryWallet } from './useHasSecondaryWallet';
import { useSecondaryWalletsAvailable } from './useSecondaryWalletsAvailable';
import { useWalletBalances } from './useWalletBalances';

// Shows the private-wallet switcher to users who can create one (Pro/admin) or
// already own one, gated on holding a non-zero account balance. The Create
// button stays gated on useSecondaryWalletsAvailable, and the embedded-wallets
// query on useSecondaryWalletsEnabled.
//
// Zero-balance users — including existing secondary-wallet owners — see no
// secondary-wallet surface, part of winding the second-app model down. The
// balance check is account-wide (not the active wallet), so it never strands a
// user who actually holds funds.
//
// Secondary wallets are mobile-only: web hides the account switcher entirely,
// even for users who already own a secondary wallet.
export function useSecondaryWalletsVisible(): boolean {
  const available = useSecondaryWalletsAvailable();
  const hasSecondaryWallet = useHasSecondaryWallet();
  const { totalBalance } = useWalletBalances(undefined, {
    useActiveWallet: false,
  });

  if (Platform.OS === 'web') {
    return false;
  }

  return (available || hasSecondaryWallet) && (totalBalance ?? 0) > 0;
}
