import { WALLET_CHAINS } from 'farcaster-client-data';
import React, { ReactNode, useMemo } from 'react';
import { createConfig, WagmiProvider as WagmiProviderLib } from 'wagmi';

import { usePublicClient } from './PublicClientProvider';

/**
 * Configured to work for public actions but not our wallets.
 */
export function WagmiProvider({ children }: { children: ReactNode }) {
  const { getEthereumClient } = usePublicClient();

  const wagmiConfig = useMemo(() => {
    return createConfig({
      multiInjectedProviderDiscovery: false,
      storage: null,
      chains: WALLET_CHAINS,
      client({ chain }) {
        return getEthereumClient({ chain });
      },
    });
  }, [getEthereumClient]);

  return <WagmiProviderLib config={wagmiConfig}>{children}</WagmiProviderLib>;
}
