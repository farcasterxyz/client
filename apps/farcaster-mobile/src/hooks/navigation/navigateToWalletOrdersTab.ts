import {
  CommonActions,
  NavigationState,
  StackActions,
} from '@react-navigation/native';

import { popWalletLimitOrderModal } from '~/hooks/navigation/dismissLimitOrderModal';
import {
  markWalletOrdersDeepLinkPending,
  triggerWalletHomeDeepLink,
} from '~/hooks/navigation/walletHomeDeepLink';
import { navigationRef } from '~/navigation/navigationRef';
import { findStackKeyWithTopRoute } from '~/utils/NavigationUtils';

type NavigationRoute = NavigationState['routes'][number] & {
  state?: NavigationState;
};

function findRouteByName(
  state: NavigationState | undefined,
  name: string,
): NavigationRoute | undefined {
  if (!state) {
    return undefined;
  }

  for (const route of state.routes) {
    if (route.name === name) {
      return route as NavigationRoute;
    }

    const nestedRoute = findRouteByName((route as NavigationRoute).state, name);
    if (nestedRoute) {
      return nestedRoute;
    }
  }

  return undefined;
}

type NavigateToWalletOrdersTabOptions = {
  /** When false (review mode), land on Wallet without the Orders sub-tab. */
  showOrdersTab?: boolean;
  /** Fetches and opens order detail when navigating from a notification. */
  limitOrderId?: string;
};

/**
 * Closes the limit-order modal, pops the wallet stack back to Wallet (e.g. from
 * Token), switches to WalletTab, and opens the Orders sub-tab. Bypasses the
 * debounced navigation methods so the second action is not dropped.
 */
let navigateToWalletOrdersTabInFlight = false;

const NAVIGATION_READY_MAX_RETRIES = 30;
const NAVIGATION_READY_FALLBACK_DELAY_MS = 100;

function releaseNavigateToWalletOrdersTabLock() {
  setTimeout(() => {
    navigateToWalletOrdersTabInFlight = false;
  }, 500);
}

function navigateToWalletOrdersTab(
  options: NavigateToWalletOrdersTabOptions = {},
) {
  const { showOrdersTab = true, limitOrderId } = options;

  if (navigateToWalletOrdersTabInFlight) {
    // Navigation is debounced, but still deliver a new limit-order deep link so
    // rapid notification taps while already on Wallet are not dropped.
    if (limitOrderId) {
      markWalletOrdersDeepLinkPending();
      requestAnimationFrame(() => {
        triggerWalletHomeDeepLink({ limitOrderId });
      });
    }
    return;
  }

  navigateToWalletOrdersTabInFlight = true;

  const walletScreenParams = {
    initialTab: showOrdersTab ? ('orders' as const) : undefined,
    limitOrderId,
  };

  const performWalletNavigation = () => {
    try {
      const rootState = navigationRef.getRootState();
      const walletTab = findRouteByName(rootState, 'WalletTab');
      const walletStackKey = walletTab?.state?.key;

      if (walletStackKey) {
        navigationRef.dispatch({
          ...StackActions.popToTop(),
          target: walletStackKey,
        });
      }

      // Always target WalletTab → Wallet so params merge correctly when the
      // wallet bottom tab is already focused (flat navigate('Wallet') skips
      // the Orders sub-tab deep link).
      navigationRef.dispatch(
        CommonActions.navigate('WalletTab', {
          screen: 'Wallet',
          params: walletScreenParams,
        }),
      );

      markWalletOrdersDeepLinkPending();
      requestAnimationFrame(() => {
        triggerWalletHomeDeepLink({ limitOrderId });
      });
    } finally {
      releaseNavigateToWalletOrdersTabLock();
    }
  };

  const navigateToWallet = (retriesLeft: number) => {
    if (!navigationRef.isReady()) {
      if (retriesLeft > 0) {
        requestAnimationFrame(() => navigateToWallet(retriesLeft - 1));
        return;
      }

      setTimeout(() => {
        performWalletNavigation();
      }, NAVIGATION_READY_FALLBACK_DELAY_MS);
      return;
    }

    performWalletNavigation();
  };

  const dismissModalIfOpen = () => {
    const modalOpen = !!findStackKeyWithTopRoute(
      navigationRef.getRootState(),
      'WalletLimitOrder',
    );

    if (!modalOpen) {
      return true;
    }

    return popWalletLimitOrderModal();
  };

  const closeModalAndNavigate = (retriesLeft: number) => {
    if (!navigationRef.isReady()) {
      if (retriesLeft > 0) {
        requestAnimationFrame(() => closeModalAndNavigate(retriesLeft - 1));
        return;
      }

      setTimeout(() => {
        if (!dismissModalIfOpen()) {
          releaseNavigateToWalletOrdersTabLock();
          return;
        }
        requestAnimationFrame(() =>
          navigateToWallet(NAVIGATION_READY_MAX_RETRIES),
        );
      }, NAVIGATION_READY_FALLBACK_DELAY_MS);
      return;
    }

    if (!dismissModalIfOpen()) {
      releaseNavigateToWalletOrdersTabLock();
      return;
    }
    requestAnimationFrame(() => navigateToWallet(NAVIGATION_READY_MAX_RETRIES));
  };

  requestAnimationFrame(() =>
    closeModalAndNavigate(NAVIGATION_READY_MAX_RETRIES),
  );
}

export { navigateToWalletOrdersTab };
export type { NavigateToWalletOrdersTabOptions };
