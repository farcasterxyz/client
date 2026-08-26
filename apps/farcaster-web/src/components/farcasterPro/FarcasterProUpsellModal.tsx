import {
  useOptimisticallyUpdateCurrentUserLevel,
  useOptimisticSetUserPreferences,
} from 'farcaster-client-hooks';
import * as React from 'react';

import { useEmbeddedWalletBridge } from '~/components/EmbeddedWallet';
import {
  useBespokeTransactionModalContext,
  useOptionalBespokeTransactionModalContext,
} from '~/contexts/BespokeTransactionModalProvider';

function FarcasterProUpsellModal() {
  const { navigate: navigateInWallet, onTransactionStateChange } =
    useEmbeddedWalletBridge();

  React.useEffect(() => {
    navigateInWallet({
      path: 'FarcasterProFullScreenUpsell',
      params: {},
    });
  }, [navigateInWallet]);

  const optimisticallyUpdateCurrentUserLevel =
    useOptimisticallyUpdateCurrentUserLevel();
  const setUserPreferences = useOptimisticSetUserPreferences();
  const { closeModal } = useBespokeTransactionModalContext();

  // Listen for Farcaster Pro subscription events from embedded wallet
  React.useEffect(() => {
    if (!onTransactionStateChange) {
      return;
    }

    const cleanup = onTransactionStateChange((state, metadata) => {
      if (state !== 'confirmed' || metadata?.type !== 'farcaster-pro') {
        return;
      }
      optimisticallyUpdateCurrentUserLevel({ level: 'pro' });
      setUserPreferences({
        preferences: {
          showFarcasterProProfileBanner: false,
        },
      });
      closeModal();
    });

    return cleanup;
  }, [
    onTransactionStateChange,
    optimisticallyUpdateCurrentUserLevel,
    setUserPreferences,
    closeModal,
  ]);

  return <div className="h-[540px]" />;
}

function useShowFarcasterProUpsellModal() {
  const context = useOptionalBespokeTransactionModalContext();
  return React.useCallback(() => {
    context?.showModal(<FarcasterProUpsellModal />);
  }, [context]);
}

export { useShowFarcasterProUpsellModal };
