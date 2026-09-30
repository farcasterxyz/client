import { chainIdToChain } from 'farcaster-client-data';
import { useFetchToken } from 'farcaster-client-hooks';
import { useCallback } from 'react';

import { useOptionalEmbeddedWalletBridge } from '~/components/EmbeddedWallet';
import { useExternalNavigate } from '~/hooks/navigation/useExternalNavigate';

const CAIP_19_ERC20_PATTERN = /^eip155:(\d+)\/erc20:(0x[a-fA-F0-9]{40})$/;

const parseToken = (token: string) => {
  const matches = token.match(CAIP_19_ERC20_PATTERN);
  if (!matches) {
    return null;
  }

  const [, chainId, address] = matches;

  const chain = chainIdToChain(chainId);
  if (!chain) {
    return null;
  }

  return {
    chain,
    ca: chain === 'solana' ? address : address.toLowerCase(),
  };
};

export const useViewToken = () => {
  const openUrl = useExternalNavigate();
  const fetchToken = useFetchToken();
  const embeddedWalletBridge = useOptionalEmbeddedWalletBridge();
  const navigateInWallet = embeddedWalletBridge?.navigate;

  return useCallback(
    async ({ url, token }: { url: string; token: string }) => {
      const tokenData = parseToken(token);
      if (!tokenData || !navigateInWallet) {
        openUrl({ to: url, openInNewTab: true });
        return;
      }

      try {
        await fetchToken(tokenData);

        navigateInWallet({
          path: 'Token',
          params: {
            chain: tokenData.chain,
            ca: tokenData.ca,
            via: 'miniapp_view_token',
          },
        });
      } catch {
        openUrl({ to: url, openInNewTab: true });
      }
    },
    [fetchToken, navigateInWallet, openUrl],
  );
};
