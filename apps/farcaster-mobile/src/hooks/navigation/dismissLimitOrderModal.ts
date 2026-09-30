import { StackActions } from '@react-navigation/native';

import { navigationRef } from '~/navigation/navigationRef';
import { findStackKeyWithTopRoute } from '~/utils/NavigationUtils';

const NAVIGATION_READY_MAX_RETRIES = 30;
const NAVIGATION_READY_FALLBACK_DELAY_MS = 100;

function popWalletLimitOrderModal(): boolean {
  const stackKey = findStackKeyWithTopRoute(
    navigationRef.getRootState(),
    'WalletLimitOrder',
  );

  if (stackKey) {
    navigationRef.dispatch({ ...StackActions.pop(), target: stackKey });
    return true;
  }

  // Modal not in navigation state — nothing to dismiss.
  return true;
}

/**
 * Dismisses the limit-order modal stack, then runs `onDismissed` once the
 * navigation ref is ready. Used before navigating away (e.g. cast composer).
 */
function dismissLimitOrderModal(onDismissed: () => void) {
  let finished = false;

  const finish = (afterPop: boolean) => {
    if (finished) {
      return;
    }
    finished = true;

    if (afterPop) {
      requestAnimationFrame(() => onDismissed());
      return;
    }

    onDismissed();
  };

  const closeModal = (retriesLeft: number) => {
    if (!navigationRef.isReady()) {
      if (retriesLeft > 0) {
        requestAnimationFrame(() => closeModal(retriesLeft - 1));
        return;
      }

      // Navigation may still be mid-transition; wait briefly, then always
      // run the callback so follow-up actions are not blocked.
      setTimeout(() => {
        finish(popWalletLimitOrderModal());
      }, NAVIGATION_READY_FALLBACK_DELAY_MS);
      return;
    }

    finish(popWalletLimitOrderModal());
  };

  requestAnimationFrame(() => closeModal(NAVIGATION_READY_MAX_RETRIES));
}

export { dismissLimitOrderModal, popWalletLimitOrderModal };
