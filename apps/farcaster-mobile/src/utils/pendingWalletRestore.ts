// INCIDENT-RELATED TEMPORARY CODE — no-custody-wallet restore prompt.
// For users left without their Farcaster account recovery phrase on device
// (e.g. signed in via email). Safe to remove once that cohort ages out
// (~6-8 months). Grep "INCIDENT-RELATED TEMPORARY CODE" for related code.
import { CommonActions } from '@react-navigation/native';
import { MMKV } from 'react-native-mmkv';

import { navigationRef } from '~/navigation/navigationRef';

const PENDING_RESTORE_KEY = 'noSeedPhraseRestorePrompt.pending';
const storage = new MMKV();

type PendingWalletRestore = {
  route: 'OnboardingImportWallet' | 'RecoveryInitiate';
  email?: string;
};

// Stash the post-logout destination before signing out. signOut() swaps the
// nav tree to the unauthed stack and resets to its initial route, so we can't
// navigate synchronously — the unauthed stack consumes this once it mounts.
export const setPendingWalletRestore = (
  pending: PendingWalletRestore,
): void => {
  storage.set(PENDING_RESTORE_KEY, JSON.stringify(pending));
};

// Read + clear the pending destination and navigate to it. Call once the
// unauthed stack is mounted. No-op when nothing is pending.
export const consumePendingWalletRestore = (): void => {
  const raw = storage.getString(PENDING_RESTORE_KEY);
  if (!raw) {
    return;
  }
  storage.delete(PENDING_RESTORE_KEY);
  if (!navigationRef.isReady()) {
    return;
  }
  let pending: PendingWalletRestore;
  try {
    pending = JSON.parse(raw) as PendingWalletRestore;
  } catch {
    return;
  }
  navigationRef.dispatch(
    pending.route === 'RecoveryInitiate'
      ? CommonActions.navigate('RecoveryInitiate', { email: pending.email })
      : CommonActions.navigate('OnboardingImportWallet'),
  );
};
