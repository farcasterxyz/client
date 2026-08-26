import { SharedWalletSwapStatusContext } from 'farcaster-expo';
import React from 'react';

import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';

import { useAppStoreReview } from './AppStoreReviewProvider';

function SharedWalletSwapStatusProvider({ children }: React.PropsWithChildren) {
  const isSignedIn = useIsSignedIn();

  if (isSignedIn) {
    return (
      <SharedWalletSwapStatusProviderAuthed>
        {children}
      </SharedWalletSwapStatusProviderAuthed>
    );
  }

  return (
    <SharedWalletSwapStatusProviderUnauthed>
      {children}
    </SharedWalletSwapStatusProviderUnauthed>
  );
}

function SharedWalletSwapStatusProviderAuthed({
  children,
}: React.PropsWithChildren) {
  const { requestReview } = useAppStoreReview();

  const context = React.useMemo(
    () => ({
      onSuccess: () => {
        requestReview({ when: 'after-swap' });
      },
    }),
    [requestReview],
  );

  return (
    <SharedWalletSwapStatusContext.Provider value={context}>
      {children}
    </SharedWalletSwapStatusContext.Provider>
  );
}

function SharedWalletSwapStatusProviderUnauthed({
  children,
}: React.PropsWithChildren) {
  const context = React.useMemo(
    () => ({
      onSuccess: () => {
        // Unauthed context this is no-op
      },
    }),
    [],
  );

  return (
    <SharedWalletSwapStatusContext.Provider value={context}>
      {children}
    </SharedWalletSwapStatusContext.Provider>
  );
}

export { SharedWalletSwapStatusProvider };
