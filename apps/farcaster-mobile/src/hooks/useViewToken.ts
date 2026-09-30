import { chainIdToChain } from 'farcaster-client-data';
import { useFetchToken } from 'farcaster-client-hooks';
import { useCallback } from 'react';

import { usePush } from '~/hooks/navigation/usePush';
import { usePossiblyNavigateOrOpenUrl } from '~/utils/LinkingUtils';

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
  const openUrl = usePossiblyNavigateOrOpenUrl();
  const push = usePush();
  const fetchToken = useFetchToken();

  return useCallback(
    async ({ url, token }: { url: string; token: string }) => {
      const tokenData = parseToken(token);
      if (!tokenData) {
        openUrl({ url, openExternalInBrowser: true });
        return;
      }

      const urlObject = new URL(url);
      const domain = urlObject.hostname;

      try {
        await fetchToken(tokenData);
        push('Token', {
          ...tokenData,
          attributedDomain: domain,
          via: 'miniapp_view_token',
        });
      } catch {
        openUrl({ url, openExternalInBrowser: true });
      }
    },
    [push, openUrl, fetchToken],
  );
};
