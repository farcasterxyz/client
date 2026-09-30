import {
  EvmWalletProvider,
  useEmbeddedWallet,
  Wallet,
  WALLET_CONFIGS,
} from 'farcaster-expo';
import * as Provider from 'ox/Provider';
import React, { useCallback, useEffect, useMemo } from 'react';
import { Hex, ProviderRpcError } from 'viem';

import {
  SelectPreferredWalletProvider,
  useSelectPreferredWallet,
} from '~/contexts/SelectPreferredWalletProvider';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { useVerifyEmbeddedWallet } from '~/hooks/useVerifyEmbeddedWallet';
import { logErrorInDevOnly } from '~/utils/LogUtils';

import { useConnectionStatus } from './ConnectionStatusProvider';

type ConnectedWalletContextValue = {
  wallet: Wallet;
  provider: EvmWalletProvider;
  connect: () => Promise<readonly Hex[] | undefined>;
};

const ConnectedWalletContext = React.createContext<ConnectedWalletContextValue>(
  null!,
);

export const useConnectedWallet = () =>
  React.useContext(ConnectedWalletContext);

export function ConnectedWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SelectPreferredWalletProvider>
      <InnerConnectedWalletProvider>{children}</InnerConnectedWalletProvider>
    </SelectPreferredWalletProvider>
  );
}

const disconnectedEmitter = Provider.createEmitter();

/**
 * Interact with a user's connected wallet. Contains logic to take the user
 * through the choose a wallet flow.
 *
 * Separate so that it can be rendered in multiple places when a global
 * bottom sheet modal will not suffice (e.g. Frame v2 modal).
 */
function InnerConnectedWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    preferredWallet,
    preferredWalletType,
    selectPreferredWallet,
    updatePreferredWallet,
  } = useSelectPreferredWallet();

  const embeddedWallet = useEmbeddedWallet();
  const isSignedIn = useIsSignedIn();

  const connect = useCallback(async () => {
    try {
      if (!preferredWalletType || !preferredWallet) {
        const selectedWallet = await selectPreferredWallet();
        return await selectedWallet.provider?.request({
          method: 'eth_requestAccounts',
        });
      } else {
        return await preferredWallet.provider?.request({
          method: 'eth_requestAccounts',
        });
      }
    } catch (e) {
      logErrorInDevOnly(e);

      // TODO error handling here, better in provider fn
      if (e instanceof ProviderRpcError) {
        throw e;
      }

      throw new ProviderRpcError(
        new Error(`Failed to select preferred wallet:\n${e}`),
        {
          code: -32603,
          shortMessage: 'Internal error',
        },
      );
    }
  }, [preferredWallet, preferredWalletType, selectPreferredWallet]);

  const provider = useMemo<EvmWalletProvider>(() => {
    if (preferredWallet) {
      if (preferredWalletType === 'warpcast') {
        return embeddedWallet.evmMiniAppProvider;
      }
      return preferredWallet.provider!;
    }

    return Provider.from({
      ...disconnectedEmitter,
      async request(request) {
        switch (request.method) {
          case 'eth_accounts': {
            return [];
          }
          case 'eth_requestAccounts': {
            return await connect();
          }
          default: {
            throw new Error(`Method '${request.method}' unsupported`);
          }
        }
      },
    });
  }, [
    connect,
    preferredWallet,
    preferredWalletType,
    embeddedWallet.evmMiniAppProvider,
  ]);

  const contextValue = useMemo(
    () => ({
      wallet: preferredWallet,
      provider,
      connect,
    }),
    [connect, preferredWallet, provider],
  );

  useEffect(() => {
    if (
      preferredWallet &&
      !preferredWallet.isInitialized &&
      isSignedIn &&
      preferredWalletType
    ) {
      try {
        const config = WALLET_CONFIGS[preferredWalletType];
        preferredWallet.initialize?.(config);
      } catch (e) {
        updatePreferredWallet(undefined);
      }
    }
  }, [preferredWallet, isSignedIn, preferredWalletType, updatePreferredWallet]);

  return (
    <ConnectedWalletContext.Provider value={contextValue}>
      {isSignedIn && <AutoVerificationProvider />}
      {children}
    </ConnectedWalletContext.Provider>
  );
}

function AutoVerificationProvider() {
  const { isOnline } = useConnectionStatus();

  useVerifyEmbeddedWallet({
    autoVerifyEvm: isOnline,
    autoVerifySolana: isOnline,
  });

  return null;
}
